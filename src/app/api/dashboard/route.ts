import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import {
  getAssets,
  getTransactions,
  getGoals,
  getCardSpendingSummary,
  getAssetSnapshots,
  getFamilyByUser,
  getSessionVersion,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = parseToken(token);
  if (!parsed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // session_version 검증
  const currentVersion = await getSessionVersion(parsed.userId);
  if (parsed.sessionVersion !== currentVersion) {
    return NextResponse.json(
      { error: "다른 기기에서 로그인되었습니다. 다시 로그인해주세요." },
      { status: 401 }
    );
  }

  const family = await getFamilyByUser(parsed.userId);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // viewMode 파싱 (private | family)
  const url = new URL(req.url);
  const viewParam = url.searchParams.get("view");
  const viewMode: "family" | "private" = viewParam === "private" ? "private" : "family";

  // 모든 데이터를 병렬로 조회
  const [assets, transactions, goals, cardSummary, snapshots] = await Promise.all([
    getAssets(family?.id, parsed.userId, viewMode),
    getTransactions(parsed.userId, family?.id, 200, viewMode),
    family && viewMode === "family" ? getGoals(family.id) : Promise.resolve([]),
    family && viewMode === "family" ? getCardSpendingSummary(family.id, year, month) : Promise.resolve([]),
    family && viewMode === "family" ? getAssetSnapshots(family.id, 30) : Promise.resolve([]),
  ]);

  return NextResponse.json({ assets, transactions, goals, cardSummary, snapshots });
}
