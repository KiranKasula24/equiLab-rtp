# equiLab RTP

Paper trading platform for Indian equities (NSE/BSE), built with Next.js, MongoDB, and Angel One SmartAPI integration patterns.

## Stack

- Next.js App Router (single repo frontend + API routes)
- MongoDB Atlas + Mongoose
- JWT auth in HttpOnly cookie
- Angel One SmartAPI wrapper (mock mode for local development)
- Zod validation
- Lightweight chart integration ready via market candle API endpoint

## Implemented MVP Scope

- Auth: register, login, logout, me, refresh
- Protected dashboard routes via Next middleware
- Core collections: users, accounts, ledger_entries, orders, trades
- Starting virtual capital credit (INR 10,00,000)
- Ledger-driven cash balance computation
- Market order execution with fee and STT computation
- Atomic order + trade + ledger updates using MongoDB transaction sessions
- Market APIs: symbol search, quote, candles
- Portfolio summary, trade history, analytics, CSV statement export
- Basic UI pages: dashboard, trade, portfolio, analytics, history

## Run

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

3. Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Notes

- By default `ANGEL_ONE_MOCK_MODE=true` to keep local setup frictionless.
- Switch to live SmartAPI by setting `ANGEL_ONE_MOCK_MODE=false` and adding all Angel One credentials in `.env.local`.
- This project root is `C:\Projects\equilab-rtp-f`.
