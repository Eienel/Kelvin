"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "./WalletButton";
import { SessionPill } from "./SessionPill";

const tabs = [
  { href: "/", label: "Pools" },
  { href: "/swap", label: "Swap" },
  { href: "/positions", label: "Positions" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Nav() {
  const path = usePathname();
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-accent text-lg font-bold tracking-tight">KELVIN</span>
          <span className="hidden sm:inline text-xs text-muted">
            DLMM · Initia appchain
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {tabs.map((t) => {
            const active =
              t.href === "/" ? path === "/" : path?.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`px-3 py-1.5 rounded text-sm ${
                  active ? "bg-panel text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <SessionPill />
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
