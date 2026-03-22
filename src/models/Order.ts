import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrderDocument extends Document {
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
  rejectionReason?: string;
  createdAt: Date;
}

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    symbol: { type: String, required: true, uppercase: true },
    exchange: { type: String, enum: ["NSE", "BSE"], default: "NSE" },
    side: { type: String, enum: ["buy", "sell"], required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["filled", "cancelled", "rejected"],
      required: true,
    },
    executedPrice: { type: Number, required: true },
    totalValue: { type: Number, required: true },
    commissionFee: { type: Number, required: true },
    stt: { type: Number, required: true },
    rejectionReason: String,
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const Order =
  mongoose.models.Order || mongoose.model<IOrderDocument>("Order", OrderSchema);
