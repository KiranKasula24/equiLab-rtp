import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAccountDocument extends Document {
  userId: Types.ObjectId;
  type: "cash" | "holdings";
  currency: "INR";
}

const AccountSchema = new Schema<IAccountDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: { type: String, enum: ["cash", "holdings"], required: true },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true },
);

AccountSchema.index({ userId: 1, type: 1 }, { unique: true });

export const Account =
  mongoose.models.Account ||
  mongoose.model<IAccountDocument>("Account", AccountSchema);
