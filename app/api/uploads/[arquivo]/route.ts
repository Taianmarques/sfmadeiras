import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caminhoFisico } from "@/lib/upload";

const TIPO_POR_EXTENSAO: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

// Serve dois tipos de arquivo, cada um com sua regra de autorização:
// - Comprovante: só o cliente dono ou um admin (evita expor comprovante de terceiro)
// - Oferta (foto de produto do catálogo): qualquer sessão autenticada, já que é
//   conteúdo de marketing mostrado a todo cliente do clube
export async function GET(req: NextRequest, { params }: { params: { arquivo: string } }) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const url = `/api/uploads/${params.arquivo}`;

  const comprovante = await prisma.comprovante.findFirst({ where: { arquivoUrl: url } });
  if (comprovante) {
    const autorizado = sessao.user.role === "admin" || sessao.user.id === comprovante.clienteId;
    if (!autorizado) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
    return servirArquivo(params.arquivo, comprovante.arquivoTipo === "PDF" ? "application/pdf" : "image/jpeg");
  }

  const oferta = await prisma.oferta.findFirst({ where: { imagemUrl: url } });
  if (oferta) {
    return servirArquivo(params.arquivo);
  }

  return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
}

async function servirArquivo(nomeArmazenado: string, tipoConteudoForcado?: string) {
  try {
    const buffer = await readFile(caminhoFisico(nomeArmazenado));
    const tipoConteudo = tipoConteudoForcado ?? TIPO_POR_EXTENSAO[path.extname(nomeArmazenado).toLowerCase()] ?? "application/octet-stream";
    return new NextResponse(buffer, { headers: { "Content-Type": tipoConteudo } });
  } catch {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }
}
