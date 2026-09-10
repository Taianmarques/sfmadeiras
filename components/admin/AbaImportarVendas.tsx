"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Check, AlertTriangle, X } from "lucide-react";
import { formatBRL, formatPontos } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

type StatusLinha = "ok" | "ja_importado" | "cliente_nao_encontrado" | "valor_invalido";

interface LinhaPreview {
  pedido: string;
  data: string | null;
  cliente: string;
  cpfCnpj: string;
  valorVenda: number;
  status: StatusLinha;
  clienteNome?: string;
  pontosEstimados?: number;
}

interface ResumoPreview {
  totalLinhas: number;
  ok: number;
  jaImportado: number;
  clienteNaoEncontrado: number;
  valorInvalido: number;
  totalValorOk: number;
  totalPontosEstimado: number;
}

interface ResultadoConfirmacao {
  importadas: number;
  jaImportadas: number;
  valorInvalido: number;
  pontosCreditados: number;
  valorCreditado: number;
  clientesNaoEncontrados: { pedido: string; cliente: string; cpfCnpj: string }[];
  falhas: { pedido: string; erro: string }[];
}

const STATUS_CONFIG: Record<StatusLinha, { label: string; cor: string; bg: string }> = {
  ok: { label: "OK", cor: "text-green-700", bg: "bg-green-50" },
  ja_importado: { label: "Já importado", cor: "text-gray-500", bg: "bg-gray-100" },
  cliente_nao_encontrado: { label: "Cliente não encontrado", cor: "text-red-700", bg: "bg-red-50" },
  valor_invalido: { label: "Valor inválido", cor: "text-red-700", bg: "bg-red-50" },
};

export function AbaImportarVendas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [preview, setPreview] = useState<{ linhas: LinhaPreview[]; resumo: ResumoPreview } | null>(null);
  const [resultado, setResultado] = useState<ResultadoConfirmacao | null>(null);

  const escolherArquivo = async (arquivoEscolhido: File) => {
    setArquivo(arquivoEscolhido);
    setResultado(null);
    setPreview(null);
    setCarregando(true);

    const formData = new FormData();
    formData.append("arquivo", arquivoEscolhido);

    const resposta = await fetch("/api/admin/importar-vendas/preview", { method: "POST", body: formData });
    const dados = await resposta.json();
    setCarregando(false);

    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível ler o arquivo.");
      setArquivo(null);
      return;
    }

    setPreview(dados);
  };

  const confirmarImportacao = async () => {
    if (!arquivo) return;
    setConfirmando(true);

    const formData = new FormData();
    formData.append("arquivo", arquivo);

    const resposta = await fetch("/api/admin/importar-vendas/confirmar", { method: "POST", body: formData });
    const dados = await resposta.json();
    setConfirmando(false);

    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível concluir a importação.");
      return;
    }

    setResultado(dados);
    setPreview(null);
    mostrarToast("sucesso", `${dados.importadas} vendas importadas, ${formatPontos(dados.pontosCreditados)} pontos creditados.`);
  };

  const cancelar = () => {
    setArquivo(null);
    setPreview(null);
    setResultado(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-[760px]">
      <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota mb-3">
        Importar relatório diário de vendas
      </h3>

      {!preview && !resultado && (
        <div className="bg-white border border-bege rounded-[10px] p-5">
          <p className="text-[13px] text-terracota mb-4 leading-relaxed">
            Suba o arquivo .xlsx do relatório diário de vendas. O sistema lê a planilha &quot;Pedidos&quot;, casa cada
            venda com o cliente pelo CPF/CNPJ e mostra uma prévia antes de creditar qualquer ponto.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) escolherArquivo(f);
            }}
          />

          <button
            onClick={() => inputRef.current?.click()}
            disabled={carregando}
            className="w-full border-[1.5px] border-dashed border-ambar rounded-[10px] py-6 flex flex-col items-center justify-center gap-2 disabled:opacity-60"
          >
            <Upload size={22} className="text-ambar" />
            <span className="text-[13px] font-bold">
              {carregando ? "Lendo arquivo..." : "Selecionar arquivo .xlsx"}
            </span>
          </button>
        </div>
      )}

      {preview && (
        <div>
          <div className="bg-white border border-bege rounded-[10px] p-5 mb-4">
            <div className="flex items-center gap-2 mb-4 text-[13px] font-semibold">
              <FileSpreadsheet size={16} className="text-terracota" /> {arquivo?.name}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <ResumoCard label="Prontas pra importar" valor={preview.resumo.ok} destaque />
              <ResumoCard label="Já importadas" valor={preview.resumo.jaImportado} />
              <ResumoCard label="Cliente não encontrado" valor={preview.resumo.clienteNaoEncontrado} alerta={preview.resumo.clienteNaoEncontrado > 0} />
              <ResumoCard label="Valor inválido" valor={preview.resumo.valorInvalido} alerta={preview.resumo.valorInvalido > 0} />
            </div>

            <div className="bg-fundo rounded-lg px-4 py-3 mb-4 text-[13px]">
              <strong>{formatBRL(preview.resumo.totalValorOk)}</strong> em vendas válidas vão gerar{" "}
              <strong>{formatPontos(preview.resumo.totalPontosEstimado)} pontos</strong> no total.
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmarImportacao}
                disabled={confirmando || preview.resumo.ok === 0}
                className="flex-1 bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {confirmando ? "Importando..." : `Confirmar importação (${preview.resumo.ok})`}
              </button>
              <button onClick={cancelar} disabled={confirmando} className="border border-bege text-terracota rounded-lg px-4 py-3 text-sm font-bold">
                Cancelar
              </button>
            </div>
          </div>

          <div className="bg-white border border-bege rounded-[10px] overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-bege text-terracota text-left">
                  <th className="px-3 py-2.5 whitespace-nowrap">Pedido</th>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Valor</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Pontos</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.linhas.map((linha) => {
                  const cfg = STATUS_CONFIG[linha.status];
                  return (
                    <tr key={linha.pedido} className="border-b border-fundo last:border-0">
                      <td className="px-3 py-2 whitespace-nowrap">{linha.pedido}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold">{linha.clienteNome ?? linha.cliente}</div>
                        <div className="text-[10.5px] text-gray-400">{linha.cpfCnpj}</div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{formatBRL(linha.valorVenda)}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{linha.pontosEstimados != null ? formatPontos(linha.pontosEstimados) : "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-1 text-[10.5px] font-bold ${cfg.bg} ${cfg.cor}`}>{cfg.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resultado && (
        <div className="bg-white border border-bege rounded-[10px] p-5">
          <div className="flex items-center gap-2 mb-4 text-green-700 font-bold text-sm">
            <Check size={18} /> Importação concluída
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
            <ResumoCard label="Importadas" valor={resultado.importadas} destaque />
            <ResumoCard label="Já importadas antes" valor={resultado.jaImportadas} />
            <ResumoCard label="Cliente não encontrado" valor={resultado.clientesNaoEncontrados.length} alerta={resultado.clientesNaoEncontrados.length > 0} />
            <ResumoCard label="Valor inválido" valor={resultado.valorInvalido} />
          </div>

          <div className="bg-fundo rounded-lg px-4 py-3 mb-4 text-[13px]">
            <strong>{formatBRL(resultado.valorCreditado)}</strong> creditados, gerando{" "}
            <strong>{formatPontos(resultado.pontosCreditados)} pontos</strong> pros clientes.
          </div>

          {resultado.clientesNaoEncontrados.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-terracota mb-2">
                <AlertTriangle size={14} /> Clientes não cadastrados no clube
              </div>
              <div className="flex flex-col gap-1.5">
                {resultado.clientesNaoEncontrados.map((c) => (
                  <div key={c.pedido} className="text-xs bg-red-50 text-red-700 rounded-md px-3 py-2 flex justify-between">
                    <span>{c.cliente || "(sem nome)"}</span>
                    <span>{c.cpfCnpj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resultado.falhas.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-terracota mb-2">
                <X size={14} /> Falhas ao importar
              </div>
              <div className="flex flex-col gap-1.5">
                {resultado.falhas.map((f) => (
                  <div key={f.pedido} className="text-xs bg-red-50 text-red-700 rounded-md px-3 py-2">
                    Pedido {f.pedido}: {f.erro}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={cancelar} className="w-full bg-madeira text-fundo font-oswald font-bold py-3 rounded-lg">
            Importar outro relatório
          </button>
        </div>
      )}
    </div>
  );
}

function ResumoCard({ label, valor, destaque, alerta }: { label: string; valor: number; destaque?: boolean; alerta?: boolean }) {
  return (
    <div
      className={`rounded-lg px-3 py-2.5 ${
        destaque ? "bg-madeira text-fundo" : alerta ? "bg-red-50 text-red-700" : "bg-fundo text-terracota"
      }`}
    >
      <div className="text-[10px] tracking-wide uppercase opacity-80">{label}</div>
      <div className="text-lg font-bold font-oswald">{valor}</div>
    </div>
  );
}
