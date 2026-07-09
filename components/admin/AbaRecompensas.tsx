"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { formatPontos } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface Recompensa {
  id: string;
  nome: string;
  pontos: number;
  estoque: number;
  icone: string;
  ativo: boolean;
}

export function AbaRecompensas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [editando, setEditando] = useState<Recompensa | "nova" | null>(null);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/recompensas");
    if (resposta.ok) setRecompensas(await resposta.json());
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Catálogo de recompensas</h3>
        <button onClick={() => setEditando("nova")} className="flex items-center gap-1.5 bg-ambar text-madeira font-bold text-xs rounded-md px-3 py-1.5">
          <Plus size={14} /> Nova recompensa
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {recompensas.map((r) => (
          <button
            key={r.id}
            onClick={() => setEditando(r)}
            className={`text-left bg-white border border-bege rounded-[10px] p-4 ${!r.ativo ? "opacity-50" : ""}`}
          >
            <div className="text-[26px] mb-1.5">{r.icone}</div>
            <div className="font-semibold text-sm mb-1">{r.nome}</div>
            <div className="text-xs text-terracota mb-2">{formatPontos(r.pontos)} pontos</div>
            <div className="text-xs opacity-70">
              Estoque: {r.estoque >= 999 ? "ilimitado" : r.estoque} {!r.ativo && "· inativa"}
            </div>
          </button>
        ))}
      </div>

      {editando && (
        <ModalRecompensa
          recompensa={editando === "nova" ? null : editando}
          onClose={() => setEditando(null)}
          onSalvo={(msg) => {
            setEditando(null);
            mostrarToast("sucesso", msg);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function ModalRecompensa({
  recompensa,
  onClose,
  onSalvo,
}: {
  recompensa: Recompensa | null;
  onClose: () => void;
  onSalvo: (msg: string) => void;
}) {
  const [nome, setNome] = useState(recompensa?.nome ?? "");
  const [pontos, setPontos] = useState(String(recompensa?.pontos ?? ""));
  const [estoque, setEstoque] = useState(String(recompensa?.estoque ?? ""));
  const [icone, setIcone] = useState(recompensa?.icone ?? "🎁");
  const [ativo, setAtivo] = useState(recompensa?.ativo ?? true);
  const [erro, setErro] = useState("");

  const salvar = async () => {
    const p = parseInt(pontos);
    const e = parseInt(estoque);
    if (!nome.trim() || !p || p <= 0 || isNaN(e) || e < 0) {
      setErro("Preencha nome, pontos e estoque corretamente.");
      return;
    }

    const resposta = await fetch(recompensa ? `/api/admin/recompensas/${recompensa.id}` : "/api/admin/recompensas", {
      method: recompensa ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, pontos: p, estoque: e, icone, ...(recompensa ? { ativo } : {}) }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível salvar.");
      return;
    }
    onSalvo(recompensa ? "Recompensa atualizada." : "Recompensa criada.");
  };

  const desativar = async () => {
    if (!recompensa) return;
    await fetch(`/api/admin/recompensas/${recompensa.id}`, { method: "DELETE" });
    onSalvo("Recompensa desativada.");
  };

  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[380px] w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold font-oswald">{recompensa ? "Editar recompensa" : "Nova recompensa"}</div>
          <button onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Ícone (emoji)</label>
        <input value={icone} onChange={(e) => setIcone(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Nome</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Pontos necessários</label>
        <input value={pontos} onChange={(e) => setPontos(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Estoque (use 999 para ilimitado)</label>
        <input value={estoque} onChange={(e) => setEstoque(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        {recompensa && (
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativa no catálogo
          </label>
        )}

        {erro && <div className="text-xs text-red-700 mb-3">{erro}</div>}

        <button onClick={salvar} className="w-full bg-ambar text-madeira font-bold py-2.5 rounded-lg mb-2">
          Salvar
        </button>
        {recompensa && (
          <button onClick={desativar} className="w-full border border-red-700 text-red-700 font-bold py-2.5 rounded-lg">
            Desativar recompensa
          </button>
        )}
      </div>
    </div>
  );
}
