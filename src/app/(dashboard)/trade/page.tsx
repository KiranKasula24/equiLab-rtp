"use client";

import { FormEvent, useEffect, useMemo, useState, type CSSProperties } from "react";

type Quote = {
  symbol: string;
  ltp: number;
  change: number;
  changePct: number;
};

type SearchItem = {
  symbol: string;
  name: string;
  exchange: string;
};

export default function TradePage() {
  const [query, setQuery] = useState("RELIANCE");
  const [selected, setSelected] = useState<SearchItem | null>({
    symbol: "RELIANCE",
    name: "Reliance Industries Ltd",
    exchange: "NSE",
  });
  const [results, setResults] = useState<SearchItem[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) return;
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
      const payload = await response.json();
      if (response.ok) setResults(payload.data ?? []);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!selected) return;

    const current = selected;

    async function loadQuote() {
      const response = await fetch(`/api/market/quote/${current.symbol}?exchange=${current.exchange}`);
      const payload = await response.json();
      if (response.ok) setQuote(payload.data);
    }

    loadQuote();
    const interval = setInterval(loadQuote, 60_000);

    return () => clearInterval(interval);
  }, [selected]);

  const estimatedTotal = useMemo(() => {
    if (!quote) return 0;
    return Number((quote.ltp * quantity).toFixed(2));
  }, [quote, quantity]);

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol: selected.symbol,
        exchange: selected.exchange,
        side,
        quantity,
      }),
    });

    const payload = await response.json();
    if (response.ok) {
      setMessage("Order placed successfully");
    } else {
      setMessage(payload.error ?? "Order failed");
    }
  }

  return (
    <section style={styles.grid}>
      <div style={styles.card}>
        <h2 style={styles.h2}>Symbol search</h2>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          style={styles.input}
          placeholder="Search symbol"
        />
        <div style={styles.list}>
          {results.slice(0, 8).map((item) => (
            <button
              type="button"
              key={`${item.exchange}-${item.symbol}`}
              style={styles.listBtn}
              onClick={() => setSelected(item)}
            >
              <span>{item.symbol}</span>
              <span style={styles.muted}>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.h2}>Quote</h2>
        {selected ? <p style={styles.muted}>{selected.symbol} ({selected.exchange})</p> : null}
        {quote ? (
          <>
            <p style={styles.price}>INR {quote.ltp.toLocaleString("en-IN")}</p>
            <p style={quote.change >= 0 ? styles.pos : styles.neg}>
              {quote.change >= 0 ? "+" : ""}
              {quote.change} ({quote.changePct}%)
            </p>
          </>
        ) : (
          <p style={styles.muted}>Loading quote...</p>
        )}
      </div>

      <form style={styles.card} onSubmit={submitOrder}>
        <h2 style={styles.h2}>Place market order</h2>
        <label style={styles.muted}>Side</label>
        <select
          value={side}
          onChange={(event) => setSide(event.target.value as "buy" | "sell")}
          style={styles.input}
        >
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
        </select>
        <label style={styles.muted}>Quantity</label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(event) => setQuantity(Number(event.target.value))}
          style={styles.input}
        />
        <p style={styles.muted}>Estimated notional: INR {estimatedTotal.toLocaleString("en-IN")}</p>
        <button type="submit" style={styles.submitBtn}>Submit order</button>
        {message ? <p style={styles.muted}>{message}</p> : null}
      </form>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" },
  card: { background: "#142036", border: "1px solid #2c3f63", borderRadius: "12px", padding: "16px" },
  h2: { marginTop: 0, marginBottom: "10px" },
  input: {
    width: "100%",
    height: "40px",
    borderRadius: "8px",
    border: "1px solid #3b4f78",
    background: "#0f1729",
    color: "#f3f7ff",
    padding: "0 10px",
    marginBottom: "10px",
  },
  list: { display: "grid", gap: "6px", maxHeight: "280px", overflow: "auto" },
  listBtn: {
    display: "flex",
    justifyContent: "space-between",
    textAlign: "left",
    width: "100%",
    border: "1px solid #2b3e5f",
    background: "#10203a",
    color: "#eaf1ff",
    borderRadius: "8px",
    padding: "8px 10px",
    cursor: "pointer",
  },
  price: { fontSize: "28px", margin: "8px 0" },
  pos: { color: "#72e2a5", margin: 0 },
  neg: { color: "#f9a1a1", margin: 0 },
  submitBtn: {
    border: "none",
    borderRadius: "8px",
    height: "40px",
    background: "#3b82f6",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
    width: "100%",
  },
  muted: { color: "#abc0e6", margin: "4px 0 8px" },
};
