"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

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

    // Silent token refresh every 12 min to avoid mid-session expiry
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
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 58,
          gap: 16,
          flexWrap: "wrap",
          background: "rgba(13,13,26,0.75)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(139,92,246,0.18)",
          boxShadow: "0 1px 0 0 rgba(139,92,246,0.08)",
        }}
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
              boxShadow: "0 0 16px rgba(139,92,246,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
              }}
            >
              E
            </span>
          </div>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: 17,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
            }}
          >
            EquiLab
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--accent-bright)",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-glow)",
              borderRadius: 6,
              padding: "2px 7px",
              letterSpacing: ".06em",
            }}
          >
            BETA
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 4 }}>
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

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {mkt && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: mkt.isOpen ? "var(--gain)" : "var(--loss)",
                  boxShadow: mkt.isOpen
                    ? "0 0 8px var(--gain)"
                    : "0 0 8px var(--loss)",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  color: mkt.isOpen ? "var(--gain-text)" : "var(--loss-text)",
                  fontWeight: 500,
                }}
              >
                {mkt.isOpen ? "Open" : "Closed"}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                {mkt.istTime} IST
              </span>
            </div>
          )}
          <button
            className="btn btn-ghost"
            style={{ height: 32, fontSize: 13, padding: "0 14px" }}
            onClick={logout}
            disabled={out}
          >
            {out ? "…" : "Logout"}
          </button>
        </div>
      </header>

      <main style={{ padding: "28px 24px", maxWidth: 1320, margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
