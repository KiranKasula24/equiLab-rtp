"use client";

import { FormEvent, useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  ColorType,
} from "lightweight-charts";

type Quote = {
  symbol: string;
  ltp: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};
type SearchItem = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
};
type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const DEFAULT: SearchItem = {
  symbol: "RELIANCE",
  name: "Reliance Industries Ltd",
  exchange: "NSE",
  sector: "Energy",
};

export default function TradePage() {
  const [query, setQuery] = useState("RELIANCE");
  const [selected, setSelected] = useState<SearchItem>(DEFAULT);
  const [results, setResults] = useState<SearchItem[]>([]);
  const [showDrop, setShowDrop] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [placing, setPlacing] = useState(false);

  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── init chart once ── */
  useEffect(() => {
    if (!containerRef.current) return;

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
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: "rgba(139,92,246,0.2)" },
      timeScale: { borderColor: "rgba(139,92,246,0.2)", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 360,
      handleScroll: true,
      handleScale: true,
    });

    /* lightweight-charts v5 API */
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#f43f5e",
      borderUpColor: "#10b981",
      borderDownColor: "#f43f5e",
      wickUpColor: "#10b981",
      wickDownColor: "#f43f5e",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.resize(containerRef.current.clientWidth, 360);
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  /* ── load candles on symbol change ── */
  useEffect(() => {
    async function load() {
      const r = await fetch(
        `/api/market/candles/${selected.symbol}?exchange=${selected.exchange}`,
      );
      const p = await r.json();
      if (!p.success || !seriesRef.current) return;
      const data = (p.data as Candle[]).map((c) => ({
        time: Math.floor(
          new Date(c.timestamp).getTime() / 1000,
        ) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
    load();
  }, [selected]);

  /* ── search debounce ── */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const r = await fetch(
        `/api/market/search?q=${encodeURIComponent(query)}`,
      );
      const p = await r.json();
      if (p.success) {
        setResults(p.data ?? []);
        setShowDrop(true);
      }
    }, 260);
    return () => clearTimeout(t);
  }, [query]);

  /* ── quote polling (30s) ── */
  useEffect(() => {
    async function load() {
      const r = await fetch(
        `/api/market/quote/${selected.symbol}?exchange=${selected.exchange}`,
      );
      const p = await r.json();
      if (p.success) setQuote(p.data);
    }
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [selected]);

  const estimated = useMemo(
    () => (quote ? +(quote.ltp * qty).toFixed(2) : 0),
    [quote, qty],
  );

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    setPlacing(true);
    setMsg(null);
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: selected.symbol,
        exchange: selected.exchange,
        side,
        quantity: qty,
      }),
    });
    const p = await r.json();
    setMsg({
      ok: p.success,
      text: p.success
        ? `${side === "buy" ? "Bought" : "Sold"} ${qty} × ${selected.symbol} @ ₹${quote?.ltp.toLocaleString("en-IN")}`
        : (p.error ?? "Order failed"),
    });
    setPlacing(false);
  }

  function pick(item: SearchItem) {
    setSelected(item);
    setQuery(item.symbol);
    setShowDrop(false);
    setMsg(null);
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <h1 className="section-title">Trade</h1>

      {/* ── top row ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 14,
          alignItems: "start",
        }}
      >
        {/* Symbol search */}
        <div className="card" style={{ position: "relative", padding: 16 }}>
          <p className="label">Search symbol</p>
          <input
            className="input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDrop(true);
            }}
            onFocus={() => results.length > 0 && setShowDrop(true)}
            placeholder="e.g. TCS, INFY, RELIANCE…"
            autoComplete="off"
          />

          {/* Dropdown */}
          {showDrop && results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% - 2px)",
                left: 16,
                right: 16,
                zIndex: 200,
                background: "rgba(13,13,26,0.97)",
                backdropFilter: "blur(20px)",
                border: "1px solid var(--border-glow)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
              }}
            >
              {results.slice(0, 8).map((item) => (
                <button
                  key={`${item.exchange}-${item.symbol}`}
                  type="button"
                  onClick={() => pick(item)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "11px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    transition: "background .1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(139,92,246,0.12)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {item.symbol}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {item.sector}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Selected info */}
          <div
            style={{
              marginTop: 14,
              padding: "12px 0 0",
              borderTop: "1px solid var(--border-dim)",
            }}
          >
            <p style={{ fontWeight: 600, fontSize: 15 }}>{selected.name}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--accent-bright)",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--border-glow)",
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontWeight: 600,
                }}
              >
                {selected.exchange}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {selected.sector}
              </span>
            </div>
          </div>
        </div>

        {/* Quote strip */}
        <div style={{ display: "grid", gap: 14 }}>
          {/* Quote strip */}
          <div
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr 1fr",
              gap: 0,
              padding: 0,
              overflow: "hidden",
            }}
          >
            {[
              {
                label: "LTP",
                node: quote ? (
                  <>
                    <p
                      className="num"
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      ₹{quote.ltp.toLocaleString("en-IN")}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        marginTop: 3,
                        color:
                          quote.change >= 0
                            ? "var(--gain-text)"
                            : "var(--loss-text)",
                      }}
                    >
                      {quote.change >= 0 ? "▲" : "▼"} {Math.abs(quote.change)} (
                      {Math.abs(quote.changePct)}%)
                    </p>
                  </>
                ) : (
                  <div
                    className="skeleton"
                    style={{ height: 36, width: 140 }}
                  />
                ),
              },
              {
                label: "High",
                node: quote ? (
                  <p
                    className="num"
                    style={{ fontSize: 18, color: "var(--gain-text)" }}
                  >
                    ₹{quote.high.toLocaleString("en-IN")}
                  </p>
                ) : (
                  <div className="skeleton" style={{ height: 24, width: 80 }} />
                ),
              },
              {
                label: "Low",
                node: quote ? (
                  <p
                    className="num"
                    style={{ fontSize: 18, color: "var(--loss-text)" }}
                  >
                    ₹{quote.low.toLocaleString("en-IN")}
                  </p>
                ) : (
                  <div className="skeleton" style={{ height: 24, width: 80 }} />
                ),
              },
              {
                label: "Volume",
                node: quote ? (
                  <p className="num" style={{ fontSize: 18 }}>
                    {(quote.volume / 1_000_000).toFixed(2)}M
                  </p>
                ) : (
                  <div className="skeleton" style={{ height: 24, width: 60 }} />
                ),
              },
            ].map(({ label, node }, i) => (
              <div
                key={label}
                style={{
                  padding: "18px 20px",
                  borderRight: i < 3 ? "1px solid var(--border-dim)" : "none",
                }}
              >
                <p className="label" style={{ marginBottom: 8 }}>
                  {label}
                </p>
                {node}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Candlestick chart ── */}
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
          <p style={{ fontWeight: 600 }}>
            {selected.symbol}{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              · Daily chart
            </span>
          </p>
          <p
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono)",
            }}
          >
            180 days · {selected.exchange}
          </p>
        </div>
        <div
          ref={containerRef}
          style={{ width: "100%", background: "transparent" }}
        />
      </div>

      {/* ── Order form (below chart) ── */}
      <form
        className="card"
        onSubmit={placeOrder}
        style={{ display: "grid", gap: 14, padding: "18px 20px" }}
      >
        <p
          style={{
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: "-0.01em",
          }}
        >
          Place market order
        </p>

        {/* Buy / Sell toggle */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={side === "buy" ? "btn btn-buy" : "btn btn-ghost"}
            style={{ flex: 1 }}
            onClick={() => setSide("buy")}
          >
            Buy
          </button>
          <button
            type="button"
            className={side === "sell" ? "btn btn-sell" : "btn btn-ghost"}
            style={{ flex: 1 }}
            onClick={() => setSide("sell")}
          >
            Sell
          </button>
        </div>

        {/* Qty + estimated */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div>
            <label className="label">Quantity</label>
            <input
              className="input"
              type="number"
              min={1}
              max={100000}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            />
          </div>
          <div>
            <label className="label">Estimated</label>
            <div
              style={{
                height: 40,
                display: "flex",
                alignItems: "center",
                paddingLeft: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-dim)",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-mono)",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              ₹{estimated.toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={placing || !quote}
          className={side === "buy" ? "btn btn-buy" : "btn btn-sell"}
          style={{ height: 44, fontSize: 14 }}
        >
          {placing
            ? "Placing order…"
            : `${side === "buy" ? "Buy" : "Sell"} ${selected.symbol}`}
        </button>

        {msg && (
          <div
            style={{
              padding: "11px 14px",
              borderRadius: "var(--r-md)",
              fontSize: 13,
              fontWeight: 500,
              background: msg.ok ? "var(--gain-dim)" : "var(--loss-dim)",
              border: `1px solid ${msg.ok ? "rgba(16,185,129,0.4)" : "rgba(244,63,94,0.4)"}`,
              color: msg.ok ? "var(--gain-text)" : "var(--loss-text)",
            }}
          >
            {msg.text}
          </div>
        )}
      </form>
    </div>
  );
}
