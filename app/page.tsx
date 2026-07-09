import Link from "next/link";
import { TreeDeciduous, ShieldCheck, UserCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <TreeDeciduous size={48} className="text-ambar mb-4" strokeWidth={2} />
      <h1 className="font-oswald text-2xl font-bold tracking-wide">MADEIREIRA PINHEIRO</h1>
      <p className="text-terracota text-sm tracking-widest mt-1 mb-10">CLUBE DE PONTOS</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/cliente/login"
          className="flex items-center justify-center gap-2 bg-madeira text-fundo font-oswald font-semibold py-3 rounded-lg hover:opacity-90 transition"
        >
          <UserCircle2 size={18} /> Sou cliente
        </Link>
        <Link
          href="/admin/login"
          className="flex items-center justify-center gap-2 border border-terracota text-terracota font-oswald font-semibold py-3 rounded-lg hover:bg-bege transition"
        >
          <ShieldCheck size={18} /> Painel da loja
        </Link>
      </div>
    </main>
  );
}
