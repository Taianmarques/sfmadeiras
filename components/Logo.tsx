// Duas artes da mesma logo: "claro" (public/logo.png, texto "PRO" em marrom
// escuro) para fundos claros, e "escuro" (public/logodois.png, texto "PRO" em
// branco) para fundos escuros. Ambas têm fundo transparente e vão direto
// sobre o fundo da tela — sem badge/card ao redor.
//
// Servida como <img> puro (arquivo estático direto, sem passar pelo
// otimizador /_next/image) de propósito: o otimizador do Next gera um ETag
// baseado só no arquivo de origem, igual pra qualquer largura pedida, o que
// nesse projeto causou respostas 304 devolvendo o conteúdo errado quando as
// duas variantes (logo.png / logodois.png) foram trocadas em sequência. Como
// é um arquivo pequeno e já otimizado, não precisamos do redimensionamento
// automático — servir direto elimina essa armadilha de cache.
interface LogoProps {
  className?: string;
  priority?: boolean;
  variante?: "claro" | "escuro";
}

const ARQUIVO_POR_VARIANTE: Record<NonNullable<LogoProps["variante"]>, string> = {
  claro: "/logo.png",
  escuro: "/logodois.png",
};

export function Logo({ className, variante = "claro" }: LogoProps) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={ARQUIVO_POR_VARIANTE[variante]} alt="SF Madeiras — Clube de Benefícios" className={className} />;
}
