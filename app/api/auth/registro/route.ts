import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apenasDigitos, validarCpfCnpj } from "@/lib/cpf";
import { registrarBonusIndicacao } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { checarLimite } from "@/lib/rateLimit";

const schemaRegistro = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo."),
  cpfCnpj: z.string().trim().min(11, "CPF/CNPJ inválido."),
  telefone: z.string().trim().min(10, "Telefone inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  codigoIndicacao: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  const ip = extrairIp(req.headers) ?? "desconhecido";
  const limite = checarLimite(`registro:${ip}`, 5, 60 * 60 * 1000);
  if (!limite.permitido) {
    return NextResponse.json({ erro: "Muitas tentativas. Tente novamente mais tarde." }, { status: 429 });
  }

  const corpo = await req.json().catch(() => null);
  const validado = schemaRegistro.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const { nome, telefone, senha, codigoIndicacao } = validado.data;
  const cpfCnpj = apenasDigitos(validado.data.cpfCnpj);

  if (!validarCpfCnpj(cpfCnpj)) {
    return NextResponse.json({ erro: "CPF/CNPJ inválido." }, { status: 400 });
  }

  const existente = await prisma.cliente.findUnique({ where: { cpfCnpj } });
  if (existente) {
    return NextResponse.json({ erro: "Já existe um cadastro com este CPF/CNPJ." }, { status: 409 });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const cliente = await prisma.cliente.create({
    data: { nome, cpfCnpj, telefone, senhaHash },
  });

  await registrarAuditoria({
    acao: "REGISTRO_CLIENTE",
    entidade: "Cliente",
    entidadeId: cliente.id,
    usuarioTipo: "CLIENTE",
    usuarioId: cliente.id,
    ip,
  });

  // codigoIndicacao = id do cliente que indicou (vem do link único /cliente/registro?ref=<id>).
  // Cada registro cria uma Indicacao já convertida — o link do indicador é reutilizável
  // para quantos amigos ele quiser indicar.
  if (codigoIndicacao && codigoIndicacao !== cliente.id) {
    const indicador = await prisma.cliente.findUnique({ where: { id: codigoIndicacao } });
    if (indicador && indicador.ativo) {
      await prisma.indicacao.create({
        data: {
          indicadorId: indicador.id,
          indicadoId: cliente.id,
          status: "CONVERTIDA",
          convertidaEm: new Date(),
        },
      });
      await registrarBonusIndicacao(indicador.id);
    }
  }

  return NextResponse.json({ ok: true, clienteId: cliente.id }, { status: 201 });
}
