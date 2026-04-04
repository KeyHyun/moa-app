"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSpendingStore } from "@/store/spendingStore";
import { TopBar } from "@/components/layout/TopBar";
import { DailySummaryBar } from "@/components/spending/DailySummaryBar";
import { CategoryFilterBar } from "@/components/spending/CategoryFilterBar";
import { SpendingItem } from "@/components/spending/SpendingItem";
import { Skeleton } from "@/components/ui/Skeleton";
import { isSameDay, parseLocalDate, formatKRW } from "@/lib/formatters";
import { clsx } from "clsx";

interface CardBill {
  id: number;
  user_id: number;
  user_name: string;
  card_name: string;
  amount: number;
  due_date: string;
}

export default function SpendingPage() {
  const fetchTransactions = useSpendingStore((s) => s.fetchTransactions);
  const setSelectedDate = useSpendingStore((s) => s.setSelectedDate);
  const selectedDate = useSpendingStore((s) => s.selectedDate);
  const isLoading = useSpendingStore((s) => s.isLoading);
  const transactions = useSpendingStore((s) => s.transactions);
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);
  const selectedType = useSpendingStore((s) => s.selectedType);

  const now = new Date();
  const [cardBills, setCardBills] = useState<CardBill[]>([]);
  const [showCardSection, setShowCardSection] = useState(true);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cardDueDate, setCardDueDate] = useState("");
  const [cardSaving, setCardSaving] = useState(false);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const fetchCardBills = async () => {
    const res = await fetch(`/api/card-bills?year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
    if (res.ok) setCardBills(await res.json());
  };

  useEffect(() => { fetchCardBills(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCard = async () => {
    if (!cardName.trim() || !cardAmount) return;
    setCardSaving(true);
    try {
      await fetch("/api/card-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_name: cardName.trim(),
          amount: parseInt(cardAmount, 10),
          due_date: cardDueDate,
          year: now.getFullYear(),
          month: now.getMonth() + 1,
        }),
      });
      setCardName(""); setCardAmount(""); setCardDueDate("");
      setShowCardForm(false);
      await fetchCardBills();
    } finally {
      setCardSaving(false);
    }
  };

  const handleDeleteCard = async (id: number) => {
    await fetch("/api/card-bills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setCardBills((prev) => prev.filter((b) => b.id !== id));
  };

  const items = transactions.filter((t) => {
    if (!isSameDay(parseLocalDate(t.date), selectedDate)) return false;
    if (selectedType !== "all" && t.type !== selectedType) return false;
    if (selectedCategory && t.category !== selectedCategory) return false;
    return true;
  });

  // 카드 값 가족별 그룹
  const cardByMember = cardBills.reduce<Record<string, { user_name: string; total: number; bills: CardBill[] }>>((acc, b) => {
    const key = String(b.user_id);
    if (!acc[key]) acc[key] = { user_name: b.user_name, total: 0, bills: [] };
    acc[key].total += b.amount;
    acc[key].bills.push(b);
    return acc;
  }, {});
  const totalCardBill = cardBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar title="가계부" />

      {/* 날짜 헤더 */}
      <div className="sticky top-14 z-30 bg-white border-b border-toss-border">
        <div className="flex items-center gap-2 px-5 py-3">
          <button
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d); }}
            className="text-toss-text-sub text-lg px-1"
          >‹</button>
          <p className="text-sm font-semibold text-toss-text flex-1 text-center">
            {selectedDate.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
          <button
            onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d); }}
            className="text-toss-text-sub text-lg px-1"
          >›</button>
        </div>
        <DailySummaryBar />
        <CategoryFilterBar />
      </div>

      {/* 이번 달 카드 값 섹션 */}
      <div className="mx-4 mt-3 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
        <button
          onClick={() => setShowCardSection((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💳</span>
            <p className="text-sm font-bold text-toss-text">
              {now.getMonth() + 1}월 카드 값
            </p>
            {totalCardBill > 0 && (
              <span className="text-sm font-bold text-toss-red">{formatKRW(totalCardBill)}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCardForm((v) => !v); setShowCardSection(true); }}
              className="text-xs font-semibold text-toss-blue bg-toss-blue-light px-3 py-1.5 rounded-pill"
            >
              + 추가
            </button>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              className={clsx("transition-transform text-toss-text-ter", showCardSection ? "rotate-180" : "")}
            >
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {showCardSection && (
          <>
            {/* 추가 폼 */}
            {showCardForm && (
              <div className="px-5 pb-4 pt-1 border-t border-toss-border space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="카드명 (예: 현대카드M)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="금액"
                    className="w-32 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                </div>
                {cardAmount && !isNaN(parseInt(cardAmount)) && (
                  <p className="text-xs text-toss-blue pl-1">{formatKRW(parseInt(cardAmount))}</p>
                )}
                <div className="flex gap-2 items-center">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-toss-text-sub whitespace-nowrap">결제일</span>
                    <input
                      type="date"
                      value={cardDueDate}
                      onChange={(e) => setCardDueDate(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                    />
                  </div>
                  <button
                    onClick={handleAddCard}
                    disabled={cardSaving || !cardName.trim() || !cardAmount}
                    className="px-4 py-2.5 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl"
                  >
                    {cardSaving ? "..." : "저장"}
                  </button>
                </div>
              </div>
            )}

            {/* 카드 목록 */}
            {cardBills.length === 0 ? (
              <div className="px-5 pb-5 pt-1 text-center">
                <p className="text-xs text-toss-text-ter">이번 달 카드 값을 입력해보세요</p>
              </div>
            ) : (
              <div className="border-t border-toss-border">
                {Object.values(cardByMember).map((member) => (
                  <div key={member.user_name} className="border-b border-toss-border last:border-b-0">
                    {/* 멤버 헤더 */}
                    <div className="flex items-center justify-between px-5 py-2.5 bg-toss-surface">
                      <p className="text-xs font-semibold text-toss-text-sub">{member.user_name}</p>
                      <p className="text-xs font-bold text-toss-red">{formatKRW(member.total)}</p>
                    </div>
                    {/* 해당 멤버 카드 목록 */}
                    {member.bills.map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">💳</span>
                          <div>
                            <p className="text-sm font-medium text-toss-text">{bill.card_name}</p>
                            {bill.due_date && (
                              <p className="text-xs text-toss-text-ter">결제일 {bill.due_date}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-toss-red">{formatKRW(bill.amount)}</p>
                          <button
                            onClick={() => handleDeleteCard(bill.id)}
                            className="w-6 h-6 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {/* 합계 */}
                {Object.keys(cardByMember).length > 1 && (
                  <div className="flex justify-between px-5 py-3 bg-toss-surface border-t border-toss-border">
                    <p className="text-sm font-bold text-toss-text">가족 합계</p>
                    <p className="text-sm font-bold text-toss-red">{formatKRW(totalCardBill)}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 거래 추가 FAB */}
      <Link
        href="/spending/add"
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-toss-blue flex items-center justify-center shadow-lg"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>

      {/* 거래 목록 */}
      <div className="bg-white divide-y divide-toss-border pb-24">
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
