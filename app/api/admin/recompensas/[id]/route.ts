import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaAtualizar = z.object({
  nome: z.string().trim().min(2).optional(),
  pontos: z.number().int().positive().optional(),
  estoque: z.number().int().min(0).optional(),
  icone: z.string().trim().min(1).max(8).optional(),
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

  const recompensa = await prisma.recompensa.update({ where: { id: params.id }, data: validado.data });

  await registrarAuditoria({
    acao: "ATUALIZAR_RECOMPENSA",
    entidade: "Recompensa",
    entidadeId: recompensa.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
    detalhes: validado.data,
  });

  return NextResponse.json(recompensa);
}

// Soft delete: desativa em vez de apagar, para preservar o histórico de
// resgates já realizados (Resgate referencia Recompensa).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const recompensa = await prisma.recompensa.update({
    where: { id: params.id },
    data: { ativo: false },
  });

  await registrarAuditoria({
    acao: "DESATIVAR_RECOMPENSA",
    entidade: "Recompensa",
    entidadeId: recompensa.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
