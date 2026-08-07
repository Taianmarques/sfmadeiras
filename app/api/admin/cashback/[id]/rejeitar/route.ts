import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { rejeitarResgateCashback } from "@/lib/cashback";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarResgateCashbackRejeitado } from "@/lib/whatsapp";

const schema = z.object({ motivo: z.string().trim().min(3, "Informe o motivo da rejeição.") });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const resgateExistente = await prisma.resgateCashback.findUnique({
    where: { id: params.id },
    include: { cliente: true },
  });
  if (!resgateExistente) return NextResponse.json({ erro: "Resgate não encontrado." }, { status: 404 });

  try {
    await rejeitarResgateCashback(params.id, sessao.user.id, validado.data.motivo);

    await registrarAuditoria({
      acao: "REJEITAR_RESGATE_CASHBACK",
      entidade: "ResgateCashback",
      entidadeId: params.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { motivo: validado.data.motivo },
    });

    notificarResgateCashbackRejeitado(
      resgateExistente.cliente.telefone,
      resgateExistente.cliente.nome,
      validado.data.motivo
    ).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível rejeitar este resgate.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
