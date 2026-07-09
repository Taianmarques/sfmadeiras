"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

// Usa a BarcodeDetector API nativa do navegador (Chrome/Edge/Android) quando
// disponível. Em navegadores sem suporte (ex: Safari/Firefox), cai para
// digitação manual do código do QR — sem dependência externa de scanner.
export function LeitorQrCode({ onLido, onClose }: { onLido: (token: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [suportado, setSuportado] = useState(true);
  const [manual, setManual] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!("BarcodeDetector" in window)) {
      setSuportado(false);
      return;
    }

    let stream: MediaStream | null = null;
    let ativo = true;
    // @ts-expect-error BarcodeDetector ainda não tem tipos oficiais no TS/DOM lib
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });

    const iniciar = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const loop = async () => {
          if (!ativo || !videoRef.current) return;
          try {
            const codigos = await detector.detect(videoRef.current);
            if (codigos.length > 0) {
              onLido(codigos[0].rawValue);
              return;
            }
          } catch {
            // ignora frame sem leitura
          }
          requestAnimationFrame(loop);
        };
        loop();
      } catch {
        setErro("Não foi possível acessar a câmera. Use a leitura manual abaixo.");
        setSuportado(false);
      }
    };

    iniciar();
    return () => {
      ativo = false;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onLido]);

  return (
    <div className="fixed inset-0 bg-madeira/85 flex flex-col items-center justify-center z-[100] p-5">
      <button onClick={onClose} className="absolute top-5 right-5 text-fundo">
        <X size={24} />
      </button>

      {suportado ? (
        <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden border-2 border-ambar">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
      ) : (
        <div className="w-full max-w-sm bg-fundo rounded-xl p-5">
          <div className="flex items-center gap-2 text-terracota mb-3">
            <Camera size={18} />
            <span className="text-sm font-semibold">Leitura por câmera indisponível neste navegador</span>
          </div>
          {erro && <p className="text-xs text-red-700 mb-3">{erro}</p>}
          <label className="block text-xs font-semibold text-terracota mb-1.5">Digite o código do QR do cliente</label>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="w-full border border-bege rounded-lg px-3 py-2.5 text-sm mb-3 outline-none focus:border-ambar"
          />
          <button
            onClick={() => manual.trim() && onLido(manual.trim())}
            className="w-full bg-ambar text-madeira font-bold py-2.5 rounded-lg"
          >
            Buscar cliente
          </button>
        </div>
      )}

      <p className="text-fundo/70 text-xs mt-4 text-center max-w-xs">
        Aponte a câmera para o QR Code exibido no app do cliente.
      </p>
    </div>
  );
}
