import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, deleteTripExpense } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string; expenseId: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  await deleteTripExpense(Number(params.expenseId));
  return NextResponse.json({ ok: true });
}