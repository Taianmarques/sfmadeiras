// ---------------------------------------------------------------------------
// Rate limiter simples em memória (janela fixa) para rotas sensíveis:
// login (cliente/admin) e envio de comprovante.
//
// Funciona para uma única instância do processo Node. Se o projeto for
// escalar horizontalmente (múltiplas instâncias/serverless com estado
// compartilhado), troque este armazenamento em memória por Redis/Upstash —
// a assinatura de `checarLimite` foi pensada para isso ser um drop-in.
// ---------------------------------------------------------------------------

interface RegistroLimite {
  contagem: number;
  inicioJanelaMs: number;
}

const armazenamento = new Map<string, RegistroLimite>();

// Limpa entradas antigas periodicamente para não vazar memória
setInterval(() => {
  const agora = Date.now();
  for (const [chave, registro] of armazenamento) {
    if (agora - registro.inicioJanelaMs > 60 * 60 * 1000) armazenamento.delete(chave);
  }
}, 10 * 60 * 1000).unref?.();

export interface ResultadoLimite {
  permitido: boolean;
  restante: number;
  resetEmMs: number;
}

// chave costuma ser `${rota}:${ip}` (e opcionalmente `:cpf` / `:email`)
export function checarLimite(chave: string, maxTentativas: number, janelaMs: number): ResultadoLimite {
  const agora = Date.now();
  const registro = armazenamento.get(chave);

  if (!registro || agora - registro.inicioJanelaMs > janelaMs) {
    armazenamento.set(chave, { contagem: 1, inicioJanelaMs: agora });
    return { permitido: true, restante: maxTentativas - 1, resetEmMs: janelaMs };
  }

  if (registro.contagem >= maxTentativas) {
    return {
      permitido: false,
      restante: 0,
      resetEmMs: janelaMs - (agora - registro.inicioJanelaMs),
    };
  }

  registro.contagem += 1;
  return {
    permitido: true,
    restante: maxTentativas - registro.contagem,
    resetEmMs: janelaMs - (agora - registro.inicioJanelaMs),
  };
}

export const LIMITES = {
  LOGIN: { max: 5, janelaMs: 15 * 60 * 1000 }, // 5 tentativas / 15 min
  COMPROVANTE: { max: 10, janelaMs: 60 * 60 * 1000 }, // 10 envios / hora
};
