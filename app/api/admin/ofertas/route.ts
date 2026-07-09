import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { salvarImagemProduto, ArquivoInvalidoError } from "@/lib/upload";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const ofertas = await prisma.oferta.findMany({ orderBy: { criadoEm: "desc" } });
  return NextResponse.json(
    ofertas.map((o) => ({
      ...o,
      precoNormal: o.precoNormal.toNumber(),
      precoPromocional: o.precoPromocional.toNumber(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = formData.get("descricao") ? String(formData.get("descricao")).trim() : null;
  const precoNormal = parseFloat(String(formData.get("precoNormal") ?? "").replace(",", "."));
  const precoPromocional = parseFloat(String(formData.get("precoPromocional") ?? "").replace(",", "."));
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
  if (!(imagem instanceof File) || imagem.size === 0) {
    return NextResponse.json({ erro: "Envie uma foto do produto." }, { status: 400 });
  }

  const dataInicio = dataInicioRaw ? new Date(String(dataInicioRaw)) : null;
  const dataFim = dataFimRaw ? new Date(String(dataFimRaw)) : null;
  if (dataInicio && dataFim && dataFim <= dataInicio) {
    return NextResponse.json({ erro: "A data de fim deve ser depois da data de início." }, { status: 400 });
  }

  try {
    const imagemUrl = await salvarImagemProduto(imagem);

    const oferta = await prisma.oferta.create({
      data: {
        titulo,
        descricao,
        imagemUrl,
        precoNormal,
        precoPromocional,
        dataInicio,
        dataFim,
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

    return NextResponse.json(
      { ...oferta, precoNormal: oferta.precoNormal.toNumber(), precoPromocional: oferta.precoPromocional.toNumber() },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) {
      return NextResponse.json({ erro: e.message }, { status: 400 });
    }
    throw e;
  }
}
