import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITradeDocument extends Document {
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

const TradeSchema = new Schema<ITradeDocument>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true },
    exchange: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
    side: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true },
    executedPrice: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    commissionFee: { type: Number, required: true },
    stt: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, symbol: 1 });

export const Trade =
  mongoose.models.Trade || mongoose.model<ITradeDocument>("Trade", TradeSchema);
