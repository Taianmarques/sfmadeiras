import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarCompra } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarComprovanteAprovado } from "@/lib/whatsapp";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(100) });

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const comprovantes = await prisma.comprovante.findMany({
    where: { id: { in: validado.data.ids }, status: "PENDENTE" },
  });

  const resultados: { id: string; ok: boolean; erro?: string }[] = [];

  for (const comprovante of comprovantes) {
    try {
      const { cliente, pontosGanhos } = await registrarCompra({
        clienteId: comprovante.clienteId,
        valor: comprovante.valorInformado.toNumber(),
        descricao: comprovante.descricao || "Compra via comprovante anexado",
        criadoPorAdminId: sessao.user.id,
        comprovanteId: comprovante.id,
      });

      await prisma.comprovante.update({
        where: { id: comprovante.id },
        data: { status: "APROVADO", analisadoPorAdminId: sessao.user.id, analisadoEm: new Date() },
      });

      await registrarAuditoria({
        acao: "APROVAR_COMPROVANTE",
        entidade: "Comprovante",
        entidadeId: comprovante.id,
        usuarioTipo: "ADMIN",
        adminId: sessao.user.id,
        ip: extrairIp(req.headers),
        detalhes: { pontosGanhos, aprovacaoEmLote: true },
      });

      notificarComprovanteAprovado(cliente.telefone, cliente.nome, pontosGanhos).catch(() => {});

      resultados.push({ id: comprovante.id, ok: true });
    } catch (e) {
      resultados.push({ id: comprovante.id, ok: false, erro: e instanceof Error ? e.message : "Falha ao aprovar." });
    }
  }

  return NextResponse.json({ resultados });
}
