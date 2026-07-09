import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { resgatarRecompensa } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarResgateConfirmado } from "@/lib/whatsapp";

const schema = z.object({ recompensaId: z.string().min(1) });

export async function GET() {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const resgates = await prisma.resgate.findMany({
    where: { clienteId: sessao.user.id },
    include: { recompensa: true },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(resgates);
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  try {
    const { resgate, cliente } = await resgatarRecompensa(sessao.user.id, validado.data.recompensaId);

    await registrarAuditoria({
      acao: "RESGATE_RECOMPENSA",
      entidade: "Resgate",
      entidadeId: resgate.id,
      usuarioTipo: "CLIENTE",
      usuarioId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { recompensaId: validado.data.recompensaId, pontosGastos: resgate.pontosGastos },
    });

    const recompensa = await prisma.recompensa.findUnique({ where: { id: validado.data.recompensaId } });
    if (recompensa) {
      notificarResgateConfirmado(cliente.telefone, cliente.nome, recompensa.nome).catch(() => {});
    }

    return NextResponse.json({ ok: true, resgate, pontosRestantes: cliente.pontos });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível concluir o resgate.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
