import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const cliente = await prisma.cliente.findUnique({
    where: { id: params.id },
    include: {
      movimentacoes: { orderBy: { criadoEm: "desc" }, take: 100 },
      comprovantes: { orderBy: { criadoEm: "desc" }, take: 50 },
      resgates: { include: { recompensa: true }, orderBy: { criadoEm: "desc" }, take: 50 },
    },
  });

  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });

  return NextResponse.json({
    ...cliente,
    totalGasto: cliente.totalGasto.toNumber(),
    movimentacoes: cliente.movimentacoes.map((m) => ({
      ...m,
      valorCompra: m.valorCompra?.toNumber() ?? null,
      multiplicadorAplicado: m.multiplicadorAplicado?.toNumber() ?? null,
    })),
    comprovantes: cliente.comprovantes.map((c) => ({ ...c, valorInformado: c.valorInformado.toNumber() })),
  });
}
