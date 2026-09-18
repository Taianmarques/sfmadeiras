import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";

export async function GET() {
  const { erro } = await exigirAdmin();
  if (erro) return erro;

  const faixas = await prisma.faixaNivelConfig.findMany({ orderBy: { minimo: "asc" } });

  return NextResponse.json(
    faixas.map((f) => ({
      nivel: f.nivel,
      minimo: f.minimo.toNumber(),
      maximo: f.maximo ? f.maximo.toNumber() : null,
      multiplicador: f.multiplicador.toNumber(),
    }))
  );
}

const schema = z
  .array(
    z.object({
      nivel: z.enum(["BRONZE", "PRATA", "OURO", "DIAMANTE"]),
      minimo: z.number().min(0),
      maximo: z.number().positive().nullable(),
      multiplicador: z.number().positive(),
    })
  )
  .length(4);

export async function PUT(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  for (const faixa of validado.data) {
    if (faixa.maximo !== null && faixa.maximo <= faixa.minimo) {
      return NextResponse.json(
        { erro: `Nível ${faixa.nivel}: o máximo precisa ser maior que o mínimo.` },
        { status: 400 }
      );
    }
  }

  try {
    await prisma.$transaction(
      validado.data.map((faixa) =>
        prisma.faixaNivelConfig.update({
          where: { nivel: faixa.nivel },
          data: { minimo: faixa.minimo, maximo: faixa.maximo, multiplicador: faixa.multiplicador },
        })
      )
    );

    await registrarAuditoria({
      acao: "ATUALIZAR_FAIXAS_NIVEL",
      entidade: "FaixaNivelConfig",
      usuarioTipo: "ADMIN",
      adminId: sessao.user.id,
      ip: extrairIp(req.headers),
      detalhes: { faixas: validado.data },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Não foi possível salvar as configurações.";
    return NextResponse.json({ erro: mensagem }, { status: 400 });
  }
}
