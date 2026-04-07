"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { clsx } from "clsx";

interface BudgetData {
  budget: { id: number; budget_amount: number; personal_budget_amount: number } | null;
  monthlyExpense: number;
  todayExpense: number;
  personalMonthlyExpense: number;
  personalTodayExpense: number;
  year: number;
  month: number;
}

function BudgetCard({
  title, emoji, budget, spent, today, daysInMonth, todayNum,
  inputValue, setInputValue, onSave, saving, editKey, activeEdit, setActiveEdit,
}: {
  title: string; emoji: string; budget: number; spent: number; today: number;
  daysInMonth: number; todayNum: number;
  inputValue: string; setInputValue: (v: string) => void;
  onSave: () => void; saving: boolean;
  editKey: string; activeEdit: string | null; setActiveEdit: (k: string | null) => void;
}) {
  const remaining = budget - spent;
  const usedPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const idealPct = (todayNum / daysInMonth) * 100;
  const isEditing = activeEdit === editKey;

  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-toss-text-ter">{emoji} {title}</p>
          <p className="text-base font-bold text-toss-text mt-0.5">
            {budget > 0 ? formatKRW(budget) : "미설정"}
          </p>
        </div>
        <button
          onClick={() => { setActiveEdit(isEditing ? null : editKey); setInputValue(budget > 0 ? String(budget) : ""); }}
          className="text-xs font-semibold text-toss-blue bg-toss-blue-light px-3 py-1.5 rounded-pill"
        >
          {budget > 0 ? "수정" : "설정"}
        </button>
      </div>

      {isEditing && (
        <div className="mb-4 flex gap-2">
          <input
            type="text" inputMode="numeric"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="예: 1500000"
            className="flex-1 px-4 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
          />
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-xl">
            {saving ? "..." : "저장"}
          </button>
        </div>
      )}

      {budget > 0 ? (
        <>
          <div className="flex justify-between mb-2">
            <p className="text-2xl font-bold text-toss-text">{formatKRW(spent)}</p>
            <div className="text-right">
              <p className="text-xs text-toss-text-ter">사용</p>
              <p className="text-sm font-bold text-toss-red">{formatKRW(spent)}</p>
            </div>
          </div>

          <div className="relative h-3 bg-toss-surface rounded-full overflow-hidden mb-2">
            <div className="absolute top-0 bottom-0 w-0.5 bg-toss-text-ter z-10" style={{ left: `${idealPct}%` }} />
            <div
              className={clsx("h-full rounded-full transition-all", {
                "bg-toss-red": usedPct > idealPct + 10,
                "bg-orange-400": usedPct > idealPct && usedPct <= idealPct + 10,
                "bg-toss-blue": usedPct <= idealPct,
              })}
              style={{ width: `${usedPct}%` }}
            />
          </div>

          <div className="flex justify-between">
            <p className="text-xs text-toss-text-ter">
              남은 금액{" "}
              <span className={clsx("font-semibold", remaining < 0 ? "text-toss-red" : "text-toss-blue")}>
                {formatKRW(remaining)}
              </span>
            </p>
            <p className="text-xs text-toss-text-ter">{usedPct.toFixed(0)}% 사용</p>
          </div>

          <p className="text-xs text-toss-text-ter mt-1">
            {todayNum}일 기준 이상적 지출: {formatKRW(Math.round((budget / daysInMonth) * todayNum))}
            {usedPct > idealPct + 5 ? " · 지출이 빠른 편이에요" : usedPct < idealPct - 10 ? " · 절약하고 있어요 👍" : " · 적절한 속도예요"}
          </p>

          <div className="mt-3 pt-3 border-t border-toss-border flex justify-between">
            <div>
              <p className="text-xs text-toss-text-ter">오늘 지출</p>
              <p className="text-sm font-bold text-toss-red">{formatKRW(today)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-toss-text-ter">하루 권장</p>
              <p className="text-sm font-bold text-toss-text">{formatKRW(Math.round(budget / daysInMonth))}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-toss-text-ter">예산을 설정해보세요</p>
        </div>
      )}
    </div>
  );
}

export default function BudgetPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  const [familyInput, setFamilyInput] = useState("");
  const [personalInput, setPersonalInput] = useState("");
  const [activeEdit, setActiveEdit] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [judgment, setJudgment] = useState<null | { ok: boolean; message: string; detail: string }>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budget?year=${year}&month=${month}`);
      if (res.ok) {
        const d = await res.json();
        setData(d);
        setFamilyInput(d.budget ? String(d.budget.budget_amount) : "");
        setPersonalInput(d.budget ? String(d.budget.personal_budget_amount || "") : "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFamilyBudget = async () => {
    const amount = parseInt(familyInput, 10);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month, budget_amount: amount }),
      });
      await fetchData();
      setActiveEdit(null);
    } finally {
      setSaving(false);
    }
  };

  const savePersonalBudget = async () => {
    const amount = parseInt(personalInput, 10);
    if (!amount || amount <= 0) return;
    setSaving(true);
    try {
      await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year, month,
          budget_amount: data?.budget?.budget_amount ?? 0,
          personal_budget_amount: amount,
        }),
      });
      await fetchData();
      setActiveEdit(null);
    } finally {
      setSaving(false);
    }
  };

  const handleJudge = () => {
    if (!data?.budget || !purchaseAmount) return;
    const purchase = parseInt(purchaseAmount, 10);
    if (!purchase) return;

    const budget = data.budget.budget_amount;
    const spent = data.monthlyExpense;
    const remaining = budget - spent;
    const afterPurchase = spent + purchase;
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = now.getDate();
    const daysLeft = daysInMonth - today;
    const idealSpent = (budget / daysInMonth) * today;
    const isOnTrack = spent <= idealSpent;
    const percentAfter = (afterPurchase / budget) * 100;

    if (afterPurchase > budget) {
      setJudgment({ ok: false, message: "❌ 구매하지 마세요",
        detail: `이 금액을 사용하면 가족 예산(${formatKRW(budget)})을 ${formatKRW(afterPurchase - budget)} 초과해요. 남은 예산은 ${formatKRW(remaining)}이에요.` });
    } else if (percentAfter > 90) {
      setJudgment({ ok: false, message: "⚠️ 신중하게 고려하세요",
        detail: `구매 후 가족 예산의 ${percentAfter.toFixed(0)}%를 사용하게 되어요. 앞으로 ${daysLeft}일이 남아있어서 빠듯할 수 있어요.` });
    } else if (!isOnTrack && percentAfter > 70) {
      setJudgment({ ok: false, message: "⚠️ 주의가 필요해요",
        detail: `오늘까지 이상적으로는 ${formatKRW(Math.round(idealSpent))}을 써야 했지만 이미 ${formatKRW(spent)}을 썼어요. 지출 속도가 빠른 편이에요.` });
    } else {
      setJudgment({ ok: true, message: "✅ 구매해도 괜찮아요",
        detail: `구매 후 가족 예산의 ${percentAfter.toFixed(0)}%만 사용돼요. 남은 ${daysLeft}일 동안 ${formatKRW(Math.round((budget - afterPurchase) / Math.max(daysLeft, 1)))}씩 쓸 수 있어요.` });
    }
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const todayNum = now.getDate();
  const monthLabel = `${year}년 ${month}월`;

  return (
    <div className="min-h-screen bg-toss-surface pb-24">
      <TopBar showBack title="예산 관리" />

      {loading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-4">
          <p className="text-xs font-semibold text-toss-text-ter px-1">{monthLabel}</p>

          {/* 가족 공유 예산 */}
          <BudgetCard
            title="가족 공유 예산" emoji="👨‍👩‍👧‍👦"
            budget={data?.budget?.budget_amount ?? 0}
            spent={data?.monthlyExpense ?? 0}
            today={data?.todayExpense ?? 0}
            daysInMonth={daysInMonth} todayNum={todayNum}
            inputValue={familyInput} setInputValue={setFamilyInput}
            onSave={saveFamilyBudget} saving={saving}
            editKey="family" activeEdit={activeEdit} setActiveEdit={setActiveEdit}
          />

          {/* 개인 예산 */}
          <BudgetCard
            title="내 개인 예산" emoji="👤"
            budget={data?.budget?.personal_budget_amount ?? 0}
            spent={data?.personalMonthlyExpense ?? 0}
            today={data?.personalTodayExpense ?? 0}
            daysInMonth={daysInMonth} todayNum={todayNum}
            inputValue={personalInput} setInputValue={setPersonalInput}
            onSave={savePersonalBudget} saving={saving}
            editKey="personal" activeEdit={activeEdit} setActiveEdit={setActiveEdit}
          />

          {/* 이거 사도 될까? */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-5">
            <p className="text-base font-bold text-toss-text mb-1">이거 사도 될까? 🤔</p>
            <p className="text-xs text-toss-text-ter mb-4">가족 예산 기준으로 판단해드려요</p>

            {(data?.budget?.budget_amount ?? 0) <= 0 ? (
              <p className="text-sm text-toss-text-ter text-center py-4">먼저 가족 예산을 설정해주세요</p>
            ) : (
              <>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 relative">
                    <input
                      type="text" inputMode="numeric"
                      value={purchaseAmount}
                      onChange={(e) => { setPurchaseAmount(e.target.value.replace(/[^0-9]/g, "")); setJudgment(null); }}
                      placeholder="구매 금액 입력"
                      className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                    />
                    {purchaseAmount && (
                      <p className="text-xs text-toss-blue mt-1 pl-1">{formatKRW(parseInt(purchaseAmount))}</p>
                    )}
                  </div>
                  <button
                    onClick={handleJudge}
                    disabled={!purchaseAmount}
                    className="px-5 py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl self-start"
                  >
                    판단
                  </button>
                </div>

                {judgment && (
                  <div className={clsx("rounded-xl px-4 py-4 mt-2", {
                    "bg-green-50": judgment.ok, "bg-red-50": !judgment.ok,
                  })}>
                    <p className={clsx("text-sm font-bold mb-1.5", {
                      "text-green-700": judgment.ok, "text-toss-red": !judgment.ok,
                    })}>
                      {judgment.message}
                    </p>
                    <p className="text-xs leading-relaxed text-toss-text">{judgment.detail}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
