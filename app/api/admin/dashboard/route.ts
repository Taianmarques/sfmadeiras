import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

const DIAS_INATIVIDADE = 60;

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const [agregadoClientes, clientesPorNivel, topClientes, resgatesPorRecompensa, clientes] = await Promise.all([
    prisma.cliente.aggregate({ _sum: { totalGasto: true, pontos: true }, _count: true }),
    prisma.cliente.groupBy({ by: ["nivel"], _count: true }),
    prisma.cliente.findMany({
      orderBy: { pontos: "desc" },
      take: 10,
      select: { id: true, nome: true, pontos: true, nivel: true, totalGasto: true },
    }),
    prisma.resgate.groupBy({ by: ["recompensaId"], _count: true, orderBy: { _count: { recompensaId: "desc" } }, take: 10 }),
    prisma.cliente.findMany({
      select: {
        id: true,
        nome: true,
        criadoEm: true,
        movimentacoes: {
          where: { tipo: "COMPRA" },
          orderBy: { criadoEm: "desc" },
          take: 1,
          select: { criadoEm: true },
        },
      },
    }),
  ]);

  const limiteInatividade = new Date();
  limiteInatividade.setDate(limiteInatividade.getDate() - DIAS_INATIVIDADE);

  const clientesInativos = clientes
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      ultimaCompra: c.movimentacoes[0]?.criadoEm ?? null,
      referencia: c.movimentacoes[0]?.criadoEm ?? c.criadoEm,
    }))
    .filter((c) => c.referencia < limiteInatividade)
    .sort((a, b) => a.referencia.getTime() - b.referencia.getTime());

  const recompensaIds = resgatesPorRecompensa.map((r) => r.recompensaId);
  const recompensas = await prisma.recompensa.findMany({ where: { id: { in: recompensaIds } } });
  const recompensasMaisResgatadas = resgatesPorRecompensa.map((r) => ({
    recompensa: recompensas.find((rec) => rec.id === r.recompensaId) ?? null,
    totalResgates: r._count,
  }));

  return NextResponse.json({
    totalFaturado: agregadoClientes._sum.totalGasto?.toNumber() ?? 0,
    pontosEmCirculacao: agregadoClientes._sum.pontos ?? 0,
    totalClientes: agregadoClientes._count,
    clientesPorNivel: clientesPorNivel.map((c) => ({ nivel: c.nivel, total: c._count })),
    rankingTop10: topClientes.map((c) => ({ ...c, totalGasto: c.totalGasto.toNumber() })),
    recompensasMaisResgatadas,
    clientesInativos: clientesInativos.slice(0, 50).map((c) => ({
      id: c.id,
      nome: c.nome,
      ultimaCompra: c.ultimaCompra,
      diasInativo: Math.floor((Date.now() - c.referencia.getTime()) / (1000 * 60 * 60 * 24)),
    })),
    totalClientesInativos: clientesInativos.length,
  });
}
