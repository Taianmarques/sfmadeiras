import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Proteção de rotas por papel (cliente/admin), em complemento às checagens
// feitas dentro de cada API Route (defesa em profundidade — a rota nunca
// deve confiar apenas no middleware).
const ROTAS_PUBLICAS_CLIENTE = ["/cliente/login", "/cliente/registro"];
const ROTAS_PUBLICAS_ADMIN = ["/admin/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const ehRotaClientePagina = pathname.startsWith("/cliente");
  const ehRotaAdminPagina = pathname.startsWith("/admin");
  const ehRotaApiCliente = pathname.startsWith("/api/cliente");
  const ehRotaApiAdmin = pathname.startsWith("/api/admin");

  if (ehRotaClientePagina && ROTAS_PUBLICAS_CLIENTE.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }
  if (ehRotaAdminPagina && ROTAS_PUBLICAS_ADMIN.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  if (ehRotaClientePagina || ehRotaApiCliente) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "cliente") {
      if (ehRotaApiCliente) {
        return NextResponse.json({ erro: "Não autenticado." }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/cliente/login", req.url));
    }
  }

  if (ehRotaAdminPagina || ehRotaApiAdmin) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      if (ehRotaApiAdmin) {
        return NextResponse.json({ erro: "Não autorizado." }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/cliente/:path*", "/admin/:path*", "/api/cliente/:path*", "/api/admin/:path*"],
};
