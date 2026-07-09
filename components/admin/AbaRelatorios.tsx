"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Download, AlertTriangle } from "lucide-react";
import { formatBRL, formatPontos } from "@/lib/formatadores";

interface Dashboard {
  totalFaturado: number;
  pontosEmCirculacao: number;
  totalClientes: number;
  clientesPorNivel: { nivel: string; total: number }[];
  rankingTop10: { id: string; nome: string; pontos: number; nivel: string; totalGasto: number }[];
  recompensasMaisResgatadas: { recompensa: { nome: string; icone: string } | null; totalResgates: number }[];
  clientesInativos: { id: string; nome: string; diasInativo: number }[];
  totalClientesInativos: number;
}

export function AbaRelatorios() {
  const [dados, setDados] = useState<Dashboard | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then(setDados);
  }, []);

  if (!dados) return <div className="text-terracota text-sm">Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Visão geral</h3>
        <div className="flex gap-2">
          <a href="/api/admin/relatorios/clientes" className="flex items-center gap-1.5 text-xs font-bold border border-terracota text-terracota rounded-md px-3 py-1.5">
            <Download size={13} /> CSV clientes
          </a>
          <a href="/api/admin/relatorios/movimentacoes" className="flex items-center gap-1.5 text-xs font-bold border border-terracota text-terracota rounded-md px-3 py-1.5">
            <Download size={13} /> CSV movimentações
          </a>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 mb-7">
        <CardMetrica label="Total faturado" valor={formatBRL(dados.totalFaturado)} />
        <CardMetrica label="Clientes cadastrados" valor={String(dados.totalClientes)} />
        <CardMetrica label="Pontos em circulação" valor={formatPontos(dados.pontosEmCirculacao)} />
        <CardMetrica label="Clientes inativos +60d" valor={String(dados.totalClientesInativos)} />
      </div>

      <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">Clientes por nível</h3>
      <div className="grid grid-cols-4 gap-3 mb-7">
        {["BRONZE", "PRATA", "OURO", "DIAMANTE"].map((nivel) => (
          <div key={nivel} className="bg-white border border-bege rounded-[10px] px-3 py-3 text-center">
            <div className="text-[11px] text-terracota tracking-wide">{nivel}</div>
            <div className="font-oswald font-bold text-xl">
              {dados.clientesPorNivel.find((c) => c.nivel === nivel)?.total ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3 text-terracota">
            <TrendingUp size={16} />
            <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase">Top 10 clientes</h3>
          </div>
          <div className="flex flex-col gap-2">
            {dados.rankingTop10.map((c, i) => (
              <div key={c.id} className="bg-white border border-bege rounded-lg px-4 py-3 flex items-center gap-3">
                <div className={`font-oswald font-extrabold text-lg w-6 ${i === 0 ? "text-ambar" : "text-terracota"}`}>{i + 1}º</div>
                <div className="flex-1">
                  <div className="font-semibold text-[13px]">{c.nome}</div>
                  <div className="text-[11px] text-gray-400">{c.nivel}</div>
                </div>
                <div className="font-bold">{formatPontos(c.pontos)} pts</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3 text-terracota">
            <AlertTriangle size={16} />
            <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase">Clientes inativos (+60 dias)</h3>
          </div>
          <div className="flex flex-col gap-2 mb-7">
            {dados.clientesInativos.slice(0, 10).map((c) => (
              <div key={c.id} className="bg-white border border-bege rounded-lg px-4 py-2.5 flex items-center justify-between">
                <span className="text-[13px] font-semibold">{c.nome}</span>
                <span className="text-xs text-terracota">{c.diasInativo} dias</span>
              </div>
            ))}
            {dados.clientesInativos.length === 0 && <div className="text-terracota text-[13px]">Nenhum cliente inativo.</div>}
          </div>

          <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">Recompensas mais resgatadas</h3>
          <div className="flex flex-col gap-2">
            {dados.recompensasMaisResgatadas.map((r, i) => (
              <div key={i} className="bg-white border border-bege rounded-lg px-4 py-2.5 flex items-center gap-3">
                <span className="text-lg">{r.recompensa?.icone ?? "🎁"}</span>
                <span className="flex-1 text-[13px] font-semibold">{r.recompensa?.nome ?? "Recompensa removida"}</span>
                <span className="text-xs text-terracota">{r.totalResgates}x</span>
              </div>
            ))}
            {dados.recompensasMaisResgatadas.length === 0 && <div className="text-terracota text-[13px]">Nenhum resgate ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function CardMetrica({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="bg-madeira rounded-[10px] px-4 py-3.5">
      <div className="text-ambar text-[11px] tracking-wide">{label.toUpperCase()}</div>
      <div className="text-fundo text-lg font-bold font-oswald">{valor}</div>
    </div>
  );
}
