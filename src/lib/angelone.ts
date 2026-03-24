const MOCK_MODE = process.env.ANGEL_ONE_MOCK_MODE !== "false";
const BASE_URL = "https://apiconnect.angelbroking.com";

export type QuoteResult = {
  symbol: string;
  ltp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePct: number;
  volume: number;
};

export type CandleResult = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
};

// ----- Mock data -----

export const SYMBOL_META: Record<
  string,
  { name: string; exchange: string; sector: string; base: number }
> = {
  RELIANCE: {
    name: "Reliance Industries Ltd",
    exchange: "NSE",
    sector: "Energy",
    base: 2945,
  },
  TCS: {
    name: "Tata Consultancy Services",
    exchange: "NSE",
    sector: "IT",
    base: 3821,
  },
  INFY: { name: "Infosys Ltd", exchange: "NSE", sector: "IT", base: 1456 },
  HDFCBANK: {
    name: "HDFC Bank Ltd",
    exchange: "NSE",
    sector: "Banking",
    base: 1623,
  },
  ICICIBANK: {
    name: "ICICI Bank Ltd",
    exchange: "NSE",
    sector: "Banking",
    base: 1089,
  },
  WIPRO: { name: "Wipro Ltd", exchange: "NSE", sector: "IT", base: 456 },
  SBIN: {
    name: "State Bank of India",
    exchange: "NSE",
    sector: "Banking",
    base: 812,
  },
  BAJFINANCE: {
    name: "Bajaj Finance Ltd",
    exchange: "NSE",
    sector: "Finance",
    base: 6892,
  },
  TATAMOTORS: {
    name: "Tata Motors Ltd",
    exchange: "NSE",
    sector: "Auto",
    base: 978,
  },
  ADANIENT: {
    name: "Adani Enterprises Ltd",
    exchange: "NSE",
    sector: "Conglomerate",
    base: 2341,
  },
  KOTAKBANK: {
    name: "Kotak Mahindra Bank Ltd",
    exchange: "NSE",
    sector: "Banking",
    base: 1780,
  },
  LT: {
    name: "Larsen & Toubro Ltd",
    exchange: "NSE",
    sector: "Infrastructure",
    base: 3510,
  },
  MARUTI: {
    name: "Maruti Suzuki India Ltd",
    exchange: "NSE",
    sector: "Auto",
    base: 12400,
  },
  SUNPHARMA: {
    name: "Sun Pharmaceutical Industries",
    exchange: "NSE",
    sector: "Pharma",
    base: 1625,
  },
  HINDUNILVR: {
    name: "Hindustan Unilever Ltd",
    exchange: "NSE",
    sector: "FMCG",
    base: 2380,
  },
  ASIANPAINT: {
    name: "Asian Paints Ltd",
    exchange: "NSE",
    sector: "Consumer",
    base: 2850,
  },
  AXISBANK: {
    name: "Axis Bank Ltd",
    exchange: "NSE",
    sector: "Banking",
    base: 1120,
  },
  TITAN: {
    name: "Titan Company Ltd",
    exchange: "NSE",
    sector: "Consumer",
    base: 3450,
  },
  ULTRACEMCO: {
    name: "UltraTech Cement Ltd",
    exchange: "NSE",
    sector: "Cement",
    base: 10200,
  },
  ONGC: {
    name: "Oil & Natural Gas Corporation",
    exchange: "NSE",
    sector: "Energy",
    base: 275,
  },
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

// Seeded price fluctuation so mock prices are consistent within a session
const sessionSeed = Date.now();
function seededRand(symbol: string, salt: number): number {
  let h = sessionSeed + salt;
  for (const c of symbol) h = Math.imul(h ^ c.charCodeAt(0), 0x9e3779b9);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

function getMockQuote(symbol: string): QuoteResult {
  const meta = SYMBOL_META[symbol.toUpperCase()];
  const base = meta?.base ?? 1000;
  const rand = seededRand(symbol, Math.floor(Date.now() / 60_000)); // changes every minute
  const fluctuation = (rand - 0.5) * base * 0.02;
  const ltp = round2(base + fluctuation);
  const prevClose = base;
  const change = round2(ltp - prevClose);

  return {
    symbol,
    ltp,
    open: round2(base * 0.998 + (seededRand(symbol, 1) - 0.5) * base * 0.005),
    high: round2(ltp * (1 + seededRand(symbol, 2) * 0.012)),
    low: round2(ltp * (1 - seededRand(symbol, 3) * 0.012)),
    close: prevClose,
    change,
    changePct: round2((change / prevClose) * 100),
    volume: Math.floor(seededRand(symbol, 4) * 4_000_000) + 500_000,
  };
}

function getMockCandles(symbol: string, days = 180): CandleResult[] {
  const meta = SYMBOL_META[symbol.toUpperCase()];
  const base = meta?.base ?? 1000;
  const candles: CandleResult[] = [];

  // Simulate a trending price walk
  let price = round2(base * 0.78);
  const trend = base > 3000 ? 0.0008 : 0.0006; // slight upward bias

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const day = date.getDay();
    if (day === 0 || day === 6) continue;

    const rand1 = seededRand(symbol, i);
    const rand2 = seededRand(symbol, i + 1000);
    const rand3 = seededRand(symbol, i + 2000);

    const dailyReturn = (rand1 - 0.48 + trend) * 0.025;
    const open = price;
    const close = round2(open * (1 + dailyReturn));
    const high = round2(Math.max(open, close) * (1 + rand2 * 0.008));
    const low = round2(Math.min(open, close) * (1 - rand3 * 0.008));
    price = close;

    candles.push({
      timestamp: date.toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(rand1 * 3_000_000) + 200_000,
    });
  }

  return candles;
}

// ----- Angel One auth -----

let authToken: string | null = null;
let tokenExpiry = 0;

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function generateTOTP(secret: string): Promise<string> {
  if (!secret) throw new Error("ANGEL_ONE_TOTP_SECRET is missing");

  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const secretBytes = new Uint8Array(
    secret
      .toUpperCase()
      .replace(/=+$/, "")
      .split("")
      .map((c) => base32Chars.indexOf(c))
      .reduce((acc: number[], value, index) => {
        const byteIndex = Math.floor((index * 5) / 8);
        const bitOffset = (index * 5) % 8;
        if (acc[byteIndex] === undefined) acc[byteIndex] = 0;
        acc[byteIndex] |= value << (3 - bitOffset);
        if (bitOffset > 3 && acc[byteIndex + 1] === undefined)
          acc[byteIndex + 1] = value << (11 - bitOffset);
        return acc;
      }, []),
  );

  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBuffer = new ArrayBuffer(8);
  new DataView(counterBuffer).setUint32(4, counter, false);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const hash = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, counterBuffer),
  );
  const offset = hash[19] & 0xf;
  const otp =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;

  return otp.toString().padStart(6, "0");
}

async function getAuthToken(): Promise<string> {
  if (authToken && Date.now() < tokenExpiry) return authToken;

  const totp = await generateTOTP(process.env.ANGEL_ONE_TOTP_SECRET ?? "");
  const response = await fetch(
    `${BASE_URL}/rest/auth/angelbroking/user/v1/loginByPassword`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": "127.0.0.1",
        "X-ClientPublicIP": "127.0.0.1",
        "X-MACAddress": "00:00:00:00:00:00",
        "X-PrivateKey": process.env.ANGEL_ONE_API_KEY ?? "",
      },
      body: JSON.stringify({
        clientcode: process.env.ANGEL_ONE_CLIENT_ID,
        password: process.env.ANGEL_ONE_CLIENT_PIN,
        totp,
      }),
    },
  );

  const payload = await parseJson<{ data?: { jwtToken?: string } }>(response);
  if (!payload.data?.jwtToken)
    throw new Error("Angel One authentication failed");

  authToken = payload.data.jwtToken;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return authToken;
}

// ----- Public API -----

type SearchScripItem = {
  tradingsymbol: string;
  symboltoken: string;
  name: string;
  exch_seg?: string;
  exchange?: string;
};

type ResolvedScrip = {
  symboltoken: string;
  tradingsymbol: string;
  exchange: string;
  name?: string;
};

const scripCache = new Map<string, ResolvedScrip>();

function liveHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "127.0.0.1",
    "X-ClientPublicIP": "127.0.0.1",
    "X-MACAddress": "00:00:00:00:00:00",
    "X-PrivateKey": process.env.ANGEL_ONE_API_KEY ?? "",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function normalizeTradingSymbol(symbol: string): string {
  return symbol.toUpperCase().split("-")[0];
}

function toAngelDateTime(value: string, endOfDay: boolean): string {
  if (value.includes(":")) return value;
  return `${value} ${endOfDay ? "15:30" : "09:15"}`;
}

async function searchScripLive(
  query: string,
  exchange = "NSE",
): Promise<SearchScripItem[]> {
  const token = await getAuthToken();
  const response = await fetch(
    `${BASE_URL}/rest/secure/angelbroking/order/v1/searchScrip`,
    {
      method: "POST",
      headers: liveHeaders(token),
      body: JSON.stringify({ exchange, searchscrip: query }),
    },
  );

  const payload = await parseJson<{
    status?: boolean;
    message?: string;
    data?: SearchScripItem[];
  }>(response);

  if (!response.ok) {
    throw new Error(payload.message ?? "searchScrip request failed");
  }

  return payload.data ?? [];
}

async function resolveSymbolToken(
  symbol: string,
  exchange = "NSE",
): Promise<ResolvedScrip> {
  if (/^\d+$/.test(symbol)) {
    return {
      symboltoken: symbol,
      tradingsymbol: symbol,
      exchange,
    };
  }

  const key = `${exchange}:${symbol.toUpperCase()}`;
  const cached = scripCache.get(key);
  if (cached) return cached;

  const results = await searchScripLive(symbol, exchange);
  const target = symbol.toUpperCase();

  const exact =
    results.find((item) => item.tradingsymbol.toUpperCase() === target) ??
    results.find(
      (item) => normalizeTradingSymbol(item.tradingsymbol) === target,
    ) ??
    results[0];

  if (!exact?.symboltoken) {
    throw new Error(`Symbol token not found for ${symbol}`);
  }

  const resolved: ResolvedScrip = {
    symboltoken: exact.symboltoken,
    tradingsymbol: exact.tradingsymbol,
    exchange,
    name: exact.name,
  };

  scripCache.set(key, resolved);
  return resolved;
}

export async function getQuote(
  symbol: string,
  exchange = "NSE",
): Promise<QuoteResult> {
  if (MOCK_MODE) return getMockQuote(symbol);

  const resolved = await resolveSymbolToken(symbol, exchange);
  const token = await getAuthToken();
  const response = await fetch(
    `${BASE_URL}/rest/secure/angelbroking/market/v1/quote/`,
    {
      method: "POST",
      headers: liveHeaders(token),
      body: JSON.stringify({
        mode: "FULL",
        exchangeTokens: { [exchange]: [resolved.symboltoken] },
      }),
    },
  );

  const payload = await parseJson<{
    status?: boolean;
    message?: string;
    data?: {
      fetched?: Array<{
        ltp: number;
        open: number;
        high: number;
        low: number;
        close: number;
        netChange: number;
        percentChange: number;
        tradeVolume: number;
      }>;
    };
  }>(response);

  if (!response.ok || payload.status === false) {
    throw new Error(payload.message ?? `Quote request failed for ${symbol}`);
  }

  const quote = payload.data?.fetched?.[0];
  if (!quote) throw new Error(`Quote not found for ${symbol}`);

  return {
    symbol: resolved.tradingsymbol,
    ltp: quote.ltp,
    open: quote.open,
    high: quote.high,
    low: quote.low,
    close: quote.close,
    change: quote.netChange,
    changePct: quote.percentChange,
    volume: quote.tradeVolume,
  };
}

export async function getCandles(
  symbol: string,
  exchange = "NSE",
  interval = "ONE_DAY",
  from: string,
  to: string,
): Promise<CandleResult[]> {
  if (MOCK_MODE) return getMockCandles(symbol);

  const resolved = await resolveSymbolToken(symbol, exchange);
  const token = await getAuthToken();
  const response = await fetch(
    `${BASE_URL}/rest/secure/angelbroking/historical/v1/getCandleData`,
    {
      method: "POST",
      headers: liveHeaders(token),
      body: JSON.stringify({
        exchange,
        symboltoken: resolved.symboltoken,
        interval,
        fromdate: toAngelDateTime(from, false),
        todate: toAngelDateTime(to, true),
      }),
    },
  );

  const payload = await parseJson<{
    status?: boolean;
    message?: string;
    data?: Array<[string, number, number, number, number, number]>;
  }>(response);

  if (!response.ok || payload.status === false) {
    throw new Error(payload.message ?? `Candle request failed for ${symbol}`);
  }

  return (payload.data ?? []).map(
    ([timestamp, open, high, low, close, volume]) => ({
      timestamp: new Date(timestamp).toISOString(),
      open,
      high,
      low,
      close,
      volume,
    }),
  );
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (MOCK_MODE) {
    const q = query.toUpperCase();
    return Object.entries(SYMBOL_META)
      .filter(
        ([sym, meta]) =>
          sym.includes(q) ||
          meta.name.toLowerCase().includes(query.toLowerCase()),
      )
      .map(([symbol, meta]) => ({
        symbol,
        name: meta.name,
        exchange: meta.exchange,
        sector: meta.sector,
      }))
      .slice(0, 10);
  }

  const results = await searchScripLive(query, "NSE");

  return results
    .filter((item) => Boolean(item.tradingsymbol))
    .slice(0, 10)
    .map((item) => {
      const normalized = normalizeTradingSymbol(item.tradingsymbol);
      return {
        symbol: normalized,
        name: item.name,
        exchange: "NSE",
        sector: SYMBOL_META[normalized]?.sector ?? "Other",
      };
    });
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(utcMillis + 5.5 * 60 * 60 * 1000);
  const day = ist.getUTCDay();
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return (
    day >= 1 && day <= 5 && minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30
  );
}

