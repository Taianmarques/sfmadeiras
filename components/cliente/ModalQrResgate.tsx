"use client";

import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";
import { formatPontos } from "@/lib/formatadores";

interface ResgatePendente {
  id: string;
  pontosGastos: number;
  recompensa: { nome: string; icone: string; imagemUrl: string | null };
}

export function ModalQrResgate({ resgate, onClose }: { resgate: ResgatePendente; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-[340px] w-full text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>

        {resgate.recompensa.imagemUrl ? (
          <img
            src={resgate.recompensa.imagemUrl}
            alt={resgate.recompensa.nome}
            className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
          />
        ) : (
          <div className="text-[40px] mb-1">{resgate.recompensa.icone}</div>
        )}

        <h2 className="font-oswald font-bold text-base mb-1">{resgate.recompensa.nome}</h2>
        <p className="text-[11px] text-terracota mb-4">{formatPontos(resgate.pontosGastos)} pontos</p>

        <div className="flex justify-center bg-fundo rounded-xl p-4 mb-3">
          <QRCodeSVG value={resgate.id} size={200} fgColor="#1C1410" bgColor="#F7F4ED" />
        </div>

        <p className="text-xs text-terracota leading-relaxed">
          Mostre este QR Code no caixa da loja pra retirar seu brinde. A loja escaneia e confirma a entrega na hora.
        </p>
      </div>
    </div>
  );
}
