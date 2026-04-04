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
  const { name, location, property_type, trade_type, min_price, max_price, min_area, max_area, naver_complex_url, floor_min, floor_max, notes, visibility } = body;
  if (!name) return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  const family = await getFamilyByUser(userId);
  const id = await insertPropertyWishlist({
    user_id: userId,
    family_id: family?.id ?? null,
    name,
    location: location || "",
    property_type: property_type || "APT",
    trade_type: trade_type || "A1",
    min_price: min_price ? Number(min_price) : null,
    max_price: max_price ? Number(max_price) : null,
    min_area: min_area ? Number(min_area) : null,
    max_area: max_area ? Number(max_area) : null,
    naver_complex_url: naver_complex_url || "",
    floor_min: floor_min ? Number(floor_min) : null,
    floor_max: floor_max ? Number(floor_max) : null,
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
