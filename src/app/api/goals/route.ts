import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getGoals, updateGoalAmount, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  if (!family) return NextResponse.json([]);
  const goals = await getGoals(family.id);
  return NextResponse.json(goals);
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, current_amount } = await req.json();
  await updateGoalAmount(Number(id), Number(current_amount));
  return NextResponse.json({ ok: true });
}
