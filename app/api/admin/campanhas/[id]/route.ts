import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaAtualizar = z.object({
  nome: z.string().trim().min(2).optional(),
  multiplicador: z.number().min(1).max(10).optional(),
  dataInicio: z.string().min(10).optional(),
  dataFim: z.string().min(10).optional(),
  ativo: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schemaAtualizar.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const { dataInicio, dataFim, ...resto } = validado.data;

  const campanha = await prisma.campanha.update({
    where: { id: params.id },
    data: {
      ...resto,
      ...(dataInicio ? { dataInicio: new Date(dataInicio) } : {}),
      ...(dataFim ? { dataFim: new Date(dataFim) } : {}),
    },
  });

  await registrarAuditoria({
    acao: "ATUALIZAR_CAMPANHA",
    entidade: "Campanha",
    entidadeId: campanha.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ...campanha, multiplicador: campanha.multiplicador.toNumber() });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const campanha = await prisma.campanha.update({ where: { id: params.id }, data: { ativo: false } });

  await registrarAuditoria({
    acao: "ENCERRAR_CAMPANHA",
    entidade: "Campanha",
    entidadeId: campanha.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
