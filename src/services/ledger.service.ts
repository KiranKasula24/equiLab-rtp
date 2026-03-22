import mongoose, { ClientSession, Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Account } from "@/models/Account";
import { LedgerEntry } from "@/models/LedgerEntry";
import { CONSTANTS } from "@/types";

export async function setupNewUserAccounts(userId: string) {
  await connectDB();

  const userObjectId = new Types.ObjectId(userId);
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const cashAccount = await Account.create(
        [
          {
            userId: userObjectId,
            type: "cash",
            currency: "INR",
          },
        ],
        { session },
      );

      await Account.create(
        [
          {
            userId: userObjectId,
            type: "holdings",
            currency: "INR",
          },
        ],
        { session },
      );

      await LedgerEntry.create(
        [
          {
            accountId: cashAccount[0]._id,
            type: "credit",
            amount: CONSTANTS.STARTING_CAPITAL,
            referenceId: userObjectId,
            referenceType: "deposit",
            description: "Initial paper capital credit: INR 10,00,000",
          },
        ],
        { session },
      );
    });
  } finally {
    session.endSession();
  }
}

export async function getAccountBalance(
  accountId: Types.ObjectId,
  session?: ClientSession,
): Promise<number> {
  await connectDB();

  const result = await LedgerEntry.aggregate([
    { $match: { accountId } },
    {
      $group: {
        _id: null,
        credits: {
          $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$amount", 0] },
        },
        debits: {
          $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$amount", 0] },
        },
      },
    },
  ]).session(session ?? null);

  if (!result.length) return 0;
  return result[0].credits - result[0].debits;
}

export async function getCashAccountId(
  userId: string,
  session?: ClientSession,
): Promise<Types.ObjectId> {
  await connectDB();

  const account = await Account.findOne({
    userId: new Types.ObjectId(userId),
    type: "cash",
  }).session(session ?? null);

  if (!account) {
    throw new Error("Cash account not found");
  }

  return account._id as Types.ObjectId;
}

export async function getCashBalance(userId: string): Promise<number> {
  const accountId = await getCashAccountId(userId);
  return getAccountBalance(accountId);
}

export async function debitCash(
  userId: string,
  amount: number,
  referenceId: Types.ObjectId,
  description: string,
  session?: ClientSession,
) {
  await connectDB();

  const accountId = await getCashAccountId(userId, session);
  const balance = await getAccountBalance(accountId, session);

  if (balance < amount) {
    throw new Error("Insufficient buying power");
  }

  await LedgerEntry.create(
    [
      {
        accountId,
        type: "debit",
        amount,
        referenceId,
        referenceType: "order",
        description,
      },
    ],
    { session },
  );
}

export async function creditCash(
  userId: string,
  amount: number,
  referenceId: Types.ObjectId,
  description: string,
  session?: ClientSession,
) {
  await connectDB();

  const accountId = await getCashAccountId(userId, session);

  await LedgerEntry.create(
    [
      {
        accountId,
        type: "credit",
        amount,
        referenceId,
        referenceType: "order",
        description,
      },
    ],
    { session },
  );
}

export async function getCashStatement(userId: string, limit = 50, skip = 0) {
  await connectDB();

  const account = await Account.findOne({
    userId: new Types.ObjectId(userId),
    type: "cash",
  });

  if (!account) {
    return [];
  }

  return LedgerEntry.find({ accountId: account._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
}
