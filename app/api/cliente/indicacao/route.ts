import { NextRequest, NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const link = `${baseUrl}/cliente/registro?ref=${sessao.user.id}`;

  const indicacoes = await prisma.indicacao.findMany({
    where: { indicadorId: sessao.user.id },
    include: { indicado: { select: { nome: true, criadoEm: true } } },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json({
    link,
    totalConvertidas: indicacoes.filter((i) => i.status === "CONVERTIDA").length,
    pontosGanhos: indicacoes.reduce((soma, i) => soma + (i.status === "CONVERTIDA" ? i.pontosBonus : 0), 0),
    indicacoes,
  });
}
