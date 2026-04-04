export function makeToken(userId: number, sessionVersion: number) {
  return Buffer.from(JSON.stringify({ userId, sessionVersion, ts: Date.now() })).toString("base64");
}

export function parseToken(token: string): { userId: number; sessionVersion: number } | null {
  try {
    const parsed = JSON.parse(Buffer.from(token, "base64").toString());
    if (typeof parsed.userId !== "number") return null;
    return { userId: parsed.userId, sessionVersion: parsed.sessionVersion ?? 0 };
  } catch {
    return null;
  }
}
