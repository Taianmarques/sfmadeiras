"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut, Receipt, Plus, Users, Package, BarChart3, Megaphone, Tag } from "lucide-react";
import { Toast } from "@/components/Toast";
import { Logo } from "@/components/Logo";
import { useToast } from "@/lib/useToast";
import { AbaComprovantes } from "@/components/admin/AbaComprovantes";
import { AbaLancarCompra } from "@/components/admin/AbaLancarCompra";
import { AbaClientes } from "@/components/admin/AbaClientes";
import { AbaRecompensas } from "@/components/admin/AbaRecompensas";
import { AbaCampanhas } from "@/components/admin/AbaCampanhas";
import { AbaOfertas } from "@/components/admin/AbaOfertas";
import { AbaRelatorios } from "@/components/admin/AbaRelatorios";

type Aba = "comprovantes" | "lancar" | "clientes" | "recompensas" | "campanhas" | "ofertas" | "relatorios";

export default function PainelAdmin() {
  const [aba, setAba] = useState<Aba>("comprovantes");
  const { toast, mostrarToast } = useToast();

  return (
    <div className="min-h-screen bg-fundo font-inter">
      <header className="bg-madeira px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo priority variante="escuro" className="h-9 w-auto" />
          <div className="text-[11px] text-ambar tracking-widest font-oswald font-semibold">PAINEL DA LOJA</div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="border border-terracota text-bege px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5"
        >
          <LogOut size={14} /> Sair
        </button>
      </header>

      <Toast toast={toast} />

      <div className="max-w-[980px] mx-auto p-5">
        <div className="flex gap-1 mb-5 border-b border-bege overflow-x-auto">
          <AbaBotao ativo={aba === "comprovantes"} onClick={() => setAba("comprovantes")} icone={<Receipt size={15} />} label="Comprovantes" />
          <AbaBotao ativo={aba === "lancar"} onClick={() => setAba("lancar")} icone={<Plus size={15} />} label="Lançar compra" />
          <AbaBotao ativo={aba === "clientes"} onClick={() => setAba("clientes")} icone={<Users size={15} />} label="Clientes" />
          <AbaBotao ativo={aba === "recompensas"} onClick={() => setAba("recompensas")} icone={<Package size={15} />} label="Recompensas" />
          <AbaBotao ativo={aba === "campanhas"} onClick={() => setAba("campanhas")} icone={<Megaphone size={15} />} label="Campanhas" />
          <AbaBotao ativo={aba === "ofertas"} onClick={() => setAba("ofertas")} icone={<Tag size={15} />} label="Ofertas" />
          <AbaBotao ativo={aba === "relatorios"} onClick={() => setAba("relatorios")} icone={<BarChart3 size={15} />} label="Relatórios" />
        </div>

        {aba === "comprovantes" && <AbaComprovantes mostrarToast={mostrarToast} />}
        {aba === "lancar" && <AbaLancarCompra mostrarToast={mostrarToast} />}
        {aba === "clientes" && <AbaClientes />}
        {aba === "recompensas" && <AbaRecompensas mostrarToast={mostrarToast} />}
        {aba === "campanhas" && <AbaCampanhas mostrarToast={mostrarToast} />}
        {aba === "ofertas" && <AbaOfertas mostrarToast={mostrarToast} />}
        {aba === "relatorios" && <AbaRelatorios />}
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
