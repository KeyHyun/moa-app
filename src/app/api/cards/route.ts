import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import {
  getUserCards, insertUserCard, updateUserCard, deleteUserCard,
  getFamilyByUser, getCardPeriodSpending,
} from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

function getBillingPeriod(billingDay: number): { from: string; to: string; nextBilling: string; daysLeft: number } {
  const today = new Date();
  const todayDay = today.getDate();
  const todayStr = today.toISOString().slice(0, 10);

  if (!billingDay) {
    const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysLeft = Math.ceil((nextMonth.getTime() - today.getTime()) / 86400000);
    return { from, to: todayStr, nextBilling: nextMonth.toISOString().slice(0, 10), daysLeft };
  }

  let periodStart: Date;
  if (todayDay >= billingDay) {
    periodStart = new Date(today.getFullYear(), today.getMonth(), billingDay);
  } else {
    periodStart = new Date(today.getFullYear(), today.getMonth() - 1, billingDay);
  }
  const nextBilling = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, billingDay);
  const daysLeft = Math.ceil((nextBilling.getTime() - today.getTime()) / 86400000);

  return {
    from: periodStart.toISOString().slice(0, 10),
    to: todayStr,
    nextBilling: nextBilling.toISOString().slice(0, 10),
    daysLeft: Math.max(0, daysLeft),
  };
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);

  const cards = await getUserCards(userId, family?.id);

  // 카드별 결제주기 지출 계산
  const cardsWithSpending = await Promise.all(
    cards.map(async (card) => {
      const period = getBillingPeriod(card.billing_day);
      const periodSpending = family
        ? await getCardPeriodSpending(family.id, card.card_name, period.from, period.to)
        : 0;
      return { ...card, period_spending: periodSpending, billing_period: period };
    })
  );

  return NextResponse.json({ cards: cardsWithSpending });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { card_name, card_type, billing_day, benefit_target } = await req.json();
  if (!card_name) return NextResponse.json({ error: "카드명을 입력해주세요." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  const id = await insertUserCard({
    user_id: userId,
    family_id: family?.id ?? null,
    card_name,
    card_type: card_type || "credit",
    billing_day: billing_day ? Number(billing_day) : 0,
    benefit_target: benefit_target ? Number(benefit_target) : 0,
  });
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, card_name, card_type, billing_day, benefit_target } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const family = await getFamilyByUser(userId);
  await updateUserCard(Number(id), family?.id, {
    ...(card_name !== undefined && { card_name }),
    ...(card_type !== undefined && { card_type }),
    ...(billing_day !== undefined && { billing_day: Number(billing_day) }),
    ...(benefit_target !== undefined && { benefit_target: Number(benefit_target) }),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deleteUserCard(Number(id), userId);
  return NextResponse.json({ ok: true });
}
