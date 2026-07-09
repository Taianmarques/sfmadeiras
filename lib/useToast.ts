"use client";

import { useCallback, useRef, useState } from "react";
import type { ToastState } from "@/components/Toast";

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const mostrarToast = useCallback((tipo: ToastState["tipo"], msg: string) => {
    setToast({ tipo, msg });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  return { toast, mostrarToast };
}
