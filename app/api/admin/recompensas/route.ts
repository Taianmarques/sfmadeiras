import { NextRequest, NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { salvarImagemProduto, ArquivoInvalidoError } from "@/lib/upload";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const recompensas = await prisma.recompensa.findMany({ orderBy: { pontos: "asc" } });
  return NextResponse.json(recompensas);
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const nome = String(formData.get("nome") ?? "").trim();
  const pontos = parseInt(String(formData.get("pontos") ?? ""), 10);
  const estoque = parseInt(String(formData.get("estoque") ?? ""), 10);
  const icone = String(formData.get("icone") ?? "🎁").trim() || "🎁";
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
    const imagemUrl = imagem instanceof File && imagem.size > 0 ? await salvarImagemProduto(imagem) : null;

    const recompensa = await prisma.recompensa.create({
      data: { nome, pontos, estoque, icone, imagemUrl },
    });

    await registrarAuditoria({
      acao: "CRIAR_RECOMPENSA",
      entidade: "Recompensa",
      entidadeId: recompensa.id,
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
    });

    return NextResponse.json(recompensa, { status: 201 });
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) {
      return NextResponse.json({ erro: e.message }, { status: 400 });
    }
    throw e;
  }
}
