"use client";

import { useSpendingStore } from "@/store/spendingStore";
import { useAuthStore } from "@/store/authStore";
import { formatKRW } from "@/lib/formatters";
import { isSameDay, parseLocalDate } from "@/lib/formatters";

export function DailySummaryBar() {
  const transactions = useSpendingStore((s) => s.transactions);
  const selectedDate = useSpendingStore((s) => s.selectedDate);
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);
  const currentUser = useAuthStore((s) => s.user);

  const dayItems = transactions.filter((t) => {
    if (!isSameDay(parseLocalDate(t.date), selectedDate)) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    return true;
  });

  // 공유 = family visibility, 혼자 = private visibility (내 것만)
  const sharedExpense = dayItems
    .filter((t) => t.type === "expense" && t.visibility === "family")
    .reduce((s, t) => s + t.amount, 0);
  const privateExpense = dayItems
    .filter((t) => t.type === "expense" && t.visibility === "private" && t.user_id === currentUser?.id)
    .reduce((s, t) => s + t.amount, 0);
  const totalIncome = dayItems
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = dayItems
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const hasPrivate = privateExpense > 0;
  const hasShared = sharedExpense > 0;

  return (
    <div className="px-5 py-2.5 bg-white border-b border-toss-border space-y-1.5">
      {/* 합산 행 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
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
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-toss-text-sub">합계</span>
          <span className={`text-sm font-semibold ${totalIncome - totalExpense >= 0 ? "text-toss-green" : "text-toss-red"}`}>
            {totalIncome - totalExpense >= 0 ? "+" : ""}
            {formatKRW(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* 공유 / 혼자 분리 표시 */}
      {(hasShared || hasPrivate) && (
        <div className="flex items-center gap-3">
          {hasShared && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-toss-text-ter">🏠 공유</span>
              <span className="text-[11px] font-semibold text-toss-red">-{formatKRW(sharedExpense)}</span>
            </div>
          )}
          {hasShared && hasPrivate && <div className="w-px h-2.5 bg-toss-border" />}
          {hasPrivate && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-toss-text-ter">🔒 나만</span>
              <span className="text-[11px] font-semibold text-toss-red">-{formatKRW(privateExpense)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
