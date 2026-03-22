import mongoose, { Schema, Document } from "mongoose";

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  fullName: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    fullName: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: { passwordHash?: string } & Record<string, unknown>) => {
        ret.passwordHash = undefined;
        return ret;
      },
    },
  },
);

export const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);
