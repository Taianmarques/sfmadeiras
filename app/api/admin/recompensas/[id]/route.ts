import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { salvarImagemProduto, ArquivoInvalidoError } from "@/lib/upload";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const existente = await prisma.recompensa.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Recompensa não encontrada." }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const nome = formData.has("nome") ? String(formData.get("nome")).trim() : existente.nome;
  const pontos = formData.has("pontos") ? parseInt(String(formData.get("pontos")), 10) : existente.pontos;
  const estoque = formData.has("estoque") ? parseInt(String(formData.get("estoque")), 10) : existente.estoque;
  const icone = formData.has("icone") ? String(formData.get("icone")).trim() || "🎁" : existente.icone;
  const ativo = formData.has("ativo") ? formData.get("ativo") === "true" : existente.ativo;
  const imagem = formData.get("imagem");

  if (!nome || nome.length < 2) {
    return NextResponse.json({ erro: "Informe o nome da recompensa." }, { status: 400 });
  }
  if (!pontos || pontos <= 0) {
    return NextResponse.json({ erro: "Informe a quantidade de pontos." }, { status: 400 });
  }
  if (isNaN(estoque) || estoque < 0) {
    return NextResponse.json({ erro: "Informe o estoque." }, { status: 400 });
  }

  try {
    const imagemUrl = imagem instanceof File && imagem.size > 0 ? await salvarImagemProduto(imagem) : existente.imagemUrl;

    const recompensa = await prisma.recompensa.update({
      where: { id: params.id },
      data: { nome, pontos, estoque, icone, imagemUrl, ativo },
    });

    await registrarAuditoria({
      acao: "ATUALIZAR_RECOMPENSA",
      entidade: "Recompensa",
      entidadeId: recompensa.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
    });

    return NextResponse.json(recompensa);
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) {
      return NextResponse.json({ erro: e.message }, { status: 400 });
    }
    throw e;
  }
}

// Soft delete: desativa em vez de apagar, para preservar o histórico de
// resgates já realizados (Resgate referencia Recompensa).
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const recompensa = await prisma.recompensa.update({
    where: { id: params.id },
    data: { ativo: false },
  });

  await registrarAuditoria({
    acao: "DESATIVAR_RECOMPENSA",
    entidade: "Recompensa",
    entidadeId: recompensa.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
