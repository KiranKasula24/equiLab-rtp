import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISnapshotDocument extends Document {
  userId: Types.ObjectId;
  date: string; // "YYYY-MM-DD" — one snapshot per day
  totalValue: number;
  cashBalance: number;
  holdingsValue: number;
  realisedPnl: number;
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshotDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: { type: String, required: true },
    totalValue: { type: Number, required: true },
    cashBalance: { type: Number, required: true },
    holdingsValue: { type: Number, required: true },
    realisedPnl: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SnapshotSchema.index({ userId: 1, date: -1 }, { unique: true });

export const Snapshot =
  mongoose.models.Snapshot ||
  mongoose.model<ISnapshotDocument>("Snapshot", SnapshotSchema);
