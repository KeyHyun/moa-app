import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, addTripFund, getTripFunds, getTotalFunds, getTripExpenses } from "@/lib/db";

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
  const [funds, totalFunds, expenses] = await Promise.all([
    getTripFunds(tripId),
    getTotalFunds(tripId),
    getTripExpenses(tripId),
  ]);
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  return NextResponse.json({ funds, totalFunds, totalExpense, remaining: totalFunds - totalExpense });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  const { member_id, amount, note } = await req.json();
  if (!member_id || !amount)
    return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
  const fundId = await addTripFund(tripId, Number(member_id), Number(amount), note || "");
  return NextResponse.json({ ok: true, fundId });
}