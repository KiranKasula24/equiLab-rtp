import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/middleware";
import { getCashStatement } from "@/services/ledger.service";

function escapeCsv(value: string | number): string {
  const text = String(value).replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const entries = await getCashStatement(auth.session.userId, 1000, 0);

  const header = [
    "createdAt",
    "type",
    "amount",
    "referenceType",
    "referenceId",
    "description",
  ];

  const rows = entries.map((entry) => [
    entry.createdAt.toISOString(),
    entry.type,
    entry.amount,
    entry.referenceType,
    String(entry.referenceId),
    entry.description,
  ]);

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="account-statement.csv"',
    },
  });
}
