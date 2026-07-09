import { NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { multiplicadorDoNivel, proximaFaixa } from "@/lib/pontos";

export async function GET() {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const cliente = await prisma.cliente.findUnique({
    where: { id: sessao.user.id },
    select: {
      id: true,
      nome: true,
      cpfCnpj: true,
      telefone: true,
      pontos: true,
      totalGasto: true,
      nivel: true,
      qrCodeToken: true,
      criadoEm: true,
      _count: { select: { indicacoesEnviadas: { where: { status: "CONVERTIDA" } } } },
    },
  });

  if (!cliente) return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });

  const totalGasto = cliente.totalGasto.toNumber();
  const proxima = proximaFaixa(totalGasto);

  return NextResponse.json({
    ...cliente,
    totalGasto,
    multiplicadorAtual: multiplicadorDoNivel(cliente.nivel),
    proximoNivel: proxima
      ? { nivel: proxima.nivel, faltamReais: Math.max(proxima.minimo - totalGasto, 0) }
      : null,
    indicacoesConvertidas: cliente._count.indicacoesEnviadas,
  });
}
