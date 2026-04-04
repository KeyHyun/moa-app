"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { AmountKeypad } from "@/components/spending-form/AmountKeypad";
import { CategoryPicker } from "@/components/spending-form/CategoryPicker";
import { useSpendingStore } from "@/store/spendingStore";
import { SpendingCategory } from "@/types";
import { clsx } from "clsx";

type SpendingType = "expense" | "income";

export default function AddSpendingPage() {
  const router = useRouter();
  const addTransaction = useSpendingStore((s) => s.addTransaction);

  const [amountStr, setAmountStr] = useState("0");
  const [category, setCategory] = useState<SpendingCategory>("식비");
  const [type, setType] = useState<SpendingType>("expense");
  const [memo, setMemo] = useState("");
  const [keypadOpen, setKeypadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const memoRef = useRef<HTMLInputElement>(null);

  const amount = parseInt(amountStr.replace(/,/g, ""), 10) || 0;

  const handleKeyPress = (key: string) => {
    if (key === "지우기") {
      setAmountStr((prev) => {
        const raw = prev.replace(/,/g, "");
        if (raw.length <= 1) return "0";
        return formatAmount(raw.slice(0, -1));
      });
    } else {
      setAmountStr((prev) => {
        const raw = prev.replace(/,/g, "");
        const append = key === "00" ? "00" : key;
        if (raw === "0") return append === "00" ? "0" : formatAmount(append);
        if (raw.length >= 9) return prev;
        return formatAmount(raw + append);
      });
    }
  };

  function formatAmount(raw: string): string {
    const num = parseInt(raw, 10);
    if (isNaN(num)) return "0";
    return num.toLocaleString("ko-KR");
  }

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

  const toggleKeypad = () => {
    memoRef.current?.blur();
    setKeypadOpen((prev) => !prev);
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
        <button onClick={toggleKeypad} className="w-full text-left mb-6">
          <p className="text-xs font-semibold text-toss-text-sub mb-1">금액</p>
          <div
            className={clsx(
              "flex items-baseline gap-2 pb-2 border-b-2 transition-colors",
              keypadOpen ? "border-toss-blue" : "border-toss-border"
            )}
          >
            <span
              className="text-4xl font-bold"
              style={{ color: type === "expense" ? "#F04452" : "#2DB400" }}
            >
              {amountStr}
            </span>
            <span className="text-xl font-medium text-toss-text-sub">원</span>
            {!keypadOpen && (
              <span className="ml-auto text-xs text-toss-blue font-medium">탭하여 입력</span>
            )}
          </div>
        </button>

        {/* 카테고리 */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-toss-text-sub mb-2">카테고리</p>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        {/* 메모 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">메모</p>
          <input
            ref={memoRef}
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onFocus={() => setKeypadOpen(false)}
            placeholder={`어디서 ${type === "expense" ? "쓰셨나요" : "받으셨나요"}?`}
            className="w-full px-4 py-3 rounded-input border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
            maxLength={50}
          />
        </div>
      </div>

      {/* 키패드 */}
      <div
        className={clsx(
          "border-t border-toss-border transition-all duration-300 overflow-hidden",
          keypadOpen ? "max-h-[280px]" : "max-h-0 border-t-0"
        )}
      >
        <AmountKeypad onPress={handleKeyPress} />
      </div>
    </div>
  );
}
