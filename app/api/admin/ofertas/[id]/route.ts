import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaAtualizar = z.object({
  titulo: z.string().trim().min(2).optional(),
  descricao: z.string().trim().min(2).optional(),
  icone: z.string().trim().min(1).max(8).optional(),
  dataInicio: z.string().min(10).optional().nullable(),
  dataFim: z.string().min(10).optional().nullable(),
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

  const oferta = await prisma.oferta.update({
    where: { id: params.id },
    data: {
      ...resto,
      ...(dataInicio !== undefined ? { dataInicio: dataInicio ? new Date(dataInicio) : null } : {}),
      ...(dataFim !== undefined ? { dataFim: dataFim ? new Date(dataFim) : null } : {}),
    },
  });

  await registrarAuditoria({
    acao: "ATUALIZAR_OFERTA",
    entidade: "Oferta",
    entidadeId: oferta.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json(oferta);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const oferta = await prisma.oferta.update({ where: { id: params.id }, data: { ativo: false } });

  await registrarAuditoria({
    acao: "DESATIVAR_OFERTA",
    entidade: "Oferta",
    entidadeId: oferta.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
