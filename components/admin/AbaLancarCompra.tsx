"use client";

import { useEffect, useState } from "react";
import { Search, QrCode } from "lucide-react";
import { formatPontos } from "@/lib/formatadores";
import { LeitorQrCode } from "@/components/admin/LeitorQrCode";
import type { ToastState } from "@/components/Toast";

interface ClienteBusca {
  id: string;
  nome: string;
  cpfCnpj: string;
}

export function AbaLancarCompra({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ClienteBusca[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteBusca | null>(null);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [leitorAberto, setLeitorAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!busca || clienteSelecionado) {
      setResultados([]);
      return;
    }
    const t = setTimeout(async () => {
      const resposta = await fetch(`/api/admin/clientes?q=${encodeURIComponent(busca)}`);
      if (resposta.ok) setResultados(await resposta.json());
    }, 250);
    return () => clearTimeout(t);
  }, [busca, clienteSelecionado]);

  const lerQrCode = async (token: string) => {
    setLeitorAberto(false);
    const resposta = await fetch("/api/admin/qrcode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCodeToken: token }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Cliente não encontrado.");
      return;
    }
    setClienteSelecionado(dados);
    setBusca("");
  };

  const lancarCompra = async () => {
    const v = parseFloat(valor.replace(",", "."));
    if (!clienteSelecionado || !v || v <= 0) {
      mostrarToast("erro", "Selecione um cliente e informe um valor válido.");
      return;
    }
    setEnviando(true);
    const resposta = await fetch("/api/admin/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clienteId: clienteSelecionado.id, valor: v, descricao }),
    });
    const dados = await resposta.json();
    setEnviando(false);

    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível lançar a compra.");
      return;
    }

    mostrarToast("sucesso", `+${formatPontos(dados.pontosGanhos)} pontos lançados para ${clienteSelecionado.nome}`);
    setValor("");
    setDescricao("");
    setClienteSelecionado(null);
    setBusca("");
  };

  const valorNumerico = parseFloat(valor.replace(",", "."));

  return (
    <div className="max-w-[520px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Lançar nova compra</h3>
        <button onClick={() => setLeitorAberto(true)} className="flex items-center gap-1.5 text-xs font-bold text-terracota border border-terracota rounded-md px-2.5 py-1.5">
          <QrCode size={14} /> Ler QR Code
        </button>
      </div>

      {leitorAberto && <LeitorQrCode onLido={lerQrCode} onClose={() => setLeitorAberto(false)} />}

      <div className="bg-white border border-bege rounded-[10px] p-5">
        <label className="block text-xs font-semibold text-terracota mb-1.5">Cliente (nome ou CPF/CNPJ)</label>
        <div className="relative mb-3.5">
          <Search size={15} className="absolute left-2.5 top-3 text-gray-400" />
          <input
            value={clienteSelecionado ? clienteSelecionado.nome : busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setClienteSelecionado(null);
            }}
            placeholder="Buscar cliente..."
            className="w-full border border-bege rounded-lg pl-8 pr-3 py-2.5 text-sm outline-none focus:border-ambar"
          />
          {busca && !clienteSelecionado && resultados.length > 0 && (
            <div className="absolute top-[42px] left-0 right-0 bg-white border border-bege rounded-lg z-10 max-h-[180px] overflow-y-auto shadow-lg">
              {resultados.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setClienteSelecionado(c);
                    setBusca("");
                  }}
                  className="px-3 py-2.5 cursor-pointer border-b border-fundo text-sm hover:bg-fundo"
                >
                  <div className="font-semibold">{c.nome}</div>
                  <div className="text-[11px] text-terracota">{c.cpfCnpj}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Valor da compra (R$)</label>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5 outline-none focus:border-ambar"
        />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Descrição (opcional)</label>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Madeira tratada + parafusos"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4.5 outline-none focus:border-ambar"
        />

        {!!valorNumerico && !isNaN(valorNumerico) && (
          <div className="bg-fundo rounded-lg px-3.5 py-2.5 mb-4 text-[13px] text-terracota">
            Cliente vai ganhar pontos conforme o nível dele (calculado automaticamente ao confirmar).
          </div>
        )}

        <button
          onClick={lancarCompra}
          disabled={enviando}
          className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {enviando ? "Lançando..." : "Confirmar lançamento"}
        </button>
      </div>
    </div>
  );
}
