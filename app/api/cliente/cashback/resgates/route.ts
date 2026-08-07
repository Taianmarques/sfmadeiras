import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { solicitarResgateCashback } from "@/lib/cashback";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { checarLimite, LIMITES } from "@/lib/rateLimit";

const schema = z.object({ valor: z.number().positive("Informe um valor válido.") });

export async function GET() {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const resgates = await prisma.resgateCashback.findMany({
    where: { clienteId: sessao.user.id },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(resgates.map((r) => ({ ...r, valor: r.valor.toNumber() })));
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const limite = checarLimite(
    `resgate-cashback:${sessao.user.id}`,
    LIMITES.RESGATE_CASHBACK.max,
    LIMITES.RESGATE_CASHBACK.janelaMs
  );
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitas solicitações de resgate. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  try {
    const resgate = await solicitarResgateCashback(sessao.user.id, validado.data.valor);

    await registrarAuditoria({
      acao: "SOLICITAR_RESGATE_CASHBACK",
      entidade: "ResgateCashback",
      entidadeId: resgate.id,
      usuarioTipo: "CLIENTE",
      usuarioId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { valor: validado.data.valor },
    });

    return NextResponse.json({ ...resgate, valor: resgate.valor.toNumber() }, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível solicitar o resgate.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
