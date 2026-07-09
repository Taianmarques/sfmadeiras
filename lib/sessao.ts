import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

// Helpers usados no início de toda API Route protegida. Lançam uma resposta
// 401/403 pronta para ser retornada (`return erro` em vez de try/catch).

export async function exigirCliente() {
  const sessao = await getServerSession(authOptions);
  if (!sessao || sessao.user.role !== "cliente") {
    return { sessao: null, erro: NextResponse.json({ erro: "Não autenticado." }, { status: 401 }) };
  }
  return { sessao, erro: null };
}

export async function exigirAdmin() {
  const sessao = await getServerSession(authOptions);
  if (!sessao || sessao.user.role !== "admin") {
    return { sessao: null, erro: NextResponse.json({ erro: "Não autorizado." }, { status: 403 }) };
  }
  return { sessao, erro: null };
}
