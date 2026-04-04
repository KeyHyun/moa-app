"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CategoryPicker } from "@/components/spending-form/CategoryPicker";
import { useSpendingStore } from "@/store/spendingStore";
import { SpendingCategory } from "@/types";
import { clsx } from "clsx";

type SpendingType = "expense" | "income";

export default function AddSpendingPage() {
  const router = useRouter();
  const addTransaction = useSpendingStore((s) => s.addTransaction);

  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<SpendingCategory>("식비");
  const [type, setType] = useState<SpendingType>("expense");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const amount = parseInt(amountStr, 10) || 0;

  const handleSave = async () => {
    if (amount === 0 || saving) return;
    setSaving(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await addTransaction({ type, category, amount, memo, date: today });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar
        showBack
        title={type === "expense" ? "지출 추가" : "수입 추가"}
        rightAction={
          <button
            onClick={handleSave}
            disabled={amount === 0 || saving}
            className={clsx(
              "text-sm font-semibold px-3 py-1.5 rounded-pill transition-colors whitespace-nowrap",
              amount > 0 && !saving
                ? "text-toss-blue hover:bg-toss-blue-light"
                : "text-toss-text-ter"
            )}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        }
      />

      {/* Type toggle */}
      <div className="flex mx-5 mt-3 bg-toss-surface rounded-pill p-1">
        {(["expense", "income"] as SpendingType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={clsx(
              "flex-1 py-2 text-sm font-semibold rounded-pill transition-all",
              type === t
                ? t === "expense"
                  ? "bg-toss-red text-white shadow-sm"
                  : "bg-toss-green text-white shadow-sm"
                : "text-toss-text-sub"
            )}
          >
            {t === "expense" ? "지출" : "수입"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4">
        {/* 금액 */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-toss-text-sub mb-1">금액</p>
          <div className="flex items-baseline gap-2 pb-2 border-b-2 border-toss-border focus-within:border-toss-blue transition-colors">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="flex-1 text-4xl font-bold bg-transparent outline-none placeholder:text-toss-border"
              style={{ color: type === "expense" ? "#F04452" : "#2DB400" }}
            />
            <span className="text-xl font-medium text-toss-text-sub">원</span>
          </div>
          {amount > 0 && (
            <p className="text-xs text-toss-blue mt-1.5 pl-1">{amount.toLocaleString("ko-KR")}원</p>
          )}
        </div>

        {/* 카테고리 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-toss-text-sub mb-2">카테고리</p>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        {/* 메모 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">메모</p>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={`어디서 ${type === "expense" ? "쓰셨나요" : "받으셨나요"}?`}
            className="w-full px-4 py-3 rounded-input border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
            maxLength={50}
          />
        </div>
      </div>
    </div>
  );
}
