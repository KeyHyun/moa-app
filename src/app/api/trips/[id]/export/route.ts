import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, getTripById, getTripMembers, getTripExpenses, getTripSettlement, getTripSettlementSummary } from "@/lib/db";
import * as XLSX from "xlsx";

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

  const [trip, members, expenses, settlement, summary] = await Promise.all([
    getTripById(tripId),
    getTripMembers(tripId),
    getTripExpenses(tripId),
    getTripSettlement(tripId),
    getTripSettlementSummary(tripId),
  ]);

  if (!trip) return NextResponse.json({ error: "여행을 찾을 수 없습니다." }, { status: 404 });

  const wb = XLSX.utils.book_new();

  // Sheet 1: 지출 내역
  const expenseRows = expenses.map((e) => {
    const row: Record<string, number | string> = {
      날짜: e.date,
      내용: e.description,
      카테고리: e.category,
      총액: e.amount,
      결제자: e.paid_by_name,
    };
    for (const m of members) {
      const split = e.splits?.find((s) => s.member_id === m.id);
      row[`${m.name} 부담액`] = split ? split.share_amount : 0;
    }
    return row;
  });

  // 결론 섹션: 지출 내역 시트 하단에 멤버별 요약 + 정산 정보 추가
  const blankRow: Record<string, string> = { 날짜: "", 내용: "", 카테고리: "", 총액: "", 결제자: "" };
  const summaryTitleRow: Record<string, string> = { 날짜: "【 멤버별 요약 】", 내용: "", 카테고리: "", 총액: "", 결제자: "" };

  const memberSummaryRows = summary.members.map((m) => {
    const row: Record<string, number | string> = {
      날짜: m.name,
      내용: `결제: ${m.paid}`,
      카테고리: `부담: ${m.share}`,
      총액: m.balance,
      결제자: m.balance > 0 ? "받을 돈" : m.balance < 0 ? "보낼 돈" : "정산 완료",
    };
    return row;
  });

  const settlementTitleRow: Record<string, string> = { 날짜: "【 정산 결과 】", 내용: "", 카테고리: "", 총액: "", 결제자: "" };

  const settlementRows = settlement.map((s) => {
    const row: Record<string, number | string> = {
      날짜: `${s.from_member_name} → ${s.to_member_name}`,
      내용: "",
      카테고리: "",
      총액: s.amount,
      결제자: "송금 필요",
    };
    return row;
  });

  const allRows = [...expenseRows, blankRow, summaryTitleRow, ...memberSummaryRows, blankRow, settlementTitleRow, ...settlementRows];

  const ws1 = XLSX.utils.json_to_sheet(allRows);
  XLSX.utils.book_append_sheet(wb, ws1, "지출 내역");

  // Sheet 2: 멤버별 요약
  const summaryRows2 = summary.members.map((m) => ({
    이름: m.name,
    "총 결제액": m.paid,
    "총 부담액": m.share,
    차액: m.balance,
    비고: m.balance > 0 ? "받을 돈" : m.balance < 0 ? "보낼 돈" : "정산 완료",
  }));
  const ws2 = XLSX.utils.json_to_sheet(summaryRows2);
  XLSX.utils.book_append_sheet(wb, ws2, "멤버별 요약");

  // Sheet 3: 정산 결과
  if (settlement.length > 0) {
    const settlementRows3 = settlement.map((s) => ({
      "보낼 사람": s.from_member_name,
      "받을 사람": s.to_member_name,
      금액: s.amount,
    }));
    const ws3 = XLSX.utils.json_to_sheet(settlementRows3);
    XLSX.utils.book_append_sheet(wb, ws3, "정산 결과");
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const fileName = encodeURIComponent(`${trip.name}_정산.xlsx`);

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${fileName}`,
    },
  });
}