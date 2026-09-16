import { Prisma, NivelFidelidade, OrigemPontos, TipoMovimentacao, TipoMovimentacaoCashback, StatusResgate } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Regras de negócio: níveis, multiplicadores e cálculo de pontos.
// Toda a lógica que mexe em saldo de pontos deve passar por aqui — nunca
// atualize `Cliente.pontos` diretamente em uma rota de API.
// ---------------------------------------------------------------------------

export const MESES_EXPIRACAO_PONTOS = 12;
export const PONTOS_BONUS_INDICACAO = 100;

// Taxa de conversão de pontos em cashback: 100 pontos = R$1,00 (igual para todos os níveis)
export const TAXA_CONVERSAO_PONTOS_CASHBACK = 0.01;

interface FaixaNivel {
  nivel: NivelFidelidade;
  minimo: number; // total gasto mínimo (inclusive)
  maximo: number | null; // total gasto máximo (inclusive), null = sem teto
  multiplicador: number;
}

export const FAIXAS_NIVEL: FaixaNivel[] = [
  { nivel: "BRONZE", minimo: 0, maximo: 999.99, multiplicador: 1 },
  { nivel: "PRATA", minimo: 1000, maximo: 4999.99, multiplicador: 1.2 },
  { nivel: "OURO", minimo: 5000, maximo: 14999.99, multiplicador: 1.5 },
  { nivel: "DIAMANTE", minimo: 15000, maximo: null, multiplicador: 2 },
];

export function calcularNivel(totalGasto: number): NivelFidelidade {
  const faixa =
    FAIXAS_NIVEL.find(
      (f) => totalGasto >= f.minimo && (f.maximo === null || totalGasto <= f.maximo)
    ) ?? FAIXAS_NIVEL[0];
  return faixa.nivel;
}

export function multiplicadorDoNivel(nivel: NivelFidelidade): number {
  return FAIXAS_NIVEL.find((f) => f.nivel === nivel)?.multiplicador ?? 1;
}

export function proximaFaixa(totalGasto: number): FaixaNivel | null {
  const atual = calcularNivel(totalGasto);
  const idx = FAIXAS_NIVEL.findIndex((f) => f.nivel === atual);
  return FAIXAS_NIVEL[idx + 1] ?? null;
}

function toNumber(v: Prisma.Decimal | number): number {
  return typeof v === "number" ? v : v.toNumber();
}

// Timeout maior que o padrão (5s) para as transações de negócio abaixo:
// cada uma faz vários round-trips sequenciais, e em conexões com mais
// latência até o banco (ex: pooler do Supabase fora da região do servidor)
// o padrão estoura mesmo em operações válidas.
const OPCOES_TRANSACAO = { timeout: 15000, maxWait: 10000 };

// ---------------------------------------------------------------------------
// Campanha de pontos em dobro ativa no momento informado (padrão: agora)
// ---------------------------------------------------------------------------

export async function buscarCampanhaAtiva(data: Date = new Date()) {
  return prisma.campanha.findFirst({
    where: {
      ativo: true,
      dataInicio: { lte: data },
      dataFim: { gte: data },
    },
    orderBy: { multiplicador: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Lançamento de compra (hoje, só via importação do relatório diário de
// vendas — ver lib/importacaoVendas.ts). Calcula multiplicador de nível +
// campanha, credita pontos e cria o lote com data de expiração (12 meses).
// ---------------------------------------------------------------------------

// Lançada quando uma venda importada do relatório diário já tinha sido
// registrada antes (mesmo `pedidoExterno`) — permite ao chamador distinguir
// "já processado" de um erro de verdade.
export class VendaJaImportadaError extends Error {}

export interface RegistrarCompraParams {
  clienteId: string;
  valor: number;
  descricao: string;
  criadoPorAdminId?: string;
  comprovanteId?: string;
  // Presente quando a compra vem da importação do relatório diário de vendas
  // (.xlsx) — número do pedido no sistema da loja, usado como chave de
  // idempotência pra nunca creditar a mesma venda duas vezes.
  pedidoExterno?: string;
}

export async function registrarCompra(params: RegistrarCompraParams) {
  const { clienteId, valor, descricao, criadoPorAdminId, comprovanteId, pedidoExterno } = params;
  if (valor <= 0) throw new Error("Valor da compra deve ser maior que zero.");

  return prisma.$transaction(async (tx) => {
    if (pedidoExterno) {
      const jaImportada = await tx.vendaImportada.findUnique({ where: { pedidoExterno } });
      if (jaImportada) throw new VendaJaImportadaError(`Pedido ${pedidoExterno} já foi importado anteriormente.`);
    }

    const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: clienteId } });

    const totalGastoAtual = toNumber(cliente.totalGasto);
    const nivelAtual = calcularNivel(totalGastoAtual);
    const multNivel = multiplicadorDoNivel(nivelAtual);

    const agora = new Date();
    const campanha = await tx.campanha.findFirst({
      where: { ativo: true, dataInicio: { lte: agora }, dataFim: { gte: agora } },
      orderBy: { multiplicador: "desc" },
    });
    const multCampanha = campanha ? toNumber(campanha.multiplicador) : 1;

    const multiplicadorTotal = multNivel * multCampanha;
    const pontosGanhos = Math.round(valor * multiplicadorTotal);

    const novoTotalGasto = totalGastoAtual + valor;
    const novoNivel = calcularNivel(novoTotalGasto);

    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        clienteId,
        tipo: TipoMovimentacao.COMPRA,
        descricao,
        valorCompra: valor,
        pontos: pontosGanhos,
        multiplicadorAplicado: multiplicadorTotal,
        criadoPorAdminId,
        comprovanteId,
        campanhaId: campanha?.id,
      },
    });

    const dataExpiracao = new Date();
    dataExpiracao.setMonth(dataExpiracao.getMonth() + MESES_EXPIRACAO_PONTOS);

    await tx.pontosLote.create({
      data: {
        clienteId,
        pontosOriginais: pontosGanhos,
        pontosRestantes: pontosGanhos,
        origem: OrigemPontos.COMPRA,
        movimentacaoId: movimentacao.id,
        dataExpiracao,
      },
    });

    const clienteAtualizado = await tx.cliente.update({
      where: { id: clienteId },
      data: {
        pontos: { increment: pontosGanhos },
        totalGasto: novoTotalGasto,
        nivel: novoNivel,
      },
    });

    if (pedidoExterno) {
      await tx.vendaImportada.create({
        data: {
          pedidoExterno,
          clienteId,
          valorVenda: valor,
          movimentacaoId: movimentacao.id,
          importadoPorAdminId: criadoPorAdminId,
        },
      });
    }

    return {
      movimentacao,
      cliente: clienteAtualizado,
      pontosGanhos,
      subiuDeNivel: novoNivel !== nivelAtual,
    };
  }, OPCOES_TRANSACAO);
}

// ---------------------------------------------------------------------------
// Bônus de indicação: credita pontos fixos para quem indicou, sem afetar
// totalGasto (não é uma compra, não altera nível).
// ---------------------------------------------------------------------------

export async function registrarBonusIndicacao(clienteId: string, pontos = PONTOS_BONUS_INDICACAO) {
  return prisma.$transaction(async (tx) => {
    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        clienteId,
        tipo: TipoMovimentacao.BONUS_INDICACAO,
        descricao: "Bônus por indicação de novo cliente",
        pontos,
      },
    });

    const dataExpiracao = new Date();
    dataExpiracao.setMonth(dataExpiracao.getMonth() + MESES_EXPIRACAO_PONTOS);

    await tx.pontosLote.create({
      data: {
        clienteId,
        pontosOriginais: pontos,
        pontosRestantes: pontos,
        origem: OrigemPontos.BONUS_INDICACAO,
        movimentacaoId: movimentacao.id,
        dataExpiracao,
      },
    });

    await tx.cliente.update({
      where: { id: clienteId },
      data: { pontos: { increment: pontos } },
    });

    return movimentacao;
  }, OPCOES_TRANSACAO);
}

// ---------------------------------------------------------------------------
// Resgate de recompensa: consome os lotes de pontos mais antigos primeiro
// (FIFO) e debita o estoque da recompensa.
// ---------------------------------------------------------------------------

export async function resgatarRecompensa(clienteId: string, recompensaId: string) {
  return prisma.$transaction(async (tx) => {
    const [cliente, recompensa] = await Promise.all([
      tx.cliente.findUniqueOrThrow({ where: { id: clienteId } }),
      tx.recompensa.findUniqueOrThrow({ where: { id: recompensaId } }),
    ]);

    if (!recompensa.ativo) throw new Error("Recompensa indisponível.");
    if (recompensa.estoque <= 0) throw new Error("Recompensa esgotada.");
    if (cliente.pontos < recompensa.pontos) {
      throw new Error(
        `Faltam ${recompensa.pontos - cliente.pontos} pontos para resgatar este item.`
      );
    }

    // Consome lotes FIFO (mais antigos / próximos de expirar primeiro)
    let restante = recompensa.pontos;
    const lotes = await tx.pontosLote.findMany({
      where: { clienteId, expirado: false, pontosRestantes: { gt: 0 } },
      orderBy: { dataExpiracao: "asc" },
    });

    for (const lote of lotes) {
      if (restante <= 0) break;
      const consumo = Math.min(lote.pontosRestantes, restante);
      await tx.pontosLote.update({
        where: { id: lote.id },
        data: { pontosRestantes: { decrement: consumo } },
      });
      restante -= consumo;
    }

    const resgate = await tx.resgate.create({
      data: { clienteId, recompensaId, pontosGastos: recompensa.pontos },
    });

    await tx.movimentacaoPontos.create({
      data: {
        clienteId,
        tipo: TipoMovimentacao.RESGATE,
        descricao: recompensa.nome,
        pontos: -recompensa.pontos,
        resgateId: resgate.id,
      },
    });

    await tx.recompensa.update({
      where: { id: recompensaId },
      data: { estoque: { decrement: 1 } },
    });

    const clienteAtualizado = await tx.cliente.update({
      where: { id: clienteId },
      data: { pontos: { decrement: recompensa.pontos } },
    });

    return { resgate, cliente: clienteAtualizado };
  }, OPCOES_TRANSACAO);
}

// ---------------------------------------------------------------------------
// Confirmação de entrega: o admin confirma no balcão que o cliente retirou
// o brinde. Pontos e estoque já foram debitados no momento do resgate — isso
// só fecha o acompanhamento.
// ---------------------------------------------------------------------------

export async function confirmarEntregaResgate(resgateId: string, adminId: string) {
  const resgate = await prisma.resgate.findUniqueOrThrow({
    where: { id: resgateId },
    include: { cliente: true, recompensa: true },
  });
  if (resgate.status !== StatusResgate.PENDENTE) {
    throw new Error("Este resgate já foi finalizado (entregue ou cancelado).");
  }

  const resgateAtualizado = await prisma.resgate.update({
    where: { id: resgateId },
    data: { status: StatusResgate.ENTREGUE, entregueEm: new Date(), entreguePorAdminId: adminId },
  });

  return { resgate: resgateAtualizado, cliente: resgate.cliente, recompensa: resgate.recompensa };
}

// ---------------------------------------------------------------------------
// Cancelamento de resgate: cliente nunca retirou o brinde. Devolve os pontos
// (como um novo lote, com validade de 12 meses a partir de hoje — os lotes
// originais consumidos no resgate não são "desconsumidos") e o estoque do
// item, e marca o resgate como cancelado.
// ---------------------------------------------------------------------------

export async function cancelarResgate(resgateId: string, adminId: string, motivo?: string) {
  return prisma.$transaction(async (tx) => {
    const resgate = await tx.resgate.findUniqueOrThrow({
      where: { id: resgateId },
      include: { cliente: true, recompensa: true },
    });
    if (resgate.status !== StatusResgate.PENDENTE) {
      throw new Error("Este resgate já foi finalizado (entregue ou cancelado).");
    }

    const { cliente, recompensa } = resgate;

    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        clienteId: resgate.clienteId,
        tipo: TipoMovimentacao.AJUSTE,
        descricao: `Estorno — resgate cancelado: ${recompensa.nome}`,
        pontos: resgate.pontosGastos,
        criadoPorAdminId: adminId,
      },
    });

    const dataExpiracao = new Date();
    dataExpiracao.setMonth(dataExpiracao.getMonth() + MESES_EXPIRACAO_PONTOS);

    await tx.pontosLote.create({
      data: {
        clienteId: resgate.clienteId,
        pontosOriginais: resgate.pontosGastos,
        pontosRestantes: resgate.pontosGastos,
        origem: OrigemPontos.AJUSTE,
        movimentacaoId: movimentacao.id,
        dataExpiracao,
      },
    });

    await tx.cliente.update({
      where: { id: resgate.clienteId },
      data: { pontos: { increment: resgate.pontosGastos } },
    });

    await tx.recompensa.update({
      where: { id: resgate.recompensaId },
      data: { estoque: { increment: 1 } },
    });

    const resgateAtualizado = await tx.resgate.update({
      where: { id: resgateId },
      data: {
        status: StatusResgate.CANCELADO,
        canceladoEm: new Date(),
        canceladoPorAdminId: adminId,
        motivoCancelamento: motivo,
      },
    });

    return { resgate: resgateAtualizado, cliente, recompensa };
  }, OPCOES_TRANSACAO);
}

// ---------------------------------------------------------------------------
// Conversão de pontos em cashback: alternativa ao resgate de recompensa do
// catálogo — em vez de trocar por um brinde, o cliente converte os pontos
// acumulados em saldo de cashback (100 pontos = R$1,00), pra usar como
// desconto na próxima compra.
// ---------------------------------------------------------------------------

export async function converterPontosEmCashback(clienteId: string, pontos: number) {
  if (!Number.isInteger(pontos) || pontos <= 0) {
    throw new Error("Informe uma quantidade de pontos válida.");
  }

  return prisma.$transaction(async (tx) => {
    const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: clienteId } });

    if (cliente.pontos < pontos) {
      throw new Error(`Faltam ${pontos - cliente.pontos} pontos para essa conversão.`);
    }

    // Consome lotes FIFO (mais antigos / próximos de expirar primeiro)
    let restante = pontos;
    const lotes = await tx.pontosLote.findMany({
      where: { clienteId, expirado: false, pontosRestantes: { gt: 0 } },
      orderBy: { dataExpiracao: "asc" },
    });

    for (const lote of lotes) {
      if (restante <= 0) break;
      const consumo = Math.min(lote.pontosRestantes, restante);
      await tx.pontosLote.update({
        where: { id: lote.id },
        data: { pontosRestantes: { decrement: consumo } },
      });
      restante -= consumo;
    }

    const valorCashback = Math.round(pontos * TAXA_CONVERSAO_PONTOS_CASHBACK * 100) / 100;

    const movimentacao = await tx.movimentacaoPontos.create({
      data: {
        clienteId,
        tipo: TipoMovimentacao.CONVERSAO_CASHBACK,
        descricao: `Conversão de ${pontos} pontos em cashback`,
        pontos: -pontos,
      },
    });

    await tx.movimentacaoCashback.create({
      data: {
        clienteId,
        tipo: TipoMovimentacaoCashback.CREDITO_CONVERSAO_PONTOS,
        descricao: `Conversão de ${pontos} pontos em cashback`,
        valor: valorCashback,
      },
    });

    const clienteAtualizado = await tx.cliente.update({
      where: { id: clienteId },
      data: {
        pontos: { decrement: pontos },
        saldoCashback: { increment: valorCashback },
      },
    });

    return { movimentacao, cliente: clienteAtualizado, valorCashback };
  }, OPCOES_TRANSACAO);
}

// ---------------------------------------------------------------------------
// Expiração de lotes vencidos (rodar via rota /api/admin/manutencao/expirar
// ou via cron externo, ex: Vercel Cron / GitHub Actions agendado).
// ---------------------------------------------------------------------------

export async function expirarLotesVencidos(agora: Date = new Date()) {
  const lotesVencidos = await prisma.pontosLote.findMany({
    where: { expirado: false, pontosRestantes: { gt: 0 }, dataExpiracao: { lt: agora } },
  });

  const resultados = [];
  for (const lote of lotesVencidos) {
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.movimentacaoPontos.create({
        data: {
          clienteId: lote.clienteId,
          tipo: TipoMovimentacao.EXPIRACAO,
          descricao: "Expiração de pontos (12 meses sem uso)",
          pontos: -lote.pontosRestantes,
        },
      });

      await tx.cliente.update({
        where: { id: lote.clienteId },
        data: { pontos: { decrement: lote.pontosRestantes } },
      });

      return tx.pontosLote.update({
        where: { id: lote.id },
        data: { pontosRestantes: 0, expirado: true },
      });
    }, OPCOES_TRANSACAO);
    resultados.push(resultado);
  }

  return { lotesExpirados: resultados.length };
}
