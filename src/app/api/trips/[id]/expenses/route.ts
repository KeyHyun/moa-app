import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, addTripExpense, getTripExpenses, updateTripExpense } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  const expenses = await getTripExpenses(tripId);
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  const { paid_by_member_id, amount, description, category, date, split_type, splits } = await req.json();
  if (!paid_by_member_id || !amount || !description || !date)
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  const expenseId = await addTripExpense(
    tripId, Number(paid_by_member_id), Number(amount), description, category || "기타", date,
    split_type || "equal",
    (splits || []).map((s: { member_id: number; share_amount: number }) => ({ memberId: Number(s.member_id), shareAmount: Number(s.share_amount) }))
  );
  return NextResponse.json({ ok: true, expenseId });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  const { expense_id, paid_by_member_id, amount, description, category, date, split_type, splits } = await req.json();
  if (!expense_id) return NextResponse.json({ error: "expense_id가 필요합니다." }, { status: 400 });
  const updateData: Record<string, unknown> = {};
  if (paid_by_member_id !== undefined) updateData.paid_by_member_id = Number(paid_by_member_id);
  if (amount !== undefined) updateData.amount = Number(amount);
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (date !== undefined) updateData.date = date;
  if (split_type !== undefined) updateData.split_type = split_type;
  if (splits !== undefined) {
    updateData.splits = splits.map((s: { member_id: number; share_amount: number }) => ({
      memberId: Number(s.member_id), shareAmount: Number(s.share_amount),
    }));
  }
  await updateTripExpense(Number(expense_id), updateData);
  return NextResponse.json({ ok: true });
}