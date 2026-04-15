import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { isTripMember, addTripGuestMember } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const member = await isTripMember(tripId, userId);
  if (!member) return NextResponse.json({ error: "접근 권한이 없습니다." }, { status: 403 });
  const { action, guest_name } = await req.json();

  if (action === "add_guest") {
    if (!guest_name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    const memberId = await addTripGuestMember(tripId, guest_name);
    return NextResponse.json({ ok: true, memberId });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}