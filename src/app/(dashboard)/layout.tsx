"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import BrandLogo from "@/components/BrandLogo";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/trade", label: "Trade" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/analytics", label: "Analytics" },
  { href: "/history", label: "History" },
];

type MarketStatus = { isOpen: boolean; istTime: string };

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [out, setOut] = useState(false);
  const [mkt, setMkt] = useState<MarketStatus | null>(null);

  useEffect(() => {
    fetch("/api/market/status")
      .then((r) => r.json())
      .then((p) => p.success && setMkt(p.data));

    const id = setInterval(
      () => fetch("/api/auth/refresh", { method: "POST" }),
      12 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  async function logout() {
    setOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 24px",
          minHeight: 68,
          gap: 16,
          flexWrap: "wrap",
          background:
            "linear-gradient(180deg, rgba(9,14,34,0.9) 0%, rgba(9,14,34,0.7) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(124,244,255,0.18)",
          boxShadow:
            "0 8px 24px rgba(5,12,28,0.45), inset 0 1px 0 rgba(131,247,255,0.08)",
        }}
      >
        <Link
          href="/dashboard"
          style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
        >
          <BrandLogo size={34} showWordmark showTag wordmarkSize={20} />
        </Link>

        <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link${pathname === href ? " active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {mkt && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                padding: "7px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(126,243,255,0.16)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: mkt.isOpen ? "var(--gain)" : "var(--loss)",
                  boxShadow: mkt.isOpen
                    ? "0 0 10px var(--gain)"
                    : "0 0 10px var(--loss)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: mkt.isOpen ? "var(--gain-text)" : "var(--loss-text)",
                  fontWeight: 600,
                }}
              >
                {mkt.isOpen ? "Open" : "Closed"}
              </span>
              <span style={{ color: "var(--text-muted)" }}>{mkt.istTime} IST</span>
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ height: 34, fontSize: 13, padding: "0 14px" }}
            onClick={logout}
            disabled={out}
          >
            {out ? "..." : "Logout"}
          </button>
        </div>
      </header>

      <main style={{ padding: "28px 24px", maxWidth: 1320, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
