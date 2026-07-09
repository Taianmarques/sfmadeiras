import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { caminhoFisico } from "@/lib/upload";

// Serve o arquivo de um comprovante somente para: o cliente dono do
// comprovante, ou qualquer admin. Evita expor comprovantes de terceiros.
export async function GET(req: NextRequest, { params }: { params: { arquivo: string } }) {
  const sessao = await getServerSession(authOptions);
  if (!sessao) return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });

  const url = `/api/uploads/${params.arquivo}`;
  const comprovante = await prisma.comprovante.findFirst({ where: { arquivoUrl: url } });
  if (!comprovante) return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });

  const autorizado = sessao.user.role === "admin" || sessao.user.id === comprovante.clienteId;
  if (!autorizado) return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });

  try {
    const buffer = await readFile(caminhoFisico(params.arquivo));
    const tipoConteudo = comprovante.arquivoTipo === "PDF" ? "application/pdf" : "image/jpeg";
    return new NextResponse(buffer, { headers: { "Content-Type": tipoConteudo } });
  } catch {
    return NextResponse.json({ erro: "Arquivo não encontrado." }, { status: 404 });
  }
}
