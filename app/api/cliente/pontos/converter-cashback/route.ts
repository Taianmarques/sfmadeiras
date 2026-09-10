import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirCliente } from "@/lib/sessao";
import { converterPontosEmCashback } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { checarLimite, LIMITES } from "@/lib/rateLimit";

const schema = z.object({ pontos: z.number().int().positive("Informe uma quantidade de pontos válida.") });

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const limite = checarLimite(
    `converter-pontos-cashback:${sessao.user.id}`,
    LIMITES.RESGATE_CASHBACK.max,
    LIMITES.RESGATE_CASHBACK.janelaMs
  );
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitas solicitações de conversão. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  try {
    const { cliente, valorCashback } = await converterPontosEmCashback(sessao.user.id, validado.data.pontos);

    await registrarAuditoria({
      acao: "CONVERTER_PONTOS_CASHBACK",
      entidade: "Cliente",
      entidadeId: sessao.user.id,
      usuarioTipo: "CLIENTE",
      usuarioId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { pontos: validado.data.pontos, valorCashback },
    });

    return NextResponse.json({
      ok: true,
      valorCashback,
      pontosRestantes: cliente.pontos,
      saldoCashback: cliente.saldoCashback.toNumber(),
    });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível concluir a conversão.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
