import { createClient, Client } from "@libsql/client";
import path from "path";
import bcrypt from "bcryptjs";

// ── 클라이언트 ──
function makeClient(): Client {
  const url =
    process.env.TURSO_DATABASE_URL ??
    `file:${path.join(process.cwd(), "data/moa.db").replace(/\\/g, "/")}`;
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

const client = makeClient();

// ── 스키마 초기화 (프로세스당 1회) ──
let _initPromise: Promise<void> | null = null;

async function _initSchema() {
  await client.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS families (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        invite_code TEXT NOT NULL UNIQUE,
        owner_id INTEGER NOT NULL REFERENCES users(id),
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS family_members (
        family_id INTEGER NOT NULL REFERENCES families(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        PRIMARY KEY (family_id, user_id)
      )`,
      `CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER REFERENCES families(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL CHECK(type IN ('income','expense')),
        category TEXT NOT NULL,
        amount INTEGER NOT NULL,
        memo TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL,
        visibility TEXT NOT NULL DEFAULT 'family',
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER REFERENCES families(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        amount INTEGER NOT NULL,
        institution TEXT NOT NULL DEFAULT '',
        visibility TEXT NOT NULL DEFAULT 'family',
        updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER REFERENCES families(id),
        name TEXT NOT NULL,
        target_amount INTEGER NOT NULL,
        current_amount INTEGER NOT NULL DEFAULT 0,
        emoji TEXT NOT NULL DEFAULT '🎯',
        deadline TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS asset_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        family_id INTEGER REFERENCES families(id),
        date TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        UNIQUE(family_id, date)
      )`,
      `CREATE TABLE IF NOT EXISTS user_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        family_id INTEGER REFERENCES families(id),
        card_name TEXT NOT NULL,
        card_type TEXT NOT NULL DEFAULT 'credit',
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS card_bills (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        family_id INTEGER REFERENCES families(id),
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        card_name TEXT NOT NULL,
        amount INTEGER NOT NULL,
        due_date TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_card_bills_family ON card_bills(family_id, year, month)`,
      `CREATE TABLE IF NOT EXISTS property_wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        family_id INTEGER REFERENCES families(id),
        name TEXT NOT NULL,
        address TEXT NOT NULL DEFAULT '',
        price INTEGER,
        property_type TEXT NOT NULL DEFAULT 'apartment',
        area REAL,
        floor TEXT NOT NULL DEFAULT '',
        naver_url TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        visibility TEXT NOT NULL DEFAULT 'family',
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE TABLE IF NOT EXISTS monthly_budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        family_id INTEGER REFERENCES families(id),
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        budget_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        UNIQUE(user_id, year, month)
      )`,
      `CREATE TABLE IF NOT EXISTS salary_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        family_id INTEGER REFERENCES families(id),
        year INTEGER NOT NULL,
        annual_salary INTEGER NOT NULL DEFAULT 0,
        credit_card_spending INTEGER NOT NULL DEFAULT 0,
        debit_card_spending INTEGER NOT NULL DEFAULT 0,
        cash_spending INTEGER NOT NULL DEFAULT 0,
        transit_spending INTEGER NOT NULL DEFAULT 0,
        traditional_market_spending INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
        UNIQUE(user_id, year)
      )`,
      `CREATE TABLE IF NOT EXISTS webauthn_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        credential_id TEXT NOT NULL UNIQUE,
        public_key TEXT NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        transports TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_family ON transactions(family_id)`,
      `CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`,
      `CREATE INDEX IF NOT EXISTS idx_snapshots_family_date ON asset_snapshots(family_id, date)`,
    ],
    "write"
  );

  // 기존 테이블에 신규 컬럼 추가 (이미 있으면 무시)
  const migrations = [
    "ALTER TABLE transactions ADD COLUMN visibility TEXT NOT NULL DEFAULT 'family'",
    "ALTER TABLE assets ADD COLUMN visibility TEXT NOT NULL DEFAULT 'family'",
    "ALTER TABLE transactions ADD COLUMN card_name TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE transactions ADD COLUMN sub_category TEXT NOT NULL DEFAULT ''",
    // property_wishlist filter columns
    "ALTER TABLE property_wishlist ADD COLUMN location TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE property_wishlist ADD COLUMN trade_type TEXT NOT NULL DEFAULT 'A1'",
    "ALTER TABLE property_wishlist ADD COLUMN min_price INTEGER",
    "ALTER TABLE property_wishlist ADD COLUMN max_price INTEGER",
    "ALTER TABLE property_wishlist ADD COLUMN min_area REAL",
    "ALTER TABLE property_wishlist ADD COLUMN max_area REAL",
    "ALTER TABLE property_wishlist ADD COLUMN naver_complex_url TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE property_wishlist ADD COLUMN floor_min INTEGER",
    "ALTER TABLE property_wishlist ADD COLUMN floor_max INTEGER",
    // session & webauthn
    "ALTER TABLE users ADD COLUMN session_version INTEGER NOT NULL DEFAULT 0",
    // card billing info
    "ALTER TABLE user_cards ADD COLUMN billing_day INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE user_cards ADD COLUMN benefit_target INTEGER NOT NULL DEFAULT 0",
    // 개인 예산 분리
    "ALTER TABLE monthly_budgets ADD COLUMN personal_budget_amount INTEGER NOT NULL DEFAULT 0",
    // 카드 공유 여부
    "ALTER TABLE user_cards ADD COLUMN is_shared INTEGER NOT NULL DEFAULT 0",
  ];
  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch { /* column already exists */ }
  }

  const r = await client.execute("SELECT COUNT(*) as c FROM users");
  if (Number(r.rows[0]["c"]) === 0) await _seed();
}

export function ensureInit(): Promise<void> {
  if (!_initPromise) {
    _initPromise = _initSchema().catch((e) => {
      _initPromise = null;
      throw e;
    });
  }
  return _initPromise;
}

// ── 시드 데이터 ──
async function _seed() {
  const hash = bcrypt.hashSync("test1234", 10);
  const ur = await client.execute({
    sql: "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    args: ["테스트 사용자", "test@moaapp.com", hash],
  });
  const userId = Number(ur.lastInsertRowid);

  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const fr = await client.execute({
    sql: "INSERT INTO families (name, invite_code, owner_id) VALUES (?, ?, ?)",
    args: ["우리 가족", inviteCode, userId],
  });
  const familyId = Number(fr.lastInsertRowid);

  await client.execute({
    sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'owner')",
    args: [familyId, userId],
  });

  // 자산
  const assetRows: [number, number, string, string, number, string][] = [
    [familyId, userId, "savings",     "국민은행 예금",      28500000, "국민은행"],
    [familyId, userId, "installment", "카카오뱅크 적금",    12000000, "카카오뱅크"],
    [familyId, userId, "investment",  "삼성증권 주식",      18420000, "삼성증권"],
    [familyId, userId, "realEstate",  "아파트 (시세)",     450000000, "KB시세"],
    [familyId, userId, "cash",        "현금 및 입출금",      3200000, ""],
    [familyId, userId, "mortgage",    "주택담보대출",      -200000000, "국민은행"],
  ];
  for (const a of assetRows) {
    await client.execute({
      sql: "INSERT INTO assets (family_id, user_id, type, label, amount, institution) VALUES (?, ?, ?, ?, ?, ?)",
      args: a,
    });
  }

  // 목표
  const goalRows: [number, string, number, number, string, string | null][] = [
    [familyId, "유럽 여행 적금", 5000000,  2100000, "✈️", "2025-12-31"],
    [familyId, "비상금 마련",   10000000,  6500000, "🛡️", null],
    [familyId, "새 차 구입",   30000000,  8000000, "🚗", "2026-06-30"],
  ];
  for (const g of goalRows) {
    await client.execute({
      sql: "INSERT INTO goals (family_id, name, target_amount, current_amount, emoji, deadline) VALUES (?, ?, ?, ?, ?, ?)",
      args: g,
    });
  }

  // 거래
  const today = new Date();
  const txRows: [number, number, string, string, number, string, number][] = [
    [familyId, userId, "income",  "급여",   3500000, "4월 월급",    -1],
    [familyId, userId, "expense", "식비",     45000, "마트 장보기",  0],
    [familyId, userId, "expense", "교통",      8500, "지하철",       0],
    [familyId, userId, "expense", "식비",     32000, "외식",        -1],
    [familyId, userId, "expense", "쇼핑",     89000, "옷 구입",     -2],
    [familyId, userId, "expense", "공과금",   75000, "전기·가스",   -3],
    [familyId, userId, "expense", "식비",     15000, "편의점",      -3],
    [familyId, userId, "expense", "문화",     14000, "영화 관람",   -4],
    [familyId, userId, "expense", "의료",     12000, "약국",        -5],
    [familyId, userId, "expense", "교육",    150000, "학원비",      -6],
  ];
  for (const [fid, uid, type, cat, amt, memo, offset] of txRows) {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    await client.execute({
      sql: "INSERT INTO transactions (family_id, user_id, type, category, amount, memo, date) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [fid, uid, type, cat, amt, memo, d.toISOString().slice(0, 10)],
    });
  }

  // 자산 스냅샷 (최근 180일)
  const totalNow = 512120000;
  const base = new Date();
  for (let i = 180; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const progress = (180 - i) / 180;
    const trend = totalNow * (0.92 + 0.08 * progress);
    const noise = (Math.sin(i * 7.3) * 0.008 + Math.cos(i * 3.1) * 0.005) * totalNow;
    await client.execute({
      sql: "INSERT OR IGNORE INTO asset_snapshots (family_id, date, total_amount) VALUES (?, ?, ?)",
      args: [familyId, dateStr, Math.round(trend + noise)],
    });
  }
}

// ── Users ──
export async function findUserByEmail(email: string) {
  await ensureInit();
  const r = await client.execute({ sql: "SELECT * FROM users WHERE email = ?", args: [email] });
  if (!r.rows[0]) return undefined;
  const row = r.rows[0];
  return {
    id: Number(row["id"]),
    name: String(row["name"]),
    email: String(row["email"]),
    password_hash: String(row["password_hash"]),
  };
}

export async function findUserById(id: number) {
  await ensureInit();
  const r = await client.execute({ sql: "SELECT id, name, email FROM users WHERE id = ?", args: [id] });
  if (!r.rows[0]) return undefined;
  const row = r.rows[0];
  return { id: Number(row["id"]), name: String(row["name"]), email: String(row["email"]) };
}

export async function createUser(name: string, email: string, passwordHash: string) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    args: [name, email, passwordHash],
  });
  return Number(r.lastInsertRowid);
}

// ── Families ──
export async function getFamilyByUser(userId: number) {
  await ensureInit();
  const r = await client.execute({
    sql: `SELECT f.*, fm.role FROM families f
          JOIN family_members fm ON fm.family_id = f.id
          WHERE fm.user_id = ?`,
    args: [userId],
  });
  if (!r.rows[0]) return undefined;
  const row = r.rows[0];
  return {
    id: Number(row["id"]),
    name: String(row["name"]),
    invite_code: String(row["invite_code"]),
    role: String(row["role"]),
  };
}

export async function createFamily(name: string, ownerId: number) {
  await ensureInit();
  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
  const r = await client.execute({
    sql: "INSERT INTO families (name, invite_code, owner_id) VALUES (?, ?, ?)",
    args: [name, inviteCode, ownerId],
  });
  const familyId = Number(r.lastInsertRowid);
  await client.execute({
    sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'owner')",
    args: [familyId, ownerId],
  });
  return familyId;
}

export async function joinFamily(inviteCode: string, userId: number) {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT id FROM families WHERE invite_code = ?",
    args: [inviteCode],
  });
  if (!r.rows[0]) return null;
  const newFamilyId = Number(r.rows[0]["id"]);

  try {
    await client.execute({
      sql: "INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, 'member')",
      args: [newFamilyId, userId],
    });
  } catch { /* already member */ }

  // 기존 자산·거래를 새 가족으로 마이그레이션
  await client.execute({
    sql: "UPDATE assets SET family_id = ? WHERE user_id = ?",
    args: [newFamilyId, userId],
  });
  await client.execute({
    sql: "UPDATE transactions SET family_id = ? WHERE user_id = ?",
    args: [newFamilyId, userId],
  });
  await client.execute({
    sql: "UPDATE goals SET family_id = ? WHERE family_id IN (SELECT id FROM families WHERE owner_id = ?)",
    args: [newFamilyId, userId],
  });

  return newFamilyId;
}

export async function getFamilyMembers(familyId: number) {
  await ensureInit();
  const r = await client.execute({
    sql: `SELECT u.id, u.name, u.email, fm.role, fm.joined_at
          FROM family_members fm JOIN users u ON u.id = fm.user_id
          WHERE fm.family_id = ?`,
    args: [familyId],
  });
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    name: String(row["name"]),
    email: String(row["email"]),
    role: String(row["role"]),
    joined_at: String(row["joined_at"]),
  }));
}

// ── Transactions ──
export async function getTransactions(
  userId: number, familyId?: number, limit = 100,
  viewMode: "family" | "private" | "all" = "all",
  fromDate?: string, toDate?: string,
) {
  await ensureInit();
  const dateClause = fromDate && toDate ? ` AND t.date >= '${fromDate}' AND t.date <= '${toDate}'` : "";
  let r;
  if (familyId) {
    if (viewMode === "private") {
      r = await client.execute({
        sql: `SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.family_id = ? AND t.user_id = ? AND t.visibility = 'private'${dateClause} ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
        args: [familyId, userId, limit],
      });
    } else if (viewMode === "family") {
      r = await client.execute({
        sql: `SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.family_id = ? AND t.visibility = 'family'${dateClause} ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
        args: [familyId, limit],
      });
    } else {
      r = await client.execute({
        sql: `SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.family_id = ? AND (t.visibility = 'family' OR t.user_id = ?)${dateClause} ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
        args: [familyId, userId, limit],
      });
    }
  } else {
    r = await client.execute({
      sql: `SELECT t.*, u.name as user_name FROM transactions t JOIN users u ON u.id = t.user_id WHERE t.user_id = ?${dateClause} ORDER BY t.date DESC, t.created_at DESC LIMIT ?`,
      args: [userId, limit],
    });
  }
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    family_id: row["family_id"] != null ? Number(row["family_id"]) : null,
    user_id: Number(row["user_id"]),
    type: String(row["type"]),
    category: String(row["category"]),
    amount: Number(row["amount"]),
    memo: String(row["memo"]),
    date: String(row["date"]),
    user_name: String(row["user_name"]),
    visibility: String(row["visibility"] ?? "family"),
    card_name: String(row["card_name"] ?? ""),
    sub_category: String(row["sub_category"] ?? ""),
  }));
}

export async function insertTransaction(data: {
  family_id?: number; user_id: number; type: string;
  category: string; amount: number; memo: string; date: string;
  visibility?: string; card_name?: string; sub_category?: string;
}) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO transactions (family_id, user_id, type, category, amount, memo, date, visibility, card_name, sub_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [data.family_id ?? null, data.user_id, data.type, data.category, data.amount, data.memo, data.date, data.visibility ?? "family", data.card_name ?? "", data.sub_category ?? ""],
  });
  return Number(r.lastInsertRowid);
}

export async function updateTransaction(id: number, userId: number, familyId: number | undefined, data: Partial<{
  type: string; category: string; amount: number; memo: string; date: string;
  visibility: string; card_name: string; sub_category: string;
}>) {
  await ensureInit();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (data.type !== undefined)         { sets.push("type = ?");         args.push(data.type); }
  if (data.category !== undefined)     { sets.push("category = ?");     args.push(data.category); }
  if (data.amount !== undefined)       { sets.push("amount = ?");       args.push(data.amount); }
  if (data.memo !== undefined)         { sets.push("memo = ?");         args.push(data.memo); }
  if (data.date !== undefined)         { sets.push("date = ?");         args.push(data.date); }
  if (data.visibility !== undefined)   { sets.push("visibility = ?");   args.push(data.visibility); }
  if (data.card_name !== undefined)    { sets.push("card_name = ?");    args.push(data.card_name); }
  if (data.sub_category !== undefined) { sets.push("sub_category = ?"); args.push(data.sub_category); }
  if (sets.length === 0) return;
  // Owner can always update; family members can update shared transactions
  const cond = familyId
    ? "(id = ? AND (user_id = ? OR (family_id = ? AND visibility = 'family')))"
    : "(id = ? AND user_id = ?)";
  const condArgs = familyId ? [id, userId, familyId] : [id, userId];
  await client.execute({ sql: `UPDATE transactions SET ${sets.join(", ")} WHERE ${cond}`, args: [...args, ...condArgs] });
}

export async function deleteTransaction(id: number, userId: number) {
  await ensureInit();
  await client.execute({
    sql: "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

// ── Assets ──
export async function getAssets(familyId?: number, userId?: number, viewMode: "family" | "private" | "all" = "all") {
  await ensureInit();
  let r;
  if (familyId) {
    if (viewMode === "private") {
      r = await client.execute({
        sql: "SELECT a.*, u.name as user_name FROM assets a JOIN users u ON u.id = a.user_id WHERE a.family_id = ? AND a.user_id = ? AND a.visibility = 'private' ORDER BY ABS(a.amount) DESC",
        args: [familyId, userId!],
      });
    } else if (viewMode === "family") {
      r = await client.execute({
        sql: "SELECT a.*, u.name as user_name FROM assets a JOIN users u ON u.id = a.user_id WHERE a.family_id = ? AND a.visibility = 'family' ORDER BY ABS(a.amount) DESC",
        args: [familyId],
      });
    } else {
      r = await client.execute({
        sql: "SELECT a.*, u.name as user_name FROM assets a JOIN users u ON u.id = a.user_id WHERE a.family_id = ? AND (a.visibility = 'family' OR a.user_id = ?) ORDER BY ABS(a.amount) DESC",
        args: [familyId, userId!],
      });
    }
  } else {
    r = await client.execute({
      sql: "SELECT a.*, u.name as user_name FROM assets a JOIN users u ON u.id = a.user_id WHERE a.user_id = ? ORDER BY ABS(a.amount) DESC",
      args: [userId!],
    });
  }
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    family_id: row["family_id"] != null ? Number(row["family_id"]) : null,
    user_id: Number(row["user_id"]),
    type: String(row["type"]),
    label: String(row["label"]),
    amount: Number(row["amount"]),
    institution: String(row["institution"]),
    visibility: String(row["visibility"] ?? "family"),
    user_name: String(row["user_name"] ?? ""),
  }));
}

export async function insertAsset(data: {
  family_id?: number | null; user_id: number; type: string;
  label: string; amount: number; institution: string; visibility?: string;
}) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO assets (family_id, user_id, type, label, amount, institution, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [data.family_id ?? null, data.user_id, data.type, data.label, data.amount, data.institution, data.visibility ?? "family"],
  });
  return Number(r.lastInsertRowid);
}

export async function updateAsset(id: number, userId: number, familyId: number | undefined, data: {
  amount?: number; label?: string; institution?: string; visibility?: string; user_id?: number;
}) {
  await ensureInit();
  const sets = ["updated_at = datetime('now','localtime')"];
  const args: (string | number | null)[] = [];
  if (data.amount !== undefined)      { sets.push("amount = ?");      args.push(data.amount); }
  if (data.label !== undefined)       { sets.push("label = ?");       args.push(data.label); }
  if (data.institution !== undefined) { sets.push("institution = ?"); args.push(data.institution); }
  if (data.visibility !== undefined)  { sets.push("visibility = ?");  args.push(data.visibility); }
  if (data.user_id !== undefined)     { sets.push("user_id = ?");     args.push(data.user_id); }
  const cond = familyId
    ? "(id = ? AND (user_id = ? OR (family_id = ? AND visibility = 'family')))"
    : "(id = ? AND user_id = ?)";
  const condArgs: (string | number)[] = familyId ? [id, userId, familyId] : [id, userId];
  await client.execute({ sql: `UPDATE assets SET ${sets.join(", ")} WHERE ${cond}`, args: [...args, ...condArgs] });
}

export async function deleteAsset(id: number, userId: number, familyId?: number) {
  await ensureInit();
  const cond = familyId
    ? "(id = ? AND (user_id = ? OR (family_id = ? AND visibility = 'family')))"
    : "(id = ? AND user_id = ?)";
  const args: (string | number)[] = familyId ? [id, userId, familyId] : [id, userId];
  await client.execute({ sql: `DELETE FROM assets WHERE ${cond}`, args });
}

// ── Asset Snapshots ──
export async function getAssetSnapshots(familyId: number, days = 30) {
  await ensureInit();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);
  const r = await client.execute({
    sql: "SELECT date, total_amount FROM asset_snapshots WHERE family_id = ? AND date >= ? ORDER BY date ASC",
    args: [familyId, sinceStr],
  });
  return r.rows.map((row) => ({
    date: String(row["date"]),
    total_amount: Number(row["total_amount"]),
  }));
}

export async function upsertAssetSnapshot(familyId: number, totalAmount: number) {
  await ensureInit();
  const today = new Date().toISOString().slice(0, 10);
  await client.execute({
    sql: "INSERT INTO asset_snapshots (family_id, date, total_amount) VALUES (?, ?, ?) ON CONFLICT(family_id, date) DO UPDATE SET total_amount = excluded.total_amount",
    args: [familyId, today, totalAmount],
  });
}

// ── Goals ──
export async function getGoals(familyId: number) {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT * FROM goals WHERE family_id = ? ORDER BY created_at ASC",
    args: [familyId],
  });
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    family_id: Number(row["family_id"]),
    name: String(row["name"]),
    target_amount: Number(row["target_amount"]),
    current_amount: Number(row["current_amount"]),
    emoji: String(row["emoji"]),
    deadline: row["deadline"] != null ? String(row["deadline"]) : null,
  }));
}

export async function updateGoalAmount(id: number, amount: number) {
  await ensureInit();
  await client.execute({
    sql: "UPDATE goals SET current_amount = ? WHERE id = ?",
    args: [amount, id],
  });
}

// ── User Cards ──
export async function getUserCards(userId: number, familyId?: number) {
  await ensureInit();
  let r;
  if (familyId) {
    // 내 카드 전부 + 가족 중 공유된 카드
    r = await client.execute({
      sql: `SELECT uc.*, u.name as user_name FROM user_cards uc JOIN users u ON u.id = uc.user_id
            WHERE uc.family_id = ? AND (uc.user_id = ? OR uc.is_shared = 1)
            ORDER BY uc.user_id = ? DESC, uc.created_at ASC`,
      args: [familyId, userId, userId],
    });
  } else {
    r = await client.execute({
      sql: "SELECT uc.*, u.name as user_name FROM user_cards uc JOIN users u ON u.id = uc.user_id WHERE uc.user_id = ? ORDER BY uc.created_at ASC",
      args: [userId],
    });
  }
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    user_name: String(row["user_name"]),
    card_name: String(row["card_name"]),
    card_type: String(row["card_type"]),
    billing_day: Number(row["billing_day"] ?? 0),
    benefit_target: Number(row["benefit_target"] ?? 0),
    is_shared: Number(row["is_shared"] ?? 0) === 1,
  }));
}

export async function insertUserCard(data: {
  user_id: number; family_id?: number | null;
  card_name: string; card_type: string;
  billing_day?: number; benefit_target?: number;
}) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO user_cards (user_id, family_id, card_name, card_type, billing_day, benefit_target) VALUES (?, ?, ?, ?, ?, ?)",
    args: [data.user_id, data.family_id ?? null, data.card_name, data.card_type, data.billing_day ?? 0, data.benefit_target ?? 0],
  });
  return Number(r.lastInsertRowid);
}

export async function updateUserCard(id: number, familyId: number | undefined, data: {
  card_name?: string; card_type?: string; billing_day?: number; benefit_target?: number; is_shared?: boolean;
}) {
  await ensureInit();
  const sets: string[] = [];
  const args: (string | number)[] = [];
  if (data.card_name !== undefined)     { sets.push("card_name = ?");     args.push(data.card_name); }
  if (data.card_type !== undefined)     { sets.push("card_type = ?");     args.push(data.card_type); }
  if (data.billing_day !== undefined)   { sets.push("billing_day = ?");   args.push(data.billing_day); }
  if (data.benefit_target !== undefined){ sets.push("benefit_target = ?"); args.push(data.benefit_target); }
  if (data.is_shared !== undefined)     { sets.push("is_shared = ?");     args.push(data.is_shared ? 1 : 0); }
  if (sets.length === 0) return;
  const cond = familyId ? "id = ? AND family_id = ?" : "id = ?";
  const condArgs: number[] = familyId ? [id, familyId] : [id];
  await client.execute({ sql: `UPDATE user_cards SET ${sets.join(", ")} WHERE ${cond}`, args: [...args, ...condArgs] });
}

export async function deleteUserCard(id: number, userId: number) {
  await ensureInit();
  await client.execute({
    sql: "DELETE FROM user_cards WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

export async function getCardPeriodSpending(familyId: number, cardName: string, fromDate: string, toDate: string): Promise<number> {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE family_id = ? AND card_name = ? AND type = 'expense' AND date >= ? AND date <= ?",
    args: [familyId, cardName, fromDate, toDate],
  });
  return Number(r.rows[0]["total"] ?? 0);
}

export async function getCardSpendingSummary(familyId: number, year: number, month: number) {
  await ensureInit();
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const r = await client.execute({
    sql: `SELECT t.card_name, t.user_id, u.name as user_name, SUM(t.amount) as total
          FROM transactions t JOIN users u ON u.id = t.user_id
          WHERE t.family_id = ? AND t.type = 'expense' AND t.card_name != '' AND t.date LIKE ?
          GROUP BY t.card_name, t.user_id
          ORDER BY total DESC`,
    args: [familyId, `${monthStr}%`],
  });
  return r.rows.map((row) => ({
    card_name: String(row["card_name"]),
    user_id: Number(row["user_id"]),
    user_name: String(row["user_name"]),
    total: Number(row["total"]),
  }));
}

// ── Card Bills ──
export async function getCardBills(userId: number, familyId: number | undefined, year: number, month: number) {
  await ensureInit();
  let r;
  if (familyId) {
    r = await client.execute({
      sql: `SELECT cb.*, u.name as user_name FROM card_bills cb
            JOIN users u ON u.id = cb.user_id
            WHERE cb.family_id = ? AND cb.year = ? AND cb.month = ?
            ORDER BY cb.user_id, cb.created_at ASC`,
      args: [familyId, year, month],
    });
  } else {
    r = await client.execute({
      sql: `SELECT cb.*, u.name as user_name FROM card_bills cb
            JOIN users u ON u.id = cb.user_id
            WHERE cb.user_id = ? AND cb.year = ? AND cb.month = ?
            ORDER BY cb.created_at ASC`,
      args: [userId, year, month],
    });
  }
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    user_name: String(row["user_name"]),
    year: Number(row["year"]),
    month: Number(row["month"]),
    card_name: String(row["card_name"]),
    amount: Number(row["amount"]),
    due_date: String(row["due_date"]),
  }));
}

export async function insertCardBill(data: {
  user_id: number; family_id?: number | null;
  year: number; month: number; card_name: string; amount: number; due_date?: string;
}) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO card_bills (user_id, family_id, year, month, card_name, amount, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)",
    args: [data.user_id, data.family_id ?? null, data.year, data.month, data.card_name, data.amount, data.due_date ?? ""],
  });
  return Number(r.lastInsertRowid);
}

export async function deleteCardBill(id: number, userId: number) {
  await ensureInit();
  await client.execute({
    sql: "DELETE FROM card_bills WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

// ── Property Wishlist ──
export async function getPropertyWishlist(userId: number, familyId?: number) {
  await ensureInit();
  let r;
  if (familyId) {
    r = await client.execute({
      sql: "SELECT p.*, u.name as user_name FROM property_wishlist p JOIN users u ON u.id = p.user_id WHERE p.family_id = ? AND (p.visibility = 'family' OR p.user_id = ?) ORDER BY p.created_at DESC",
      args: [familyId, userId],
    });
  } else {
    r = await client.execute({
      sql: "SELECT p.*, u.name as user_name FROM property_wishlist p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? ORDER BY p.created_at DESC",
      args: [userId],
    });
  }
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    family_id: row["family_id"] != null ? Number(row["family_id"]) : null,
    name: String(row["name"]),
    location: String(row["location"] ?? ""),
    property_type: String(row["property_type"]),
    trade_type: String(row["trade_type"] ?? "A1"),
    min_price: row["min_price"] != null ? Number(row["min_price"]) : null,
    max_price: row["max_price"] != null ? Number(row["max_price"]) : null,
    min_area: row["min_area"] != null ? Number(row["min_area"]) : null,
    max_area: row["max_area"] != null ? Number(row["max_area"]) : null,
    naver_complex_url: String(row["naver_complex_url"] ?? ""),
    floor_min: row["floor_min"] != null ? Number(row["floor_min"]) : null,
    floor_max: row["floor_max"] != null ? Number(row["floor_max"]) : null,
    notes: String(row["notes"]),
    visibility: String(row["visibility"]),
    created_at: String(row["created_at"]),
    user_name: String(row["user_name"] ?? ""),
  }));
}

export async function insertPropertyWishlist(data: {
  user_id: number; family_id?: number | null; name: string; location: string;
  property_type: string; trade_type: string;
  min_price?: number | null; max_price?: number | null;
  min_area?: number | null; max_area?: number | null;
  naver_complex_url?: string;
  floor_min?: number | null; floor_max?: number | null;
  notes: string; visibility: string;
}) {
  await ensureInit();
  const r = await client.execute({
    sql: "INSERT INTO property_wishlist (user_id, family_id, name, location, property_type, trade_type, min_price, max_price, min_area, max_area, naver_complex_url, floor_min, floor_max, notes, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    args: [data.user_id, data.family_id ?? null, data.name, data.location, data.property_type, data.trade_type, data.min_price ?? null, data.max_price ?? null, data.min_area ?? null, data.max_area ?? null, data.naver_complex_url ?? "", data.floor_min ?? null, data.floor_max ?? null, data.notes, data.visibility],
  });
  return Number(r.lastInsertRowid);
}

export async function deletePropertyWishlist(id: number, userId: number) {
  await ensureInit();
  await client.execute({
    sql: "DELETE FROM property_wishlist WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
}

// ── Monthly Budget ──
export async function getMonthlyBudget(userId: number, year: number, month: number) {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT * FROM monthly_budgets WHERE user_id = ? AND year = ? AND month = ?",
    args: [userId, year, month],
  });
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    year: Number(row["year"]),
    month: Number(row["month"]),
    budget_amount: Number(row["budget_amount"]),
    personal_budget_amount: Number(row["personal_budget_amount"] ?? 0),
  };
}

export async function upsertMonthlyBudget(
  userId: number, familyId: number | null, year: number, month: number,
  budgetAmount: number, personalBudgetAmount?: number,
) {
  await ensureInit();
  await client.execute({
    sql: `INSERT INTO monthly_budgets (user_id, family_id, year, month, budget_amount, personal_budget_amount)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, year, month) DO UPDATE SET
            budget_amount = excluded.budget_amount,
            personal_budget_amount = CASE WHEN excluded.personal_budget_amount > 0 THEN excluded.personal_budget_amount ELSE personal_budget_amount END`,
    args: [userId, familyId ?? null, year, month, budgetAmount, personalBudgetAmount ?? 0],
  });
}

// ── Salary Info ──
export async function getSalaryInfo(userId: number, year: number) {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT * FROM salary_info WHERE user_id = ? AND year = ?",
    args: [userId, year],
  });
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    year: Number(row["year"]),
    annual_salary: Number(row["annual_salary"]),
    credit_card_spending: Number(row["credit_card_spending"]),
    debit_card_spending: Number(row["debit_card_spending"]),
    cash_spending: Number(row["cash_spending"]),
    transit_spending: Number(row["transit_spending"]),
    traditional_market_spending: Number(row["traditional_market_spending"]),
  };
}

export async function upsertSalaryInfo(data: {
  user_id: number; family_id?: number | null; year: number;
  annual_salary: number; credit_card_spending: number; debit_card_spending: number;
  cash_spending: number; transit_spending: number; traditional_market_spending: number;
}) {
  await ensureInit();
  await client.execute({
    sql: `INSERT INTO salary_info (user_id, family_id, year, annual_salary, credit_card_spending, debit_card_spending, cash_spending, transit_spending, traditional_market_spending)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(user_id, year) DO UPDATE SET
            annual_salary = excluded.annual_salary,
            credit_card_spending = excluded.credit_card_spending,
            debit_card_spending = excluded.debit_card_spending,
            cash_spending = excluded.cash_spending,
            transit_spending = excluded.transit_spending,
            traditional_market_spending = excluded.traditional_market_spending`,
    args: [data.user_id, data.family_id ?? null, data.year, data.annual_salary, data.credit_card_spending, data.debit_card_spending, data.cash_spending, data.transit_spending, data.traditional_market_spending],
  });
}

export async function getFamilySalaryInfo(familyId: number, year: number) {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT s.*, u.name as user_name FROM salary_info s JOIN users u ON u.id = s.user_id WHERE s.family_id = ? AND s.year = ?",
    args: [familyId, year],
  });
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    user_name: String(row["user_name"]),
    year: Number(row["year"]),
    annual_salary: Number(row["annual_salary"]),
    credit_card_spending: Number(row["credit_card_spending"]),
    debit_card_spending: Number(row["debit_card_spending"]),
    cash_spending: Number(row["cash_spending"]),
    transit_spending: Number(row["transit_spending"]),
    traditional_market_spending: Number(row["traditional_market_spending"]),
  }));
}

// ── Session version (단일 기기 로그인) ──
export async function incrementSessionVersion(userId: number): Promise<number> {
  await ensureInit();
  await client.execute({
    sql: "UPDATE users SET session_version = session_version + 1 WHERE id = ?",
    args: [userId],
  });
  const r = await client.execute({
    sql: "SELECT session_version FROM users WHERE id = ?",
    args: [userId],
  });
  return Number(r.rows[0]?.["session_version"] ?? 0);
}

export async function getSessionVersion(userId: number): Promise<number> {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT session_version FROM users WHERE id = ?",
    args: [userId],
  });
  return Number(r.rows[0]?.["session_version"] ?? 0);
}

// ── WebAuthn Credentials ──
export interface WebAuthnCredential {
  id: number;
  user_id: number;
  credential_id: string;
  public_key: string; // base64
  counter: number;
  transports: string[] | null;
}

export async function getWebAuthnCredentialsByUserId(userId: number): Promise<WebAuthnCredential[]> {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT * FROM webauthn_credentials WHERE user_id = ?",
    args: [userId],
  });
  return r.rows.map((row) => ({
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    credential_id: String(row["credential_id"]),
    public_key: String(row["public_key"]),
    counter: Number(row["counter"]),
    transports: row["transports"] ? JSON.parse(String(row["transports"])) : null,
  }));
}

export async function getWebAuthnCredentialById(credentialId: string): Promise<WebAuthnCredential | null> {
  await ensureInit();
  const r = await client.execute({
    sql: "SELECT * FROM webauthn_credentials WHERE credential_id = ?",
    args: [credentialId],
  });
  if (!r.rows[0]) return null;
  const row = r.rows[0];
  return {
    id: Number(row["id"]),
    user_id: Number(row["user_id"]),
    credential_id: String(row["credential_id"]),
    public_key: String(row["public_key"]),
    counter: Number(row["counter"]),
    transports: row["transports"] ? JSON.parse(String(row["transports"])) : null,
  };
}

export async function saveWebAuthnCredential(
  userId: number,
  credentialId: string,
  publicKey: string,
  counter: number,
  transports: string[] | null
) {
  await ensureInit();
  await client.execute({
    sql: "INSERT INTO webauthn_credentials (user_id, credential_id, public_key, counter, transports) VALUES (?, ?, ?, ?, ?)",
    args: [userId, credentialId, publicKey, counter, transports ? JSON.stringify(transports) : null],
  });
}

export async function updateCredentialCounter(credentialId: string, counter: number) {
  await ensureInit();
  await client.execute({
    sql: "UPDATE webauthn_credentials SET counter = ? WHERE credential_id = ?",
    args: [counter, credentialId],
  });
}

export async function deleteWebAuthnCredentialsByUserId(userId: number) {
  await ensureInit();
  await client.execute({
    sql: "DELETE FROM webauthn_credentials WHERE user_id = ?",
    args: [userId],
  });
}
