"use client";

import { useEffect, useState } from "react";
import { Check, X, FileImage, FileText, CheckSquare, Square } from "lucide-react";
import { formatBRL, formatPontos, formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface Comprovante {
  id: string;
  valorInformado: number;
  descricao: string | null;
  arquivoNome: string;
  arquivoUrl: string;
  arquivoTipo: "IMAGEM" | "PDF";
  status: "PENDENTE" | "APROVADO" | "REJEITADO";
  motivoRejeicao: string | null;
  criadoEm: string;
  cliente: { nome: string; cpfCnpj: string };
}

export function AbaComprovantes({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [visualizando, setVisualizando] = useState<Comprovante | null>(null);
  const [rejeitando, setRejeitando] = useState<Comprovante | null>(null);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/comprovantes");
    if (resposta.ok) setComprovantes(await resposta.json());
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const pendentes = comprovantes.filter((c) => c.status === "PENDENTE");
  const analisados = comprovantes.filter((c) => c.status !== "PENDENTE");

  const alternarSelecao = (id: string) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const aprovar = async (id: string) => {
    const resposta = await fetch(`/api/admin/comprovantes/${id}/aprovar`, { method: "POST" });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível aprovar.");
      return;
    }
    mostrarToast("sucesso", `Comprovante aprovado: +${formatPontos(dados.pontosGanhos)} pontos`);
    carregar();
  };

  const aprovarSelecionados = async () => {
    if (selecionados.size === 0) return;
    const resposta = await fetch("/api/admin/comprovantes/aprovar-lote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selecionados) }),
    });
    const dados = await resposta.json();
    const ok = dados.resultados?.filter((r: { ok: boolean }) => r.ok).length ?? 0;
    mostrarToast("sucesso", `${ok} comprovante(s) aprovado(s) em lote.`);
    setSelecionados(new Set());
    carregar();
  };

  const confirmarRejeicao = async () => {
    if (!rejeitando) return;
    if (!motivo.trim()) {
      mostrarToast("erro", "Informe o motivo da rejeição.");
      return;
    }
    const resposta = await fetch(`/api/admin/comprovantes/${rejeitando.id}/rejeitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    if (!resposta.ok) {
      const dados = await resposta.json();
      mostrarToast("erro", dados.erro ?? "Não foi possível rejeitar.");
      return;
    }
    mostrarToast("sucesso", "Comprovante rejeitado.");
    setRejeitando(null);
    setMotivo("");
    carregar();
  };

  if (carregando) return <div className="text-terracota text-sm">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">
          Comprovantes pendentes ({pendentes.length})
        </h3>
        {selecionados.size > 0 && (
          <button onClick={aprovarSelecionados} className="bg-green-700 text-white text-xs font-bold rounded-md px-3 py-1.5 flex items-center gap-1.5">
            <Check size={13} /> Aprovar {selecionados.size} selecionado(s)
          </button>
        )}
      </div>

      {pendentes.length === 0 && (
        <div className="text-center text-terracota py-10 text-[13px] bg-white border border-bege rounded-[10px]">
          Nenhum comprovante pendente. Tudo certo por aqui!
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-7">
        {pendentes.map((p) => (
          <div key={p.id} className="bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center gap-3.5">
            <button onClick={() => alternarSelecao(p.id)} className="text-terracota shrink-0">
              {selecionados.has(p.id) ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <button
              onClick={() => setVisualizando(p)}
              className="w-14 h-14 rounded-lg border border-bege bg-fundo flex items-center justify-center shrink-0 overflow-hidden"
            >
              {p.arquivoTipo === "IMAGEM" ? (
                <img src={p.arquivoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <FileText size={20} className="text-gray-400" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px]">{p.cliente.nome}</div>
              <div className="text-xs text-terracota truncate">
                {p.descricao || "Sem descrição"} · {formatData(p.criadoEm)}
              </div>
              <div className="text-[13px] font-bold mt-0.5">
                {formatBRL(p.valorInformado)} → {formatPontos(Math.round(p.valorInformado))} pts
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => aprovar(p.id)} className="bg-green-700 text-white rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Check size={13} /> Aprovar
              </button>
              <button onClick={() => setRejeitando(p)} className="border border-red-700 text-red-700 rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <X size={13} /> Rejeitar
              </button>
            </div>
          </div>
        ))}
      </div>

      {analisados.length > 0 && (
        <>
          <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">Histórico de análises</h3>
          <div className="flex flex-col gap-2">
            {analisados.map((p) => (
              <div key={p.id} className="bg-white border border-bege rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold">
                    {p.cliente.nome} · {formatBRL(p.valorInformado)}
                  </div>
                  <div className="text-[11px] text-terracota">{formatData(p.criadoEm)}</div>
                </div>
                <span
                  className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${
                    p.status === "APROVADO" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {p.status === "APROVADO" ? "Aprovado" : "Rejeitado"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {visualizando && (
        <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={() => setVisualizando(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[420px] w-full">
            <div className="flex justify-between items-center mb-3.5">
              <div className="font-bold font-oswald">Comprovante anexado</div>
              <button onClick={() => setVisualizando(null)} className="text-terracota">
                <X size={18} />
              </button>
            </div>
            {visualizando.arquivoTipo === "IMAGEM" ? (
              <img src={visualizando.arquivoUrl} alt="Comprovante" className="w-full rounded-lg mb-3.5" />
            ) : (
              <a
                href={visualizando.arquivoUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-fundo rounded-lg p-7 text-center mb-3.5 text-terracota flex flex-col items-center gap-2"
              >
                <FileImage size={28} />
                <div className="text-[13px] underline">{visualizando.arquivoNome} (abrir PDF)</div>
              </a>
            )}
            <div className="text-[13px]">
              <strong>{visualizando.cliente.nome}</strong> · {formatBRL(visualizando.valorInformado)}
            </div>
            <div className="text-xs text-terracota">{visualizando.descricao}</div>
          </div>
        </div>
      )}

      {rejeitando && (
        <div
          className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5"
          onClick={() => {
            setRejeitando(null);
            setMotivo("");
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[420px] w-full">
            <div className="font-bold font-oswald mb-1">Rejeitar comprovante</div>
            <div className="text-xs text-terracota mb-3.5">
              {rejeitando.cliente.nome} · {formatBRL(rejeitando.valorInformado)}
            </div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Motivo (o cliente vai ver esta mensagem)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Comprovante ilegível"
              rows={3}
              className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-ambar"
            />
            <button onClick={confirmarRejeicao} className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg">
              Confirmar rejeição
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
