import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { gerarCsv, respostaCsv } from "@/lib/csv";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const movimentacoes = await prisma.movimentacaoPontos.findMany({
    orderBy: { criadoEm: "desc" },
    take: 5000,
    include: { cliente: { select: { nome: true, cpfCnpj: true } } },
  });

  const csv = gerarCsv(
    ["Data", "Cliente", "CPF/CNPJ", "Tipo", "Descrição", "Valor (R$)", "Pontos", "Multiplicador"],
    movimentacoes.map((m) => [
      m.criadoEm.toISOString().slice(0, 19).replace("T", " "),
      m.cliente.nome,
      m.cliente.cpfCnpj,
      m.tipo,
      m.descricao,
      m.valorCompra ? m.valorCompra.toFixed(2).replace(".", ",") : "",
      m.pontos,
      m.multiplicadorAplicado ? m.multiplicadorAplicado.toFixed(2).replace(".", ",") : "",
    ])
  );

  return respostaCsv(csv, `movimentacoes-madeireira-pinheiro-${new Date().toISOString().slice(0, 10)}.csv`);
}
