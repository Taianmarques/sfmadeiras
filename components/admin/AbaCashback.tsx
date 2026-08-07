"use client";

import { useEffect, useState } from "react";
import { Check, X, Wallet } from "lucide-react";
import { formatBRL, formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface ResgateCashback {
  id: string;
  valor: number;
  status: "PENDENTE" | "APROVADO" | "REJEITADO";
  motivoRejeicao: string | null;
  criadoEm: string;
  cliente: { nome: string; cpfCnpj: string };
}

export function AbaCashback({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [resgates, setResgates] = useState<ResgateCashback[]>([]);
  const [rejeitando, setRejeitando] = useState<ResgateCashback | null>(null);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/cashback");
    if (resposta.ok) setResgates(await resposta.json());
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const pendentes = resgates.filter((r) => r.status === "PENDENTE");
  const analisados = resgates.filter((r) => r.status !== "PENDENTE");

  const aprovar = async (id: string) => {
    const resposta = await fetch(`/api/admin/cashback/${id}/aprovar`, { method: "POST" });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível aprovar.");
      return;
    }
    mostrarToast("sucesso", `Resgate aprovado: ${formatBRL(dados.resgate.valor)}`);
    carregar();
  };

  const confirmarRejeicao = async () => {
    if (!rejeitando) return;
    if (!motivo.trim()) {
      mostrarToast("erro", "Informe o motivo da rejeição.");
      return;
    }
    const resposta = await fetch(`/api/admin/cashback/${rejeitando.id}/rejeitar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    if (!resposta.ok) {
      const dados = await resposta.json();
      mostrarToast("erro", dados.erro ?? "Não foi possível rejeitar.");
      return;
    }
    mostrarToast("sucesso", "Resgate rejeitado.");
    setRejeitando(null);
    setMotivo("");
    carregar();
  };

  if (carregando) return <div className="text-terracota text-sm">Carregando...</div>;

  return (
    <div>
      <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">
        Resgates de cashback pendentes ({pendentes.length})
      </h3>

      {pendentes.length === 0 && (
        <div className="text-center text-terracota py-10 text-[13px] bg-white border border-bege rounded-[10px]">
          Nenhum resgate pendente. Tudo certo por aqui!
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-7">
        {pendentes.map((r) => (
          <div key={r.id} className="bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-fundo flex items-center justify-center shrink-0 text-terracota">
              <Wallet size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px]">{r.cliente.nome}</div>
              <div className="text-xs text-terracota truncate">{r.cliente.cpfCnpj} · {formatData(r.criadoEm)}</div>
              <div className="text-[13px] font-bold mt-0.5">{formatBRL(r.valor)}</div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => aprovar(r.id)} className="bg-green-700 text-white rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Check size={13} /> Aprovar
              </button>
              <button onClick={() => setRejeitando(r)} className="border border-red-700 text-red-700 rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
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
            {analisados.map((r) => (
              <div key={r.id} className="bg-white border border-bege rounded-lg px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-semibold">
                    {r.cliente.nome} · {formatBRL(r.valor)}
                  </div>
                  <div className="text-[11px] text-terracota">{formatData(r.criadoEm)}</div>
                </div>
                <span
                  className={`text-[11px] font-bold rounded-full px-2.5 py-1 ${
                    r.status === "APROVADO" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.status === "APROVADO" ? "Aprovado" : "Rejeitado"}
                </span>
              </div>
            ))}
          </div>
        </>
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
            <div className="font-bold font-oswald mb-1">Rejeitar resgate de cashback</div>
            <div className="text-xs text-terracota mb-3.5">
              {rejeitando.cliente.nome} · {formatBRL(rejeitando.valor)}
            </div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Motivo (o cliente vai ver esta mensagem)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Saldo divergente do sistema"
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
