import { NextRequest, NextResponse } from "next/server";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import {
  findUserById,
  getWebAuthnCredentialsByUserId,
  saveWebAuthnCredential,
  deleteWebAuthnCredentialsByUserId,
} from "@/lib/db";
import { parseToken } from "@/lib/auth";

// 인메모리 챌린지 저장 (5분 만료)
const challengeStore = new Map<number, { challenge: string; expires: number }>();

function getRpConfig(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const rpID = host.split(":")[0];
  const origin = `${proto}://${host}`;
  return { rpID, origin };
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const parsed = parseToken(token);
  if (!parsed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { action: string; response?: RegistrationResponseJSON };
  const { rpID, origin } = getRpConfig(req);

  // ── 등록 여부 확인 ──
  if (body.action === "check") {
    const credentials = await getWebAuthnCredentialsByUserId(parsed.userId);
    return NextResponse.json({ hasCredential: credentials.length > 0 });
  }

  // ── 등록 해제 ──
  if (body.action === "delete") {
    await deleteWebAuthnCredentialsByUserId(parsed.userId);
    return NextResponse.json({ ok: true });
  }

  // ── 등록 시작 ──
  if (body.action === "begin") {
    const user = await findUserById(parsed.userId);
    if (!user) return NextResponse.json({ error: "유저를 찾을 수 없습니다." }, { status: 404 });

    const existingCredentials = await getWebAuthnCredentialsByUserId(parsed.userId);

    const options = await generateRegistrationOptions({
      rpName: "모아",
      rpID,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "required",
      },
      excludeCredentials: existingCredentials.map((c) => ({
        id: c.credential_id,
        transports: (c.transports ?? []) as AuthenticatorTransport[],
      })),
    });

    challengeStore.set(parsed.userId, {
      challenge: options.challenge,
      expires: Date.now() + 5 * 60 * 1000,
    });

    return NextResponse.json(options);
  }

  // ── 등록 완료 ──
  if (body.action === "complete") {
    if (!body.response) return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });

    const stored = challengeStore.get(parsed.userId);
    if (!stored || Date.now() > stored.expires) {
      return NextResponse.json({ error: "챌린지가 만료되었습니다. 다시 시도해주세요." }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: stored.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (e) {
      console.error("WebAuthn register verify error:", e);
      return NextResponse.json({ error: "인증 검증에 실패했습니다." }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Face ID 등록에 실패했습니다." }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64");

    await saveWebAuthnCredential(
      parsed.userId,
      credential.id,
      publicKeyBase64,
      credential.counter,
      (credential.transports ?? []) as string[]
    );

    challengeStore.delete(parsed.userId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
