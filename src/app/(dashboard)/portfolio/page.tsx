"use client";

import { useEffect, useState } from "react";

type Position = {
  symbol: string;
  exchange: string;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  dayChange: number;
  dayChangePct: number;
};
type Summary = {
  cashBalance: number;
  totalValue: number;
  holdingsValue: number;
  realisedPnl: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  dayPnl: number;
  positions: Position[];
};

export default function PortfolioPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portfolio", { cache: "no-store" })
      .then((r) => r.json())
      .then((p) => (p.success ? setData(p.data) : setError(p.error)))
      .catch(() => setError("Network error"));
  }, []);

  if (error)
    return <p style={{ color: "var(--loss-text)", padding: 24 }}>{error}</p>;

  const stats = [
    {
      label: "Total value",
      val: data ? inr(data.totalValue) : null,
      col: null,
    },
    {
      label: "Cash balance",
      val: data ? inr(data.cashBalance) : null,
      col: null,
    },
    {
      label: "Holdings",
      val: data ? inr(data.holdingsValue) : null,
      col: null,
    },
    {
      label: "Unrealised P&L",
      val: data ? signedInr(data.unrealisedPnl) : null,
      col: data?.unrealisedPnl ?? null,
      sub: data
        ? `${data.unrealisedPnlPct >= 0 ? "+" : ""}${data.unrealisedPnlPct}%`
        : null,
    },
    {
      label: "Realised P&L",
      val: data ? signedInr(data.realisedPnl) : null,
      col: data?.realisedPnl ?? null,
    },
    {
      label: "Day P&L",
      val: data ? signedInr(data.dayPnl) : null,
      col: data?.dayPnl ?? null,
    },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h1 className="section-title">Portfolio</h1>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        {stats.map(({ label, val, col, sub }) => (
          <div key={label} className="card" style={{ padding: "16px 18px" }}>
            <p className="metric-label">{label}</p>
            {val == null ? (
              <div
                className="skeleton"
                style={{ height: 22, width: "60%", marginTop: 8 }}
              />
            ) : (
              <>
                <p
                  className="num"
                  style={{
                    fontSize: 17,
                    marginTop: 7,
                    fontWeight: 600,
                    color:
                      col == null
                        ? "var(--text-primary)"
                        : col >= 0
                          ? "var(--gain-text)"
                          : "var(--loss-text)",
                  }}
                >
                  {val}
                </p>
                {sub && (
                  <p
                    style={{
                      fontSize: 11,
                      marginTop: 3,
                      color:
                        col != null && col >= 0
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

      {/* Positions table */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            Open positions {data ? `(${data.positions.length})` : ""}
          </p>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Qty</th>
                <th>Avg cost</th>
                <th>LTP</th>
                <th>Current value</th>
                <th>Unrealised P&L</th>
                <th>Day change</th>
              </tr>
            </thead>
            <tbody>
              {data == null ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j}>
                        <div
                          className="skeleton"
                          style={{ height: 14, width: j === 0 ? 72 : 52 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.positions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      color: "var(--text-muted)",
                      padding: 48,
                      fontWeight: 500,
                    }}
                  >
                    No open positions — head to Trade to get started.
                  </td>
                </tr>
              ) : (
                data.positions.map((pos) => (
                  <tr key={pos.symbol}>
                    <td>
                      <p
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {pos.symbol}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {pos.exchange}
                      </p>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {pos.quantity}
                    </td>
                    <td
                      className="num"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {inr(pos.avgCostPrice)}
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {inr(pos.currentPrice)}
                    </td>
                    <td className="num">{inr(pos.currentValue)}</td>
                    <td>
                      <p
                        className={`num ${pos.unrealisedPnl >= 0 ? "gain" : "loss"}`}
                        style={{ fontWeight: 600 }}
                      >
                        {signedInr(pos.unrealisedPnl)}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          marginTop: 2,
                          color:
                            pos.unrealisedPnlPct >= 0
                              ? "var(--gain-text)"
                              : "var(--loss-text)",
                        }}
                      >
                        {pos.unrealisedPnlPct >= 0 ? "+" : ""}
                        {pos.unrealisedPnlPct}%
                      </p>
                    </td>
                    <td
                      className={`num ${pos.dayChange >= 0 ? "gain" : "loss"}`}
                    >
                      {pos.dayChange >= 0 ? "+" : ""}₹
                      {Math.abs(pos.dayChange).toLocaleString("en-IN")}
                      <span
                        style={{ fontSize: 11, marginLeft: 5, opacity: 0.8 }}
                      >
                        ({pos.dayChangePct >= 0 ? "+" : ""}
                        {pos.dayChangePct}%)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function inr(v: number) {
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function signedInr(v: number) {
  return `${v >= 0 ? "+" : ""}${inr(v)}`;
}
