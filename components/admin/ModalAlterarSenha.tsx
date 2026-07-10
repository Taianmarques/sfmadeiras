"use client";

import { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import type { ToastState } from "@/components/Toast";

export function ModalAlterarSenha({
  onClose,
  mostrarToast,
}: {
  onClose: () => void;
  mostrarToast: (tipo: ToastState["tipo"], msg: string) => void;
}) {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro("A confirmação não confere com a nova senha.");
      return;
    }

    setSalvando(true);
    const resposta = await fetch("/api/admin/alterar-senha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senhaAtual, novaSenha }),
    });
    const dados = await resposta.json();
    setSalvando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível alterar a senha.");
      return;
    }

    mostrarToast("sucesso", "Senha alterada com sucesso.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={onClose}>
      <form onSubmit={salvar} onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[380px] w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold font-oswald">Alterar senha</div>
          <button type="button" onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Senha atual</label>
        <input
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          autoComplete="current-password"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5 outline-none focus:border-ambar"
          required
        />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Nova senha</label>
        <input
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5 outline-none focus:border-ambar"
          required
        />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Confirmar nova senha</label>
        <input
          type="password"
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          autoComplete="new-password"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar"
          required
        />

        {erro && (
          <div className="flex items-center gap-1.5 text-red-700 text-xs mb-3">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button type="submit" disabled={salvando} className="w-full bg-ambar text-madeira font-oswald font-bold py-2.5 rounded-lg disabled:opacity-60">
          {salvando ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  );
}
