import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getMonthlyBudget, upsertMonthlyBudget, getTransactions, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") || String(now.getMonth() + 1));

  const budget = await getMonthlyBudget(userId, year, month);
  const family = await getFamilyByUser(userId);

  // 이번 달 지출 합계
  const allTx = await getTransactions(userId, family?.id, 500, "all");
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const monthlyExpense = allTx
    .filter((t) => t.type === "expense" && t.date.startsWith(monthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  // 오늘까지 지출
  const today = now.toISOString().slice(0, 10);
  const todayExpense = allTx
    .filter((t) => t.type === "expense" && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    budget,
    monthlyExpense,
    todayExpense,
    year,
    month,
  });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year, month, budget_amount } = await req.json();
  if (!year || !month || budget_amount == null)
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  const family = await getFamilyByUser(userId);
  await upsertMonthlyBudget(userId, family?.id ?? null, Number(year), Number(month), Number(budget_amount));
  return NextResponse.json({ ok: true });
}
