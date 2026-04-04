"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSpendingStore } from "@/store/spendingStore";
import { TopBar } from "@/components/layout/TopBar";
import { DailySummaryBar } from "@/components/spending/DailySummaryBar";
import { CategoryFilterBar } from "@/components/spending/CategoryFilterBar";
import { SpendingItem } from "@/components/spending/SpendingItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { isSameDay, parseLocalDate } from "@/lib/formatters";

export default function SpendingPage() {
  const fetchTransactions = useSpendingStore((s) => s.fetchTransactions);
  const setSelectedDate = useSpendingStore((s) => s.setSelectedDate);
  const selectedDate = useSpendingStore((s) => s.selectedDate);
  const isLoading = useSpendingStore((s) => s.isLoading);
  const transactions = useSpendingStore((s) => s.transactions);
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);
  const selectedType = useSpendingStore((s) => s.selectedType);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const items = transactions.filter((t) => {
    if (!isSameDay(parseLocalDate(t.date), selectedDate)) return false;
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar title="가계부" />

      {/* 날짜 헤더 (sticky) */}
      <div className="sticky top-14 z-30 bg-white shadow-sm">
        {/* 날짜 네비게이션 */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-toss-border">
          <button
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl"
          >‹</button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className="flex-1 text-sm font-semibold text-toss-text text-center"
          >
            {selectedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </button>
          <button
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl"
          >›</button>
        </div>

        {/* 수입/지출 요약 */}
        <DailySummaryBar />

        {/* 카테고리 필터 */}
        <CategoryFilterBar />
      </div>

      {/* 거래 추가 FAB */}
      <Link
        href="/spending/add"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-toss-blue flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>

      {/* 거래 목록 */}
      <div className="mt-2 bg-white divide-y divide-toss-border pb-24">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <Skeleton className="w-11 h-11" rounded="full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
              <Skeleton className="w-20 h-5" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">💸</div>
            <p className="text-base font-semibold text-toss-text">거래 내역이 없습니다</p>
            <p className="text-sm text-toss-text-ter">이 날의 거래를 기록해보세요</p>
            <Link href="/spending/add" className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill">
              + 거래 추가
            </Link>
          </div>
        ) : (
          items.map((item) => <SpendingItem key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
