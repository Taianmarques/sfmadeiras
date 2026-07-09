"use client";

import { Check, X } from "lucide-react";

export interface ToastState {
  tipo: "sucesso" | "erro";
  msg: string;
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-fundo shadow-xl ${
        toast.tipo === "erro" ? "bg-terracota" : "bg-madeira"
      }`}
    >
      {toast.tipo === "erro" ? <X size={14} /> : <Check size={14} className="text-ambar" />}
      {toast.msg}
    </div>
  );
}
