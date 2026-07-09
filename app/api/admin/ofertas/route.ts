import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

const schemaCriar = z.object({
  titulo: z.string().trim().min(2),
  descricao: z.string().trim().min(2),
  icone: z.string().trim().min(1).max(8).default("🏷️"),
  dataInicio: z.string().min(10).optional().nullable(),
  dataFim: z.string().min(10).optional().nullable(),
});

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const ofertas = await prisma.oferta.findMany({ orderBy: { criadoEm: "desc" } });
  return NextResponse.json(ofertas);
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schemaCriar.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const { dataInicio, dataFim, ...resto } = validado.data;

  if (dataInicio && dataFim && new Date(dataFim) <= new Date(dataInicio)) {
    return NextResponse.json({ erro: "A data de fim deve ser depois da data de início." }, { status: 400 });
  }

  const oferta = await prisma.oferta.create({
    data: {
      ...resto,
      dataInicio: dataInicio ? new Date(dataInicio) : null,
      dataFim: dataFim ? new Date(dataFim) : null,
      criadoPorAdminId: sessao.user.id,
    },
  });

  await registrarAuditoria({
    acao: "CRIAR_OFERTA",
    entidade: "Oferta",
    entidadeId: oferta.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json(oferta, { status: 201 });
}
