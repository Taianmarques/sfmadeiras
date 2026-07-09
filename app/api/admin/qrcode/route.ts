import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";

const schema = z.object({ qrCodeToken: z.string().min(1) });

// Usado pelo painel da loja ao ler o QR Code do cliente (via câmera ou
// leitor) para pré-preencher a tela de "Lançar compra".
export async function POST(req: NextRequest) {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) return NextResponse.json({ erro: "QR Code inválido." }, { status: 400 });

  const cliente = await prisma.cliente.findUnique({
    where: { qrCodeToken: validado.data.qrCodeToken },
    select: { id: true, nome: true, cpfCnpj: true, pontos: true, nivel: true, ativo: true },
  });

  if (!cliente || !cliente.ativo) {
    return NextResponse.json({ erro: "Cliente não encontrado." }, { status: 404 });
  }

  return NextResponse.json(cliente);
}
