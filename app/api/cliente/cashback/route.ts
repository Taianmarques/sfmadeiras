import { NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const [cliente, movimentacoes] = await Promise.all([
    prisma.cliente.findUniqueOrThrow({ where: { id: sessao.user.id }, select: { saldoCashback: true } }),
    prisma.movimentacaoCashback.findMany({
      where: { clienteId: sessao.user.id },
      orderBy: { criadoEm: "desc" },
    }),
  ]);

  return NextResponse.json({
    saldoCashback: cliente.saldoCashback.toNumber(),
    extrato: movimentacoes.map((m) => ({
      ...m,
      valor: m.valor.toNumber(),
      valorCompra: m.valorCompra?.toNumber() ?? null,
      taxaAplicada: m.taxaAplicada?.toNumber() ?? null,
    })),
  });
}
