import type { MetadataRoute } from "next";

// Manifest do PWA — permite "instalar" o clube na tela inicial do celular
// com o ícone da SF em vez do ícone genérico do navegador.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SF PRO — Clube de Benefícios",
    short_name: "SF PRO",
    description: "O clube de benefícios de quem vive da marcenaria.",
    start_url: "/cliente",
    display: "standalone",
    background_color: "#F7F4ED",
    theme_color: "#1C1410",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
