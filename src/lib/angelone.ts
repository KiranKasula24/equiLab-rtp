const MOCK_MODE = process.env.ANGEL_ONE_MOCK_MODE !== "false";
const BASE_URL = "https://apiconnect.angelbroking.com";

type QuoteResult = {
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

type CandleResult = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type SearchResult = {
  symbol: string;
  name: string;
  exchange: string;
};

const MOCK_QUOTES: Record<string, number> = {
  RELIANCE: 2945.5,
  TCS: 3821.0,
  INFY: 1456.75,
  HDFCBANK: 1623.4,
  ICICIBANK: 1089.2,
  WIPRO: 456.3,
  SBIN: 812.6,
  BAJFINANCE: 6892.0,
  TATAMOTORS: 978.45,
  ADANIENT: 2341.8,
};

const MOCK_SEARCH: SearchResult[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE" },
  { symbol: "TCS", name: "Tata Consultancy Services", exchange: "NSE" },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE" },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE" },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE" },
  { symbol: "WIPRO", name: "Wipro Ltd", exchange: "NSE" },
  { symbol: "SBIN", name: "State Bank of India", exchange: "NSE" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", exchange: "NSE" },
  { symbol: "TATAMOTORS", name: "Tata Motors Ltd", exchange: "NSE" },
  { symbol: "ADANIENT", name: "Adani Enterprises Ltd", exchange: "NSE" },
];

let authToken: string | null = null;
let tokenExpiry = 0;

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function getMockQuote(symbol: string): QuoteResult {
  const base = MOCK_QUOTES[symbol.toUpperCase()] ?? 1000;
  const fluctuation = (Math.random() - 0.5) * base * 0.02;
  const ltp = round2(base + fluctuation);
  const prevClose = base;
  const change = round2(ltp - prevClose);

  return {
    symbol,
    ltp,
    open: round2(base * 0.998),
    high: round2(base * 1.012),
    low: round2(base * 0.991),
    close: prevClose,
    change,
    changePct: round2((change / prevClose) * 100),
    volume: Math.floor(Math.random() * 5_000_000) + 500_000,
  };
}

function getMockCandles(symbol: string, days = 90): CandleResult[] {
  const base = MOCK_QUOTES[symbol.toUpperCase()] ?? 1000;
  const candles: CandleResult[] = [];
  let price = base * 0.85;

  for (let i = days; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }

    const open = price;
    const change = (Math.random() - 0.48) * price * 0.025;
    const close = round2(open + change);
    const high = round2(Math.max(open, close) * (1 + Math.random() * 0.01));
    const low = round2(Math.min(open, close) * (1 - Math.random() * 0.01));
    price = close;

    candles.push({
      timestamp: date.toISOString(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 3_000_000) + 200_000,
    });
  }

  return candles;
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T;
  return data;
}

async function getAuthToken(): Promise<string> {
  if (authToken && Date.now() < tokenExpiry) {
    return authToken;
  }

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

  if (!payload.data?.jwtToken) {
    throw new Error("Angel One authentication failed");
  }

  authToken = payload.data.jwtToken;
  tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

  return authToken;
}

async function generateTOTP(secret: string): Promise<string> {
  if (!secret) {
    throw new Error("ANGEL_ONE_TOTP_SECRET is missing");
  }

  const base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const secretBytes = new Uint8Array(
    secret
      .toUpperCase()
      .replace(/=+$/, "")
      .split("")
      .map((char) => {
        const index = base32Chars.indexOf(char);
        return index === -1 ? 0 : index;
      })
      .reduce((acc: number[], value, index) => {
        const byteIndex = Math.floor((index * 5) / 8);
        const bitOffset = (index * 5) % 8;

        if (acc[byteIndex] === undefined) {
          acc[byteIndex] = 0;
        }

        acc[byteIndex] |= value << (3 - bitOffset);

        if (bitOffset > 3 && acc[byteIndex + 1] === undefined) {
          acc[byteIndex + 1] = value << (11 - bitOffset);
        }

        return acc;
      }, []),
  );

  const counter = Math.floor(Date.now() / 1000 / 30);
  const counterBuffer = new ArrayBuffer(8);
  const counterView = new DataView(counterBuffer);
  counterView.setUint32(4, counter, false);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, counterBuffer);
  const hash = new Uint8Array(signature);
  const offset = hash[19] & 0xf;

  const otp =
    (((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)) %
    1_000_000;

  return otp.toString().padStart(6, "0");
}

export async function getQuote(symbol: string, exchange = "NSE"): Promise<QuoteResult> {
  if (MOCK_MODE) {
    return getMockQuote(symbol);
  }

  const token = await getAuthToken();

  const response = await fetch(`${BASE_URL}/rest/secure/angelbroking/market/v1/quote/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-PrivateKey": process.env.ANGEL_ONE_API_KEY ?? "",
    },
    body: JSON.stringify({
      mode: "FULL",
      exchangeTokens: { [exchange]: [symbol] },
    }),
  });

  const payload = await parseJson<{
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

  const quote = payload.data?.fetched?.[0];

  if (!quote) {
    throw new Error(`Quote not found for ${symbol}`);
  }

  return {
    symbol,
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
  if (MOCK_MODE) {
    return getMockCandles(symbol);
  }

  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/rest/secure/angelbroking/historical/v1/getCandleData`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-PrivateKey": process.env.ANGEL_ONE_API_KEY ?? "",
      },
      body: JSON.stringify({
        exchange,
        symboltoken: symbol,
        interval,
        fromdate: from,
        todate: to,
      }),
    },
  );

  const payload = await parseJson<{ data?: Array<[string, number, number, number, number, number]> }>(response);

  return (payload.data ?? []).map(([timestamp, open, high, low, close, volume]) => ({
    timestamp: new Date(timestamp).toISOString(),
    open,
    high,
    low,
    close,
    volume,
  }));
}

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  if (MOCK_MODE) {
    return MOCK_SEARCH.filter(
      (item) =>
        item.symbol.includes(query.toUpperCase()) ||
        item.name.toLowerCase().includes(query.toLowerCase()),
    );
  }

  const token = await getAuthToken();

  const response = await fetch(
    `${BASE_URL}/rest/secure/angelbroking/order/v1/searchScrip`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-PrivateKey": process.env.ANGEL_ONE_API_KEY ?? "",
      },
      body: JSON.stringify({ exchange: "NSE", searchscrip: query }),
    },
  );

  const payload = await parseJson<{
    data?: Array<{
      tradingsymbol: string;
      name: string;
    }>;
  }>(response);

  return (payload.data ?? []).map((item) => ({
    symbol: item.tradingsymbol,
    name: item.name,
    exchange: "NSE",
  }));
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const utcMillis = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(utcMillis + 5.5 * 60 * 60 * 1000);

  const day = ist.getUTCDay();
  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();
  const minutes = hour * 60 + minute;

  const openMinutes = 9 * 60 + 15;
  const closeMinutes = 15 * 60 + 30;

  return day >= 1 && day <= 5 && minutes >= openMinutes && minutes <= closeMinutes;
}
