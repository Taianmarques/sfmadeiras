"use client";

import { useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";

export function ModalComprovante({
  onClose,
  onEnviado,
}: {
  onClose: () => void;
  onEnviado: () => void;
}) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleArquivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArquivo(file);
    setPreviewUrl(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    setErro("");
  };

  const confirmar = async () => {
    setErro("");
    const v = parseFloat(valor.replace(",", "."));
    if (!arquivo) {
      setErro("Anexe uma foto ou PDF do comprovante.");
      return;
    }
    if (!v || v <= 0) {
      setErro("Informe o valor da compra.");
      return;
    }

    setEnviando(true);
    const formData = new FormData();
    formData.append("arquivo", arquivo);
    formData.append("valor", String(v));
    formData.append("descricao", descricao);

    const resposta = await fetch("/api/cliente/comprovantes", { method: "POST", body: formData });
    const dados = await resposta.json();
    setEnviando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível enviar o comprovante.");
      return;
    }

    onEnviado();
  };

  return (
    <div className="fixed inset-0 bg-madeira/55 flex items-end justify-center z-[100]" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-fundo rounded-t-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto px-5 pt-5 pb-7"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-oswald font-bold text-base">Enviar comprovante</h2>
          <button onClick={onClose} className="text-terracota">
            <X size={20} />
          </button>
        </div>

        <p className="text-[12.5px] text-terracota mb-4 leading-relaxed">
          Esqueceu de informar seu CPF na hora da compra? Anexe a foto ou o PDF da nota e a loja confere e credita seus
          pontos.
        </p>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Foto ou PDF do comprovante</label>
        <label className="flex flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-ambar rounded-lg py-5 px-3 mb-1 cursor-pointer bg-white">
          <input type="file" accept="image/*,application/pdf" onChange={handleArquivo} className="hidden" />
          {arquivo ? (
            previewUrl ? (
              <img src={previewUrl} alt="Pré-visualização" className="max-h-28 rounded-md" />
            ) : (
              <div className="flex items-center gap-1.5">
                <FileText size={20} /> {arquivo.name}
              </div>
            )
          ) : (
            <>
              <Upload size={22} className="text-ambar" />
              <span className="text-xs text-terracota">Toque para escolher um arquivo</span>
            </>
          )}
        </label>
        {arquivo && <div className="text-[11px] text-gray-400 mb-3.5">{arquivo.name}</div>}

        <label className="block text-xs font-semibold text-terracota mb-1.5 mt-3.5">Valor da compra (R$)</label>
        <input
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3.5 outline-none focus:border-ambar bg-white"
        />

        <label className="block text-xs font-semibold text-terracota mb-1.5">O que você comprou? (opcional)</label>
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex: Cimento e areia"
          className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-4 outline-none focus:border-ambar bg-white"
        />

        {erro && (
          <div className="flex items-center gap-1.5 text-red-700 text-xs mb-3">
            <AlertCircle size={14} /> {erro}
          </div>
        )}

        <button
          onClick={confirmar}
          disabled={enviando}
          className="w-full bg-ambar text-madeira font-oswald font-bold py-3 rounded-lg disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar para aprovação"}
        </button>
      </div>
    </div>
  );
}
