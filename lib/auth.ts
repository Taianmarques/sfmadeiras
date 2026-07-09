import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { apenasDigitos } from "@/lib/cpf";
import { checarLimite, LIMITES } from "@/lib/rateLimit";
import { registrarAuditoria } from "@/lib/auditoria";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/cliente/login",
  },
  providers: [
    CredentialsProvider({
      id: "cliente-login",
      name: "Cliente",
      credentials: {
        cpfCnpj: { label: "CPF/CNPJ", type: "text" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.cpfCnpj || !credentials.senha) return null;

        const ip = req?.headers?.["x-forwarded-for"]?.toString().split(",")[0] ?? "desconhecido";
        const limite = checarLimite(`login-cliente:${ip}`, LIMITES.LOGIN.max, LIMITES.LOGIN.janelaMs);
        if (!limite.permitido) {
          throw new Error("Muitas tentativas de login. Tente novamente em alguns minutos.");
        }

        const cpfCnpj = apenasDigitos(credentials.cpfCnpj);
        const cliente = await prisma.cliente.findUnique({ where: { cpfCnpj } });
        if (!cliente || !cliente.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.senha, cliente.senhaHash);
        if (!senhaValida) return null;

        await registrarAuditoria({
          acao: "LOGIN_CLIENTE",
          usuarioTipo: "CLIENTE",
          usuarioId: cliente.id,
          ip,
        });

        return { id: cliente.id, name: cliente.nome, role: "cliente" as const };
      },
    }),
    CredentialsProvider({
      id: "admin-login",
      name: "Admin",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.senha) return null;

        const ip = req?.headers?.["x-forwarded-for"]?.toString().split(",")[0] ?? "desconhecido";
        const limite = checarLimite(`login-admin:${ip}`, LIMITES.LOGIN.max, LIMITES.LOGIN.janelaMs);
        if (!limite.permitido) {
          throw new Error("Muitas tentativas de login. Tente novamente em alguns minutos.");
        }

        const admin = await prisma.admin.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!admin || !admin.ativo) return null;

        const senhaValida = await bcrypt.compare(credentials.senha, admin.senhaHash);
        if (!senhaValida) return null;

        await registrarAuditoria({
          acao: "LOGIN_ADMIN",
          usuarioTipo: "ADMIN",
          adminId: admin.id,
          ip,
        });

        return { id: admin.id, name: admin.nome, role: "admin" as const };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: "cliente" | "admin" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "cliente" | "admin";
      }
      return session;
    },
  },
};
