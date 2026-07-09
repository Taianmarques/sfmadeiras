"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  TreeDeciduous,
  Gift,
  History,
  LogOut,
  Upload,
  Clock,
  Check,
  X,
  FileImage,
  FileText,
  QrCode,
  Users,
  Tag,
} from "lucide-react";
import { AnelProgresso } from "@/components/AnelProgresso";
import { Toast } from "@/components/Toast";
import { useToast } from "@/lib/useToast";
import { ModalComprovante } from "@/components/cliente/ModalComprovante";
import { ModalQrCode } from "@/components/cliente/ModalQrCode";
import { formatBRL, formatPontos, formatData } from "@/lib/formatadores";

interface ClienteMe {
  id: string;
  nome: string;
  pontos: number;
  totalGasto: number;
  nivel: "BRONZE" | "PRATA" | "OURO" | "DIAMANTE";
  qrCodeToken: string;
  multiplicadorAtual: number;
  proximoNivel: { nivel: string; faltamReais: number } | null;
  indicacoesConvertidas: number;
}

interface Recompensa {
  id: string;
  nome: string;
  pontos: number;
  estoque: number;
  icone: string;
}

interface Movimentacao {
  id: string;
  tipo: "COMPRA" | "RESGATE" | "BONUS_INDICACAO" | "EXPIRACAO" | "AJUSTE";
  descricao: string;
  valorCompra: number | null;
  pontos: number;
  criadoEm: string;
}

interface Comprovante {
  id: string;
  valorInformado: number;
  descricao: string | null;
  arquivoTipo: "IMAGEM" | "PDF";
  status: "PENDENTE" | "APROVADO" | "REJEITADO";
  motivoRejeicao: string | null;
  criadoEm: string;
}

interface Oferta {
  id: string;
  titulo: string;
  descricao: string | null;
  imagemUrl: string;
  precoNormal: number;
  precoPromocional: number;
  dataInicio: string | null;
  dataFim: string | null;
}

type Aba = "inicio" | "recompensas" | "ofertas" | "historico";

export default function ClienteApp() {
  const [aba, setAba] = useState<Aba>("inicio");
  const [cliente, setCliente] = useState<ClienteMe | null>(null);
  const [recompensas, setRecompensas] = useState<Recompensa[]>([]);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [comprovantes, setComprovantes] = useState<Comprovante[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalComprovanteAberto, setModalComprovanteAberto] = useState(false);
  const [modalQrAberto, setModalQrAberto] = useState(false);
  const { toast, mostrarToast } = useToast();

  const carregarTudo = useCallback(async () => {
    const [meRes, recRes, histRes, compRes, ofertasRes] = await Promise.all([
      fetch("/api/cliente/me"),
      fetch("/api/cliente/recompensas"),
      fetch("/api/cliente/historico"),
      fetch("/api/cliente/comprovantes"),
      fetch("/api/cliente/ofertas"),
    ]);
    if (meRes.ok) setCliente(await meRes.json());
    if (recRes.ok) setRecompensas(await recRes.json());
    if (histRes.ok) setHistorico(await histRes.json());
    if (compRes.ok) setComprovantes(await compRes.json());
    if (ofertasRes.ok) setOfertas(await ofertasRes.json());
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregarTudo();
  }, [carregarTudo]);

  if (carregando || !cliente) {
    return <div className="min-h-screen flex items-center justify-center text-terracota text-sm">Carregando...</div>;
  }

  const proximaRecompensa = [...recompensas].filter((r) => r.pontos > cliente.pontos).sort((a, b) => a.pontos - b.pontos)[0]
    ?? [...recompensas].sort((a, b) => b.pontos - a.pontos)[0];

  const comprovantesPendentes = comprovantes.filter((c) => c.status === "PENDENTE");

  const tentarResgatar = async (recompensa: Recompensa) => {
    if (cliente.pontos < recompensa.pontos) {
      mostrarToast("erro", `Faltam ${formatPontos(recompensa.pontos - cliente.pontos)} pontos para esse item.`);
      return;
    }
    const resposta = await fetch("/api/cliente/resgates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recompensaId: recompensa.id }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarToast("erro", dados.erro ?? "Não foi possível concluir o resgate.");
      return;
    }
    mostrarToast("sucesso", `Resgate confirmado: ${recompensa.nome}`);
    carregarTudo();
  };

  return (
    <div className="min-h-screen bg-fundo font-inter">
      <header className="bg-madeira px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TreeDeciduous size={26} className="text-ambar" strokeWidth={2} />
          <div>
            <div className="font-oswald font-bold text-sm text-fundo tracking-wide">MADEIREIRA PINHEIRO</div>
            <div className="text-[11px] text-ambar tracking-widest">CLUBE DE PONTOS</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalQrAberto(true)} className="border border-terracota text-bege px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5">
            <QrCode size={14} /> Meu QR
          </button>
          <button onClick={() => signOut({ callbackUrl: "/cliente/login" })} className="border border-terracota text-bege px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {modalComprovanteAberto && (
        <ModalComprovante
          onClose={() => setModalComprovanteAberto(false)}
          onEnviado={() => {
            setModalComprovanteAberto(false);
            mostrarToast("sucesso", "Comprovante enviado! Aguarde a aprovação da loja.");
            carregarTudo();
          }}
        />
      )}
      {modalQrAberto && <ModalQrCode token={cliente.qrCodeToken} nome={cliente.nome} onClose={() => setModalQrAberto(false)} />}

      <Toast toast={toast} />

      <main className="max-w-[480px] mx-auto px-5 pt-6 pb-24">
        {aba === "inicio" && (
          <>
            <div className="text-center mb-2 text-terracota text-[13px]">
              Olá, <strong>{cliente.nome.split(" ")[0]}</strong>
            </div>
            <div className="flex justify-center my-3 mb-5">
              <AnelProgresso pontosAtuais={cliente.pontos} pontosMeta={proximaRecompensa?.pontos || 1000} />
            </div>

            <div className="flex justify-center mb-5">
              <span className="text-[11px] font-oswald font-semibold tracking-widest bg-bege text-terracota px-3 py-1 rounded-full">
                NÍVEL {cliente.nivel}
              </span>
            </div>

            {proximaRecompensa && (
              <div className="bg-white border border-bege rounded-[10px] px-4 py-3.5 mb-5 flex items-center gap-3">
                <div className="text-[28px]">{proximaRecompensa.icone}</div>
                <div className="flex-1">
                  <div className="text-[13px] text-terracota">Próxima recompensa</div>
                  <div className="font-semibold text-sm">{proximaRecompensa.nome}</div>
                  <div className="text-xs text-madeira/60">
                    Faltam {formatPontos(Math.max(proximaRecompensa.pontos - cliente.pontos, 0))} pontos
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-madeira rounded-[10px] px-4 py-3.5">
                <div className="text-ambar text-[11px] tracking-wide">TOTAL GASTO</div>
                <div className="text-fundo text-lg font-bold font-oswald">{formatBRL(cliente.totalGasto)}</div>
              </div>
              <div className="bg-madeira rounded-[10px] px-4 py-3.5">
                <div className="text-ambar text-[11px] tracking-wide">MULTIPLICADOR</div>
                <div className="text-fundo text-lg font-bold font-oswald">{cliente.multiplicadorAtual}x</div>
              </div>
            </div>

            <button
              onClick={() => setModalComprovanteAberto(true)}
              className="w-full bg-white border-[1.5px] border-dashed border-ambar rounded-[10px] py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-[13px] mb-4"
            >
              <Upload size={16} className="text-ambar" />
              Enviar comprovante de compra
            </button>

            {comprovantesPendentes.length > 0 && (
              <div className="bg-[#FBF3DD] border border-ambar rounded-[10px] px-4 py-3 mb-5 flex items-center gap-2.5">
                <Clock size={18} className="text-terracota" />
                <div className="text-xs text-terracota">
                  Você tem <strong>{comprovantesPendentes.length}</strong> comprovante{comprovantesPendentes.length > 1 ? "s" : ""} em
                  análise pela loja.
                </div>
              </div>
            )}

            <SecaoTitulo icone={<History size={16} />} texto="Últimas movimentações" />
            <div className="flex flex-col gap-2">
              {historico.slice(0, 4).map((h) => (
                <LinhaHistorico key={h.id} item={h} />
              ))}
              {historico.length === 0 && <div className="text-center text-terracota py-6 text-[13px]">Nenhuma movimentação ainda.</div>}
            </div>
          </>
        )}

        {aba === "recompensas" && (
          <>
            <SecaoTitulo icone={<Gift size={16} />} texto="Troque seus pontos" />
            <div className="flex flex-col gap-2.5">
              {recompensas.map((r) => {
                const podeResgatar = cliente.pontos >= r.pontos && r.estoque > 0;
                return (
                  <div key={r.id} className={`bg-white border border-bege rounded-[10px] px-4 py-3.5 flex items-center gap-3 ${r.estoque === 0 ? "opacity-50" : ""}`}>
                    <div className="text-[26px]">{r.icone}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{r.nome}</div>
                      <div className="text-xs text-terracota">{formatPontos(r.pontos)} pontos</div>
                    </div>
                    <button
                      onClick={() => tentarResgatar(r)}
                      disabled={r.estoque === 0}
                      className={`rounded-md px-3 py-2 text-xs font-bold whitespace-nowrap ${
                        podeResgatar ? "bg-ambar text-madeira" : "bg-bege text-gray-400"
                      } ${r.estoque === 0 ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {r.estoque === 0 ? "Esgotado" : "Resgatar"}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <SecaoTitulo icone={<Users size={16} />} texto="Indique um amigo" />
              <IndicarAmigo />
            </div>
          </>
        )}

        {aba === "ofertas" && (
          <>
            <SecaoTitulo icone={<Tag size={16} />} texto="Ofertas exclusivas do clube" />
            <div className="grid grid-cols-2 gap-3">
              {ofertas.map((o) => {
                const desconto = Math.round((1 - o.precoPromocional / o.precoNormal) * 100);
                return (
                  <div key={o.id} className="bg-white border border-bege rounded-[10px] overflow-hidden">
                    <div className="relative aspect-square bg-fundo">
                      <img src={o.imagemUrl} alt={o.titulo} className="w-full h-full object-cover" />
                      {desconto > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-terracota text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                          -{desconto}%
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="font-semibold text-[12.5px] leading-tight mb-1">{o.titulo}</div>
                      {o.descricao && <div className="text-[11px] text-terracota mb-1 line-clamp-2">{o.descricao}</div>}
                      <div className="text-[11px] text-gray-400 line-through">{formatBRL(o.precoNormal)}</div>
                      <div className="text-sm font-bold text-terracota">{formatBRL(o.precoPromocional)}</div>
                      {o.dataFim && (
                        <div className="text-[10px] text-gray-400 mt-1">Até {formatData(o.dataFim)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {ofertas.length === 0 && (
                <div className="col-span-2 text-center text-terracota py-10 text-[13px] bg-white border border-bege rounded-[10px]">
                  Nenhuma oferta exclusiva no momento. Volte mais tarde!
                </div>
              )}
            </div>
          </>
        )}

        {aba === "historico" && (
          <>
            {comprovantes.length > 0 && (
              <>
                <SecaoTitulo icone={<FileText size={16} />} texto="Comprovantes enviados" />
                <div className="flex flex-col gap-2 mb-6">
                  {comprovantes.map((c) => (
                    <LinhaComprovante key={c.id} item={c} />
                  ))}
                </div>
              </>
            )}

            <SecaoTitulo icone={<History size={16} />} texto="Histórico de pontos" />
            <div className="flex flex-col gap-2">
              {historico.length === 0 && <div className="text-center text-terracota py-7 text-[13px]">Nenhuma movimentação ainda.</div>}
              {historico.map((h) => (
                <LinhaHistorico key={h.id} item={h} />
              ))}
            </div>
          </>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-madeira border-t border-[#2a2018] flex justify-center py-2">
        <div className="flex gap-1.5 w-full max-w-[480px] px-4">
          <TabButton ativo={aba === "inicio"} onClick={() => setAba("inicio")} icone={<TreeDeciduous size={18} />} label="Início" />
          <TabButton ativo={aba === "recompensas"} onClick={() => setAba("recompensas")} icone={<Gift size={18} />} label="Recompensas" />
          <TabButton ativo={aba === "ofertas"} onClick={() => setAba("ofertas")} icone={<Tag size={18} />} label="Ofertas" />
          <TabButton ativo={aba === "historico"} onClick={() => setAba("historico")} icone={<History size={18} />} label="Histórico" />
        </div>
      </nav>
    </div>
  );
}

function TabButton({ ativo, onClick, icone, label }: { ativo: boolean; onClick: () => void; icone: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[11px] ${ativo ? "text-ambar" : "text-gray-400"}`}
    >
      {icone}
      {label}
    </button>
  );
}

function SecaoTitulo({ icone, texto }: { icone: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 text-terracota">
      {icone}
      <span className="font-oswald font-semibold text-[13px] tracking-wide uppercase">{texto}</span>
    </div>
  );
}

function LinhaHistorico({ item }: { item: Movimentacao }) {
  const ehDebito = item.pontos < 0;
  return (
    <div className="bg-white border border-bege rounded-lg px-3.5 py-2.5 flex items-center justify-between">
      <div>
        <div className="text-[13px] font-semibold">{item.descricao}</div>
        <div className="text-[11px] text-terracota">{formatData(item.criadoEm)}</div>
      </div>
      <div className="text-right">
        <div className={`text-[13px] font-bold ${ehDebito ? "text-terracota" : "text-madeira"}`}>
          {ehDebito ? "−" : "+"}
          {formatPontos(Math.abs(item.pontos))} pts
        </div>
        {item.valorCompra !== null && <div className="text-[11px] text-gray-400">{formatBRL(item.valorCompra)}</div>}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  PENDENTE: { cor: "text-terracota", bg: "bg-[#FBF3DD]", label: "Em análise", icone: <Clock size={13} /> },
  APROVADO: { cor: "text-green-700", bg: "bg-green-50", label: "Aprovado", icone: <Check size={13} /> },
  REJEITADO: { cor: "text-red-700", bg: "bg-red-50", label: "Não aprovado", icone: <X size={13} /> },
};

function LinhaComprovante({ item }: { item: Comprovante }) {
  const cfg = STATUS_CONFIG[item.status];
  return (
    <div className="bg-white border border-bege rounded-lg px-3.5 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.arquivoTipo === "IMAGEM" ? <FileImage size={15} className="text-gray-400" /> : <FileText size={15} className="text-gray-400" />}
          <div>
            <div className="text-[13px] font-semibold">{item.descricao || "Comprovante de compra"}</div>
            <div className="text-[11px] text-terracota">
              {formatData(item.criadoEm)} · {formatBRL(item.valorInformado)}
            </div>
          </div>
        </div>
        <div className={`rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 whitespace-nowrap ${cfg.bg} ${cfg.cor}`}>
          {cfg.icone} {cfg.label}
        </div>
      </div>
      {item.status === "REJEITADO" && item.motivoRejeicao && (
        <div className="text-xs text-red-700 bg-red-50 rounded-md px-2.5 py-1.5 mt-2">Motivo: {item.motivoRejeicao}</div>
      )}
    </div>
  );
}

function IndicarAmigo() {
  const [link, setLink] = useState<string | null>(null);
  const [totalConvertidas, setTotalConvertidas] = useState(0);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    fetch("/api/cliente/indicacao")
      .then((r) => r.json())
      .then((d) => {
        setLink(d.link);
        setTotalConvertidas(d.totalConvertidas);
      });
  }, []);

  if (!link) return null;

  const copiar = async () => {
    await navigator.clipboard.writeText(link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white border border-bege rounded-[10px] px-4 py-4">
      <p className="text-[13px] mb-3">
        Indique um amigo e ganhe <strong>100 pontos</strong> quando ele fizer o cadastro. Você já indicou{" "}
        <strong>{totalConvertidas}</strong> amigo{totalConvertidas === 1 ? "" : "s"}.
      </p>
      <div className="flex gap-2">
        <input readOnly value={link} className="flex-1 border border-bege rounded-md px-2.5 py-2 text-xs bg-fundo" />
        <button onClick={copiar} className="bg-ambar text-madeira font-bold text-xs rounded-md px-3 py-2 whitespace-nowrap">
          {copiado ? "Copiado!" : "Copiar"}
        </button>
      </div>
    </div>
  );
}
