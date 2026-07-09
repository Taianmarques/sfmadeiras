"use client";

import { useEffect, useState } from "react";
import { formatBRL, formatPontos, formatData } from "@/lib/formatadores";

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  pontos: number;
  totalGasto: number;
  nivel: string;
  compras: number;
  criadoEm: string;
}

export function AbaClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      const resposta = await fetch(`/api/admin/clientes${busca ? `?q=${encodeURIComponent(busca)}` : ""}`);
      if (resposta.ok) setClientes(await resposta.json());
      setCarregando(false);
    }, 200);
    return () => clearTimeout(t);
  }, [busca]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">
          Clientes cadastrados {!carregando && `(${clientes.length})`}
        </h3>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CPF/CNPJ..."
          className="border border-bege rounded-lg px-3 py-1.5 text-sm outline-none focus:border-ambar w-60"
        />
      </div>

      <div className="bg-white border border-bege rounded-[10px] overflow-x-auto">
        <table className="w-full border-collapse text-[13px] min-w-[640px]">
          <thead>
            <tr className="bg-fundo text-left">
              <th className="px-3.5 py-2.5 font-semibold">Nome</th>
              <th className="px-3.5 py-2.5 font-semibold">CPF/CNPJ</th>
              <th className="px-3.5 py-2.5 font-semibold">Nível</th>
              <th className="px-3.5 py-2.5 font-semibold">Pontos</th>
              <th className="px-3.5 py-2.5 font-semibold">Total gasto</th>
              <th className="px-3.5 py-2.5 font-semibold">Compras</th>
              <th className="px-3.5 py-2.5 font-semibold">Cliente desde</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t border-[#F0EBDE]">
                <td className="px-3.5 py-2.5 font-semibold">{c.nome}</td>
                <td className="px-3.5 py-2.5">{c.cpfCnpj}</td>
                <td className="px-3.5 py-2.5">{c.nivel}</td>
                <td className="px-3.5 py-2.5 text-ambar font-bold">{formatPontos(c.pontos)}</td>
                <td className="px-3.5 py-2.5">{formatBRL(c.totalGasto)}</td>
                <td className="px-3.5 py-2.5">{c.compras}</td>
                <td className="px-3.5 py-2.5">{formatData(c.criadoEm)}</td>
              </tr>
            ))}
            {!carregando && clientes.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-terracota py-8">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
