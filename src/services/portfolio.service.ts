import { Types } from "mongoose";
import { getQuote } from "@/lib/angelone";
import { connectDB } from "@/lib/db";
import { Trade } from "@/models/Trade";
import { IAnalytics, IPortfolioSummary, IPosition } from "@/types";
import { getCashBalance } from "./ledger.service";

function round2(value: number): number {
  return Number(value.toFixed(2));
}

export async function getPositions(userId: string): Promise<IPosition[]> {
  await connectDB();

  const trades = await Trade.find({
    userId: new Types.ObjectId(userId),
  }).lean();

  const symbolMap: Record<
    string,
    { qty: number; cost: number; exchange: string }
  > = {};

  for (const trade of trades) {
    if (!symbolMap[trade.symbol]) {
      symbolMap[trade.symbol] = { qty: 0, cost: 0, exchange: trade.exchange };
    }

    const entry = symbolMap[trade.symbol];

    if (trade.side === "buy") {
      entry.cost += trade.totalValue;
      entry.qty += trade.quantity;
    } else {
      const avgCost = entry.qty > 0 ? entry.cost / entry.qty : 0;
      entry.cost -= avgCost * trade.quantity;
      entry.qty -= trade.quantity;
    }
  }

  const openSymbols = Object.entries(symbolMap).filter(
    ([, value]) => value.qty > 0,
  );

  if (!openSymbols.length) {
    return [];
  }

  return Promise.all(
    openSymbols.map(async ([symbol, data]) => {
      const quote = await getQuote(symbol, data.exchange);
      const avgCostPrice = round2(data.cost / data.qty);
      const currentValue = round2(quote.ltp * data.qty);
      const investedValue = round2(avgCostPrice * data.qty);
      const unrealisedPnl = round2(currentValue - investedValue);
      const unrealisedPnlPct =
        investedValue > 0 ? round2((unrealisedPnl / investedValue) * 100) : 0;
      const dayChange = round2(quote.change * data.qty);

      return {
        symbol,
        exchange: data.exchange as "NSE" | "BSE",
        quantity: data.qty,
        avgCostPrice,
        currentPrice: quote.ltp,
        currentValue,
        investedValue,
        unrealisedPnl,
        unrealisedPnlPct,
        dayChange,
        dayChangePct: quote.changePct,
      };
    }),
  );
}

export async function getRealisedPnl(userId: string): Promise<number> {
  await connectDB();

  const trades = await Trade.find({
    userId: new Types.ObjectId(userId),
  })
    .sort({ createdAt: 1 })
    .lean();

  const costBasis: Record<string, { qty: number; cost: number }> = {};
  let realisedPnl = 0;

  for (const trade of trades) {
    if (!costBasis[trade.symbol]) {
      costBasis[trade.symbol] = { qty: 0, cost: 0 };
    }

    const basis = costBasis[trade.symbol];

    if (trade.side === "buy") {
      basis.cost += trade.totalValue;
      basis.qty += trade.quantity;
    } else {
      const avgCost = basis.qty > 0 ? basis.cost / basis.qty : 0;
      const pnl = (trade.executedPrice - avgCost) * trade.quantity;
      realisedPnl += pnl - trade.commissionFee - trade.stt;
      basis.cost -= avgCost * trade.quantity;
      basis.qty -= trade.quantity;
    }
  }

  return round2(realisedPnl);
}

export async function getPortfolioSummary(
  userId: string,
): Promise<IPortfolioSummary> {
  const [cashBalance, positions, realisedPnl] = await Promise.all([
    getCashBalance(userId),
    getPositions(userId),
    getRealisedPnl(userId),
  ]);

  const holdingsValue = positions.reduce(
    (sum, item) => sum + item.currentValue,
    0,
  );
  const totalInvested = positions.reduce(
    (sum, item) => sum + item.investedValue,
    0,
  );
  const unrealisedPnl = positions.reduce(
    (sum, item) => sum + item.unrealisedPnl,
    0,
  );
  const dayPnl = positions.reduce((sum, item) => sum + item.dayChange, 0);
  const totalValue = cashBalance + holdingsValue;

  return {
    cashBalance: round2(cashBalance),
    holdingsValue: round2(holdingsValue),
    totalValue: round2(totalValue),
    totalInvested: round2(totalInvested),
    unrealisedPnl: round2(unrealisedPnl),
    unrealisedPnlPct:
      totalInvested > 0 ? round2((unrealisedPnl / totalInvested) * 100) : 0,
    realisedPnl: round2(realisedPnl),
    dayPnl: round2(dayPnl),
    positions,
  };
}

export async function getAnalytics(userId: string): Promise<IAnalytics> {
  await connectDB();

  const trades = await Trade.find({
    userId: new Types.ObjectId(userId),
  })
    .sort({ createdAt: 1 })
    .lean();

  const costBasis: Record<
    string,
    { qty: number; cost: number; firstBuy: Date }
  > = {};
  const closedTrades: { symbol: string; pnl: number; holdingDays: number }[] =
    [];

  for (const trade of trades) {
    if (!costBasis[trade.symbol]) {
      costBasis[trade.symbol] = { qty: 0, cost: 0, firstBuy: trade.createdAt };
    }

    const basis = costBasis[trade.symbol];

    if (trade.side === "buy") {
      if (basis.qty === 0) {
        basis.firstBuy = trade.createdAt;
      }
      basis.cost += trade.totalValue;
      basis.qty += trade.quantity;
    } else {
      const avgCost = basis.qty > 0 ? basis.cost / basis.qty : 0;
      const pnl =
        (trade.executedPrice - avgCost) * trade.quantity -
        trade.commissionFee -
        trade.stt;

      const holdingDays = Math.floor(
        (trade.createdAt.getTime() - basis.firstBuy.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      closedTrades.push({ symbol: trade.symbol, pnl, holdingDays });
      basis.cost -= avgCost * trade.quantity;
      basis.qty -= trade.quantity;
    }
  }

  if (!closedTrades.length) {
    return {
      totalTrades: trades.length,
      winRate: 0,
      sharpeRatio: 0,
      avgHoldingDays: 0,
      bestTrade: null,
      worstTrade: null,
    };
  }

  const winners = closedTrades.filter((trade) => trade.pnl > 0);
  const winRate = round2((winners.length / closedTrades.length) * 100);
  const avgHoldingDays = Math.round(
    closedTrades.reduce((sum, trade) => sum + trade.holdingDays, 0) /
      closedTrades.length,
  );

  const returns = closedTrades.map((trade) => trade.pnl);
  const avgReturn =
    returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - avgReturn) ** 2, 0) /
    returns.length;
  const stdDev = Math.sqrt(variance);
  const riskFreeDaily = 0.065 / 365;
  const sharpeRatio =
    stdDev > 0 ? round2((avgReturn - riskFreeDaily) / stdDev) : 0;

  const sorted = [...closedTrades].sort((a, b) => b.pnl - a.pnl);

  return {
    totalTrades: trades.length,
    winRate,
    sharpeRatio,
    avgHoldingDays,
    bestTrade: {
      symbol: sorted[0].symbol,
      pnl: round2(sorted[0].pnl),
    },
    worstTrade: {
      symbol: sorted[sorted.length - 1].symbol,
      pnl: round2(sorted[sorted.length - 1].pnl),
    },
  };
}

export async function getTradeHistory(
  userId: string,
  page = 1,
  limit = 20,
  symbol?: string,
  side?: "buy" | "sell",
) {
  await connectDB();

  const filter: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  if (symbol) {
    filter.symbol = symbol.toUpperCase();
  }

  if (side) {
    filter.side = side;
  }

  const [trades, total] = await Promise.all([
    Trade.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Trade.countDocuments(filter),
  ]);

  return {
    trades,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
