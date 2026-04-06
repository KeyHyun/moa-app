import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getTransactions, insertTransaction, updateTransaction, deleteTransaction, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  const p = req.nextUrl.searchParams;
  const limit = parseInt(p.get("limit") || "500");

  let fromDate: string | undefined;
  let toDate: string | undefined;

  if (p.get("from") && p.get("to")) {
    fromDate = p.get("from")!;
    toDate = p.get("to")!;
  } else if (p.get("year") && p.get("month")) {
    const year = p.get("year")!;
    const month = p.get("month")!.padStart(2, "0");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    fromDate = `${year}-${month}-01`;
    toDate = `${year}-${month}-${lastDay}`;
  }

  const items = await getTransactions(userId, family?.id, limit, "all", fromDate, toDate);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { type, category, amount, memo, date, visibility, card_name, sub_category } = body;
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
    sub_category: sub_category || "",
  });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { id, type, category, amount, memo, date, visibility, card_name, sub_category } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const family = await getFamilyByUser(userId);
  await updateTransaction(Number(id), userId, family?.id, {
    ...(type !== undefined && { type }),
    ...(category !== undefined && { category }),
    ...(amount !== undefined && { amount: Number(amount) }),
    ...(memo !== undefined && { memo }),
    ...(date !== undefined && { date }),
    ...(visibility !== undefined && { visibility }),
    ...(card_name !== undefined && { card_name }),
    ...(sub_category !== undefined && { sub_category }),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteTransaction(Number(id), userId);
  return NextResponse.json({ ok: true });
}
