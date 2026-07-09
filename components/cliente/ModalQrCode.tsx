"use client";

import { QRCodeSVG } from "qrcode.react";
import { X } from "lucide-react";

export function ModalQrCode({ token, nome, onClose }: { token: string; nome: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-madeira/70 flex items-center justify-center z-[100] p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-[340px] w-full text-center">
        <div className="flex justify-end">
          <button onClick={onClose} className="text-terracota">
            <X size={18} />
          </button>
        </div>
        <h2 className="font-oswald font-bold text-base mb-1">Meu QR Code</h2>
        <p className="text-xs text-terracota mb-4">Apresente no caixa para lançar seus pontos</p>
        <div className="flex justify-center bg-fundo rounded-xl p-4 mb-3">
          <QRCodeSVG value={token} size={200} fgColor="#1C1410" bgColor="#F7F4ED" />
        </div>
        <p className="text-sm font-semibold">{nome}</p>
      </div>
    </div>
  );
}
