import { NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { erro } = await exigirCliente();
  if (erro) return erro;

  const agora = new Date();

  const ofertas = await prisma.oferta.findMany({
    where: {
      ativo: true,
      OR: [{ dataInicio: null }, { dataInicio: { lte: agora } }],
      AND: [{ OR: [{ dataFim: null }, { dataFim: { gte: agora } }] }],
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
    ofertas.map((o) => ({
      ...o,
      precoNormal: o.precoNormal.toNumber(),
      precoPromocional: o.precoPromocional.toNumber(),
    }))
  );
}
