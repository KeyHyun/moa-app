"use client";

import { useSpendingStore } from "@/store/spendingStore";
import { formatKRW } from "@/lib/formatters";
import { isSameDay, parseLocalDate } from "@/lib/formatters";

export function DailySummaryBar() {
  const transactions = useSpendingStore((s) => s.transactions);
  const selectedDate = useSpendingStore((s) => s.selectedDate);
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);

  const items = transactions.filter((t) => {
    if (!isSameDay(parseLocalDate(t.date), selectedDate)) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    return true;
  });

  const totalExpense = items.filter((s) => s.type === "expense").reduce((sum, s) => sum + s.amount, 0);
  const totalIncome = items.filter((s) => s.type === "income").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-toss-border">
      <div className="flex items-center gap-1">
        <span className="text-xs text-toss-text-sub">수입</span>
        <span className="text-sm font-semibold text-toss-green">
          {totalIncome > 0 ? `+${formatKRW(totalIncome)}` : "0원"}
        </span>
      </div>
      <div className="w-px h-3 bg-toss-border" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-toss-text-sub">지출</span>
        <span className="text-sm font-semibold text-toss-red">
          {totalExpense > 0 ? `-${formatKRW(totalExpense)}` : "0원"}
        </span>
      </div>
      <div className="w-px h-3 bg-toss-border" />
      <div className="flex items-center gap-1">
        <span className="text-xs text-toss-text-sub">합계</span>
        <span className={`text-sm font-semibold ${totalIncome - totalExpense >= 0 ? "text-toss-green" : "text-toss-red"}`}>
          {totalIncome - totalExpense >= 0 ? "+" : ""}
          {formatKRW(totalIncome - totalExpense)}
        </span>
      </div>
    </div>
  );
}
