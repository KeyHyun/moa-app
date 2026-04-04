import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail, findUserById, createUser, getFamilyByUser } from "@/lib/db";
import { makeToken, parseToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { action, name, email, password } = await req.json();

  if (action === "login") {
    const user = await findUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return NextResponse.json({ error: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });

    const family = await getFamilyByUser(user.id);
    const token = makeToken(user.id);
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email }, family });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  if (action === "register") {
    if (await findUserByEmail(email))
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    const hash = bcrypt.hashSync(password, 10);
    const userId = await createUser(name, email, hash);
    const token = makeToken(userId);
    const res = NextResponse.json({ ok: true, user: { id: userId, name, email }, family: null });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("token");
    return res;
  }

  if (action === "me") {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = parseToken(token);
    if (!parsed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const u = await findUserById(parsed.userId);
    if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const family = await getFamilyByUser(u.id);
    return NextResponse.json({ user: u, family });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
