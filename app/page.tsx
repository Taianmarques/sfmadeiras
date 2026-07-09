import Link from "next/link";
import { ShieldCheck, UserCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Logo priority className="h-16 w-auto mb-10" />

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
