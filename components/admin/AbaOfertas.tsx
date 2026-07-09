"use client";

import { useEffect, useState } from "react";
import { Plus, X, Tag } from "lucide-react";
import { formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface Oferta {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
}

export function AbaOfertas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [editando, setEditando] = useState<Oferta | "nova" | null>(null);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/ofertas");
    if (resposta.ok) setOfertas(await resposta.json());
  };

  useEffect(() => {
    carregar();
  }, []);

  const agora = new Date();
  const estaVigente = (o: Oferta) =>
    o.ativo &&
    (!o.dataInicio || new Date(o.dataInicio) <= agora) &&
    (!o.dataFim || new Date(o.dataFim) >= agora);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Ofertas exclusivas</h3>
        <button onClick={() => setEditando("nova")} className="flex items-center gap-1.5 bg-ambar text-madeira font-bold text-xs rounded-md px-3 py-1.5">
          <Plus size={14} /> Nova oferta
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {ofertas.map((o) => (
          <button
            key={o.id}
            onClick={() => setEditando(o)}
            className={`text-left bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center gap-3 ${!o.ativo ? "opacity-50" : ""}`}
          >
            <div className="text-[26px] shrink-0">{o.icone}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{o.titulo}</div>
              <div className="text-xs text-terracota truncate">{o.descricao}</div>
              {(o.dataInicio || o.dataFim) && (
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {o.dataInicio ? formatData(o.dataInicio) : "sempre"} até {o.dataFim ? formatData(o.dataFim) : "sem prazo"}
                </div>
              )}
            </div>
            <span
              className={`text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0 ${
                estaVigente(o) ? "bg-green-50 text-green-700" : "bg-fundo text-terracota"
              }`}
            >
              {!o.ativo ? "Inativa" : estaVigente(o) ? "Vigente" : "Fora do período"}
            </span>
          </button>
        ))}
        {ofertas.length === 0 && (
          <div className="text-center text-terracota py-8 text-[13px] bg-white border border-bege rounded-[10px]">
            <Tag size={20} className="mx-auto mb-2 opacity-50" />
            Nenhuma oferta cadastrada.
          </div>
        )}
      </div>

      {editando && (
        <ModalOferta
          oferta={editando === "nova" ? null : editando}
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

function ModalOferta({
  oferta,
  onClose,
  onSalvo,
}: {
  oferta: Oferta | null;
  onClose: () => void;
  onSalvo: (msg: string) => void;
}) {
  const paraInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

  const [icone, setIcone] = useState(oferta?.icone ?? "🏷️");
  const [titulo, setTitulo] = useState(oferta?.titulo ?? "");
  const [descricao, setDescricao] = useState(oferta?.descricao ?? "");
  const [dataInicio, setDataInicio] = useState(paraInput(oferta?.dataInicio ?? null));
  const [dataFim, setDataFim] = useState(paraInput(oferta?.dataFim ?? null));
  const [ativo, setAtivo] = useState(oferta?.ativo ?? true);
  const [erro, setErro] = useState("");

  const salvar = async () => {
    if (!titulo.trim() || !descricao.trim()) {
      setErro("Preencha o título e a descrição.");
      return;
    }
    if (dataInicio && dataFim && dataFim <= dataInicio) {
      setErro("A data de fim deve ser depois da data de início.");
      return;
    }

    const resposta = await fetch(oferta ? `/api/admin/ofertas/${oferta.id}` : "/api/admin/ofertas", {
      method: oferta ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        descricao,
        icone,
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        ...(oferta ? { ativo } : {}),
      }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível salvar.");
      return;
    }
    onSalvo(oferta ? "Oferta atualizada." : "Oferta criada.");
  };

  const desativar = async () => {
    if (!oferta) return;
    await fetch(`/api/admin/ofertas/${oferta.id}`, { method: "DELETE" });
    onSalvo("Oferta desativada.");
  };

  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[400px] w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold font-oswald">{oferta ? "Editar oferta" : "Nova oferta"}</div>
          <button onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Ícone (emoji)</label>
        <input value={icone} onChange={(e) => setIcone(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Título</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Semana do Deck" className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          placeholder="Ex: 15% de desconto em madeira tratada só essa semana"
          className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5"
        />

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Início (opcional)</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Fim (opcional)</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {oferta && (
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativa
          </label>
        )}

        {erro && <div className="text-xs text-red-700 mb-3">{erro}</div>}

        <button onClick={salvar} className="w-full bg-ambar text-madeira font-bold py-2.5 rounded-lg mb-2">
          Salvar
        </button>
        {oferta && (
          <button onClick={desativar} className="w-full border border-red-700 text-red-700 font-bold py-2.5 rounded-lg">
            Desativar oferta
          </button>
        )}
      </div>
    </div>
  );
}
