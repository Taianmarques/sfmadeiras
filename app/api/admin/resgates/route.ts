import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const resgates = await prisma.resgate.findMany({
    include: {
      cliente: { select: { nome: true, cpfCnpj: true, telefone: true } },
      recompensa: { select: { nome: true, icone: true, imagemUrl: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(resgates);
}
