import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import type { TipoArquivo } from "@prisma/client";

// ---------------------------------------------------------------------------
// Upload local de comprovantes em /uploads (fora de /public, para exigir
// autenticação ao servir o arquivo — veja app/api/uploads/[...caminho]).
//
// Para trocar por S3 no futuro: substitua `salvarArquivo` mantendo a mesma
// assinatura (recebe File, devolve { url, tipo, nomeOriginal }), e ajuste a
// rota de download para redirecionar/assinar a URL do bucket.
// ---------------------------------------------------------------------------

const TIPOS_PERMITIDOS: Record<string, TipoArquivo> = {
  "image/jpeg": "IMAGEM",
  "image/png": "IMAGEM",
  "image/webp": "IMAGEM",
  "application/pdf": "PDF",
};

const TIPOS_IMAGEM_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp"]);

export const TAMANHO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8MB

const DIRETORIO_UPLOADS = path.join(process.cwd(), "uploads");

export class ArquivoInvalidoError extends Error {}

async function salvarArquivoBruto(file: File, extensao: string): Promise<string> {
  await mkdir(DIRETORIO_UPLOADS, { recursive: true });

  const nomeArmazenado = `${randomUUID()}.${extensao}`;
  const caminhoCompleto = path.join(DIRETORIO_UPLOADS, nomeArmazenado);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(caminhoCompleto, buffer);

  return nomeArmazenado;
}

export async function salvarComprovante(file: File): Promise<{
  arquivoNome: string;
  arquivoUrl: string;
  arquivoTipo: TipoArquivo;
}> {
  const tipo = TIPOS_PERMITIDOS[file.type];
  if (!tipo) {
    throw new ArquivoInvalidoError("Envie uma imagem (JPG/PNG/WebP) ou um PDF.");
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    throw new ArquivoInvalidoError("Arquivo maior que 8MB.");
  }

  const extensao = tipo === "PDF" ? "pdf" : (file.type.split("/")[1] ?? "jpg");
  const nomeArmazenado = await salvarArquivoBruto(file, extensao);

  return {
    arquivoNome: file.name,
    arquivoUrl: `/api/uploads/${nomeArmazenado}`,
    arquivoTipo: tipo,
  };
}

// Foto de produto usada no catálogo de ofertas e no catálogo de recompensas —
// é conteúdo de marketing/catálogo, não comprovante, então não fica preso a
// um cliente (qualquer sessão autenticada pode visualizar).
export async function salvarImagemProduto(file: File): Promise<string> {
  if (!TIPOS_IMAGEM_PERMITIDOS.has(file.type)) {
    throw new ArquivoInvalidoError("Envie uma imagem (JPG/PNG/WebP).");
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    throw new ArquivoInvalidoError("Imagem maior que 8MB.");
  }

  const extensao = file.type.split("/")[1] ?? "jpg";
  const nomeArmazenado = await salvarArquivoBruto(file, extensao);
  return `/api/uploads/${nomeArmazenado}`;
}

export function caminhoFisico(nomeArmazenado: string): string {
  // impede path traversal (../../etc) — só aceita o basename
  const seguro = path.basename(nomeArmazenado);
  return path.join(DIRETORIO_UPLOADS, seguro);
}
