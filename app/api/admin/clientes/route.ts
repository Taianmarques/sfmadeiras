import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { apenasDigitos } from "@/lib/cpf";

export async function GET(req: NextRequest) {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const nivel = req.nextUrl.searchParams.get("nivel");

  const clientes = await prisma.cliente.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { cpfCnpj: { contains: apenasDigitos(q) || q } },
              ],
            }
          : {},
        nivel ? { nivel: nivel as never } : {},
      ],
    },
    orderBy: { nome: "asc" },
    select: {
      id: true,
      nome: true,
      cpfCnpj: true,
      telefone: true,
      pontos: true,
      totalGasto: true,
      nivel: true,
      criadoEm: true,
      ativo: true,
      _count: { select: { movimentacoes: { where: { tipo: "COMPRA" } } } },
    },
    take: 200,
  });

  return NextResponse.json(
    clientes.map((c) => ({
      ...c,
      totalGasto: c.totalGasto.toNumber(),
      compras: c._count.movimentacoes,
    }))
  );
}
