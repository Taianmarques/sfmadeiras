import Image from "next/image";

// Logo oficial (public/logo.png) já vem com fundo transparente. Em telas de
// fundo escuro (headers, login do admin) é envolvida por um badge claro pelo
// componente que a usa, já que os traços mais escuros do símbolo perdem
// contraste direto sobre o marrom escuro do tema.
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/logo.png"
      alt="SF Madeiras — Clube de Benefícios"
      width={350}
      height={116}
      priority={priority}
      className={className}
    />
  );
}
