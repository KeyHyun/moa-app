"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSpendingStore, ViewMode } from "@/store/spendingStore";
import { TopBar } from "@/components/layout/TopBar";
import { CategoryFilterBar } from "@/components/spending/CategoryFilterBar";
import { SpendingItem } from "@/components/spending/SpendingItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { isSameDay, parseLocalDate, formatKRW } from "@/lib/formatters";
import { clsx } from "clsx";

type SortOrder = "time" | "amount_desc" | "amount_asc";

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "time", label: "시간순" },
  { value: "amount_desc", label: "금액↓" },
  { value: "amount_asc", label: "금액↑" },
];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function SpendingPage() {
  const {
    fetchTransactions, fetchTransactionsByMonth, fetchTransactionsByRange,
    setSelectedDate, selectedDate,
    isLoading, transactions,
    selectedCategory, selectedType, setSelectedType,
    viewMode, setViewMode,
    selectedMonth, setSelectedMonth,
    dateRange, setDateRange,
  } = useSpendingStore();

  const [sortOrder, setSortOrder] = useState<SortOrder>("time");
  const [rangeFrom, setRangeFrom] = useState(dateRange.from);
  const [rangeTo, setRangeTo] = useState(dateRange.to);

  // 초기 로드 - 월별이 기본
  useEffect(() => {
    fetchTransactionsByMonth(selectedMonth.year, selectedMonth.month);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 뷰모드별 필터링
  const visibleItems = useMemo(() => {
    let items = transactions.filter((t) => {
      if (viewMode === "day" && !isSameDay(parseLocalDate(t.date), selectedDate)) return false;
      if (selectedType !== "all" && t.type !== selectedType) return false;
      if (selectedCategory && t.category !== selectedCategory) return false;
      return true;
    });
    if (sortOrder === "amount_desc") items = [...items].sort((a, b) => b.amount - a.amount);
    else if (sortOrder === "amount_asc") items = [...items].sort((a, b) => a.amount - b.amount);
    return items;
  }, [transactions, viewMode, selectedDate, selectedType, selectedCategory, sortOrder]);

  const totalIncome = visibleItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = visibleItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // 월별/기간별 그룹화
  const groupedByDay = useMemo(() => {
    if (viewMode === "day") return null;
    const map = new Map<string, typeof visibleItems>();
    for (const t of visibleItems) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date)!.push(t);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [visibleItems, viewMode]);

  const handleMonthChange = (delta: number) => {
    let { year, month } = selectedMonth;
    month += delta;
    if (month > 12) { month = 1; year++; }
    if (month < 1) { month = 12; year--; }
    setSelectedMonth(year, month);
    fetchTransactionsByMonth(year, month);
  };

  const handleRangeApply = () => {
    if (rangeFrom > rangeTo) return;
    setDateRange(rangeFrom, rangeTo);
    fetchTransactionsByRange(rangeFrom, rangeTo);
  };

  const handleTypeToggle = (type: "income" | "expense") => {
    setSelectedType(selectedType === type ? "all" : type);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "day") fetchTransactions();
    else if (mode === "month") fetchTransactionsByMonth(selectedMonth.year, selectedMonth.month);
    else if (mode === "range") fetchTransactionsByRange(dateRange.from, dateRange.to);
  };

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar title="가계부" />

      {/* Sticky header */}
      <div className="sticky top-14 z-30 bg-white shadow-sm">
        {/* 뷰모드 탭 */}
        <div className="flex border-b border-toss-border">
          {(["day", "month", "range"] as ViewMode[]).map((mode) => {
            const labels = { day: "일별", month: "월별", range: "기간" };
            return (
              <button
                key={mode}
                onClick={() => handleViewModeChange(mode)}
                className={clsx(
                  "flex-1 py-2.5 text-sm font-semibold transition-colors",
                  viewMode === mode
                    ? "text-toss-blue border-b-2 border-toss-blue"
                    : "text-toss-text-sub"
                )}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {/* 날짜 네비게이션 */}
        {viewMode === "day" && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-toss-border">
            <button
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl"
            >‹</button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="flex-1 text-sm font-semibold text-toss-text text-center"
            >
              {selectedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </button>
            <button
              onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl"
            >›</button>
          </div>
        )}

        {viewMode === "month" && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-toss-border">
            <button onClick={() => handleMonthChange(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl">‹</button>
            <span className="flex-1 text-sm font-semibold text-toss-text text-center">
              {selectedMonth.year}년 {selectedMonth.month}월
            </span>
            <button onClick={() => handleMonthChange(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-toss-surface text-toss-text-sub text-xl">›</button>
          </div>
        )}

        {viewMode === "range" && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-toss-border">
            <input
              type="date"
              value={rangeFrom}
              max={todayStr()}
              onChange={(e) => setRangeFrom(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue"
            />
            <span className="text-toss-text-ter text-sm">~</span>
            <input
              type="date"
              value={rangeTo}
              min={rangeFrom}
              max={todayStr()}
              onChange={(e) => setRangeTo(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue"
            />
            <button
              onClick={handleRangeApply}
              className="px-3 py-1.5 bg-toss-blue text-white text-xs font-semibold rounded-lg"
            >
              조회
            </button>
          </div>
        )}

        {/* 수입/지출 요약 (클릭으로 필터) */}
        <div className="px-5 py-2.5 bg-white border-b border-toss-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTypeToggle("income")}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                selectedType === "income" ? "bg-toss-green/10" : "hover:bg-toss-surface"
              )}
            >
              <span className="text-xs text-toss-text-sub">수입</span>
              <span className={clsx("text-sm font-semibold", selectedType === "income" ? "text-toss-green" : "text-toss-green")}>
                {totalIncome > 0 ? `+${formatKRW(totalIncome)}` : "0원"}
              </span>
            </button>
            <div className="w-px h-3 bg-toss-border" />
            <button
              onClick={() => handleTypeToggle("expense")}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg transition-colors",
                selectedType === "expense" ? "bg-toss-red/10" : "hover:bg-toss-surface"
              )}
            >
              <span className="text-xs text-toss-text-sub">지출</span>
              <span className="text-sm font-semibold text-toss-red">
                {totalExpense > 0 ? `-${formatKRW(totalExpense)}` : "0원"}
              </span>
            </button>
          </div>
          {selectedType !== "all" && (
            <button
              onClick={() => setSelectedType("all")}
              className="text-xs text-toss-text-ter underline"
            >
              전체보기
            </button>
          )}
          {selectedType === "all" && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-toss-text-sub">합계</span>
              <span className={clsx("text-sm font-semibold", totalIncome - totalExpense >= 0 ? "text-toss-green" : "text-toss-red")}>
                {totalIncome - totalExpense >= 0 ? "+" : ""}{formatKRW(totalIncome - totalExpense)}
              </span>
            </div>
          )}
        </div>

        {/* 카테고리 필터 */}
        <CategoryFilterBar />

        {/* 정렬 */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-t border-toss-border">
          <span className="text-xs text-toss-text-ter mr-1">정렬</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortOrder(opt.value)}
              className={clsx(
                "px-3 py-1 rounded-pill text-xs font-semibold transition-colors",
                sortOrder === opt.value
                  ? "bg-toss-blue text-white"
                  : "bg-toss-surface text-toss-text-sub"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAB */}
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
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-5xl">💸</div>
            <p className="text-base font-semibold text-toss-text">거래 내역이 없습니다</p>
            <p className="text-sm text-toss-text-ter">거래를 기록해보세요</p>
            <Link href="/spending/add" className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill">
              + 거래 추가
            </Link>
          </div>
        ) : viewMode === "day" ? (
          visibleItems.map((item) => <SpendingItem key={item.id} item={item} />)
        ) : (
          /* 월별/기간별: 날짜 그룹 */
          groupedByDay!.map(([date, dayItems]) => {
            const dayExpense = dayItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
            const dayIncome = dayItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
            const d = parseLocalDate(date);
            const dayLabel = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
            return (
              <div key={date}>
                <div className="flex items-center justify-between px-5 py-2 bg-toss-surface border-b border-toss-border">
                  <span className="text-xs font-semibold text-toss-text-sub">{dayLabel}</span>
                  <div className="flex items-center gap-2">
                    {dayIncome > 0 && <span className="text-xs font-medium text-toss-green">+{formatKRW(dayIncome)}</span>}
                    {dayExpense > 0 && <span className="text-xs font-medium text-toss-red">-{formatKRW(dayExpense)}</span>}
                  </div>
                </div>
                {dayItems.map((item) => <SpendingItem key={item.id} item={item} />)}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
