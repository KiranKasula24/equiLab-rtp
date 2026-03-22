import { z } from "zod";
import { Types } from "mongoose";

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include one uppercase letter")
    .regex(/[0-9]/, "Password must include one number"),
  fullName: z.string().min(2),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const PlaceOrderSchema = z.object({
  symbol: z.string().min(1).transform((v) => v.toUpperCase()),
  exchange: z.enum(["NSE", "BSE"]).default("NSE"),
  side: z.enum(["buy", "sell"]),
  quantity: z.number().int().positive().max(100_000),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type PlaceOrderInput = z.infer<typeof PlaceOrderSchema>;

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  fullName: string;
  passwordHash: string;
  createdAt: Date;
}

export interface IAccount {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: "cash" | "holdings";
  currency: "INR";
}

export interface ILedgerEntry {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  type: "debit" | "credit";
  amount: number;
  referenceId: Types.ObjectId;
  referenceType: "order" | "trade" | "deposit";
  description: string;
  createdAt: Date;
}

export interface IOrder {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  symbol: string;
  exchange: "NSE" | "BSE";
  side: "buy" | "sell";
  quantity: number;
  status: "filled" | "cancelled" | "rejected";
  executedPrice: number;
  totalValue: number;
  commissionFee: number;
  stt: number;
  createdAt: Date;
}

export interface ITrade {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  symbol: string;
  exchange: "NSE" | "BSE";
  side: "buy" | "sell";
  quantity: number;
  executedPrice: number;
  totalValue: number;
  commissionFee: number;
  stt: number;
  createdAt: Date;
}

export interface IPosition {
  symbol: string;
  exchange: "NSE" | "BSE";
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  dayChange: number;
  dayChangePct: number;
}

export interface IPortfolioSummary {
  cashBalance: number;
  holdingsValue: number;
  totalValue: number;
  totalInvested: number;
  unrealisedPnl: number;
  unrealisedPnlPct: number;
  realisedPnl: number;
  dayPnl: number;
  positions: IPosition[];
}

export interface IAnalytics {
  totalTrades: number;
  winRate: number;
  sharpeRatio: number;
  avgHoldingDays: number;
  bestTrade: { symbol: string; pnl: number } | null;
  worstTrade: { symbol: string; pnl: number } | null;
}

export const CONSTANTS = {
  STARTING_CAPITAL: 1_000_000,
  CURRENCY: "INR",
  MAX_COMMISSION: 20,
  INTRADAY_COMMISSION_PCT: 0.0003,
  STT_DELIVERY_PCT: 0.001,
} as const;
