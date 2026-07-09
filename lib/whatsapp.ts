// ---------------------------------------------------------------------------
// Stub de integração com WhatsApp (Evolution API ou Z-API).
//
// Nada aqui dispara mensagens de verdade enquanto WHATSAPP_PROVIDER,
// WHATSAPP_API_URL e WHATSAPP_API_KEY não estiverem configurados no .env —
// as funções apenas fazem log e retornam `{ enviado: false }`. Isso permite
// que todo o resto do sistema (aprovação de comprovante, resgate, etc.) já
// chame `notificarX(...)` hoje, e a integração real seja plugada depois só
// implementando `enviarMensagem` abaixo.
// ---------------------------------------------------------------------------

type ProvedorWhatsapp = "evolution" | "zapi" | "none";

interface EnvioResultado {
  enviado: boolean;
  motivo?: string;
}

function configurado() {
  return Boolean(process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_KEY);
}

function provedor(): ProvedorWhatsapp {
  const p = process.env.WHATSAPP_PROVIDER?.toLowerCase();
  if (p === "evolution" || p === "zapi") return p;
  return "none";
}

// Envia uma mensagem de texto simples para um número de telefone (formato
// livre; normalize para E.164 dentro do provedor real quando for implementar).
export async function enviarMensagem(telefone: string, mensagem: string): Promise<EnvioResultado> {
  if (!configurado() || provedor() === "none") {
    console.info(`[whatsapp:stub] Para ${telefone}: ${mensagem}`);
    return { enviado: false, motivo: "Integração WhatsApp não configurada (.env)." };
  }

  const prov = provedor();

  try {
    if (prov === "evolution") {
      // Documentação: https://doc.evolution-api.com/
      const resposta = await fetch(`${process.env.WHATSAPP_API_URL}/message/sendText/${process.env.WHATSAPP_INSTANCE ?? "default"}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: process.env.WHATSAPP_API_KEY!,
        },
        body: JSON.stringify({ number: telefone, text: mensagem }),
      });
      return { enviado: resposta.ok };
    }

    if (prov === "zapi") {
      // Documentação: https://developer.z-api.io/
      const resposta = await fetch(`${process.env.WHATSAPP_API_URL}/send-text`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token": process.env.WHATSAPP_API_KEY!,
        },
        body: JSON.stringify({ phone: telefone, message: mensagem }),
      });
      return { enviado: resposta.ok };
    }

    return { enviado: false, motivo: "Provedor desconhecido." };
  } catch (erro) {
    console.error("[whatsapp] Falha ao enviar mensagem:", erro);
    return { enviado: false, motivo: "Erro de rede ao chamar o provedor." };
  }
}

export function notificarComprovanteAprovado(telefone: string, nome: string, pontos: number) {
  return enviarMensagem(
    telefone,
    `Olá, ${nome}! Seu comprovante foi aprovado e você ganhou ${pontos} pontos no Clube SF Madeiras. 🌲`
  );
}

export function notificarComprovanteRejeitado(telefone: string, nome: string, motivo: string) {
  return enviarMensagem(
    telefone,
    `Olá, ${nome}. Seu comprovante enviado não foi aprovado. Motivo: ${motivo}. Qualquer dúvida, fale com a loja.`
  );
}

export function notificarResgateConfirmado(telefone: string, nome: string, recompensa: string) {
  return enviarMensagem(
    telefone,
    `${nome}, seu resgate de "${recompensa}" foi confirmado! Retire na loja SF Madeiras.`
  );
}

export function notificarNivelSubiu(telefone: string, nome: string, novoNivel: string) {
  return enviarMensagem(
    telefone,
    `Parabéns, ${nome}! Você subiu para o nível ${novoNivel} no Clube SF Madeiras e agora ganha ainda mais pontos por compra. 🎉`
  );
}
