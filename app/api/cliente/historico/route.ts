import { NextRequest, NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const limite = Math.min(Number(req.nextUrl.searchParams.get("limite")) || 50, 200);

  const movimentacoes = await prisma.movimentacaoPontos.findMany({
    where: { clienteId: sessao.user.id },
    orderBy: { criadoEm: "desc" },
    take: limite,
    select: {
      id: true,
      tipo: true,
      descricao: true,
      valorCompra: true,
      pontos: true,
      multiplicadorAplicado: true,
      criadoEm: true,
    },
  });

  return NextResponse.json(
    movimentacoes.map((m) => ({
      ...m,
      valorCompra: m.valorCompra?.toNumber() ?? null,
      multiplicadorAplicado: m.multiplicadorAplicado?.toNumber() ?? null,
    }))
  );
}
