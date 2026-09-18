import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { parseRelatorioVendas, RelatorioInvalidoError } from "@/lib/importacaoVendas";
import { multiplicadorDoNivel, buscarCampanhaAtiva, buscarFaixasNivel } from "@/lib/pontos";

export async function POST(req: NextRequest) {
  const { erro } = await exigirAdmin();
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

  if (linhas.length === 0) {
    return NextResponse.json({ erro: "Nenhuma linha de venda encontrada no arquivo." }, { status: 400 });
  }

  const pedidosNoArquivo = linhas.map((l) => l.pedido);
  const cpfsNoArquivo = [...new Set(linhas.map((l) => l.cpfCnpj))];

  const [jaImportadas, clientes, campanha, faixas] = await Promise.all([
    prisma.vendaImportada.findMany({
      where: { pedidoExterno: { in: pedidosNoArquivo } },
      select: { pedidoExterno: true },
    }),
    prisma.cliente.findMany({ where: { cpfCnpj: { in: cpfsNoArquivo } } }),
    buscarCampanhaAtiva(),
    buscarFaixasNivel(),
  ]);

  const pedidosJaImportados = new Set(jaImportadas.map((v) => v.pedidoExterno));
  const clientesPorCpf = new Map(clientes.map((c) => [c.cpfCnpj, c]));
  const multCampanha = campanha ? campanha.multiplicador.toNumber() : 1;

  const resultado = linhas.map((linha) => {
    if (linha.valorVenda <= 0) {
      return { ...linha, status: "valor_invalido" as const };
    }
    if (pedidosJaImportados.has(linha.pedido)) {
      return { ...linha, status: "ja_importado" as const };
    }
    const cliente = clientesPorCpf.get(linha.cpfCnpj);
    if (!cliente) {
      return { ...linha, status: "cliente_nao_encontrado" as const };
    }
    const pontosEstimados = Math.round(linha.valorVenda * multiplicadorDoNivel(faixas, cliente.nivel) * multCampanha);
    return {
      ...linha,
      status: "ok" as const,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      pontosEstimados,
    };
  });

  const resumo = {
    totalLinhas: resultado.length,
    ok: resultado.filter((l) => l.status === "ok").length,
    jaImportado: resultado.filter((l) => l.status === "ja_importado").length,
    clienteNaoEncontrado: resultado.filter((l) => l.status === "cliente_nao_encontrado").length,
    valorInvalido: resultado.filter((l) => l.status === "valor_invalido").length,
    totalValorOk: resultado.filter((l) => l.status === "ok").reduce((acc, l) => acc + l.valorVenda, 0),
    totalPontosEstimado: resultado.reduce((acc, l) => acc + ("pontosEstimados" in l ? l.pontosEstimados : 0), 0),
  };

  return NextResponse.json({ linhas: resultado, resumo });
}
