import Image from "next/image";

// Duas artes da mesma logo: "claro" (public/logo.png, versão "SF PRO") para
// fundos claros, e "escuro" (public/logodois.png, versão "SF" simples) para
// fundos escuros — normalmente ainda envolvida por um badge claro pelo
// componente que a usa, já que os traços do símbolo continuam escuros nas
// duas versões.
interface LogoProps {
  className?: string;
  priority?: boolean;
  variante?: "claro" | "escuro";
}

const ARQUIVO_POR_VARIANTE: Record<NonNullable<LogoProps["variante"]>, string> = {
  claro: "/logo.png",
  escuro: "/logodois.png",
};

export function Logo({ className, priority, variante = "claro" }: LogoProps) {
  return (
    <Image
      src={ARQUIVO_POR_VARIANTE[variante]}
      alt="SF Madeiras — Clube de Benefícios"
      width={350}
      height={116}
      priority={priority}
      className={className}
    />
  );
}
