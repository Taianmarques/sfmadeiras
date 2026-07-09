"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Logo } from "@/components/Logo";

function FormularioRegistro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoIndicacao = searchParams.get("ref") ?? undefined;

  const [nome, setNome] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const resposta = await fetch("/api/auth/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cpfCnpj, telefone, senha, codigoIndicacao }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível concluir o cadastro.");
      setCarregando(false);
      return;
    }

    const resultado = await signIn("cliente-login", { cpfCnpj, senha, redirect: false });
    setCarregando(false);
    if (resultado?.error) {
      router.push("/cliente/login");
      return;
    }
    router.push("/cliente");
    router.refresh();
  };

  return (
    <form onSubmit={cadastrar} className="w-full max-w-sm bg-white border border-bege rounded-xl p-6 shadow-sm">
      <h2 className="font-oswald font-semibold text-lg mb-4">Criar cadastro</h2>

      {codigoIndicacao && (
        <div className="text-xs bg-bege/60 text-terracota rounded-lg px-3 py-2 mb-4">
          Você foi indicado por um cliente SF Madeiras! 🎉
        </div>
      )}

      <label className="block text-xs font-semibold text-terracota mb-1">Nome completo</label>
      <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar" required />

      <label className="block text-xs font-semibold text-terracota mb-1">CPF ou CNPJ</label>
      <input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar" required />

      <label className="block text-xs font-semibold text-terracota mb-1">Telefone (WhatsApp)</label>
      <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar" required />

      <label className="block text-xs font-semibold text-terracota mb-1">Senha</label>
      <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar" required minLength={6} />

      {erro && (
        <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={14} /> {erro}
        </div>
      )}

      <button type="submit" disabled={carregando} className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-60">
        {carregando ? "Criando..." : "Criar cadastro"}
      </button>

      <p className="text-center text-xs text-terracota mt-4">
        Já tem cadastro?{" "}
        <Link href="/cliente/login" className="font-semibold underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

export default function RegistroClientePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center mb-8">
        <Logo priority className="h-12 w-auto" />
      </div>
      <Suspense fallback={null}>
        <FormularioRegistro />
      </Suspense>
    </main>
  );
}
