"use client";

import { useEffect, useState, type CSSProperties } from "react";

type Trade = {
  _id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  executedPrice: number;
  totalValue: number;
  commissionFee: number;
  stt: number;
  createdAt: string;
};

type TradeData = {
  trades: Trade[];
  page: number;
  totalPages: number;
};

export default function HistoryPage() {
  const [data, setData] = useState<TradeData | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/portfolio/trades?page=1&limit=50", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok) {
        setData(payload.data);
      }
    }
    load();
  }, []);

  if (!data) return <p>Loading history...</p>;

  return (
    <section style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Trade history</h2>
        <a href="/api/portfolio/statement" style={styles.download}>
          Download statement CSV
        </a>
      </div>
      <div style={styles.wrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Fees</th>
            </tr>
          </thead>
          <tbody>
            {data.trades.map((trade) => (
              <tr key={trade._id}>
                <td>{new Date(trade.createdAt).toLocaleString()}</td>
                <td>{trade.symbol}</td>
                <td style={{ color: trade.side === "buy" ? "#72e2a5" : "#f9a1a1" }}>{trade.side}</td>
                <td>{trade.quantity}</td>
                <td>INR {trade.executedPrice.toLocaleString("en-IN")}</td>
                <td>INR {trade.totalValue.toLocaleString("en-IN")}</td>
                <td>INR {(trade.commissionFee + trade.stt).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {!data.trades.length ? (
              <tr>
                <td colSpan={7}>No trades yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  download: {
    color: "#fff",
    textDecoration: "none",
    background: "#30528a",
    border: "1px solid #4d6da4",
    borderRadius: "8px",
    padding: "8px 10px",
    fontSize: "14px",
  },
  wrap: { overflowX: "auto", background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px" },
  table: { width: "100%", borderCollapse: "collapse" },
};

