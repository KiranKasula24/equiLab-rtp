"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  realisedPnl: number;
  dayPnl: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio", { cache: "no-store" })
      .then((r) => r.json())
      .then((p) =>
        p.success ? setData(p.data) : setError(p.error ?? "Failed"),
      )
      .catch(() => setError("Network error"));
  }, []);

  if (error)
    return (
      <div
        style={{
          padding: "40px 0",
          textAlign: "center",
          color: "var(--loss-text)",
        }}
      >
        {error}
      </div>
    );

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1 className="section-title">Overview</h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              marginTop: 4,
            }}
          >
            Virtual portfolio · ₹10,00,000 starting capital
          </p>
        </div>
        <Link
          href="/trade"
          className="btn btn-primary"
          style={{ textDecoration: "none" }}
        >
          Place order →
        </Link>
      </div>

      {/* Hero card — total value */}
      <div
        style={{
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(99,51,220,0.08) 100%)",
          border: "1px solid var(--border-glow)",
          borderRadius: "var(--r-xl)",
          padding: "28px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
          boxShadow:
            "0 0 60px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.06)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div>
          <p className="metric-label" style={{ color: "var(--accent-bright)" }}>
            Total portfolio value
          </p>
          {data ? (
            <p
              className="num"
              style={{
                fontSize: 42,
                fontWeight: 700,
                marginTop: 6,
                color: "var(--text-primary)",
                letterSpacing: "-0.05em",
              }}
            >
              {inr(data.totalValue)}
            </p>
          ) : (
            <div
              className="skeleton"
              style={{ height: 48, width: 260, marginTop: 6 }}
            />
          )}
          {data && (
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color:
                  data.unrealisedPnl >= 0
                    ? "var(--gain-text)"
                    : "var(--loss-text)",
              }}
            >
              {data.unrealisedPnl >= 0 ? "▲" : "▼"}{" "}
              {signedInr(data.unrealisedPnl)} unrealised
              <span style={{ color: "var(--text-muted)", marginLeft: 10 }}>
                |
              </span>
              <span style={{ marginLeft: 10 }}>
                {signedInr(data.dayPnl)} today
              </span>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <Stat label="Cash" value={data ? inr(data.cashBalance) : null} />
          <Stat
            label="Holdings"
            value={data ? inr(data.holdingsValue) : null}
          />
        </div>
      </div>

      {/* Metric grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {[
          {
            label: "Unrealised P&L",
            value: data ? signedInr(data.unrealisedPnl) : null,
            sub: data
              ? `${data.unrealisedPnlPct >= 0 ? "+" : ""}${data.unrealisedPnlPct}%`
              : null,
            coloured: data?.unrealisedPnl ?? null,
          },
          {
            label: "Realised P&L",
            value: data ? signedInr(data.realisedPnl) : null,
            coloured: data?.realisedPnl ?? null,
          },
          {
            label: "Day P&L",
            value: data ? signedInr(data.dayPnl) : null,
            coloured: data?.dayPnl ?? null,
          },
        ].map(({ label, value, sub, coloured }) => (
          <div key={label} className="card" style={{ padding: "18px 20px" }}>
            <p className="metric-label">{label}</p>
            {value == null ? (
              <div
                className="skeleton"
                style={{ height: 26, width: "65%", marginTop: 8 }}
              />
            ) : (
              <>
                <p
                  className="num metric-value"
                  style={{
                    fontSize: 20,
                    color:
                      coloured == null
                        ? "var(--text-primary)"
                        : coloured >= 0
                          ? "var(--gain-text)"
                          : "var(--loss-text)",
                  }}
                >
                  {value}
                </p>
                {sub && (
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      color:
                        coloured != null && coloured >= 0
                          ? "var(--gain-text)"
                          : "var(--loss-text)",
                    }}
                  >
                    {sub}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            marginBottom: 12,
          }}
        >
          Quick actions
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {[
            {
              href: "/trade",
              icon: "◈",
              label: "Trade",
              desc: "Buy or sell stocks",
            },
            {
              href: "/portfolio",
              icon: "◉",
              label: "Portfolio",
              desc: "Positions & P&L",
            },
            {
              href: "/analytics",
              icon: "◎",
              label: "Analytics",
              desc: "Win rate & Sharpe",
            },
            {
              href: "/history",
              icon: "◌",
              label: "History",
              desc: "All trades & CSV",
            },
          ].map(({ href, icon, label, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div
                className="card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  transition: "all .2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border-glow)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 0 20px rgba(139,92,246,0.15)";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border-dim)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                }}
              >
                <span style={{ fontSize: 22, color: "var(--accent-bright)" }}>
                  {icon}
                </span>
                <div>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary)",
                      marginTop: 1,
                    }}
                  >
                    {desc}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          color: "rgba(167,139,250,0.7)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: ".08em",
        }}
      >
        {label}
      </p>
      {value == null ? (
        <div
          className="skeleton"
          style={{ height: 22, width: 100, marginTop: 6 }}
        />
      ) : (
        <p
          className="num"
          style={{ fontSize: 18, marginTop: 4, fontWeight: 600 }}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function inr(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function signedInr(v: number) {
  return `${v >= 0 ? "+" : ""}${inr(v)}`;
}
