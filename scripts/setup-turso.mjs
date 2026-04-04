/**
 * Turso 자동 셋업 스크립트
 * 사용법: node scripts/setup-turso.mjs <API_TOKEN>
 *
 * API 토큰 발급: https://app.turso.tech → Settings → API Tokens → Create Token
 */

import fs from "fs";
import path from "path";

const API_TOKEN = process.argv[2];
if (!API_TOKEN) {
  console.error("❌ 사용법: node scripts/setup-turso.mjs <API_TOKEN>");
  console.error("   API 토큰: https://app.turso.tech → Settings → API Tokens → Create Token");
  process.exit(1);
}

const BASE = "https://api.turso.tech";
const DB_NAME = "moa-app";
const REGION = "nrt"; // 도쿄 (한국 최근접)

async function api(method, endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    console.error(`API Error ${res.status}:`, text);
    process.exit(1);
  }
  return JSON.parse(text);
}

async function main() {
  console.log("🔍 Turso 계정 확인 중...");

  // 1. 계정 정보 (organization name 필요)
  const orgs = await api("GET", "/v1/organizations");
  const org = orgs[0];
  if (!org) {
    console.error("❌ 조직 정보를 가져올 수 없습니다. API 토큰을 확인해주세요.");
    process.exit(1);
  }
  console.log(`✅ 계정: ${org.slug}`);

  // 2. DB 생성 (이미 있으면 스킵)
  console.log(`\n📦 데이터베이스 '${DB_NAME}' 생성 중...`);
  let dbUrl;
  try {
    const existingDbs = await api("GET", `/v1/organizations/${org.slug}/databases`);
    const existing = existingDbs.databases?.find((d) => d.Name === DB_NAME);
    if (existing) {
      console.log(`✅ 이미 존재하는 DB 사용: ${existing.Name}`);
      dbUrl = `libsql://${existing.Name}-${org.slug}.turso.io`;
    } else {
      const created = await api("POST", `/v1/organizations/${org.slug}/databases`, {
        name: DB_NAME,
        group: "default",
        location: REGION,
      });
      console.log(`✅ DB 생성 완료: ${created.database?.Name}`);
      dbUrl = `libsql://${DB_NAME}-${org.slug}.turso.io`;
    }
  } catch (e) {
    console.error("DB 생성 실패:", e);
    process.exit(1);
  }

  // 3. DB 토큰 발급
  console.log("\n🔑 인증 토큰 발급 중...");
  const tokenRes = await api(
    "POST",
    `/v1/organizations/${org.slug}/databases/${DB_NAME}/auth/tokens?expiration=never&authorization=full-access`,
    {}
  );
  const authToken = tokenRes.jwt;
  if (!authToken) {
    console.error("❌ 토큰 발급 실패:", JSON.stringify(tokenRes));
    process.exit(1);
  }
  console.log("✅ 토큰 발급 완료");

  // 4. .env.local 작성
  const envPath = path.join(process.cwd(), ".env.local");
  const envContent = `# Turso (libSQL) - 자동 생성됨
TURSO_DATABASE_URL=${dbUrl}
TURSO_AUTH_TOKEN=${authToken}
`;
  fs.writeFileSync(envPath, envContent, "utf8");
  console.log(`\n✅ .env.local 생성 완료`);
  console.log(`   DB URL  : ${dbUrl}`);
  console.log(`   Token   : ${authToken.slice(0, 20)}...`);

  // 5. 환경변수 요약 출력 (Render 대시보드용)
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋 Render 환경변수 (대시보드에 복붙):");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`TURSO_DATABASE_URL=${dbUrl}`);
  console.log(`TURSO_AUTH_TOKEN=${authToken}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n🚀 이제 npm run dev 로 로컬 확인 후 Render에 배포하세요!");
}

main().catch(console.error);
