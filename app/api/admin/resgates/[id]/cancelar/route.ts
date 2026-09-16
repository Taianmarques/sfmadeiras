import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { cancelarResgate } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarResgateCancelado } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => ({}));
  const motivo = typeof corpo?.motivo === "string" ? corpo.motivo.trim().slice(0, 300) : undefined;

  try {
    const { resgate, cliente, recompensa } = await cancelarResgate(params.id, sessao.user.id, motivo || undefined);

    await registrarAuditoria({
      acao: "CANCELAR_RESGATE",
      entidade: "Resgate",
      entidadeId: resgate.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { recompensa: recompensa.nome, pontosGastos: resgate.pontosGastos, motivo },
    });

    notificarResgateCancelado(cliente.telefone, cliente.nome, recompensa.nome).catch(() => {});

    return NextResponse.json({ ok: true, resgate });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível cancelar este resgate.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
