"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Position = {
  symbol: string;
  exchange: "NSE" | "BSE";
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
};

type Summary = {
  cashBalance: number;
  totalValue: number;
  holdingsValue: number;
  realisedPnl: number;
  unrealisedPnl: number;
  positions: Position[];
};

export default function PortfolioPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Failed to load");
        return;
      }
      setData(payload.data);
    }

    load();
  }, []);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading portfolio...</p>;

  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <div style={styles.summaryGrid}>
        <Metric title="Cash" value={formatInr(data.cashBalance)} />
        <Metric title="Holdings" value={formatInr(data.holdingsValue)} />
        <Metric title="Total" value={formatInr(data.totalValue)} />
        <Metric title="Realised P&L" value={formatSigned(data.realisedPnl)} />
        <Metric title="Unrealised P&L" value={formatSigned(data.unrealisedPnl)} />
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Qty</th>
              <th>Avg cost</th>
              <th>LTP</th>
              <th>Current value</th>
              <th>Unrealised P&L</th>
            </tr>
          </thead>
          <tbody>
            {data.positions.map((position) => (
              <tr key={position.symbol}>
                <td>{position.symbol}</td>
                <td>{position.quantity}</td>
                <td>{formatInr(position.avgCostPrice)}</td>
                <td>{formatInr(position.currentPrice)}</td>
                <td>{formatInr(position.currentValue)}</td>
                <td style={{ color: position.unrealisedPnl >= 0 ? "#72e2a5" : "#f9a1a1" }}>
                  {formatSigned(position.unrealisedPnl)} ({position.unrealisedPnlPct}%)
                </td>
              </tr>
            ))}
            {!data.positions.length ? (
              <tr>
                <td colSpan={6}>No open positions yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.card}>
      <p style={{ margin: 0, color: "#abc0e6" }}>{title}</p>
      <p style={{ margin: "8px 0 0", fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function formatInr(value: number) {
  return `INR ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatSigned(value: number) {
  return `${value >= 0 ? "+" : ""}${formatInr(value)}`;
}

const styles: Record<string, CSSProperties> = {
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "10px" },
  card: { background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px", padding: "14px" },
  tableWrap: { overflowX: "auto", background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px" },
  table: { width: "100%", borderCollapse: "collapse" },
};

