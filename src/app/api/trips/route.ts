import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getTripsByUser, createTrip, joinTrip } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trips = await getTripsByUser(userId);
  return NextResponse.json(trips);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, name, destination, start_date, end_date, description, currency, invite_code } = await req.json();

  if (action === "create") {
    if (!name || !destination || !start_date || !end_date)
      return NextResponse.json({ error: "필수 항목을 입력해주세요." }, { status: 400 });
    const tripId = await createTrip(name, destination, start_date, end_date, description || "", userId, currency || "KRW");
    return NextResponse.json({ ok: true, tripId });
  }

  if (action === "join") {
    if (!invite_code) return NextResponse.json({ error: "초대 코드를 입력해주세요." }, { status: 400 });
    const tripId = await joinTrip(invite_code, userId);
    if (!tripId) return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
    return NextResponse.json({ ok: true, tripId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}