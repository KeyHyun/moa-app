import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getFamilyByUser, getAssets, getAssetSnapshots, upsertAssetSnapshot } from "@/lib/db";

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

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = daysParam ? Math.min(Number(daysParam), 365) : 30;

  // 오늘 스냅샷 갱신
  const assets = await getAssets(family.id, userId);
  const total = assets.reduce((s, a) => s + a.amount, 0);
  await upsertAssetSnapshot(family.id, total);

  const rows = await getAssetSnapshots(family.id, days);
  return NextResponse.json(rows.map((r) => ({ date: r.date, total: r.total_amount })));
}
