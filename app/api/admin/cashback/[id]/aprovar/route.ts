import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { aprovarResgateCashback } from "@/lib/cashback";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarResgateCashbackAprovado } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  try {
    const { resgate, cliente } = await aprovarResgateCashback(params.id, sessao.user.id);
    const valor = resgate.valor.toNumber();

    await registrarAuditoria({
      acao: "APROVAR_RESGATE_CASHBACK",
      entidade: "ResgateCashback",
      entidadeId: resgate.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { valor },
    });

    notificarResgateCashbackAprovado(cliente.telefone, cliente.nome, valor).catch(() => {});

    return NextResponse.json({ ok: true, resgate: { ...resgate, valor } });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível aprovar este resgate.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
