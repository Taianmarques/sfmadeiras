import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { exigirAdmin } from "@/lib/sessao";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria, extrairIp } from "@/lib/auditoria";
import { checarLimite, LIMITES } from "@/lib/rateLimit";

const schema = z.object({
  senhaAtual: z.string().min(1, "Informe a senha atual."),
  novaSenha: z.string().min(8, "A nova senha deve ter ao menos 8 caracteres."),
});

export async function POST(req: NextRequest) {
  const { sessao, erro } = await exigirAdmin();
  if (erro) return erro;

  // Mesmo limite do login: sem isso, uma sessão roubada poderia usar este
  // endpoint pra adivinhar a senha atual por força bruta.
  const limite = checarLimite(`alterar-senha:${sessao.user.id}`, LIMITES.LOGIN.max, LIMITES.LOGIN.janelaMs);
  if (!limite.permitido) {
    return NextResponse.json({ erro: "Muitas tentativas. Tente novamente em alguns minutos." }, { status: 429 });
  }

  const corpo = await req.json().catch(() => null);
  const validado = schema.safeParse(corpo);
  if (!validado.success) {
    return NextResponse.json({ erro: validado.error.errors[0].message }, { status: 400 });
  }

  const admin = await prisma.admin.findUnique({ where: { id: sessao.user.id } });
  if (!admin || !admin.ativo) {
    return NextResponse.json({ erro: "Admin não encontrado." }, { status: 404 });
  }

  const senhaConfere = await bcrypt.compare(validado.data.senhaAtual, admin.senhaHash);
  if (!senhaConfere) {
    return NextResponse.json({ erro: "Senha atual incorreta." }, { status: 400 });
  }

  if (validado.data.novaSenha === validado.data.senhaAtual) {
    return NextResponse.json({ erro: "A nova senha deve ser diferente da atual." }, { status: 400 });
  }

  const senhaHash = await bcrypt.hash(validado.data.novaSenha, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { senhaHash } });

  await registrarAuditoria({
    acao: "ALTERAR_SENHA_ADMIN",
    entidade: "Admin",
    entidadeId: admin.id,
    usuarioTipo: "ADMIN",
    adminId: admin.id,
    ip: extrairIp(req.headers),
  });

  return NextResponse.json({ ok: true });
}
