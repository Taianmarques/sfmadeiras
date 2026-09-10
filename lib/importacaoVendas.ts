import * as XLSX from "xlsx";
import { apenasDigitos } from "@/lib/cpf";

// ---------------------------------------------------------------------------
// Leitura do relatório diário de vendas (.xlsx). O relatório tem várias
// planilhas (Pedidos, Produtos, Contas, Resumo, Texto bruto) — só a planilha
// "Pedidos" interessa aqui: uma linha por venda, com CNPJ/CPF do cliente e o
// valor da venda.
// ---------------------------------------------------------------------------

const NOME_PLANILHA_PEDIDOS = "Pedidos";

export interface LinhaRelatorioVendas {
  pedido: string;
  data: Date | null;
  cliente: string;
  cpfCnpj: string;
  valorVenda: number;
}

export class RelatorioInvalidoError extends Error {}

// Excel guarda datas como número de dias desde 1899-12-30 (a base inclui o
// bug histórico do ano bissexto de 1900, por isso não é 1900-01-01).
function excelSerialParaData(serial: number): Date {
  const epoch = Date.UTC(1899, 11, 30);
  return new Date(epoch + serial * 86400000);
}

export function parseRelatorioVendas(buffer: Buffer): LinhaRelatorioVendas[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new RelatorioInvalidoError("Não foi possível ler o arquivo. Verifique se é um .xlsx válido.");
  }

  const sheet = workbook.Sheets[NOME_PLANILHA_PEDIDOS];
  if (!sheet) {
    throw new RelatorioInvalidoError(
      `Planilha "${NOME_PLANILHA_PEDIDOS}" não encontrada no arquivo. Verifique se é o relatório diário de vendas correto.`
    );
  }

  const linhasBrutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

  return linhasBrutas
    .map((linha): LinhaRelatorioVendas | null => {
      const pedido = linha["Pedido"];
      const cpfCnpjBruto = linha["CNPJ/CPF"];
      const valorVenda = linha["Valor Venda"];

      if (pedido == null || cpfCnpjBruto == null || valorVenda == null) return null;

      const dataSerial = linha["Data"];
      return {
        pedido: String(pedido).trim(),
        cliente: linha["Cliente"] ? String(linha["Cliente"]).trim() : "",
        cpfCnpj: apenasDigitos(String(cpfCnpjBruto)),
        valorVenda: Number(valorVenda),
        data: typeof dataSerial === "number" ? excelSerialParaData(dataSerial) : null,
      };
    })
    .filter((linha): linha is LinhaRelatorioVendas => linha !== null && linha.pedido !== "" && linha.cpfCnpj !== "");
}
