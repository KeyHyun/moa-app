import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getFamilyByUser, getFamilyMembers, createFamily, joinFamily } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  if (!family) return NextResponse.json({ family: null, members: [] });
  const members = await getFamilyMembers(family.id);
  return NextResponse.json({ family, members });
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, name, invite_code } = await req.json();

  if (action === "create") {
    if (!name) return NextResponse.json({ error: "가족 이름을 입력해주세요." }, { status: 400 });
    const existing = await getFamilyByUser(userId);
    if (existing) return NextResponse.json({ error: "이미 가족 그룹에 속해 있습니다." }, { status: 409 });
    const familyId = await createFamily(name, userId);
    const family = await getFamilyByUser(userId);
    return NextResponse.json({ ok: true, familyId, family });
  }

  if (action === "join") {
    if (!invite_code) return NextResponse.json({ error: "초대 코드를 입력해주세요." }, { status: 400 });
    const familyId = await joinFamily(invite_code.toUpperCase(), userId);
    if (!familyId) return NextResponse.json({ error: "유효하지 않은 초대 코드입니다." }, { status: 404 });
    const family = await getFamilyByUser(userId);
    return NextResponse.json({ ok: true, familyId, family });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
