const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30일

export function makeToken(userId: number, sessionVersion: number) {
  return Buffer.from(JSON.stringify({ userId, sessionVersion, ts: Date.now() })).toString("base64");
}

export function parseToken(token: string): { userId: number; sessionVersion: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString());
    if (typeof parsed.userId !== "number") return null;
    // 30일 만료 체크
    if (!parsed.ts || Date.now() - parsed.ts > SESSION_MAX_AGE_MS) return null;
    return { userId: parsed.userId, sessionVersion: parsed.sessionVersion ?? 0 };
  } catch {
    return null;
  }
}
