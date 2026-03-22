import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILedgerEntryDocument extends Document {
  accountId: Types.ObjectId;
  type: "debit" | "credit";
  amount: number;
  referenceId: Types.ObjectId;
  referenceType: "order" | "trade" | "deposit";
  description: string;
  createdAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntryDocument>(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["debit", "credit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    referenceId: { type: Schema.Types.ObjectId, required: true },
    referenceType: {
      type: String,
      enum: ["order", "trade", "deposit"],
      required: true,
    },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const LedgerEntry =
  mongoose.models.LedgerEntry ||
  mongoose.model<ILedgerEntryDocument>("LedgerEntry", LedgerEntrySchema);
