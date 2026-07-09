import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaCriar = z.object({
  nome: z.string().trim().min(2),
  multiplicador: z.number().min(1).max(10),
  dataInicio: z.string().datetime().or(z.string().min(10)),
  dataFim: z.string().datetime().or(z.string().min(10)),
});

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const campanhas = await prisma.campanha.findMany({ orderBy: { dataInicio: "desc" } });
  return NextResponse.json(campanhas.map((c) => ({ ...c, multiplicador: c.multiplicador.toNumber() })));
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schemaCriar.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const dataInicio = new Date(validado.data.dataInicio);
  const dataFim = new Date(validado.data.dataFim);
  if (dataFim <= dataInicio) {
    return NextResponse.json({ erro: "A data de fim deve ser depois da data de início." }, { status: 400 });
  }

  const campanha = await prisma.campanha.create({
    data: {
      nome: validado.data.nome,
      multiplicador: validado.data.multiplicador,
      dataInicio,
      dataFim,
      criadoPorAdminId: sessao.user.id,
    },
  });

  await registrarAuditoria({
    acao: "CRIAR_CAMPANHA",
    entidade: "Campanha",
    entidadeId: campanha.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
    detalhes: validado.data,
  });

  return NextResponse.json({ ...campanha, multiplicador: campanha.multiplicador.toNumber() }, { status: 201 });
}
