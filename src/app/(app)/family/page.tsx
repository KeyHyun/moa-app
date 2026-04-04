"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";

interface Member {
  id: number;
  name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface FamilyData {
  family: { id: number; name: string; invite_code: string; role: string } | null;
  members: Member[];
}

export default function FamilyPage() {
  const router = useRouter();
  const { user, setFamily } = useAuthStore();
  const [data, setData] = useState<FamilyData>({ family: null, members: [] });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Face ID
  const [hasFaceId, setHasFaceId] = useState<boolean | null>(null);
  const [faceIdLoading, setFaceIdLoading] = useState(false);
  const [faceIdMsg, setFaceIdMsg] = useState("");

  const fetchFamily = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/family");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const checkFaceId = async () => {
    try {
      const r = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      });
      const d = await r.json();
      setHasFaceId(d.hasCredential ?? false);
    } catch { setHasFaceId(false); }
  };

  useEffect(() => { fetchFamily(); checkFaceId(); }, []);

  const handleRegisterFaceId = async () => {
    setFaceIdLoading(true);
    setFaceIdMsg("");
    try {
      const { startRegistration } = await import("@simplewebauthn/browser");

      const beginRes = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "begin" }),
      });
      const beginData = await beginRes.json();
      if (!beginRes.ok) throw new Error(beginData.error);

      let regResponse;
      try {
        regResponse = await startRegistration({ optionsJSON: beginData });
      } catch {
        throw new Error("Face ID 등록이 취소되었습니다.");
      }

      const completeRes = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", response: regResponse }),
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) throw new Error(completeData.error);

      setHasFaceId(true);
      setFaceIdMsg("Face ID가 등록되었습니다.");
    } catch (e: unknown) {
      setFaceIdMsg(e instanceof Error ? e.message : "등록에 실패했습니다.");
    } finally {
      setFaceIdLoading(false);
    }
  };

  const handleRemoveFaceId = async () => {
    if (!confirm("Face ID 등록을 해제할까요?")) return;
    setFaceIdLoading(true);
    setFaceIdMsg("");
    try {
      const r = await fetch("/api/auth/webauthn/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      if (!r.ok) throw new Error("해제에 실패했습니다.");
      setHasFaceId(false);
      setFaceIdMsg("Face ID 등록이 해제되었습니다.");
    } catch (e: unknown) {
      setFaceIdMsg(e instanceof Error ? e.message : "해제에 실패했습니다.");
    } finally {
      setFaceIdLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!familyName.trim()) { setError("가족 이름을 입력해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: familyName.trim() }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error); return; }
      setFamily(result.family);
      await fetchFamily();
      setShowCreate(false);
    } catch {
      setError("생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) { setError("초대 코드를 입력해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", invite_code: inviteCode.trim() }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.error); return; }
      setFamily(result.family);
      await fetchFamily();
      setShowJoin(false);
    } catch {
      setError("참여에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const copyInviteCode = async () => {
    if (!data.family?.invite_code) return;
    await navigator.clipboard.writeText(data.family.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems = [
    { href: "/wishlist", icon: "🏠", label: "부동산 찜 목록", desc: "네이버 부동산 매물 관리" },
    { href: "/tax", icon: "💰", label: "세금/카드 분석", desc: "연말정산 카드 혜택 계산" },
    { href: "/budget", icon: "📊", label: "예산 관리", desc: "이번 달 지출 & 구매 판단" },
  ];

  return (
    <div className="min-h-screen bg-toss-surface pb-24">
      <TopBar title="가족" />

      {loading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* 가족 그룹 */}
          <div className="mx-4 mt-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
            {data.family ? (
              <>
                <div className="px-5 py-4 border-b border-toss-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-base font-bold text-toss-text">{data.family.name}</p>
                      <p className="text-xs text-toss-text-ter mt-0.5">멤버 {data.members.length}명</p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-toss-blue-light text-toss-blue text-xs font-semibold rounded-pill"
                    >
                      {copied ? "✓ 복사됨" : `🔗 ${data.family.invite_code}`}
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-toss-border">
                  {data.members.map((m) => (
                    <div key={m.id} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-toss-blue-light flex items-center justify-center text-sm font-bold text-toss-blue">
                        {m.name[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-toss-text">{m.name}</p>
                        <p className="text-xs text-toss-text-ter">{m.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        m.role === "owner" ? "bg-toss-blue text-white" : "bg-toss-surface text-toss-text-sub"
                      }`}>
                        {m.role === "owner" ? "방장" : "멤버"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-toss-surface">
                  <p className="text-xs text-toss-text-ter">초대 코드를 공유해서 가족을 초대하세요</p>
                </div>
              </>
            ) : (
              <div className="px-5 py-8 flex flex-col items-center gap-4">
                <span className="text-5xl">👨‍👩‍👧‍👦</span>
                <div className="text-center">
                  <p className="text-base font-bold text-toss-text">아직 가족 그룹이 없어요</p>
                  <p className="text-sm text-toss-text-ter mt-1">가족 그룹을 만들거나 참여하세요</p>
                </div>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => { setShowCreate(true); setShowJoin(false); setError(""); }}
                    className="flex-1 py-3 bg-toss-blue text-white text-sm font-semibold rounded-xl"
                  >
                    그룹 만들기
                  </button>
                  <button
                    onClick={() => { setShowJoin(true); setShowCreate(false); setError(""); }}
                    className="flex-1 py-3 bg-toss-surface text-toss-text-sub text-sm font-semibold rounded-xl"
                  >
                    코드로 참여
                  </button>
                </div>

                {showCreate && (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="우리 가족"
                      className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                    />
                    {error && <p className="text-xs text-toss-red">{error}</p>}
                    <button onClick={handleCreate} disabled={saving}
                      className="w-full py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl">
                      {saving ? "생성 중..." : "만들기"}
                    </button>
                  </div>
                )}

                {showJoin && (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      placeholder="초대 코드 6자리"
                      maxLength={6}
                      className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue tracking-widest text-center font-bold"
                    />
                    {error && <p className="text-xs text-toss-red">{error}</p>}
                    <button onClick={handleJoin} disabled={saving}
                      className="w-full py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl">
                      {saving ? "참여 중..." : "참여하기"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 기능 메뉴 */}
          <div className="mx-4">
            <p className="text-xs font-semibold text-toss-text-ter mb-2 px-1">기능</p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {menuItems.map((item, i) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-5 py-4 active:bg-toss-surface transition-colors ${
                    i < menuItems.length - 1 ? "border-b border-toss-border" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-toss-surface flex items-center justify-center text-xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-toss-text">{item.label}</p>
                    <p className="text-xs text-toss-text-ter mt-0.5">{item.desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="#C9CDD2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* 현재 사용자 */}
          <div className="mx-4 mt-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-toss-blue flex items-center justify-center text-white font-bold">
                  {user?.name?.[0] ?? "?"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-toss-text">{user?.name}</p>
                  <p className="text-xs text-toss-text-ter">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await fetch("/api/auth", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "logout" }),
                    });
                    router.replace("/login");
                  }}
                  className="text-xs text-toss-text-ter"
                >
                  로그아웃
                </button>
              </div>

              {/* Face ID 설정 */}
              <div className="px-5 py-4 border-t border-toss-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-toss-text">🔐 Face ID 로그인</p>
                    <p className="text-xs text-toss-text-ter mt-0.5">
                      {hasFaceId === null ? "확인 중..." : hasFaceId ? "등록됨" : "미등록"}
                    </p>
                  </div>
                  {hasFaceId ? (
                    <button
                      onClick={handleRemoveFaceId}
                      disabled={faceIdLoading}
                      className="text-xs text-toss-red font-semibold px-3 py-1.5 rounded-pill bg-red-50"
                    >
                      {faceIdLoading ? "처리 중..." : "해제"}
                    </button>
                  ) : (
                    <button
                      onClick={handleRegisterFaceId}
                      disabled={faceIdLoading}
                      className="text-xs text-toss-blue font-semibold px-3 py-1.5 rounded-pill bg-toss-blue-light"
                    >
                      {faceIdLoading ? "처리 중..." : "등록하기"}
                    </button>
                  )}
                </div>
                {faceIdMsg && (
                  <p className={`text-xs mt-2 ${faceIdMsg.includes("실패") || faceIdMsg.includes("취소") ? "text-toss-red" : "text-toss-green"}`}>
                    {faceIdMsg}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
