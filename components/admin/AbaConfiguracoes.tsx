"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import type { ToastState } from "@/components/Toast";

type Nivel = "BRONZE" | "PRATA" | "OURO" | "DIAMANTE";

interface FaixaNivel {
  nivel: Nivel;
  minimo: number;
  maximo: number | null;
  multiplicador: number;
}

interface FaixaForm {
  nivel: Nivel;
  minimo: string;
  maximo: string; // vazio = sem teto
  multiplicador: string;
}

const LABEL_NIVEL: Record<Nivel, string> = {
  BRONZE: "Bronze",
  PRATA: "Prata",
  OURO: "Ouro",
  DIAMANTE: "Diamante",
};

function paraForm(f: FaixaNivel): FaixaForm {
  return {
    nivel: f.nivel,
    minimo: String(f.minimo),
    maximo: f.maximo === null ? "" : String(f.maximo),
    multiplicador: String(f.multiplicador),
  };
}

export function AbaConfiguracoes({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [faixas, setFaixas] = useState<FaixaForm[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/configuracoes/niveis");
    if (resposta.ok) {
      const dados: FaixaNivel[] = await resposta.json();
      setFaixas(dados.map(paraForm));
    }
    setCarregando(false);
  };

  useEffect(() => {
    carregar();
  }, []);

  const atualizarCampo = (nivel: Nivel, campo: keyof Omit<FaixaForm, "nivel">, valor: string) => {
    setFaixas((atual) => atual.map((f) => (f.nivel === nivel ? { ...f, [campo]: valor } : f)));
  };

  const salvar = async () => {
    const payload = faixas.map((f) => ({
      nivel: f.nivel,
      minimo: parseFloat(f.minimo.replace(",", ".")),
      maximo: f.maximo.trim() === "" ? null : parseFloat(f.maximo.replace(",", ".")),
      multiplicador: parseFloat(f.multiplicador.replace(",", ".")),
    }));

    for (const f of payload) {
      if (isNaN(f.minimo) || isNaN(f.multiplicador) || (f.maximo !== null && isNaN(f.maximo))) {
        mostrarToast("erro", `Nível ${LABEL_NIVEL[f.nivel]}: preencha os valores corretamente.`);
        return;
      }
    }

    setSalvando(true);
    const resposta = await fetch("/api/admin/configuracoes/niveis", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const dados = await resposta.json();
    setSalvando(false);

    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível salvar.");
      return;
    }

    mostrarToast("sucesso", "Configuração de níveis salva! Já vale pra próxima compra.");
    carregar();
  };

  if (carregando) return <div className="text-terracota text-sm">Carregando...</div>;

  return (
    <div className="max-w-[640px]">
      <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">
        Níveis de fidelidade
      </h3>

      <p className="text-[13px] text-terracota mb-4 leading-relaxed">
        Define a faixa de total gasto e o multiplicador de pontos de cada nível. Mudanças valem na hora, pra toda
        importação de venda seguinte — não precisa de deploy.
      </p>

      <div className="flex flex-col gap-2.5 mb-5">
        {faixas.map((f) => (
          <div key={f.nivel} className="bg-white border border-bege rounded-[10px] p-4">
            <div className="font-oswald font-bold text-sm mb-3">{LABEL_NIVEL[f.nivel]}</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-terracota mb-1">Gasto mínimo (R$)</label>
                <input
                  value={f.minimo}
                  onChange={(e) => atualizarCampo(f.nivel, "minimo", e.target.value)}
                  className="w-full border border-bege rounded-lg px-2.5 py-2 text-sm outline-none focus:border-ambar"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-terracota mb-1">Gasto máximo (R$)</label>
                <input
                  value={f.maximo}
                  onChange={(e) => atualizarCampo(f.nivel, "maximo", e.target.value)}
                  placeholder="sem teto"
                  className="w-full border border-bege rounded-lg px-2.5 py-2 text-sm outline-none focus:border-ambar"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-terracota mb-1">Multiplicador</label>
                <input
                  value={f.multiplicador}
                  onChange={(e) => atualizarCampo(f.nivel, "multiplicador", e.target.value)}
                  className="w-full border border-bege rounded-lg px-2.5 py-2 text-sm outline-none focus:border-ambar"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={salvar}
        disabled={salvando}
        className="flex items-center justify-center gap-2 bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg w-full disabled:opacity-60"
      >
        <Save size={16} /> {salvando ? "Salvando..." : "Salvar configuração"}
      </button>
    </div>
  );
}
