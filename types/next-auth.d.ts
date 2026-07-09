import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "cliente" | "admin";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "cliente" | "admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "cliente" | "admin";
  }
}
