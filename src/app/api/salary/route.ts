import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getSalaryInfo, upsertSalaryInfo, getFamilySalaryInfo, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const year = parseInt(req.nextUrl.searchParams.get("year") || String(new Date().getFullYear()));
  const family = await getFamilyByUser(userId);

  const [myInfo, familyInfoList] = await Promise.all([
    getSalaryInfo(userId, year),
    family ? getFamilySalaryInfo(family.id, year) : Promise.resolve([]),
  ]);

  return NextResponse.json({ myInfo, familyInfoList, year });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const {
    year, annual_salary, credit_card_spending, debit_card_spending,
    cash_spending, transit_spending, traditional_market_spending,
  } = body;
  const family = await getFamilyByUser(userId);
  await upsertSalaryInfo({
    user_id: userId,
    family_id: family?.id ?? null,
    year: Number(year || new Date().getFullYear()),
    annual_salary: Number(annual_salary || 0),
    credit_card_spending: Number(credit_card_spending || 0),
    debit_card_spending: Number(debit_card_spending || 0),
    cash_spending: Number(cash_spending || 0),
    transit_spending: Number(transit_spending || 0),
    traditional_market_spending: Number(traditional_market_spending || 0),
  });
  return NextResponse.json({ ok: true });
}
