import { NextRequest, NextResponse } from "next/server";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import {
  findUserByEmail,
  getFamilyByUser,
  getWebAuthnCredentialsByUserId,
  getWebAuthnCredentialById,
  updateCredentialCounter,
  incrementSessionVersion,
} from "@/lib/db";
import { makeToken } from "@/lib/auth";

// 인메모리 챌린지 저장 (key: email, 5분 만료)
const challengeStore = new Map<string, { challenge: string; userId: number; expires: number }>();

function getRpConfig(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const rpID = host.split(":")[0];
  const origin = `${proto}://${host}`;
  return { rpID, origin };
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    action: string;
    email?: string;
    response?: AuthenticationResponseJSON;
  };
  const { rpID, origin } = getRpConfig(req);

  // ── 인증 시작 ──
  if (body.action === "begin") {
    if (!body.email) return NextResponse.json({ error: "이메일을 입력해주세요." }, { status: 400 });

    const user = await findUserByEmail(body.email);
    if (!user) return NextResponse.json({ error: "등록된 이메일이 없습니다." }, { status: 404 });

    const credentials = await getWebAuthnCredentialsByUserId(user.id);
    if (credentials.length === 0) {
      return NextResponse.json(
        { error: "이 계정에 등록된 Face ID가 없습니다. 먼저 비밀번호로 로그인 후 Face ID를 등록해주세요." },
        { status: 404 }
      );
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map((c) => ({
        id: c.credential_id,
        transports: (c.transports ?? []) as AuthenticatorTransport[],
      })),
      userVerification: "required",
    });

    challengeStore.set(body.email, {
      challenge: options.challenge,
      userId: user.id,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json(options);
  }

  // ── 인증 완료 ──
  if (body.action === "complete") {
    if (!body.email || !body.response) {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    const stored = challengeStore.get(body.email);
    if (!stored || Date.now() > stored.expires) {
      return NextResponse.json({ error: "챌린지가 만료되었습니다. 다시 시도해주세요." }, { status: 400 });
    }

    const credential = await getWebAuthnCredentialById(body.response.id);
    if (!credential || credential.user_id !== stored.userId) {
      return NextResponse.json({ error: "인증 정보를 찾을 수 없습니다." }, { status: 404 });
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credential.credential_id,
          publicKey: Buffer.from(credential.public_key, "base64"),
          counter: credential.counter,
          transports: (credential.transports ?? []) as AuthenticatorTransport[],
        },
      });
    } catch (e) {
      console.error("WebAuthn auth verify error:", e);
      return NextResponse.json({ error: "인증 검증에 실패했습니다." }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: "Face ID 인증에 실패했습니다." }, { status: 401 });
    }

    await updateCredentialCounter(credential.credential_id, verification.authenticationInfo.newCounter);

    // 단일 기기 세션 갱신
    const sessionVersion = await incrementSessionVersion(stored.userId);
    const family = await getFamilyByUser(stored.userId);
    const user = await import("@/lib/db").then((m) => m.findUserById(stored.userId));

    const token = makeToken(stored.userId, sessionVersion);
    const res = NextResponse.json({
      ok: true,
      user: { id: user!.id, name: user!.name, email: user!.email },
      family,
    });
    res.cookies.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 });

    challengeStore.delete(body.email);
    return res;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
