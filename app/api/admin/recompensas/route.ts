import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaCriar = z.object({
  nome: z.string().trim().min(2),
  pontos: z.number().int().positive(),
  estoque: z.number().int().min(0),
  icone: z.string().trim().min(1).max(8).default("🎁"),
});

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const recompensas = await prisma.recompensa.findMany({ orderBy: { pontos: "asc" } });
  return NextResponse.json(recompensas);
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schemaCriar.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const recompensa = await prisma.recompensa.create({ data: validado.data });

  await registrarAuditoria({
    acao: "CRIAR_RECOMPENSA",
    entidade: "Recompensa",
    entidadeId: recompensa.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json(recompensa, { status: 201 });
}
