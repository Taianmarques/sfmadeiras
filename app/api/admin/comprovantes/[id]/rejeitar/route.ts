import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarComprovanteRejeitado } from "@/lib/whatsapp";

const schema = z.object({ motivo: z.string().trim().min(3, "Informe o motivo da rejeição.") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const comprovante = await prisma.comprovante.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });
  if (!comprovante) return NextResponse.json({ erro: "Comprovante não encontrado." }, { status: 404 });
  if (comprovante.status !== "PENDENTE") {
    return NextResponse.json({ erro: "Este comprovante já foi analisado." }, { status: 400 });
  }

  await prisma.comprovante.update({
    where: { id: comprovante.id },
    data: {
      status: "REJEITADO",
      motivoRejeicao: validado.data.motivo,
      analisadoPorAdminId: sessao.user.id,
      analisadoEm: new Date(),
    },
  });

  await registrarAuditoria({
    acao: "REJEITAR_COMPROVANTE",
    entidade: "Comprovante",
    entidadeId: comprovante.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
    detalhes: { motivo: validado.data.motivo },
  });

  notificarComprovanteRejeitado(comprovante.cliente.telefone, comprovante.cliente.nome, validado.data.motivo).catch(() => {});

  return NextResponse.json({ ok: true });
}
