import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const oswald = Oswald({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-oswald" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SF Madeiras — Clube de Pontos",
  description: "Clube de fidelidade da SF Madeiras",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${oswald.variable} ${inter.variable}`}>
      <body className="font-inter bg-fundo text-madeira antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
