import { NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { erro } = await exigirCliente();
  if (erro) return erro;

  const recompensas = await prisma.recompensa.findMany({
    where: { ativo: true },
    orderBy: { pontos: "asc" },
  });

  return NextResponse.json(recompensas);
}
