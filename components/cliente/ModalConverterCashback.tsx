"use client";

import { useMemo, useState } from "react";
import { X, Wallet, AlertCircle } from "lucide-react";
import { formatBRL, formatPontos } from "@/lib/formatadores";

export function ModalConverterCashback({
  pontosDisponiveis,
  taxaConversao,
  onClose,
  onConvertido,
}: {
  pontosDisponiveis: number;
  taxaConversao: number;
  onClose: () => void;
  onConvertido: (valorCashback: number) => void;
}) {
  const [pontos, setPontos] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const pontosNumero = parseInt(pontos, 10) || 0;
  const valorEstimado = useMemo(() => Math.round(pontosNumero * taxaConversao * 100) / 100, [pontosNumero, taxaConversao]);

  const confirmar = async () => {
    setErro("");
    if (!pontosNumero || pontosNumero <= 0) {
      setErro("Informe uma quantidade de pontos válida.");
      return;
    }
    if (pontosNumero > pontosDisponiveis) {
      setErro(`Você tem apenas ${formatPontos(pontosDisponiveis)} pontos disponíveis.`);
      return;
    }

    setEnviando(true);
    const resposta = await fetch("/api/cliente/pontos/converter-cashback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pontos: pontosNumero }),
    });
    const dados = await resposta.json();
    setEnviando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível concluir a conversão.");
      return;
    }

    onConvertido(dados.valorCashback);
  };

  return (
    <div className="fixed inset-0 bg-madeira/55 flex items-end justify-center z-[100]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-fundo rounded-t-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto px-5 pt-5 pb-7"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-oswald font-bold text-base">Converter pontos em cashback</h2>
          <button onClick={onClose} className="text-terracota">
            <X size={20} />
          </button>
        </div>

        <div className="bg-madeira rounded-[10px] px-4 py-3.5 mb-4 flex items-center gap-3">
          <Wallet size={22} className="text-ambar" />
          <div>
            <div className="text-ambar text-[11px] tracking-wide">PONTOS DISPONÍVEIS</div>
            <div className="text-fundo text-lg font-bold font-oswald">{formatPontos(pontosDisponiveis)}</div>
          </div>
        </div>

        <p className="text-[12.5px] text-terracota mb-4 leading-relaxed">
          Em vez de trocar por um brinde do catálogo, você pode converter seus pontos em saldo de cashback
          ({formatPontos(Math.round(1 / taxaConversao))} pontos = R$1,00) para usar como desconto na próxima compra.
        </p>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Pontos a converter</label>
        <input
          value={pontos}
          onChange={(e) => setPontos(e.target.value.replace(/\D/g, ""))}
          placeholder="0"
          inputMode="numeric"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-1.5 outline-none focus:border-ambar bg-white"
        />
        <div className="text-xs text-terracota mb-3.5">Você vai receber {formatBRL(valorEstimado)} de cashback.</div>

        {erro && (
          <div className="flex items-center gap-1.5 text-red-700 text-xs mb-3">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={enviando || pontosDisponiveis <= 0}
          className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {enviando ? "Convertendo..." : "Converter"}
        </button>
      </div>
    </div>
  );
}
