"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { formatCurrency, CURRENCY_SYMBOLS } from "@/lib/formatters";
import type { TripMember, TripExpense } from "@/types";

const EXPENSE_CATEGORIES = ["식비", "교통", "숙박", "관광", "쇼핑", "문화", "의료", "기타"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AddExpensePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = Number(params.id);
  const editExpenseId = searchParams.get("edit") ? Number(searchParams.get("edit")) : null;
  const isEdit = !!editExpenseId;

  const [members, setMembers] = useState<TripMember[]>([]);
  const [currency, setCurrency] = useState("KRW");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("식비");
  const [date, setDate] = useState(todayStr());
  const [paidByMemberId, setPaidByMemberId] = useState<number | null>(null);
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.members);
        if (data.trip?.currency) setCurrency(data.trip.currency);
        if (data.members.length > 0 && !isEdit) {
          setPaidByMemberId(data.members[0].id);
          setSelectedMembers(new Set(data.members.map((m: TripMember) => m.id)));
        }
      });
  }, [tripId, isEdit]);

  // 수정 모드: 기존 지출 데이터 로드
  useEffect(() => {
    if (!editExpenseId) return;
    fetch(`/api/trips/${tripId}/expenses`)
      .then((r) => r.json())
      .then((expenses: TripExpense[]) => {
        const exp = expenses.find((e) => e.id === editExpenseId);
        if (!exp) return;
        setAmount(String(exp.amount));
        setDescription(exp.description);
        setCategory(exp.category);
        setDate(exp.date);
        setPaidByMemberId(exp.paid_by_member_id);
        setSplitType(exp.split_type === "custom" ? "custom" : "equal");
        if (exp.splits && exp.splits.length > 0) {
          setSelectedMembers(new Set(exp.splits.map((s) => s.member_id)));
          if (exp.split_type === "custom") {
            const ca: Record<number, string> = {};
            exp.splits.forEach((s) => { ca[s.member_id] = String(s.share_amount); });
            setCustomAmounts(ca);
          }
        }
      });
  }, [tripId, editExpenseId]);

  const numAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;

  const toggleMember = (id: number) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!paidByMemberId || numAmount === 0 || !description.trim() || saving) return;
    setSaving(true);

    let splits: { member_id: number; share_amount: number }[] = [];

    if (splitType === "equal") {
      const memberIds = Array.from(selectedMembers);
      if (memberIds.length === 0) { setSaving(false); return; }
      const sharePerPerson = Math.floor(numAmount / memberIds.length);
      const remainder = numAmount - sharePerPerson * memberIds.length;
      splits = memberIds.map((id, i) => ({
        member_id: id,
        share_amount: sharePerPerson + (i === 0 ? remainder : 0),
      }));
    } else {
      const memberIds = Array.from(selectedMembers);
      splits = memberIds.map((id) => ({
        member_id: id,
        share_amount: parseInt(customAmounts[id] || "0", 10) || 0,
      }));
    }

    try {
      const url = `/api/trips/${tripId}/expenses`;
      const method = isEdit ? "PATCH" : "POST";
      const body: Record<string, unknown> = {
        paid_by_member_id: paidByMemberId,
        amount: numAmount,
        description: description.trim(),
        category,
        date,
        split_type: splitType,
        splits,
      };
      if (isEdit) body.expense_id = editExpenseId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        router.back();
      } else {
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const canSave = paidByMemberId && numAmount > 0 && description.trim() && selectedMembers.size > 0;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar showBack title={isEdit ? "지출 수정" : "지출 추가"} />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-6 space-y-5">
        {/* 금액 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-1">금액</p>
          <div className="flex items-baseline gap-2 pb-2 border-b-2 border-toss-border focus-within:border-toss-blue transition-colors">
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="flex-1 text-4xl font-bold bg-transparent outline-none placeholder:text-toss-border text-toss-red"
            />
            <span className="text-xl font-medium text-toss-text-sub">{CURRENCY_SYMBOLS[currency] || currency}</span>
          </div>
          {numAmount > 0 && (
            <p className="text-xs text-toss-blue mt-1.5 pl-1">{formatCurrency(numAmount, currency)}</p>
          )}
        </div>

        {/* 날짜 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">날짜</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {EXPENSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  category === cat
                    ? "bg-toss-blue text-white border-toss-blue"
                    : "bg-white text-toss-text-sub border-toss-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">내용</p>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="무엇에 쓰셨나요?"
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors placeholder:text-toss-text-ter"
            maxLength={50}
          />
        </div>

        {/* 누가 냈는지 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">누가 냈나요?</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaidByMemberId(m.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  paidByMemberId === m.id
                    ? "bg-toss-blue text-white border-toss-blue"
                    : "bg-white text-toss-text-sub border-toss-border"
                }`}
              >
                {m.name}{m.is_guest ? " 👤" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* 분할 방식 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">누구를 위해 썼나요?</p>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSplitType("equal")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                splitType === "equal" ? "bg-toss-blue text-white" : "bg-toss-surface text-toss-text-sub"
              }`}
            >
              균등 분할
            </button>
            <button
              onClick={() => setSplitType("custom")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                splitType === "custom" ? "bg-toss-blue text-white" : "bg-toss-surface text-toss-text-sub"
              }`}
            >
              개별 지정
            </button>
          </div>

          <div className="space-y-2">
            {members.map((m) => {
              const isSelected = selectedMembers.has(m.id);
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMember(m.id)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "bg-toss-blue border-toss-blue" : "border-toss-border bg-white"
                    }`}
                  >
                    {isSelected && <span className="text-white text-xs">✓</span>}
                  </button>
                  <span className="text-sm text-toss-text flex-shrink-0">
                    {m.name}{m.is_guest ? " 👤" : ""}
                  </span>
                  {splitType === "custom" && isSelected && (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customAmounts[m.id] || ""}
                      onChange={(e) =>
                        setCustomAmounts((prev) => ({ ...prev, [m.id]: e.target.value.replace(/[^0-9]/g, "") }))
                      }
                      placeholder="금액"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-toss-border text-sm outline-none focus:border-toss-blue text-right"
                    />
                  )}
                  {splitType === "equal" && isSelected && numAmount > 0 && (
                    <span className="text-xs text-toss-text-ter ml-auto">
                      {formatCurrency(Math.floor(numAmount / selectedMembers.size), currency)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="sticky bottom-0 px-5 py-4 bg-white border-t border-toss-border">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 rounded-2xl font-semibold text-sm transition-colors bg-toss-red text-white disabled:opacity-50"
        >
          {saving
            ? "저장 중..."
            : numAmount > 0
              ? `${formatCurrency(numAmount, currency)} ${isEdit ? "지출 수정" : "지출 저장"}`
              : "금액을 입력해주세요"}
        </button>
      </div>
    </div>
  );
}