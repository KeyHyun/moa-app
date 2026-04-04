import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getAssets, insertAsset, updateAsset, deleteAsset, getFamilyByUser, upsertAssetSnapshot } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

async function recordSnapshot(userId: number) {
  const family = await getFamilyByUser(userId);
  if (!family) return;
  const assets = await getAssets(family.id, userId);
  const total = assets.reduce((s, a) => s + a.amount, 0);
  await upsertAssetSnapshot(family.id, total);
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  const items = await getAssets(family?.id, userId);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { type, label, amount, institution, visibility, owner_user_id } = await req.json();
  if (!type || !label || amount == null)
    return NextResponse.json({ error: "필수 항목이 누락됐습니다." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  // owner_user_id: family member override (defaults to current user)
  const assetUserId = owner_user_id ? Number(owner_user_id) : userId;
  const id = await insertAsset({
    family_id: family?.id ?? null,
    user_id: assetUserId,
    type,
    label,
    amount: Number(amount),
    institution: institution || "",
    visibility: visibility || "family",
  });
  await recordSnapshot(userId);
  return NextResponse.json({ ok: true, id });
}

export async function PATCH(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, amount, label, institution, visibility, owner_user_id } = await req.json();
  const family = await getFamilyByUser(userId);
  await updateAsset(Number(id), userId, family?.id, {
    ...(amount != null && { amount: Number(amount) }),
    ...(label !== undefined && { label }),
    ...(institution !== undefined && { institution }),
    ...(visibility !== undefined && { visibility }),
    ...(owner_user_id !== undefined && { user_id: Number(owner_user_id) }),
  });
  await recordSnapshot(userId);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  const family = await getFamilyByUser(userId);
  await deleteAsset(Number(id), userId, family?.id);
  await recordSnapshot(userId);
  return NextResponse.json({ ok: true });
}
