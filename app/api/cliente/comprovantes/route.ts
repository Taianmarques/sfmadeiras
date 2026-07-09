import { NextRequest, NextResponse } from "next/server";
import { exigirCliente } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { salvarComprovante, ArquivoInvalidoError } from "@/lib/upload";
import { LIMITE_COMPROVANTES_PENDENTES } from "@/lib/pontos";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { checarLimite, LIMITES } from "@/lib/rateLimit";

export async function GET() {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const comprovantes = await prisma.comprovante.findMany({
    where: { clienteId: sessao.user.id },
    orderBy: { criadoEm: "desc" },
  });

  return NextResponse.json(
    comprovantes.map((c) => ({ ...c, valorInformado: c.valorInformado.toNumber() }))
  );
}

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirCliente();
  if (erro) return erro;

  const ip = extrairIp(req.headers) ?? "desconhecido";
  const limite = checarLimite(
    `comprovante:${sessao.user.id}`,
    LIMITES.COMPROVANTE.max,
    LIMITES.COMPROVANTE.janelaMs
  );
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitos comprovantes enviados. Tente novamente mais tarde." },
      { status: 429 }
    );
  }

  const pendentes = await prisma.comprovante.count({
    where: { clienteId: sessao.user.id, status: "PENDENTE" },
  });
  if (pendentes >= LIMITE_COMPROVANTES_PENDENTES) {
    return NextResponse.json(
      {
        erro: `Você já tem ${LIMITE_COMPROVANTES_PENDENTES} comprovantes em análise. Aguarde a loja avaliar antes de enviar outro.`,
      },
      { status: 400 }
    );
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });

  const arquivo = formData.get("arquivo");
  const valorInformadoRaw = formData.get("valor");
  const descricao = formData.get("descricao");

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ erro: "Anexe uma foto ou PDF do comprovante." }, { status: 400 });
  }

  const valorInformado = parseFloat(String(valorInformadoRaw).replace(",", "."));
  if (!valorInformado || valorInformado <= 0) {
    return NextResponse.json({ erro: "Informe um valor de compra válido." }, { status: 400 });
  }

  try {
    const { arquivoNome, arquivoUrl, arquivoTipo } = await salvarComprovante(arquivo);

    const comprovante = await prisma.comprovante.create({
      data: {
        clienteId: sessao.user.id,
        valorInformado,
        descricao: descricao ? String(descricao).slice(0, 300) : null,
        arquivoNome,
        arquivoUrl,
        arquivoTipo,
      },
    });

    await registrarAuditoria({
      acao: "ENVIO_COMPROVANTE",
      entidade: "Comprovante",
      entidadeId: comprovante.id,
      usuarioTipo: "CLIENTE",
      usuarioId: sessao.user.id,
      ip,
      detalhes: { valorInformado },
    });

    return NextResponse.json({ ...comprovante, valorInformado: comprovante.valorInformado.toNumber() }, { status: 201 });
  } catch (e) {
    if (e instanceof ArquivoInvalidoError) {
      return NextResponse.json({ erro: e.message }, { status: 400 });
    }
    throw e;
  }
}
