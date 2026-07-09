import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const status = req.nextUrl.searchParams.get("status");

  const comprovantes = await prisma.comprovante.findMany({
    where: status ? { status: status as never } : {},
    include: { cliente: { select: { id: true, nome: true, cpfCnpj: true, telefone: true } } },
    orderBy: { criadoEm: "desc" },
    take: 300,
  });

  return NextResponse.json(
    comprovantes.map((c) => ({ ...c, valorInformado: c.valorInformado.toNumber() }))
  );
}
