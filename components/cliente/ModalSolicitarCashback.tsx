"use client";

import { useState } from "react";
import { X, Wallet, AlertCircle } from "lucide-react";
import { formatBRL } from "@/lib/formatadores";

export function ModalSolicitarCashback({
  saldoDisponivel,
  onClose,
  onSolicitado,
}: {
  saldoDisponivel: number;
  onClose: () => void;
  onSolicitado: () => void;
}) {
  const [valor, setValor] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const confirmar = async () => {
    setErro("");
    const v = parseFloat(valor.replace(",", "."));
    if (!v || v <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    if (v > saldoDisponivel) {
      setErro(`Você tem apenas ${formatBRL(saldoDisponivel)} disponível.`);
      return;
    }

    setEnviando(true);
    const resposta = await fetch("/api/cliente/cashback/resgates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ valor: v }),
    });
    const dados = await resposta.json();
    setEnviando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível solicitar o resgate.");
      return;
    }

    onSolicitado();
  };

  return (
    <div className="fixed inset-0 bg-madeira/55 flex items-end justify-center z-[100]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-fundo rounded-t-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto px-5 pt-5 pb-7"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-oswald font-bold text-base">Resgatar cashback</h2>
          <button onClick={onClose} className="text-terracota">
            <X size={20} />
          </button>
        </div>

        <div className="bg-madeira rounded-[10px] px-4 py-3.5 mb-4 flex items-center gap-3">
          <Wallet size={22} className="text-ambar" />
          <div>
            <div className="text-ambar text-[11px] tracking-wide">SALDO DISPONÍVEL</div>
            <div className="text-fundo text-lg font-bold font-oswald">{formatBRL(saldoDisponivel)}</div>
          </div>
        </div>

        <p className="text-[12.5px] text-terracota mb-4 leading-relaxed">
          Solicite o resgate do valor que quiser usar. A loja confere e aprova o pedido — depois é só retirar o
          desconto na próxima compra.
        </p>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Valor a resgatar (R$)</label>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5 outline-none focus:border-ambar bg-white"
        />

        {erro && (
          <div className="flex items-center gap-1.5 text-red-700 text-xs mb-3">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={enviando || saldoDisponivel <= 0}
          className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Solicitar resgate"}
        </button>
      </div>
    </div>
  );
}
