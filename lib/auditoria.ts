import { prisma } from "@/lib/prisma";
import { TipoUsuarioAuditoria } from "@prisma/client";

export interface RegistrarAuditoriaParams {
  acao: string;
  entidade?: string;
  entidadeId?: string;
  usuarioTipo: TipoUsuarioAuditoria;
  usuarioId?: string;
  adminId?: string;
  ip?: string | null;
  detalhes?: Record<string, unknown>;
}

// Toda ação sensível (lançamento de compra, aprovação/rejeição de
// comprovante, resgate, login, ajuste manual) deve chamar esta função.
export async function registrarAuditoria(params: RegistrarAuditoriaParams) {
  const { acao, entidade, entidadeId, usuarioTipo, usuarioId, adminId, ip, detalhes } = params;
  await prisma.logAuditoria.create({
    data: {
      acao,
      entidade,
      entidadeId,
      usuarioTipo,
      usuarioId,
      adminId,
      ip: ip ?? undefined,
      detalhes: detalhes as never,
    },
  });
}

// Extrai o IP do cliente a partir dos headers do Next.js (considera proxy/CDN)
export function extrairIp(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return headers.get("x-real-ip");
}
