"use client";

import { useEffect, useState } from "react";
import { Plus, X, Tag, Upload, FileImage } from "lucide-react";
import { formatBRL, formatData } from "@/lib/formatadores";
import type { ToastState } from "@/components/Toast";

interface Oferta {
  id: string;
  titulo: string;
  descricao: string | null;
  imagemUrl: string;
  precoNormal: number;
  precoPromocional: number;
  dataInicio: string | null;
  dataFim: string | null;
  ativo: boolean;
}

export function AbaOfertas({ mostrarToast }: { mostrarToast: (tipo: ToastState["tipo"], msg: string) => void }) {
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [editando, setEditando] = useState<Oferta | "nova" | null>(null);

  const carregar = async () => {
    const resposta = await fetch("/api/admin/ofertas");
    if (resposta.ok) setOfertas(await resposta.json());
  };

  useEffect(() => {
    carregar();
  }, []);

  const agora = new Date();
  const estaVigente = (o: Oferta) =>
    o.ativo &&
    (!o.dataInicio || new Date(o.dataInicio) <= agora) &&
    (!o.dataFim || new Date(o.dataFim) >= agora);

  const desconto = (o: Oferta) => Math.round((1 - o.precoPromocional / o.precoNormal) * 100);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-oswald font-semibold text-[13px] tracking-wide uppercase text-terracota">Catálogo de ofertas exclusivas</h3>
        <button onClick={() => setEditando("nova")} className="flex items-center gap-1.5 bg-ambar text-madeira font-bold text-xs rounded-md px-3 py-1.5">
          <Plus size={14} /> Nova oferta
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        {ofertas.map((o) => (
          <button
            key={o.id}
            onClick={() => setEditando(o)}
            className={`text-left bg-white border border-bege rounded-[10px] overflow-hidden ${!o.ativo ? "opacity-50" : ""}`}
          >
            <div className="relative aspect-[4/3] bg-fundo">
              <img src={o.imagemUrl} alt={o.titulo} className="w-full h-full object-cover" />
              <span className="absolute top-2 left-2 bg-terracota text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                -{desconto(o)}%
              </span>
              <span
                className={`absolute top-2 right-2 text-[11px] font-bold rounded-full px-2 py-0.5 ${
                  estaVigente(o) ? "bg-green-600 text-white" : "bg-fundo text-terracota"
                }`}
              >
                {!o.ativo ? "Inativa" : estaVigente(o) ? "Vigente" : "Fora do período"}
              </span>
            </div>
            <div className="p-3.5">
              <div className="font-semibold text-sm mb-1">{o.titulo}</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-gray-400 line-through">{formatBRL(o.precoNormal)}</span>
                <span className="text-sm font-bold text-terracota">{formatBRL(o.precoPromocional)}</span>
              </div>
              {(o.dataInicio || o.dataFim) && (
                <div className="text-[11px] text-gray-400 mt-1">
                  {o.dataInicio ? formatData(o.dataInicio) : "sempre"} até {o.dataFim ? formatData(o.dataFim) : "sem prazo"}
                </div>
              )}
            </div>
          </button>
        ))}
        {ofertas.length === 0 && (
          <div className="col-span-full text-center text-terracota py-10 text-[13px] bg-white border border-bege rounded-[10px]">
            <Tag size={20} className="mx-auto mb-2 opacity-50" />
            Nenhuma oferta cadastrada.
          </div>
        )}
      </div>

      {editando && (
        <ModalOferta
          oferta={editando === "nova" ? null : editando}
          onClose={() => setEditando(null)}
          onSalvo={(msg) => {
            setEditando(null);
            mostrarToast("sucesso", msg);
            carregar();
          }}
        />
      )}
    </div>
  );
}

function ModalOferta({
  oferta,
  onClose,
  onSalvo,
}: {
  oferta: Oferta | null;
  onClose: () => void;
  onSalvo: (msg: string) => void;
}) {
  const paraInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

  const [titulo, setTitulo] = useState(oferta?.titulo ?? "");
  const [descricao, setDescricao] = useState(oferta?.descricao ?? "");
  const [precoNormal, setPrecoNormal] = useState(oferta ? String(oferta.precoNormal) : "");
  const [precoPromocional, setPrecoPromocional] = useState(oferta ? String(oferta.precoPromocional) : "");
  const [dataInicio, setDataInicio] = useState(paraInput(oferta?.dataInicio ?? null));
  const [dataFim, setDataFim] = useState(paraInput(oferta?.dataFim ?? null));
  const [ativo, setAtivo] = useState(oferta?.ativo ?? true);
  const [imagem, setImagem] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(oferta?.imagemUrl ?? null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleImagem = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagem(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const salvar = async () => {
    setErro("");
    const pn = parseFloat(precoNormal.replace(",", "."));
    const pp = parseFloat(precoPromocional.replace(",", "."));

    if (!titulo.trim()) {
      setErro("Informe o título do produto.");
      return;
    }
    if (!pn || pn <= 0 || !pp || pp <= 0) {
      setErro("Informe o preço normal e o preço promocional.");
      return;
    }
    if (pp >= pn) {
      setErro("O preço promocional deve ser menor que o preço normal.");
      return;
    }
    if (!oferta && !imagem) {
      setErro("Envie uma foto do produto.");
      return;
    }
    if (dataInicio && dataFim && dataFim <= dataInicio) {
      setErro("A data de fim deve ser depois da data de início.");
      return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descricao", descricao);
    formData.append("precoNormal", String(pn));
    formData.append("precoPromocional", String(pp));
    formData.append("dataInicio", dataInicio);
    formData.append("dataFim", dataFim);
    if (oferta) formData.append("ativo", String(ativo));
    if (imagem) formData.append("imagem", imagem);

    setSalvando(true);
    const resposta = await fetch(oferta ? `/api/admin/ofertas/${oferta.id}` : "/api/admin/ofertas", {
      method: oferta ? "PUT" : "POST",
      body: formData,
    });
    const dados = await resposta.json();
    setSalvando(false);

    if (!resposta.ok) {
      setErro(dados.erro ?? "Não foi possível salvar.");
      return;
    }
    onSalvo(oferta ? "Oferta atualizada." : "Oferta criada.");
  };

  const desativar = async () => {
    if (!oferta) return;
    await fetch(`/api/admin/ofertas/${oferta.id}`, { method: "DELETE" });
    onSalvo("Oferta desativada.");
  };

  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl p-5 max-w-[420px] w-full my-8">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold font-oswald">{oferta ? "Editar oferta" : "Nova oferta"}</div>
          <button onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Foto do produto</label>
        <label className="flex flex-col items-center justify-center gap-1.5 border-[1.5px] border-dashed border-ambar rounded-lg py-4 px-3 mb-3.5 cursor-pointer bg-fundo overflow-hidden">
          <input type="file" accept="image/*" onChange={handleImagem} className="hidden" />
          {previewUrl ? (
            <img src={previewUrl} alt="Pré-visualização" className="max-h-32 rounded-md" />
          ) : (
            <>
              <Upload size={20} className="text-ambar" />
              <span className="text-xs text-terracota flex items-center gap-1">
                <FileImage size={13} /> Toque para escolher uma foto
              </span>
            </>
          )}
        </label>

        <label className="block text-xs font-semibold text-terracota mb-1.5">Título do produto</label>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Furadeira de impacto 750W" className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5" />

        <label className="block text-xs font-semibold text-terracota mb-1.5">Descrição (opcional)</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={2}
          placeholder="Ex: Direto de fábrica, garantia de 1 ano"
          className="w-full border border-bege rounded-lg px-3 py-2 text-sm mb-3.5"
        />

        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Preço normal (R$)</label>
            <input value={precoNormal} onChange={(e) => setPrecoNormal(e.target.value)} placeholder="0,00" className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Preço promocional (R$)</label>
            <input value={precoPromocional} onChange={(e) => setPrecoPromocional(e.target.value)} placeholder="0,00" className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Início (opcional)</label>
            <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-terracota mb-1.5">Fim (opcional)</label>
            <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full border border-bege rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        {oferta && (
          <label className="flex items-center gap-2 text-sm mb-4">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Ativa no catálogo
          </label>
        )}

        {erro && <div className="text-xs text-red-700 mb-3">{erro}</div>}

        <button onClick={salvar} disabled={salvando} className="w-full bg-ambar text-madeira font-bold py-2.5 rounded-lg mb-2 disabled:opacity-60">
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {oferta && (
          <button onClick={desativar} className="w-full border border-red-700 text-red-700 font-bold py-2.5 rounded-lg">
            Desativar oferta
          </button>
        )}
      </div>
    </div>
  );
}
