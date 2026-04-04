import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getTransactions, insertTransaction, deleteTransaction, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100");
  const items = await getTransactions(userId, family?.id, limit);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { type, category, amount, memo, date, visibility, card_name } = body;
  if (!type || !category || !amount || !date)
    return NextResponse.json({ error: "필수 항목이 누락됐습니다." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  const id = await insertTransaction({
    family_id: family?.id,
    user_id: userId,
    type,
    category,
    amount: Number(amount),
    memo: memo || "",
    date,
    visibility: visibility || "family",
    card_name: card_name || "",
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteTransaction(Number(id), userId);
  return NextResponse.json({ ok: true });
}
