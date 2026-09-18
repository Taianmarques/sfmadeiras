import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { parseRelatorioVendas, RelatorioInvalidoError } from "@/lib/importacaoVendas";
import { registrarCompra, VendaJaImportadaError } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const formData = await req.formData().catch(() => null);
  const arquivo = formData?.get("arquivo");
  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: "Anexe o arquivo .xlsx do relatório." }, { status: 400 });
  }

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  let linhas;
  try {
    linhas = parseRelatorioVendas(buffer);
  } catch (e) {
    const mensagem = e instanceof RelatorioInvalidoError ? e.message : "Não foi possível ler o arquivo.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }

  const cpfsNoArquivo = [...new Set(linhas.map((l) => l.cpfCnpj))];
  const clientes = await prisma.cliente.findMany({ where: { cpfCnpj: { in: cpfsNoArquivo } } });
  const clientesPorCpf = new Map(clientes.map((c) => [c.cpfCnpj, c]));

  let importadas = 0;
  let jaImportadas = 0;
  let valorInvalido = 0;
  let pontosCreditados = 0;
  let valorCreditado = 0;
  const clientesNaoEncontrados: { pedido: string; cliente: string; cpfCnpj: string }[] = [];
  const falhas: { pedido: string; erro: string }[] = [];

  // Sequencial (não paralelo) — cada linha abre sua própria transação em
  // registrarCompra, e processar em paralelo esgotaria o pool de conexões.
  for (const linha of linhas) {
    if (linha.valorVenda <= 0) {
      valorInvalido += 1;
      continue;
    }

    const cliente = clientesPorCpf.get(linha.cpfCnpj);
    if (!cliente) {
      clientesNaoEncontrados.push({ pedido: linha.pedido, cliente: linha.cliente, cpfCnpj: linha.cpfCnpj });
      continue;
    }

    try {
      const { pontosGanhos } = await registrarCompra({
        clienteId: cliente.id,
        valor: linha.valorVenda,
        descricao: `Compra — Pedido ${linha.pedido}`,
        criadoPorAdminId: sessao.user.id,
        pedidoExterno: linha.pedido,
      });
      importadas += 1;
      pontosCreditados += pontosGanhos;
      valorCreditado += linha.valorVenda;
    } catch (e) {
      if (e instanceof VendaJaImportadaError) {
        jaImportadas += 1;
        continue;
      }
      falhas.push({ pedido: linha.pedido, erro: e instanceof Error ? e.message : "Falha desconhecida." });
    }
  }

  await registrarAuditoria({
    acao: "IMPORTAR_VENDAS_DIARIO",
    entidade: "VendaImportada",
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
    detalhes: {
      arquivoNome: arquivo.name,
      totalLinhas: linhas.length,
      importadas,
      jaImportadas,
      valorInvalido,
      pontosCreditados,
      valorCreditado,
      clientesNaoEncontrados: clientesNaoEncontrados.length,
      falhas: falhas.length,
    },
  });

  return NextResponse.json({
    importadas,
    jaImportadas,
    valorInvalido,
    pontosCreditados,
    valorCreditado,
    clientesNaoEncontrados,
    falhas,
  });
}
