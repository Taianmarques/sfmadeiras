"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, UserCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LoginAdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("admin-login", { email, senha, redirect: false });

    setCarregando(false);
    if (resultado?.error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/admin");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-madeira">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-fundo rounded-lg px-4 py-3 mb-3">
          <Logo priority className="h-10 w-auto" />
        </div>
        <p className="text-ambar text-xs tracking-widest font-oswald font-semibold">PAINEL DA LOJA</p>
      </div>

      <form onSubmit={entrar} className="w-full max-w-sm bg-fundo rounded-xl p-6 shadow-xl">
        <h2 className="font-oswald font-semibold text-lg mb-4">Entrar como admin</h2>

        <label className="block text-xs font-semibold text-terracota mb-1">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar"
          required
        />

        <label className="block text-xs font-semibold text-terracota mb-1">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar"
          required
        />

        {erro && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-4">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full bg-madeira text-fundo font-oswald font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <Link
        href="/cliente/login"
        className="flex items-center gap-1.5 text-xs text-bege mt-6 hover:underline"
      >
        <UserCircle2 size={14} /> Sou cliente, ir para o app
      </Link>
    </main>
  );
}
