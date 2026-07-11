"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function LoginClientePage() {
  const router = useRouter();
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("cliente-login", { cpfCnpj, senha, redirect: false });

    setCarregando(false);
    if (resultado?.error) {
      setErro("CPF/CNPJ ou senha inválidos.");
      return;
    }
    router.push("/cliente");
    router.refresh();
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <Logo priority className="h-12 w-auto" />
        <p className="text-terracota text-[13px] text-center mt-3 max-w-xs">
          O clube de benefícios de quem vive da marcenaria.
        </p>
      </div>

      <form onSubmit={entrar} className="w-full max-w-sm bg-white border border-bege rounded-xl p-6 shadow-sm">
        <h2 className="font-oswald font-semibold text-lg mb-4">Entrar</h2>

        <label className="block text-xs font-semibold text-terracota mb-1">CPF ou CNPJ</label>
        <input
          value={cpfCnpj}
          onChange={(e) => setCpfCnpj(e.target.value)}
          placeholder="000.000.000-00"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar"
          required
        />

        <label className="block text-xs font-semibold text-terracota mb-1">Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="••••••••"
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
          className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-60"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-center text-xs text-terracota mt-4">
          Ainda não é cliente?{" "}
          <Link href="/cliente/registro" className="font-semibold underline">
            Cadastre-se
          </Link>
        </p>
      </form>

      <Link
        href="/admin/login"
        className="flex items-center gap-1.5 text-xs text-terracota mt-6 hover:underline"
      >
        <ShieldCheck size={14} /> Sou da loja, ir para o painel
      </Link>
    </main>
  );
}
