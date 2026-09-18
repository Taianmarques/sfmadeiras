"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Users, Package, BarChart3, Megaphone, Tag, KeyRound, Wallet, FileSpreadsheet, Gift, Settings } from "lucide-react";
import { Toast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { useToast } from "@/lib/useToast";
import { ModalAlterarSenha } from "@/components/admin/ModalAlterarSenha";
import { AbaClientes } from "@/components/admin/AbaClientes";
import { AbaRecompensas } from "@/components/admin/AbaRecompensas";
import { AbaCampanhas } from "@/components/admin/AbaCampanhas";
import { AbaOfertas } from "@/components/admin/AbaOfertas";
import { AbaRelatorios } from "@/components/admin/AbaRelatorios";
import { AbaCashback } from "@/components/admin/AbaCashback";
import { AbaImportarVendas } from "@/components/admin/AbaImportarVendas";
import { AbaRetiradas } from "@/components/admin/AbaRetiradas";
import { AbaConfiguracoes } from "@/components/admin/AbaConfiguracoes";

type Aba =
  | "importar-vendas"
  | "clientes"
  | "recompensas"
  | "retiradas"
  | "cashback"
  | "campanhas"
  | "ofertas"
  | "relatorios"
  | "configuracoes";

export default function PainelAdmin() {
  const [aba, setAba] = useState<Aba>("importar-vendas");
  const [modalSenhaAberto, setModalSenhaAberto] = useState(false);
  const { toast, mostrarToast } = useToast();

  return (
    <div className="min-h-screen bg-fundo font-inter">
      <header className="bg-madeira px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo priority variante="escuro" className="h-9 w-auto" />
          <div className="text-[11px] text-ambar tracking-widest font-oswald font-semibold">PAINEL DA LOJA</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalSenhaAberto(true)}
            className="border border-terracota text-bege px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5"
          >
            <KeyRound size={14} /> Alterar senha
          </button>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="border border-terracota text-bege px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </header>

      {modalSenhaAberto && <ModalAlterarSenha onClose={() => setModalSenhaAberto(false)} mostrarToast={mostrarToast} />}

      <Toast toast={toast} />

      <div className="max-w-[980px] mx-auto p-5">
        <div className="flex gap-1 mb-5 border-b border-bege overflow-x-auto">
          <AbaBotao ativo={aba === "importar-vendas"} onClick={() => setAba("importar-vendas")} icone={<FileSpreadsheet size={15} />} label="Importar vendas" />
          <AbaBotao ativo={aba === "clientes"} onClick={() => setAba("clientes")} icone={<Users size={15} />} label="Clientes" />
          <AbaBotao ativo={aba === "recompensas"} onClick={() => setAba("recompensas")} icone={<Package size={15} />} label="Recompensas" />
          <AbaBotao ativo={aba === "retiradas"} onClick={() => setAba("retiradas")} icone={<Gift size={15} />} label="Retiradas" />
          <AbaBotao ativo={aba === "cashback"} onClick={() => setAba("cashback")} icone={<Wallet size={15} />} label="Cashback" />
          <AbaBotao ativo={aba === "campanhas"} onClick={() => setAba("campanhas")} icone={<Megaphone size={15} />} label="Campanhas" />
          <AbaBotao ativo={aba === "ofertas"} onClick={() => setAba("ofertas")} icone={<Tag size={15} />} label="Ofertas" />
          <AbaBotao ativo={aba === "relatorios"} onClick={() => setAba("relatorios")} icone={<BarChart3 size={15} />} label="Relatórios" />
          <AbaBotao ativo={aba === "configuracoes"} onClick={() => setAba("configuracoes")} icone={<Settings size={15} />} label="Configurações" />
        </div>

        {aba === "importar-vendas" && <AbaImportarVendas mostrarToast={mostrarToast} />}
        {aba === "clientes" && <AbaClientes />}
        {aba === "recompensas" && <AbaRecompensas mostrarToast={mostrarToast} />}
        {aba === "retiradas" && <AbaRetiradas mostrarToast={mostrarToast} />}
        {aba === "cashback" && <AbaCashback mostrarToast={mostrarToast} />}
        {aba === "campanhas" && <AbaCampanhas mostrarToast={mostrarToast} />}
        {aba === "ofertas" && <AbaOfertas mostrarToast={mostrarToast} />}
        {aba === "relatorios" && <AbaRelatorios />}
        {aba === "configuracoes" && <AbaConfiguracoes mostrarToast={mostrarToast} />}
      </div>
    </div>
  );
}

function AbaBotao({ ativo, onClick, icone, label }: { ativo: boolean; onClick: () => void; icone: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap border-b-2 -mb-px ${
        ativo ? "border-ambar text-madeira" : "border-transparent text-terracota/70"
      }`}
    >
      {icone} {label}
    </button>
  );
}
