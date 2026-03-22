"use client";

import { useEffect, useState, type CSSProperties } from "react";

type PortfolioSummary = {
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  unrealisedPnl: number;
  dayPnl: number;
};

export default function DashboardPage() {
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/portfolio", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Failed to load portfolio");
        return;
      }
      setData(payload.data);
    }
    load();
  }, []);

  if (error) return <p>{error}</p>;
  if (!data) return <p>Loading dashboard...</p>;

  return (
    <section style={styles.grid}>
      <Card title="Total value" value={formatInr(data.totalValue)} />
      <Card title="Cash balance" value={formatInr(data.cashBalance)} />
      <Card title="Holdings value" value={formatInr(data.holdingsValue)} />
      <Card title="Unrealised P&L" value={formatSignedInr(data.unrealisedPnl)} />
      <Card title="Day P&L" value={formatSignedInr(data.dayPnl)} />
      <div style={styles.wideCard}>
        <h3 style={styles.h3}>Quick actions</h3>
        <p style={styles.muted}>Use Trade tab to place market orders.</p>
        <p style={styles.muted}>Use Portfolio and Analytics for performance tracking.</p>
      </div>
    </section>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.card}>
      <p style={styles.muted}>{title}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

function formatInr(value: number) {
  return `INR ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function formatSignedInr(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatInr(value)}`;
}

const styles: Record<string, CSSProperties> = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" },
  card: { background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px", padding: "16px" },
  wideCard: {
    gridColumn: "1 / -1",
    background: "#142036",
    border: "1px solid #2c3f63",
    borderRadius: "12px",
    padding: "16px",
  },
  value: { margin: "8px 0 0", fontSize: "20px", fontWeight: 700 },
  h3: { margin: 0 },
  muted: { margin: "6px 0", color: "#a8bde4" },
};

