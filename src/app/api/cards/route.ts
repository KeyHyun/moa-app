import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getUserCards, insertUserCard, deleteUserCard, getFamilyByUser, getCardSpendingSummary } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);

  const cards = await getUserCards(userId, family?.id);

  // 이번 달 카드별 지출 집계
  const now = new Date();
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(now.getFullYear()));
  const month = parseInt(req.nextUrl.searchParams.get("month") || String(now.getMonth() + 1));
  const summary = family ? await getCardSpendingSummary(family.id, year, month) : [];

  return NextResponse.json({ cards, summary });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { card_name, card_type } = await req.json();
  if (!card_name) return NextResponse.json({ error: "카드명을 입력해주세요." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  const id = await insertUserCard({
    user_id: userId,
    family_id: family?.id ?? null,
    card_name,
    card_type: card_type || "credit",
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteUserCard(Number(id), userId);
  return NextResponse.json({ ok: true });
}
