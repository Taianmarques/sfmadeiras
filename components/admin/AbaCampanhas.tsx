"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface Campanha {
  id: string;
  nome: string;
  multiplicador: number;
  dataInicio: string;
  dataFim: string;
  ativo: boolean;
}

export function AbaCampanhas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [formAberto, setFormAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [multiplicador, setMultiplicador] = useState("2");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const carregar = async () => {
    const resposta = await fetch("/api/admin/campanhas");
    if (resposta.ok) setCampanhas(await resposta.json());
  };

  useEffect(() => {
    carregar();
  }, []);

  const agora = new Date();
  const estaAtiva = (c: Campanha) => c.ativo && new Date(c.dataInicio) <= agora && agora <= new Date(c.dataFim);

  const criar = async () => {
    const m = parseFloat(multiplicador.replace(",", "."));
    if (!nome.trim() || !m || m < 1 || !dataInicio || !dataFim) {
      mostrarToast("erro", "Preencha todos os campos corretamente.");
      return;
    }
    const resposta = await fetch("/api/admin/campanhas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, multiplicador: m, dataInicio, dataFim }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível criar a campanha.");
      return;
    }
    mostrarToast("sucesso", "Campanha criada!");
    setFormAberto(false);
    setNome("");
    setMultiplicador("2");
    setDataInicio("");
    setDataFim("");
    carregar();
  };

  const encerrar = async (id: string) => {
    await fetch(`/api/admin/campanhas/${id}`, { method: "DELETE" });
    mostrarToast("sucesso", "Campanha encerrada.");
    carregar();
  };

  return (
    <div className="max-w-[560px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Campanhas de pontos em dobro</h3>
        <button onClick={() => setFormAberto((v) => !v)} className="flex items-center gap-1.5 bg-ambar text-madeira font-bold text-xs rounded-md px-3 py-1.5">
          <Plus size={14} /> Nova campanha
        </button>
      </div>

      {formAberto && (
        <div className="bg-white border border-bege rounded-[10px] p-5 mb-5">
          <label className="block text-xs font-semibold text-terracota mb-1.5">Nome da campanha</label>
          <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Semana da Madeira em Dobro" className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5" />

          <label className="block text-xs font-semibold text-terracota mb-1.5">Multiplicador (ex: 2 = pontos em dobro)</label>
          <input value={multiplicador} onChange={(e) => setMultiplicador(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-terracota mb-1.5">Início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-terracota mb-1.5">Fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm" />
            </div>
          </div>

          <button onClick={criar} className="w-full bg-ambar text-madeira font-bold py-2.5 rounded-lg">
            Criar campanha
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {campanhas.map((c) => (
          <div key={c.id} className="bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">
                {c.nome} <span className="text-ambar font-bold">· {c.multiplicador}x</span>
              </div>
              <div className="text-xs text-terracota">
                {formatData(c.dataInicio)} até {formatData(c.dataFim)}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {estaAtiva(c) ? (
                <span className="text-[11px] font-bold bg-green-50 text-green-700 rounded-full px-2.5 py-1">Ativa agora</span>
              ) : (
                <span className="text-[11px] font-bold bg-fundo text-terracota rounded-full px-2.5 py-1">{c.ativo ? "Agendada/Encerrada" : "Encerrada"}</span>
              )}
              {c.ativo && (
                <button onClick={() => encerrar(c.id)} className="text-xs text-red-700 font-bold border border-red-700 rounded-md px-2.5 py-1">
                  Encerrar
                </button>
              )}
            </div>
          </div>
        ))}
        {campanhas.length === 0 && <div className="text-center text-terracota py-8 text-[13px]">Nenhuma campanha cadastrada.</div>}
      </div>
    </div>
  );
}
