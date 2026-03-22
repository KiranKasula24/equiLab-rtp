"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Analytics = {
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  avgHoldingDays: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/portfolio/analytics", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setData(payload.data);
      }
    }
    load();
  }, []);

  if (!data) return <p>Loading analytics...</p>;

  return (
    <section style={styles.grid}>
      <Metric title="Total trades" value={String(data.totalTrades)} />
      <Metric title="Win rate" value={`${data.winRate}%`} />
      <Metric title="Sharpe ratio" value={String(data.sharpeRatio)} />
      <Metric title="Avg holding days" value={String(data.avgHoldingDays)} />
      <Metric
        title="Best trade"
        value={data.bestTrade ? `${data.bestTrade.symbol} (${formatSigned(data.bestTrade.pnl)})` : "N/A"}
      />
      <Metric
        title="Worst trade"
        value={data.worstTrade ? `${data.worstTrade.symbol} (${formatSigned(data.worstTrade.pnl)})` : "N/A"}
      />
    </section>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.card}>
      <p style={styles.label}>{title}</p>
      <p style={styles.value}>{value}</p>
    </div>
  );
}

function formatSigned(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}INR ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

const styles: Record<string, CSSProperties> = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "12px" },
  card: { background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px", padding: "16px" },
  label: { margin: 0, color: "#abc0e6" },
  value: { margin: "8px 0 0", fontWeight: 700, fontSize: "20px" },
};

