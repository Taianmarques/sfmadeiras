const formatPontos = (v: number) => v.toLocaleString("pt-BR");

export function AnelProgresso({
  pontosAtuais,
  pontosMeta,
  tamanho = 180,
}: {
  pontosAtuais: number;
  pontosMeta: number;
  tamanho?: number;
}) {
  const raio = tamanho / 2 - 14;
  const circunferencia = 2 * Math.PI * raio;
  const pct = Math.min(pontosAtuais / Math.max(pontosMeta, 1), 1);
  const offset = circunferencia * (1 - pct);
  const centro = tamanho / 2;

  return (
    <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`}>
      {[0.85, 0.65, 0.45].map((f, i) => (
        <circle key={i} cx={centro} cy={centro} r={raio * f} fill="none" stroke="#E8DCC8" strokeWidth={1} opacity={0.5} />
      ))}
      <circle cx={centro} cy={centro} r={raio} fill="none" stroke="#E8DCC8" strokeWidth={12} />
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke="#C9A227"
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${centro} ${centro})`}
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x={centro} y={centro - 6} textAnchor="middle" fontSize={28} fontWeight={800} fill="#1C1410" fontFamily="var(--font-oswald)">
        {formatPontos(pontosAtuais)}
      </text>
      <text x={centro} y={centro + 18} textAnchor="middle" fontSize={11} fill="#7A3B2E" letterSpacing="0.05em" fontFamily="var(--font-oswald)">
        PONTOS
      </text>
    </svg>
  );
}
