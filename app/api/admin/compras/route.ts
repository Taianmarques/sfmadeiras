import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { registrarCompra } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarNivelSubiu } from "@/lib/whatsapp";

const schema = z.object({
  clienteId: z.string().min(1),
  valor: z.number().positive("Informe um valor válido."),
  descricao: z.string().trim().max(200).optional(),
});

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  try {
    const { movimentacao, cliente, pontosGanhos, subiuDeNivel } = await registrarCompra({
      clienteId: validado.data.clienteId,
      valor: validado.data.valor,
      descricao: validado.data.descricao || "Compra na loja",
      criadoPorAdminId: sessao.user.id,
    });

    await registrarAuditoria({
      acao: "LANCAR_COMPRA",
      entidade: "MovimentacaoPontos",
      entidadeId: movimentacao.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { clienteId: validado.data.clienteId, valor: validado.data.valor, pontosGanhos },
    });

    if (subiuDeNivel) {
      notificarNivelSubiu(cliente.telefone, cliente.nome, cliente.nivel).catch(() => {});
    }

    return NextResponse.json({ ok: true, pontosGanhos, cliente });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível lançar a compra.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
