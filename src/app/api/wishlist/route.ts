import { NextRequest, NextResponse } from "next/server";
import { parseToken } from "@/lib/auth";
import { getPropertyWishlist, insertPropertyWishlist, deletePropertyWishlist, getFamilyByUser } from "@/lib/db";

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  return parseToken(token)?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const family = await getFamilyByUser(userId);
  const items = await getPropertyWishlist(userId, family?.id);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, address, price, property_type, area, floor, naver_url, notes, visibility } = body;
  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  const id = await insertPropertyWishlist({
    user_id: userId,
    family_id: family?.id ?? null,
    name,
    address: address || "",
    price: price ? Number(price) : null,
    property_type: property_type || "apartment",
    area: area ? Number(area) : null,
    floor: floor || "",
    naver_url: naver_url || "",
    notes: notes || "",
    visibility: visibility || "family",
  });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await deletePropertyWishlist(Number(id), userId);
  return NextResponse.json({ ok: true });
}
