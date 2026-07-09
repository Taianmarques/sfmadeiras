import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarCompra } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { notificarComprovanteAprovado } from "@/lib/whatsapp";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const comprovante = await prisma.comprovante.findUnique({ where: { id: params.id } });
  if (!comprovante) return NextResponse.json({ erro: "Comprovante não encontrado." }, { status: 404 });
  if (comprovante.status !== "PENDENTE") {
    return NextResponse.json({ erro: "Este comprovante já foi analisado." }, { status: 400 });
  }

  const { movimentacao, cliente, pontosGanhos } = await registrarCompra({
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
    detalhes: { pontosGanhos },
  });

  notificarComprovanteAprovado(cliente.telefone, cliente.nome, pontosGanhos).catch(() => {});

  return NextResponse.json({ ok: true, pontosGanhos, movimentacaoId: movimentacao.id });
}
