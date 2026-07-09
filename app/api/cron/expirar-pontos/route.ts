import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { expirarLotesVencidos } from "@/lib/pontos";
import { registrarAuditoria } from "@/lib/auditoria";

// Expira lotes de pontos vencidos (12 meses sem uso). Pode ser chamado:
// 1) manualmente por um admin logado no painel, ou
// 2) por um cron externo (Vercel Cron / GitHub Actions) enviando o header
//    `x-cron-secret` com o valor de CRON_SECRET — não precisa de sessão.
export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret");
  const autorizadoPorCron = Boolean(process.env.CRON_SECRET) && cronSecret === process.env.CRON_SECRET;

  let adminId: string | undefined;
  if (!autorizadoPorCron) {
    const sessao = await getServerSession(authOptions);
    if (!sessao || sessao.user.role !== "admin") {
      return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
    }
    adminId = sessao.user.id;
  }

  const resultado = await expirarLotesVencidos();

  await registrarAuditoria({
    acao: "EXPIRAR_PONTOS",
    usuarioTipo: autorizadoPorCron ? "SISTEMA" : "ADMIN",
    adminId,
    detalhes: resultado,
  });

  return NextResponse.json(resultado);
}
