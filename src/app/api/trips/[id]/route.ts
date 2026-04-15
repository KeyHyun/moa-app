import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getTripById, getTripMembers, isTripMember, deleteTrip, updateTrip } from "@/lib/db";

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
  const trip = await getTripById(tripId);
  const members = await getTripMembers(tripId);
  return NextResponse.json({ trip, members });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const body = await req.json();
  const ok = await updateTrip(tripId, userId, body);
  if (!ok) return NextResponse.json({ error: "수정 권한이 없습니다." }, { status: 403 });
  const trip = await getTripById(tripId);
  return NextResponse.json({ ok: true, trip });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tripId = Number(params.id);
  const ok = await deleteTrip(tripId, userId);
  if (!ok) return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
  return NextResponse.json({ ok: true });
}