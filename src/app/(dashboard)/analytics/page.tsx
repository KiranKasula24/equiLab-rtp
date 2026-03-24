"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  type IChartApi,
  type UTCTimestamp,
  ColorType,
  LineStyle,
} from "lightweight-charts";

type Analytics = {
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  avgHoldingDays: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
};
type Snapshot = { date: string; totalValue: number; realisedPnl: number };
type Position = { symbol: string; currentValue: number };

const SECTOR_MAP: Record<string, string> = {
  RELIANCE: "Energy",
  TCS: "IT",
  INFY: "IT",
  HDFCBANK: "Banking",
  ICICIBANK: "Banking",
  WIPRO: "IT",
  SBIN: "Banking",
  BAJFINANCE: "Finance",
  TATAMOTORS: "Auto",
  ADANIENT: "Conglomerate",
  KOTAKBANK: "Banking",
  LT: "Infrastructure",
  MARUTI: "Auto",
  SUNPHARMA: "Pharma",
  HINDUNILVR: "FMCG",
  ASIANPAINT: "Consumer",
  AXISBANK: "Banking",
  TITAN: "Consumer",
  ULTRACEMCO: "Cement",
  ONGC: "Energy",
};
const SECTOR_COLORS: Record<string, string> = {
  IT: "#8b5cf6",
  Banking: "#06b6d4",
  Energy: "#f59e0b",
  Auto: "#10b981",
  Finance: "#a78bfa",
  Conglomerate: "#f43f5e",
  Infrastructure: "#34d399",
  Pharma: "#fb923c",
  FMCG: "#e879f9",
  Consumer: "#60a5fa",
  Cement: "#94a3b8",
};

const STARTING = 1_000_000;

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const [sectors, setSectors] = useState<
    Array<{ sector: string; pct: number; color: string }>
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    fetch("/api/portfolio/analytics")
      .then((r) => r.json())
      .then((p) => p.success && setData(p.data));
    fetch("/api/portfolio/snapshots?days=180")
      .then((r) => r.json())
      .then((p) => p.success && setSnaps(p.data ?? []));
    fetch("/api/portfolio")
      .then((r) => r.json())
      .then((p) => {
        if (!p.success) return;
        const positions: Position[] = p.data.positions;
        const total = positions.reduce((s, x) => s + x.currentValue, 0);
        if (!total) return;
        const buckets: Record<string, number> = {};
        for (const pos of positions) {
          const s = SECTOR_MAP[pos.symbol] ?? "Other";
          buckets[s] = (buckets[s] ?? 0) + pos.currentValue;
        }
        setSectors(
          Object.entries(buckets)
            .map(([sector, value]) => ({
              sector,
              pct: Math.round((value / total) * 100),
              color: SECTOR_COLORS[sector] ?? "#6b7280",
            }))
            .sort((a, b) => b.pct - a.pct),
        );
      });
  }, []);

  /* ── portfolio chart ── */
  useEffect(() => {
    if (!containerRef.current || snaps.length === 0) return;
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8b85a8",
        fontFamily: "'Space Grotesk', sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.03)" },
      },
      rightPriceScale: { borderColor: "rgba(139,92,246,0.2)" },
      timeScale: { borderColor: "rgba(139,92,246,0.2)" },
      width: containerRef.current.clientWidth,
      height: 280,
    });

    /* v5 addSeries API */
    const area = chart.addSeries(AreaSeries, {
      lineColor: "#8b5cf6",
      topColor: "rgba(139,92,246,0.2)",
      bottomColor: "rgba(139,92,246,0)",
      lineWidth: 2,
      priceLineVisible: false,
    });
    const baseline = chart.addSeries(LineSeries, {
      color: "rgba(255,255,255,0.12)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
    });

    const formatted = snaps
      .map((s) => ({
        time: Math.floor(new Date(s.date).getTime() / 1000) as UTCTimestamp,
        value: s.totalValue,
      }))
      .sort((a, b) => a.time - b.time)
      .filter((point, idx, arr) => idx === 0 || point.time > arr[idx - 1].time);

    if (formatted.length > 0) {
      area.setData(formatted);
      if (formatted.length === 1) {
        // Single point baseline
        baseline.setData([{ time: formatted[0].time, value: STARTING }]);
      } else {
        baseline.setData([
          { time: formatted[0].time, value: STARTING },
          { time: formatted[formatted.length - 1].time, value: STARTING },
        ]);
      }
      chart.timeScale().fitContent();
    }
    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.resize(containerRef.current.clientWidth, 280);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [snaps]);

  const cards = data
    ? [
        { label: "Total trades", val: String(data.totalTrades), sub: null },
        {
          label: "Win rate",
          val: `${data.winRate}%`,
          sub: null,
          highlight: data.winRate >= 50,
        },
        { label: "Sharpe ratio", val: String(data.sharpeRatio), sub: null },
        { label: "Avg holding", val: `${data.avgHoldingDays}d`, sub: null },
        {
          label: "Best trade",
          val: data.bestTrade ? data.bestTrade.symbol : "—",
          sub: data.bestTrade
            ? `+₹${data.bestTrade.pnl.toLocaleString("en-IN")}`
            : null,
          gain: true,
        },
        {
          label: "Worst trade",
          val: data.worstTrade ? data.worstTrade.symbol : "—",
          sub: data.worstTrade
            ? `-₹${Math.abs(data.worstTrade.pnl).toLocaleString("en-IN")}`
            : null,
          gain: false,
        },
      ]
    : [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <h1 className="section-title">Analytics</h1>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 10,
        }}
      >
        {data == null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 18 }}>
                <div
                  className="skeleton"
                  style={{ height: 10, width: "50%", marginBottom: 12 }}
                />
                <div
                  className="skeleton"
                  style={{ height: 22, width: "70%" }}
                />
              </div>
            ))
          : cards.map((c) => (
              <div
                key={c.label}
                className="card"
                style={{ padding: "16px 18px" }}
              >
                <p className="metric-label">{c.label}</p>
                <p
                  className="num"
                  style={{
                    fontSize: 20,
                    marginTop: 7,
                    fontWeight: 700,
                    color:
                      "highlight" in c && c.highlight
                        ? "var(--gain-text)"
                        : "var(--text-primary)",
                  }}
                >
                  {c.val}
                </p>
                {c.sub && (
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 4,
                      fontFamily: "var(--font-mono)",
                      color:
                        "gain" in c && c.gain
                          ? "var(--gain-text)"
                          : "var(--loss-text)",
                    }}
                  >
                    {c.sub}
                  </p>
                )}
              </div>
            ))}
      </div>

      {/* Portfolio value chart */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid var(--border-dim)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontWeight: 600 }}>Portfolio value over time</p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            dashed = ₹10L baseline
          </p>
        </div>
        {snaps.length === 0 ? (
          <div
            style={{
              height: 280,
              display: "grid",
              placeItems: "center",
              color: "var(--text-muted)",
            }}
          >
            Place trades to see your portfolio history here.
          </div>
        ) : (
          <div ref={containerRef} style={{ width: "100%" }} />
        )}
      </div>

      {/* Sector exposure */}
      {sectors.length > 0 && (
        <div className="card" style={{ padding: "18px 20px" }}>
          <p style={{ fontWeight: 600, marginBottom: 18 }}>Sector exposure</p>
          <div style={{ display: "grid", gap: 12 }}>
            {sectors.map((s) => (
              <div key={s.sector}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: s.color,
                        display: "inline-block",
                      }}
                    />
                    {s.sector}
                  </span>
                  <span
                    className="num"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {s.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 5,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${s.pct}%`,
                      background: s.color,
                      borderRadius: 3,
                      boxShadow: `0 0 8px ${s.color}55`,
                      transition: "width .5s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
