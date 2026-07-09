import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { salvarImagemOferta, ArquivoInvalidoError } from "@/lib/upload";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const existente = await prisma.oferta.findUnique({ where: { id: params.id } });
  if (!existente) return NextResponse.json({ erro: "Oferta não encontrada." }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const titulo = formData.has("titulo") ? String(formData.get("titulo")).trim() : existente.titulo;
  const descricao = formData.has("descricao") ? String(formData.get("descricao")).trim() || null : existente.descricao;
  const precoNormal = formData.has("precoNormal")
    ? parseFloat(String(formData.get("precoNormal")).replace(",", "."))
    : existente.precoNormal.toNumber();
  const precoPromocional = formData.has("precoPromocional")
    ? parseFloat(String(formData.get("precoPromocional")).replace(",", "."))
    : existente.precoPromocional.toNumber();
  const ativo = formData.has("ativo") ? formData.get("ativo") === "true" : existente.ativo;
  const dataInicioRaw = formData.get("dataInicio");
  const dataFimRaw = formData.get("dataFim");
  const imagem = formData.get("imagem");

  if (!titulo || titulo.length < 2) {
    return NextResponse.json({ erro: "Informe o título do produto." }, { status: 400 });
  }
  if (!precoNormal || precoNormal <= 0 || !precoPromocional || precoPromocional <= 0) {
    return NextResponse.json({ erro: "Informe o preço normal e o preço promocional." }, { status: 400 });
  }
  if (precoPromocional >= precoNormal) {
    return NextResponse.json({ erro: "O preço promocional deve ser menor que o preço normal." }, { status: 400 });
  }

  const dataInicio = formData.has("dataInicio") ? (dataInicioRaw ? new Date(String(dataInicioRaw)) : null) : existente.dataInicio;
  const dataFim = formData.has("dataFim") ? (dataFimRaw ? new Date(String(dataFimRaw)) : null) : existente.dataFim;
  if (dataInicio && dataFim && dataFim <= dataInicio) {
    return NextResponse.json({ erro: "A data de fim deve ser depois da data de início." }, { status: 400 });
  }

  try {
    const imagemUrl = imagem instanceof File && imagem.size > 0 ? await salvarImagemOferta(imagem) : existente.imagemUrl;

    const oferta = await prisma.oferta.update({
      where: { id: params.id },
      data: { titulo, descricao, imagemUrl, precoNormal, precoPromocional, dataInicio, dataFim, ativo },
    });

    await registrarAuditoria({
      acao: "ATUALIZAR_OFERTA",
      entidade: "Oferta",
      entidadeId: oferta.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
    });

    return NextResponse.json({
      ...oferta,
      precoNormal: oferta.precoNormal.toNumber(),
      precoPromocional: oferta.precoPromocional.toNumber(),
    });
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) {
      return NextResponse.json({ erro: e.message }, { status: 400 });
    }
    throw e;
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const oferta = await prisma.oferta.update({ where: { id: params.id }, data: { ativo: false } });

  await registrarAuditoria({
    acao: "DESATIVAR_OFERTA",
    entidade: "Oferta",
    entidadeId: oferta.id,
    usuarioTipo: "ADMIN",
    adminId: sessao.user.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
