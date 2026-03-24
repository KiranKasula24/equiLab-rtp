import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { getQuote } from "@/lib/angelone";
import { Order } from "@/models/Order";
import { Trade } from "@/models/Trade";
import { Snapshot } from "@/models/Snapshot";
import { CONSTANTS, PlaceOrderInput } from "@/types";
import { creditCash, debitCash, getCashBalance } from "./ledger.service";
import { getPortfolioSummary } from "./portfolio.service";

function round2(value: number): number {
  return Number(value.toFixed(2));
}

function calculateFees(side: "buy" | "sell", totalValue: number) {
  const commission = Math.min(
    CONSTANTS.MAX_COMMISSION,
    totalValue * CONSTANTS.INTRADAY_COMMISSION_PCT,
  );
  const stt = side === "sell" ? totalValue * CONSTANTS.STT_DELIVERY_PCT : 0;
  return { commission: round2(commission), stt: round2(stt) };
}

async function saveSnapshot(userId: string): Promise<void> {
  try {
    const summary = await getPortfolioSummary(userId);
    const date = new Date().toISOString().split("T")[0];
    await Snapshot.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), date },
      {
        totalValue: summary.totalValue,
        cashBalance: summary.cashBalance,
        holdingsValue: summary.holdingsValue,
        realisedPnl: summary.realisedPnl,
      },
      { upsert: true },
    );
  } catch {
    // Non-fatal — snapshot failure should never block order execution
  }
}

export async function placeOrder(userId: string, input: PlaceOrderInput) {
  await connectDB();

  const quote = await getQuote(input.symbol, input.exchange);
  const executedPrice = quote.ltp;
  const totalValue = round2(executedPrice * input.quantity);
  const { commission, stt } = calculateFees(input.side, totalValue);
  const totalCost = round2(totalValue + commission + stt);

  if (input.side === "buy") {
    const cashBalance = await getCashBalance(userId);
    if (cashBalance < totalCost) {
      await Order.create({
        userId: new Types.ObjectId(userId),
        symbol: input.symbol,
        exchange: input.exchange,
        side: input.side,
        quantity: input.quantity,
        status: "rejected",
        executedPrice,
        totalValue,
        commissionFee: commission,
        stt,
        rejectionReason: `Insufficient buying power. Required ₹${totalCost.toLocaleString("en-IN")}, available ₹${cashBalance.toLocaleString("en-IN")}`,
      });
      throw new Error(
        `Insufficient buying power. Required ₹${totalCost.toLocaleString("en-IN")}`,
      );
    }
  }

  if (input.side === "sell") {
    const position = await getUserPosition(userId, input.symbol);
    if (!position || position.quantity < input.quantity) {
      await Order.create({
        userId: new Types.ObjectId(userId),
        symbol: input.symbol,
        exchange: input.exchange,
        side: input.side,
        quantity: input.quantity,
        status: "rejected",
        executedPrice,
        totalValue,
        commissionFee: commission,
        stt,
        rejectionReason: `Insufficient holdings. Current quantity: ${position?.quantity ?? 0}`,
      });
      throw new Error(
        `Insufficient holdings. You hold ${position?.quantity ?? 0} shares.`,
      );
    }
  }

  const session = await mongoose.startSession();
  let createdOrder: unknown;

  try {
    await session.withTransaction(async () => {
      const orderDocs = await Order.create(
        [
          {
            userId: new Types.ObjectId(userId),
            symbol: input.symbol,
            exchange: input.exchange,
            side: input.side,
            quantity: input.quantity,
            status: "filled",
            executedPrice,
            totalValue,
            commissionFee: commission,
            stt,
          },
        ],
        { session },
      );

      const order = orderDocs[0];

      await Trade.create(
        [
          {
            orderId: order._id,
            userId: new Types.ObjectId(userId),
            symbol: input.symbol,
            exchange: input.exchange,
            side: input.side,
            quantity: input.quantity,
            executedPrice,
            totalValue,
            commissionFee: commission,
            stt,
          },
        ],
        { session },
      );

      if (input.side === "buy") {
        await debitCash(
          userId,
          totalCost,
          order._id as Types.ObjectId,
          `BUY ${input.quantity} × ${input.symbol} @ ₹${executedPrice.toLocaleString("en-IN")}`,
          session,
        );
      } else {
        const netProceeds = round2(totalValue - commission - stt);
        await creditCash(
          userId,
          netProceeds,
          order._id as Types.ObjectId,
          `SELL ${input.quantity} × ${input.symbol} @ ₹${executedPrice.toLocaleString("en-IN")}`,
          session,
        );
      }

      createdOrder = order.toObject();
    });
  } finally {
    session.endSession();
  }

  // Snapshot after transaction completes (non-blocking)
  void saveSnapshot(userId);

  return createdOrder;
}

export async function getUserPosition(userId: string, symbol: string) {
  await connectDB();

  const trades = await Trade.find({
    userId: new Types.ObjectId(userId),
    symbol: symbol.toUpperCase(),
  }).lean();

  if (!trades.length) return null;

  let quantity = 0;
  let totalCost = 0;

  for (const trade of trades) {
    if (trade.side === "buy") {
      totalCost += trade.totalValue;
      quantity += trade.quantity;
    } else {
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      totalCost -= avgCost * trade.quantity;
      quantity -= trade.quantity;
    }
  }

  if (quantity <= 0) return null;
  return { symbol, quantity, avgCostPrice: round2(totalCost / quantity) };
}
