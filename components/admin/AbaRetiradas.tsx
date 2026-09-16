"use client";

import { useEffect, useState } from "react";
import { Check, X, Gift } from "lucide-react";
import { formatPontos, formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface ResgateItem {
  id: string;
  pontosGastos: number;
  status: "PENDENTE" | "ENTREGUE" | "CANCELADO";
  motivoCancelamento: string | null;
  criadoEm: string;
  cliente: { nome: string; cpfCnpj: string };
  recompensa: { nome: string; icone: string; imagemUrl: string | null };
}

export function AbaRetiradas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [resgates, setResgates] = useState<ResgateItem[]>([]);
  const [cancelando, setCancelando] = useState<ResgateItem | null>(null);
  const [motivo, setMotivo] = useState("");
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/resgates");
    if (resposta.ok) setResgates(await resposta.json());
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const pendentes = resgates.filter((r) => r.status === "PENDENTE");
  const historico = resgates.filter((r) => r.status !== "PENDENTE");

  const confirmarEntrega = async (id: string) => {
    const resposta = await fetch(`/api/admin/resgates/${id}/entregar`, { method: "POST" });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível confirmar a entrega.");
      return;
    }
    mostrarToast("sucesso", "Entrega confirmada!");
    carregar();
  };

  const confirmarCancelamento = async () => {
    if (!cancelando) return;
    const resposta = await fetch(`/api/admin/resgates/${cancelando.id}/cancelar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível cancelar.");
      return;
    }
    mostrarToast("sucesso", "Resgate cancelado e pontos devolvidos ao cliente.");
    setCancelando(null);
    setMotivo("");
    carregar();
  };

  if (carregando) return <div className="text-terracota text-sm">Carregando...</div>;

  return (
    <div>
      <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">
        Retiradas pendentes ({pendentes.length})
      </h3>

      {pendentes.length === 0 && (
        <div className="text-center text-terracota py-10 text-[13px] bg-white border border-bege rounded-[10px]">
          Nenhuma retirada pendente. Tudo certo por aqui!
        </div>
      )}

      <div className="flex flex-col gap-2.5 mb-7">
        {pendentes.map((r) => (
          <div key={r.id} className="bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-fundo flex items-center justify-center shrink-0 overflow-hidden">
              {r.recompensa.imagemUrl ? (
                <img src={r.recompensa.imagemUrl} alt={r.recompensa.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg">{r.recompensa.icone}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[13px]">{r.cliente.nome}</div>
              <div className="text-xs text-terracota truncate">{r.cliente.cpfCnpj} · {formatData(r.criadoEm)}</div>
              <div className="text-[13px] font-bold mt-0.5">
                {r.recompensa.nome} · {formatPontos(r.pontosGastos)} pts
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <button onClick={() => confirmarEntrega(r.id)} className="bg-green-700 text-white rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <Check size={13} /> Confirmar entrega
              </button>
              <button onClick={() => setCancelando(r)} className="border border-red-700 text-red-700 rounded-md px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
                <X size={13} /> Cancelar
              </button>
            </div>
          </div>
        ))}
      </div>

      {historico.length > 0 && (
        <>
          <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">Histórico</h3>
          <div className="flex flex-col gap-2">
            {historico.map((r) => (
              <div key={r.id} className="bg-white border border-bege rounded-lg px-3.5 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold flex items-center gap-1.5">
                      <Gift size={13} className="text-terracota shrink-0" />
                      {r.cliente.nome} · {r.recompensa.nome}
                    </div>
                    <div className="text-[11px] text-terracota">{formatData(r.criadoEm)} · {formatPontos(r.pontosGastos)} pts</div>
                  </div>
                  <span
                    className={`text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${
                      r.status === "ENTREGUE" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.status === "ENTREGUE" ? "Entregue" : "Cancelado"}
                  </span>
                </div>
                {r.status === "CANCELADO" && r.motivoCancelamento && (
                  <div className="text-xs text-red-700 bg-red-50 rounded-md px-2.5 py-1.5 mt-2">Motivo: {r.motivoCancelamento}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {cancelando && (
        <div
          className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5"
          onClick={() => {
            setCancelando(null);
            setMotivo("");
          }}
        >
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[420px] w-full">
            <div className="font-bold font-oswald mb-1">Cancelar resgate</div>
            <div className="text-xs text-terracota mb-3.5">
              {cancelando.cliente.nome} · {cancelando.recompensa.nome} · {formatPontos(cancelando.pontosGastos)} pts
            </div>
            <p className="text-xs text-terracota mb-3">
              Os pontos voltam pro saldo do cliente e o item volta pro estoque.
            </p>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Cliente não retirou dentro do prazo"
              rows={3}
              className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-ambar"
            />
            <button onClick={confirmarCancelamento} className="w-full bg-red-700 text-white font-bold py-2.5 rounded-lg">
              Confirmar cancelamento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
