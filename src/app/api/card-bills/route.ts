import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getCardBills, insertCardBill, deleteCardBill, getFamilyByUser } from "@/lib/db";

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
  const family = await getFamilyByUser(userId);
  const items = await getCardBills(userId, family?.id, year, month);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { card_name, amount, due_date, year, month } = await req.json();
  if (!card_name || !amount) return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  const now = new Date();
  const family = await getFamilyByUser(userId);
  const id = await insertCardBill({
    user_id: userId,
    family_id: family?.id ?? null,
    year: year ?? now.getFullYear(),
    month: month ?? (now.getMonth() + 1),
    card_name,
    amount: Number(amount),
    due_date: due_date || "",
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteCardBill(Number(id), userId);
  return NextResponse.json({ ok: true });
}
