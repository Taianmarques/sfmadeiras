import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { confirmarEntregaResgate } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarResgateEntregue } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  try {
    const { resgate, cliente, recompensa } = await confirmarEntregaResgate(params.id, sessao.user.id);

    await registrarAuditoria({
      acao: "CONFIRMAR_ENTREGA_RESGATE",
      entidade: "Resgate",
      entidadeId: resgate.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { recompensa: recompensa.nome, pontosGastos: resgate.pontosGastos },
    });

    notificarResgateEntregue(cliente.telefone, cliente.nome, recompensa.nome).catch(() => {});

    return NextResponse.json({ ok: true, resgate });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível confirmar a entrega.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
