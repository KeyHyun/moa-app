"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { formatKRW } from "@/lib/formatters";
import { clsx } from "clsx";

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

interface BillingPeriod {
  from: string;
  to: string;
  nextBilling: string;
  daysLeft: number;
}

interface UserCard {
  id: number;
  user_id: number;
  user_name: string;
  card_name: string;
  card_type: string;
  billing_day: number;
  benefit_target: number;
  period_spending: number;
  billing_period: BillingPeriod;
  is_shared: boolean;
}

const CARD_TYPE_OPTIONS = [
  { value: "credit", label: "신용카드", icon: "💳" },
  { value: "debit",  label: "체크카드", icon: "🏧" },
  { value: "cash",   label: "현금",     icon: "💵" },
];

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

  // 카드 관리
  const [cards, setCards] = useState<UserCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [editingCard, setEditingCard] = useState<UserCard | null>(null);
  const [newCardName, setNewCardName] = useState("");
  const [newCardType, setNewCardType] = useState("credit");
  const [newBillingDay, setNewBillingDay] = useState("");
  const [newBenefitTarget, setNewBenefitTarget] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  const fetchCards = async () => {
    setCardsLoading(true);
    try {
      const res = await fetch("/api/cards");
      if (res.ok) {
        const d = await res.json();
        setCards(d.cards || []);
      }
    } finally {
      setCardsLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCardName.trim()) return;
    setCardSaving(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_name: newCardName.trim(),
          card_type: newCardType,
          billing_day: newBillingDay ? parseInt(newBillingDay) : 0,
          benefit_target: newBenefitTarget ? parseInt(newBenefitTarget.replace(/,/g, "")) : 0,
        }),
      });
      if (res.ok) {
        setNewCardName(""); setNewCardType("credit"); setNewBillingDay(""); setNewBenefitTarget("");
        setShowAddCard(false);
        await fetchCards();
      }
    } finally {
      setCardSaving(false);
    }
  };

  const handleEditCard = async () => {
    if (!editingCard) return;
    setCardSaving(true);
    try {
      const res = await fetch("/api/cards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCard.id,
          card_name: newCardName.trim() || editingCard.card_name,
          card_type: newCardType,
          billing_day: newBillingDay ? parseInt(newBillingDay) : 0,
          benefit_target: newBenefitTarget ? parseInt(newBenefitTarget.replace(/,/g, "")) : 0,
        }),
      });
      if (res.ok) {
        setEditingCard(null); setNewCardName(""); setNewCardType("credit"); setNewBillingDay(""); setNewBenefitTarget("");
        await fetchCards();
      }
    } finally {
      setCardSaving(false);
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm("카드를 삭제할까요?")) return;
    await fetch("/api/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchCards();
  };

  const startEditCard = (card: UserCard) => {
    setEditingCard(card);
    setNewCardName(card.card_name);
    setNewCardType(card.card_type);
    setNewBillingDay(card.billing_day ? String(card.billing_day) : "");
    setNewBenefitTarget(card.benefit_target ? String(card.benefit_target) : "");
    setShowAddCard(false);
  };

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

  useEffect(() => { fetchFamily(); checkFaceId(); fetchCards(); }, []);

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
                {/* 헤더 */}
                <div className="px-5 py-4 border-b border-toss-border">
                  <p className="text-base font-bold text-toss-text">{data.family.name}</p>
                  <p className="text-xs text-toss-text-ter mt-0.5">멤버 {data.members.length}명</p>
                </div>

                {/* 멤버 목록 */}
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

                {/* 초대 코드 섹션 */}
                <div className="px-5 py-4 bg-toss-surface border-t border-toss-border">
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">👥 가족 초대하기</p>
                  <p className="text-xs text-toss-text-ter mb-3">
                    아래 코드를 공유하면 누구든 가족 그룹에 참여할 수 있어요 (인원 제한 없음)
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-toss-border rounded-xl px-4 py-3 text-center">
                      <p className="text-xl font-bold tracking-widest text-toss-blue">
                        {data.family.invite_code}
                      </p>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="px-4 py-3 bg-toss-blue text-white text-sm font-semibold rounded-xl whitespace-nowrap"
                    >
                      {copied ? "✓ 복사됨" : "코드 복사"}
                    </button>
                  </div>
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

          {/* 카드 관리 */}
          <div className="mx-4 mt-4">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold text-toss-text-ter">💳 카드 관리</p>
              <button
                onClick={() => { setShowAddCard((v) => !v); setEditingCard(null); setNewCardName(""); setNewCardType("credit"); setNewBillingDay(""); setNewBenefitTarget(""); }}
                className="text-xs text-toss-blue font-semibold"
              >
                {showAddCard ? "취소" : "+ 카드 추가"}
              </button>
            </div>

            {/* 카드 추가 폼 */}
            {showAddCard && (
              <div className="mb-3 p-4 bg-white rounded-2xl shadow-sm space-y-3">
                <p className="text-sm font-semibold text-toss-text">새 카드 등록</p>
                <input type="text" value={newCardName} onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="카드명 (예: 현대카드M)" className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                <div className="flex gap-2">
                  {CARD_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setNewCardType(opt.value)}
                      className={clsx("flex-1 py-2 text-xs font-semibold rounded-xl transition-colors", {
                        "bg-toss-blue text-white": newCardType === opt.value,
                        "bg-toss-surface text-toss-text-sub": newCardType !== opt.value,
                      })}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-toss-text-ter mb-1">결제일</p>
                    <div className="flex items-center gap-1">
                      <input type="number" min="1" max="31" value={newBillingDay} onChange={(e) => setNewBillingDay(e.target.value)}
                        placeholder="15" className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                      <span className="text-xs text-toss-text-ter">일</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-toss-text-ter mb-1">혜택 목표</p>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={newBenefitTarget} onChange={(e) => setNewBenefitTarget(e.target.value)}
                        placeholder="300000" className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                      <span className="text-xs text-toss-text-ter">원</span>
                    </div>
                  </div>
                </div>
                <button onClick={handleAddCard} disabled={cardSaving || !newCardName.trim()}
                  className="w-full py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl">
                  {cardSaving ? "등록 중..." : "등록하기"}
                </button>
              </div>
            )}

            {/* 카드 편집 폼 */}
            {editingCard && (
              <div className="mb-3 p-4 bg-white rounded-2xl shadow-sm space-y-3 border border-toss-blue/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-toss-text">카드 수정</p>
                  <button onClick={() => setEditingCard(null)} className="text-xs text-toss-text-ter">취소</button>
                </div>
                <input type="text" value={newCardName} onChange={(e) => setNewCardName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                <div className="flex gap-2">
                  {CARD_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setNewCardType(opt.value)}
                      className={clsx("flex-1 py-2 text-xs font-semibold rounded-xl transition-colors", {
                        "bg-toss-blue text-white": newCardType === opt.value,
                        "bg-toss-surface text-toss-text-sub": newCardType !== opt.value,
                      })}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-toss-text-ter mb-1">결제일</p>
                    <div className="flex items-center gap-1">
                      <input type="number" min="1" max="31" value={newBillingDay} onChange={(e) => setNewBillingDay(e.target.value)}
                        placeholder="15" className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                      <span className="text-xs text-toss-text-ter">일</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-toss-text-ter mb-1">혜택 목표</p>
                    <div className="flex items-center gap-1">
                      <input type="number" min="0" value={newBenefitTarget} onChange={(e) => setNewBenefitTarget(e.target.value)}
                        placeholder="300000" className="w-full px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                      <span className="text-xs text-toss-text-ter">원</span>
                    </div>
                  </div>
                </div>
                <button onClick={handleEditCard} disabled={cardSaving}
                  className="w-full py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl">
                  {cardSaving ? "저장 중..." : "저장하기"}
                </button>
              </div>
            )}

            {/* 카드 목록 */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {cardsLoading ? (
                <div className="px-5 py-4 text-sm text-toss-text-ter">불러오는 중...</div>
              ) : cards.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-toss-text-sub">등록된 카드가 없습니다</p>
                  <p className="text-xs text-toss-text-ter mt-1">+ 카드 추가를 눌러 등록하세요</p>
                </div>
              ) : (
                <div className="divide-y divide-toss-border">
                  {cards.map((card) => {
                    const typeOpt = CARD_TYPE_OPTIONS.find((o) => o.value === card.card_type);
                    const spent = card.period_spending;
                    const target = card.benefit_target;
                    const remaining = target > 0 ? Math.max(0, target - spent) : 0;
                    const progress = target > 0 ? Math.min(100, (spent / target) * 100) : 0;
                    const period = card.billing_period;
                    const achieved = target > 0 && spent >= target;
                    const isMyCard = card.user_id === user?.id;
                    return (
                      <div key={card.id} className="px-5 py-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl flex-shrink-0">{typeOpt?.icon ?? "💳"}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-sm font-semibold text-toss-text truncate">{card.card_name}</p>
                                {card.is_shared && <span className="text-xs bg-toss-blue-light text-toss-blue px-1.5 py-0.5 rounded-full flex-shrink-0">공유중</span>}
                                {!isMyCard && <span className="text-xs bg-toss-surface text-toss-text-ter px-1.5 py-0.5 rounded-full flex-shrink-0">{card.user_name}</span>}
                              </div>
                              <p className="text-xs text-toss-text-ter">{typeOpt?.label}{card.billing_day > 0 ? ` · 매월 ${card.billing_day}일` : ""}</p>
                            </div>
                          </div>
                          {isMyCard && (
                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                              <button
                                onClick={async () => {
                                  await fetch("/api/cards", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: card.id, is_shared: !card.is_shared }) });
                                  fetchCards();
                                }}
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.is_shared ? "bg-toss-blue text-white" : "bg-toss-surface text-toss-text-sub"}`}
                              >
                                {card.is_shared ? "공유ON" : "공유"}
                              </button>
                              <button onClick={() => startEditCard(card)} className="text-xs text-toss-blue font-medium">수정</button>
                              <button onClick={() => handleDeleteCard(card.id)} className="text-xs text-toss-red font-medium">삭제</button>
                            </div>
                          )}
                        </div>
                        <div className="bg-toss-surface rounded-xl p-3 space-y-2">
                          {card.billing_day > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-toss-text-ter truncate">결제주기 {period.from.slice(5).replace("-", "/")} ~ {period.nextBilling.slice(5).replace("-", "/")}</span>
                              <span className="text-toss-text-sub font-medium flex-shrink-0 ml-2">D-{period.daysLeft}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-toss-text-sub">이번 주기 지출</span>
                            <span className="text-sm font-bold text-toss-text">{formatKRW(spent)}</span>
                          </div>
                          {target > 0 && (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-toss-text-ter">혜택 목표 {formatKRW(target)}</span>
                                {achieved ? <span className="text-toss-green font-semibold">🎉 달성!</span> : <span className="text-toss-text-sub">{formatKRW(remaining)} 더 필요</span>}
                              </div>
                              <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                                <div className={clsx("h-full rounded-full transition-all", achieved ? "bg-toss-green" : "bg-toss-blue")} style={{ width: `${progress}%` }} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 기능 메뉴 */}
          <div className="mx-4 mt-4">
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
