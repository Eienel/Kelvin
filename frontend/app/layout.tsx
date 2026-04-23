import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "Kelvin — DLMM on Initia",
  description:
    "Bin-based concentrated liquidity deployed as its own Initia appchain. Popup-free LPing at 100ms block times.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-fg font-mono">
        <Providers>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 pt-20 pb-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
