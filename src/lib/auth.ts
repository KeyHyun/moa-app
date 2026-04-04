export function makeToken(userId: number) {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString("base64");
}

export function parseToken(token: string): { userId: number } | null {
  try { return JSON.parse(Buffer.from(token, "base64").toString()); } catch { return null; }
}
