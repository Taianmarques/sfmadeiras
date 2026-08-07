import { TipoMovimentacaoCashback } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// Regras de negócio: solicitação, aprovação e rejeição de resgate de
// cashback. O crédito de cashback por compra vive em `registrarCompra`
// (lib/pontos.ts), na mesma transação que credita os pontos.
//
// Diferente do resgate de recompensa (instantâneo), o saldo só é debitado
// quando um admin aprova a solicitação — nunca mexa em `Cliente.saldoCashback`
// fora daqui.
// ---------------------------------------------------------------------------

export const LIMITE_RESGATES_CASHBACK_PENDENTES = 1;

const OPCOES_TRANSACAO = { timeout: 15000, maxWait: 10000 };

function toNumber(v: { toNumber(): number } | number): number {
  return typeof v === "number" ? v : v.toNumber();
}

// ---------------------------------------------------------------------------
// Solicitação de resgate: só valida saldo e cria o pedido PENDENTE. O saldo
// só é debitado na aprovação (para evitar prender saldo de um pedido que
// pode ser rejeitado).
// ---------------------------------------------------------------------------

export async function solicitarResgateCashback(clienteId: string, valor: number) {
  if (valor <= 0) throw new Error("Valor do resgate deve ser maior que zero.");

  const cliente = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
  if (toNumber(cliente.saldoCashback) < valor) {
    throw new Error("Saldo de cashback insuficiente.");
  }

  const pendentes = await prisma.resgateCashback.count({
    where: { clienteId, status: "PENDENTE" },
  });
  if (pendentes >= LIMITE_RESGATES_CASHBACK_PENDENTES) {
    throw new Error("Você já tem um resgate de cashback em análise. Aguarde a loja avaliar antes de pedir outro.");
  }

  return prisma.resgateCashback.create({
    data: { clienteId, valor },
  });
}

// ---------------------------------------------------------------------------
// Aprovação: revalida o saldo (pode ter mudado desde a solicitação), debita
// e registra a movimentação.
// ---------------------------------------------------------------------------

export async function aprovarResgateCashback(resgateCashbackId: string, adminId: string) {
  return prisma.$transaction(async (tx) => {
    const resgate = await tx.resgateCashback.findUniqueOrThrow({ where: { id: resgateCashbackId } });
    if (resgate.status !== "PENDENTE") throw new Error("Este resgate já foi analisado.");

    const cliente = await tx.cliente.findUniqueOrThrow({ where: { id: resgate.clienteId } });
    const valor = toNumber(resgate.valor);
    if (toNumber(cliente.saldoCashback) < valor) {
      throw new Error("Saldo de cashback insuficiente para aprovar este resgate.");
    }

    await tx.movimentacaoCashback.create({
      data: {
        clienteId: resgate.clienteId,
        tipo: TipoMovimentacaoCashback.RESGATE,
        descricao: "Resgate de cashback",
        valor: -valor,
        resgateCashbackId: resgate.id,
        criadoPorAdminId: adminId,
      },
    });

    const resgateAtualizado = await tx.resgateCashback.update({
      where: { id: resgate.id },
      data: { status: "APROVADO", analisadoPorAdminId: adminId, analisadoEm: new Date() },
    });

    const clienteAtualizado = await tx.cliente.update({
      where: { id: resgate.clienteId },
      data: { saldoCashback: { decrement: valor } },
    });

    return { resgate: resgateAtualizado, cliente: clienteAtualizado };
  }, OPCOES_TRANSACAO);
}

export async function rejeitarResgateCashback(resgateCashbackId: string, adminId: string, motivo: string) {
  const resgate = await prisma.resgateCashback.findUniqueOrThrow({ where: { id: resgateCashbackId } });
  if (resgate.status !== "PENDENTE") throw new Error("Este resgate já foi analisado.");

  return prisma.resgateCashback.update({
    where: { id: resgateCashbackId },
    data: {
      status: "REJEITADO",
      motivoRejeicao: motivo,
      analisadoPorAdminId: adminId,
      analisadoEm: new Date(),
    },
  });
}
