import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, getTripSettlement, getTripSettlementSummary, getTripFunds, getTotalFunds, getTripExpenses } from "@/lib/db";

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

  const [settlement, summary, funds, totalFunds, expenses] = await Promise.all([
    getTripSettlement(tripId),
    getTripSettlementSummary(tripId),
    getTripFunds(tripId),
    getTotalFunds(tripId),
    getTripExpenses(tripId),
  ]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalFunds - totalExpense;

  // 공금 잔액 분배: 각 멤버의 기여 비율에 따라 환불
  let fundDistribution: Array<{ memberId: number; name: string; contributed: number; refund: number }> = [];
  if (remaining > 0 && totalFunds > 0) {
    const memberFundTotals: Record<number, { name: string; contributed: number }> = {};
    for (const f of funds) {
      if (!memberFundTotals[f.member_id]) {
        memberFundTotals[f.member_id] = { name: f.member_name, contributed: 0 };
      }
      memberFundTotals[f.member_id].contributed += f.amount;
    }

    // 비율에 따라 잔액 분배 (원 단위 절삭, 나머지는 첫 기여자에게)
    let distributed = 0;
    const entries = Object.entries(memberFundTotals);
    fundDistribution = entries.map(([mid, info], i) => {
      let refund: number;
      if (i === entries.length - 1) {
        refund = remaining - distributed;
      } else {
        refund = Math.floor(remaining * (info.contributed / totalFunds));
        distributed += refund;
      }
      return {
        memberId: Number(mid),
        name: info.name,
        contributed: info.contributed,
        refund,
      };
    });
  }

  return NextResponse.json({ settlement, summary, totalFunds, totalExpense, remaining, fundDistribution });
}