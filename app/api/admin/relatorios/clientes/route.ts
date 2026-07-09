import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { gerarCsv, respostaCsv } from "@/lib/csv";
import { formatarCpfCnpj } from "@/lib/cpf";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const clientes = await prisma.cliente.findMany({ orderBy: { nome: "asc" } });

  const csv = gerarCsv(
    ["Nome", "CPF/CNPJ", "Telefone", "Nível", "Pontos", "Total gasto (R$)", "Cliente desde", "Ativo"],
    clientes.map((c) => [
      c.nome,
      formatarCpfCnpj(c.cpfCnpj),
      c.telefone,
      c.nivel,
      c.pontos,
      c.totalGasto.toFixed(2).replace(".", ","),
      c.criadoEm.toISOString().slice(0, 10),
      c.ativo ? "Sim" : "Não",
    ])
  );

  return respostaCsv(csv, `clientes-sf-madeiras-${new Date().toISOString().slice(0, 10)}.csv`);
}
