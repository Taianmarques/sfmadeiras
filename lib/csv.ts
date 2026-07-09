// Geração simples de CSV (separador ";" — melhor compatibilidade com Excel PT-BR)

function escaparCampo(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (/[";\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function gerarCsv(cabecalho: string[], linhas: unknown[][]): string {
  const bom = "﻿"; // garante acentuação correta ao abrir no Excel
  const todasLinhas = [cabecalho, ...linhas];
  return bom + todasLinhas.map((linha) => linha.map(escaparCampo).join(";")).join("\n");
}

export function respostaCsv(conteudo: string, nomeArquivo: string): Response {
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
    },
  });
}
