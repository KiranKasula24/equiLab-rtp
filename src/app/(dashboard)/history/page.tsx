"use client";

import { useEffect, useState } from "react";

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
  total: number;
};

export default function HistoryPage() {
  const [data, setData] = useState<TradeData | null>(null);
  const [page, setPage] = useState(1);
  const [sym, setSym] = useState("");
  const [side, setSide] = useState<"" | "buy" | "sell">("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), limit: "20" });
    if (sym.trim()) p.set("symbol", sym.trim().toUpperCase());
    if (side) p.set("side", side);
    fetch(`/api/portfolio/trades?${p}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d.success && setData(d.data))
      .finally(() => setLoading(false));
  }, [page, sym, side]);

  function clearFilters() {
    setSym("");
    setSide("");
    setPage(1);
  }

  const pages = data
    ? Array.from({ length: data.totalPages }, (_, i) => i + 1).filter(
        (p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1,
      )
    : [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
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
          <h1 className="section-title">Trade history</h1>
          {data && (
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              {data.total} trades
            </p>
          )}
        </div>
        <a
          href="/api/portfolio/statement"
          className="btn btn-ghost"
          style={{ textDecoration: "none", fontSize: 13 }}
        >
          Download CSV ↓
        </a>
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          className="input"
          style={{ maxWidth: 190 }}
          placeholder="Filter by symbol…"
          value={sym}
          onChange={(e) => {
            setSym(e.target.value);
            setPage(1);
          }}
        />
        <select
          className="input"
          style={{ maxWidth: 140 }}
          value={side}
          onChange={(e) => {
            setSide(e.target.value as "" | "buy" | "sell");
            setPage(1);
          }}
        >
          <option value="">All sides</option>
          <option value="buy">Buy only</option>
          <option value="sell">Sell only</option>
        </select>
        {(sym || side) && (
          <button
            className="btn btn-ghost"
            style={{ fontSize: 13 }}
            onClick={clearFilters}
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Date &amp; time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th>Fees</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}>
                      <div
                        className="skeleton"
                        style={{ height: 13, width: j === 0 ? 120 : 56 }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : !data || data.trades.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: 52,
                    fontWeight: 500,
                  }}
                >
                  No trades found.
                </td>
              </tr>
            ) : (
              data.trades.map((t) => (
                <tr key={t._id}>
                  <td
                    style={{
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                    }}
                  >
                    {new Date(t.createdAt).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: "var(--accent-bright)",
                    }}
                  >
                    {t.symbol}
                  </td>
                  <td>
                    <span className={`badge badge-${t.side}`}>{t.side}</span>
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    {t.quantity}
                  </td>
                  <td className="num">
                    ₹
                    {t.executedPrice.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="num" style={{ fontWeight: 600 }}>
                    ₹
                    {t.totalValue.toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="num" style={{ color: "var(--text-muted)" }}>
                    ₹
                    {(t.commissionFee + t.stt).toLocaleString("en-IN", {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <button
            className="btn btn-ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            style={{ height: 34, padding: "0 14px", fontSize: 13 }}
          >
            ← Prev
          </button>

          {pages
            .reduce<(number | "…")[]>((acc, p, i, arr) => {
              if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === "…" ? (
                <span
                  key={`e${i}`}
                  style={{ color: "var(--text-muted)", padding: "0 4px" }}
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  className="btn"
                  onClick={() => setPage(p as number)}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    fontSize: 13,
                    background: p === page ? "var(--accent)" : "transparent",
                    color: p === page ? "#fff" : "var(--text-secondary)",
                    border: `1px solid ${p === page ? "var(--accent)" : "var(--border-base)"}`,
                    boxShadow:
                      p === page ? "0 0 12px rgba(139,92,246,0.4)" : "none",
                  }}
                >
                  {p}
                </button>
              ),
            )}

          <button
            className="btn btn-ghost"
            disabled={page >= (data?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            style={{ height: 34, padding: "0 14px", fontSize: 13 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
