"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { formatCurrency, CURRENCY_OPTIONS } from "@/lib/formatters";
import type { Trip, TripMember, TripExpense, SettlementEntry, SettlementSummary } from "@/types";

interface FundEntry {
  id: number;
  member_id: number;
  member_name: string;
  amount: number;
  note: string;
  created_at: string;
}

interface FundDistribution {
  memberId: number;
  name: string;
  contributed: number;
  refund: number;
}

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = Number(params.id);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [expenses, setExpenses] = useState<TripExpense[]>([]);
  const [showSettlement, setShowSettlement] = useState(false);
  const [settlement, setSettlement] = useState<SettlementEntry[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [settlementFunds, setSettlementFunds] = useState<{ totalFunds: number; totalExpense: number; remaining: number; fundDistribution: FundDistribution[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCurrency, setEditCurrency] = useState("KRW");
  const [editSaving, setEditSaving] = useState(false);

  // 공금 상태
  const [funds, setFunds] = useState<FundEntry[]>([]);
  const [totalFunds, setTotalFunds] = useState(0);
  const [showAddFund, setShowAddFund] = useState(false);
  const [fundMemberId, setFundMemberId] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");

  const fetchTrip = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}`);
    if (!res.ok) { router.replace("/travel"); return; }
    const data = await res.json();
    setTrip(data.trip);
    setMembers(data.members);
  }, [tripId, router]);

  const fetchExpenses = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/expenses`);
    if (res.ok) setExpenses(await res.json());
  }, [tripId]);

  const fetchFunds = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/funds`);
    if (res.ok) {
      const data = await res.json();
      setFunds(data.funds);
      setTotalFunds(data.totalFunds);
    }
  }, [tripId]);

  useEffect(() => { fetchTrip(); fetchExpenses(); fetchFunds(); }, [fetchTrip, fetchExpenses, fetchFunds]);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalFunds - totalExpense;

  const handleSettlement = async () => {
    const res = await fetch(`/api/trips/${tripId}/settlement`);
    if (res.ok) {
      const data = await res.json();
      setSettlement(data.settlement);
      setSummary(data.summary);
      setSettlementFunds({
        totalFunds: data.totalFunds,
        totalExpense: data.totalExpense,
        remaining: data.remaining,
        fundDistribution: data.fundDistribution,
      });
      setShowSettlement(true);
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm("이 지출을 삭제하시겠습니까?")) return;
    await fetch(`/api/trips/${tripId}/expenses/${expenseId}`, { method: "DELETE" });
    fetchExpenses();
  };

  const handleCopyCode = () => {
    if (!trip) return;
    navigator.clipboard.writeText(trip.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    window.open(`/api/trips/${tripId}/export`, "_blank");
  };

  const handleAddGuest = async () => {
    if (!guestName.trim()) return;
    const res = await fetch(`/api/trips/${tripId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add_guest", guest_name: guestName.trim() }),
    });
    if (res.ok) {
      setGuestName("");
      setShowAddMember(false);
      fetchTrip();
    }
  };

  const openEditTrip = () => {
    if (!trip) return;
    setEditName(trip.name);
    setEditDestination(trip.destination);
    setEditStartDate(trip.start_date);
    setEditEndDate(trip.end_date);
    setEditDescription(trip.description);
    setEditCurrency(trip.currency);
    setShowEditTrip(true);
  };

  const handleEditTrip = async () => {
    if (!editName.trim() || !editDestination.trim() || editSaving) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          destination: editDestination.trim(),
          start_date: editStartDate,
          end_date: editEndDate,
          description: editDescription.trim(),
          currency: editCurrency,
        }),
      });
      if (res.ok) {
        setShowEditTrip(false);
        fetchTrip();
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleAddFund = async () => {
    if (!fundMemberId || !fundAmount) return;
    const res = await fetch(`/api/trips/${tripId}/funds`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: fundMemberId, amount: Number(fundAmount), note: fundNote.trim() }),
    });
    if (res.ok) {
      setFundAmount("");
      setFundNote("");
      setShowAddFund(false);
      fetchFunds();
    }
  };

  if (!trip) return <div className="min-h-screen bg-toss-surface" />;

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar showBack title={trip.name} rightAction={
        <button onClick={handleExport} className="text-xs text-toss-blue font-semibold">엑셀</button>
      } />

      <div className="px-5 pt-4 pb-32 space-y-4">
        {/* 여행 정보 카드 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-toss-border/50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-toss-text">{trip.name}</h2>
                <button onClick={openEditTrip} className="text-xs text-toss-blue font-semibold">수정</button>
              </div>
              <p className="text-sm text-toss-text-sub mt-1">📍 {trip.destination}</p>
              <p className="text-xs text-toss-text-ter mt-1">
                {trip.start_date} ~ {trip.end_date}
              </p>
              {trip.description && (
                <p className="text-xs text-toss-text-ter mt-2">{trip.description}</p>
              )}
            </div>
            <span className="text-3xl">✈️</span>
          </div>

          {/* 초대 코드 */}
          <div className="mt-4 pt-4 border-t border-toss-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-toss-text-ter">초대 코드</p>
                <p className="text-lg font-bold text-toss-blue tracking-wider">{trip.invite_code}</p>
              </div>
              <button
                onClick={handleCopyCode}
                className="px-4 py-2 rounded-xl bg-toss-blue/10 text-toss-blue text-sm font-semibold"
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </div>
          </div>

          {/* 멤버 */}
          <div className="mt-4 pt-4 border-t border-toss-border/50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-toss-text-ter">참여자 ({members.length}명)</p>
              <button
                onClick={() => setShowAddMember(true)}
                className="text-xs text-toss-blue font-semibold"
              >
                + 참여자 추가
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <span
                  key={m.id}
                  className="px-3 py-1.5 rounded-full bg-toss-surface text-sm font-medium text-toss-text"
                >
                  {m.role === "owner" ? "👑 " : ""}{m.name}{m.is_guest ? " 👤" : ""}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 공금 현황 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-toss-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-toss-text">💰 공금 현황</p>
            <button
              onClick={() => {
                if (members.length > 0) setFundMemberId(members[0].id);
                setShowAddFund(true);
              }}
              className="text-xs text-toss-blue font-semibold"
            >
              + 공금 추가
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[10px] text-toss-text-ter">모인 자금</p>
              <p className="text-base font-bold text-toss-blue">{formatCurrency(totalFunds, trip?.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-toss-text-ter">총 지출</p>
              <p className="text-base font-bold text-toss-red">{formatCurrency(totalExpense, trip?.currency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-toss-text-ter">남은 금액</p>
              <p className={`text-base font-bold ${remaining >= 0 ? "text-toss-green" : "text-toss-red"}`}>
                {formatCurrency(remaining, trip?.currency)}
              </p>
            </div>
          </div>

          {funds.length > 0 && (
            <div className="mt-3 pt-3 border-t border-toss-border/50 space-y-1">
              {funds.map((f) => (
                <div key={f.id} className="flex items-center justify-between text-xs">
                  <span className="text-toss-text-sub">{f.member_name}{f.note ? ` (${f.note})` : ""}</span>
                  <span className="font-medium text-toss-blue">+{formatCurrency(f.amount, trip?.currency)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/travel/${tripId}/expense/add`)}
            className="flex-1 py-3 bg-toss-blue text-white rounded-2xl font-semibold text-sm"
          >
            + 지출 추가
          </button>
          <button
            onClick={handleSettlement}
            className="flex-1 py-3 bg-white text-toss-text rounded-2xl font-semibold text-sm border border-toss-border"
          >
            정산하기
          </button>
        </div>

        {/* 지출 내역 */}
        {expenses.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-2xl mb-2">💰</p>
            <p className="text-sm text-toss-text-sub">아직 지출 내역이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-toss-border/50 cursor-pointer active:bg-toss-surface/50 transition-colors"
                onClick={() => router.push(`/travel/${tripId}/expense/add?edit=${exp.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-toss-text">{exp.description}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-toss-surface text-toss-text-ter">
                        {exp.category}
                      </span>
                    </div>
                    <p className="text-xs text-toss-text-ter mt-1">
                      {exp.paid_by_name} 결제 · {exp.date}
                    </p>
                    {exp.splits && exp.splits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exp.splits.map((s, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-toss-surface text-toss-text-sub">
                            {s.user_name} {formatCurrency(s.share_amount, trip?.currency)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-toss-red">{formatCurrency(exp.amount, trip?.currency)}</span>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-toss-text-ter hover:text-toss-red text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 게스트 멤버 추가 모달 */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAddMember(false)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-toss-text mb-4">참여자 추가</h2>
            <p className="text-xs text-toss-text-sub mb-3">앱을 쓰지 않는 사람도 이름만으로 추가할 수 있습니다.</p>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors mb-4"
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && handleAddGuest()}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 py-3 rounded-xl bg-toss-surface text-toss-text-sub font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleAddGuest}
                disabled={!guestName.trim()}
                className="flex-1 py-3 rounded-xl bg-toss-blue text-white font-semibold text-sm disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 공금 추가 모달 */}
      {showAddFund && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAddFund(false)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-toss-text mb-4">공금 추가</h2>

            <p className="text-xs font-semibold text-toss-text-sub mb-2">누가 냈나요?</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setFundMemberId(m.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    fundMemberId === m.id
                      ? "bg-toss-blue text-white border-toss-blue"
                      : "bg-white text-toss-text-sub border-toss-border"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>

            <p className="text-xs font-semibold text-toss-text-sub mb-2">금액</p>
            <input
              type="text"
              inputMode="numeric"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors mb-4"
            />

            <p className="text-xs font-semibold text-toss-text-sub mb-2">
              메모 <span className="font-normal text-toss-text-ter">(선택)</span>
            </p>
            <input
              type="text"
              value={fundNote}
              onChange={(e) => setFundNote(e.target.value)}
              placeholder="예: 첫 모임 회비"
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors mb-4"
              maxLength={30}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddFund(false)}
                className="flex-1 py-3 rounded-xl bg-toss-surface text-toss-text-sub font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleAddFund}
                disabled={!fundMemberId || !fundAmount}
                className="flex-1 py-3 rounded-xl bg-toss-green text-white font-semibold text-sm disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 여행 정보 수정 모달 */}
      {showEditTrip && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowEditTrip(false)}>
          <div className="bg-white rounded-2xl p-6 mx-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-toss-text mb-4">여행 정보 수정</h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-1">여행 이름</p>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="여행 이름"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
                  maxLength={30}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-1">여행 위치</p>
                <input
                  type="text"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  placeholder="여행 위치"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
                  maxLength={30}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-1">시작일</p>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-1">종료일</p>
                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-1">설명</p>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="여행 컨셉/설명"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
                  maxLength={100}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-1">화폐 단위</p>
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors bg-white"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowEditTrip(false)}
                className="flex-1 py-3 rounded-xl bg-toss-surface text-toss-text-sub font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleEditTrip}
                disabled={!editName.trim() || !editDestination.trim() || editSaving}
                className="flex-1 py-3 rounded-xl bg-toss-blue text-white font-semibold text-sm disabled:opacity-50"
              >
                {editSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 정산 모달 */}
      {showSettlement && summary && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowSettlement(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg mx-5 px-5 pt-6 pb-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-toss-text">정산 결과</h2>
              <button onClick={() => setShowSettlement(false)} className="text-toss-text-ter text-lg">✕</button>
            </div>

            {/* 총 지출 & 멤버별 요약 */}
            <div className="bg-toss-surface rounded-2xl p-4 mb-5">
              <div className="text-center mb-4">
                <p className="text-xs text-toss-text-ter">총 지출</p>
                <p className="text-xl font-bold text-toss-red">{formatCurrency(summary.totalExpense, trip?.currency)}</p>
              </div>
              <div className="space-y-2">
                {summary.members.map((m) => (
                  <div key={m.memberId} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-toss-text">{m.name}</span>
                    <div className="text-right">
                      <div className="text-xs text-toss-text-ter">
                        결제 {formatCurrency(m.paid, trip?.currency)} / 부담 {formatCurrency(m.share, trip?.currency)}
                      </div>
                      <div className={`font-semibold ${m.balance > 0 ? "text-toss-blue" : m.balance < 0 ? "text-toss-red" : "text-toss-text-sub"}`}>
                        {m.balance > 0 ? `+${formatCurrency(m.balance, trip?.currency)} 받음` : m.balance < 0 ? `${formatCurrency(Math.abs(m.balance), trip?.currency)} 보냄` : "정산 완료"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 공금 잔액 분배 */}
            {settlementFunds && settlementFunds.remaining > 0 && settlementFunds.fundDistribution.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-toss-text-sub mb-3">💰 공금 잔액 분배</h3>
                <div className="bg-toss-surface rounded-2xl p-4">
                  <div className="text-center mb-3">
                    <p className="text-xs text-toss-text-ter">남은 공금</p>
                    <p className="text-lg font-bold text-toss-green">{formatCurrency(settlementFunds.remaining, trip?.currency)}</p>
                  </div>
                  <div className="space-y-2">
                    {settlementFunds.fundDistribution.map((d) => (
                      <div key={d.memberId} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-toss-text">{d.name}</span>
                        <div className="text-right">
                          <div className="text-xs text-toss-text-ter">
                            공금 기여 {formatCurrency(d.contributed, trip?.currency)}
                          </div>
                          <div className="font-semibold text-toss-green">
                            {formatCurrency(d.refund, trip?.currency)} 돌려받음
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 송금 정보 */}
            {settlement.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-toss-text-sub">송금 정보</h3>
                {settlement.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white border border-toss-border rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-toss-red">{s.from_member_name}</span>
                      <span className="text-toss-text-ter">→</span>
                      <span className="font-semibold text-toss-blue">{s.to_member_name}</span>
                    </div>
                    <span className="font-bold text-toss-text">{formatCurrency(s.amount, trip?.currency)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-toss-text-sub py-4">정산할 금액이 없습니다 🎉</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}