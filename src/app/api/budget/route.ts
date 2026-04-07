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

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const today = now.toISOString().slice(0, 10);

  // 가족 공유 지출 (visibility='family' 거래만)
  const familyTx = family
    ? await getTransactions(userId, family.id, 1000, "family")
    : await getTransactions(userId, undefined, 1000, "all");
  const familyMonthlyExpense = familyTx
    .filter((t) => t.type === "expense" && t.date.startsWith(monthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const familyTodayExpense = familyTx
    .filter((t) => t.type === "expense" && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);

  // 내 개인 지출 (내 거래 전체 - private + family 모두)
  const myTx = await getTransactions(userId, undefined, 1000, "all");
  const personalMonthlyExpense = myTx
    .filter((t) => t.type === "expense" && t.date.startsWith(monthStr))
    .reduce((sum, t) => sum + t.amount, 0);
  const personalTodayExpense = myTx
    .filter((t) => t.type === "expense" && t.date === today)
    .reduce((sum, t) => sum + t.amount, 0);

  return NextResponse.json({
    budget,
    // 가족 지출
    monthlyExpense: familyMonthlyExpense,
    todayExpense: familyTodayExpense,
    // 개인 지출
    personalMonthlyExpense,
    personalTodayExpense,
    year,
    month,
  });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { year, month, budget_amount, personal_budget_amount } = await req.json();
  if (!year || !month || budget_amount == null)
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  const family = await getFamilyByUser(userId);
  await upsertMonthlyBudget(
    userId, family?.id ?? null,
    Number(year), Number(month),
    Number(budget_amount),
    personal_budget_amount != null ? Number(personal_budget_amount) : undefined,
  );
  return NextResponse.json({ ok: true });
}
