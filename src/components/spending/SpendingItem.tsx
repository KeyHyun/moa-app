"use client";

import { formatKRW } from "@/lib/formatters";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useSpendingStore, Transaction } from "@/store/spendingStore";
import { SpendingCategory } from "@/types";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SpendingItemProps {
  item: Transaction;
}

export function SpendingItem({ item }: SpendingItemProps) {
  const router = useRouter();
  const deleteTransaction = useSpendingStore((s) => s.deleteTransaction);
  const [pressed, setPressed] = useState(false);
  const cat = CATEGORY_CONFIG[item.category as SpendingCategory] ?? CATEGORY_CONFIG["기타"];
  const isExpense = item.type === "expense";

  return (
    <div
      className={`flex items-center justify-between px-5 py-4 transition-colors ${
        pressed ? "bg-toss-surface" : "bg-white"
      } hover:bg-toss-surface active:bg-toss-surface`}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: cat.bg }}
        >
          {cat.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-toss-text truncate">{item.memo || item.category}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ color: cat.color, backgroundColor: cat.bg }}
            >
              {item.category}
              {item.sub_category ? ` > ${item.sub_category}` : ""}
            </span>
            {item.card_name && (
              <span className="text-[10px] text-toss-text-sub bg-toss-surface px-1.5 py-0.5 rounded-full flex-shrink-0 truncate max-w-[100px]">
                💳 {item.card_name}
              </span>
            )}
            {item.user_name && (
              <span className="text-[10px] text-toss-text-ter flex-shrink-0">{item.user_name}</span>
            )}
            {item.visibility === "private" && (
              <span className="text-[10px] text-toss-text-ter bg-toss-surface px-1.5 py-0.5 rounded-full flex-shrink-0">🔒</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <p className={`text-sm font-semibold whitespace-nowrap ${isExpense ? "text-toss-text" : "text-toss-green"}`}>
          {isExpense ? "-" : "+"}
          {formatKRW(item.amount)}
        </p>
        {/* 수정 버튼 */}
        <button
          onClick={() => router.push(`/spending/add?id=${item.id}`)}
          className="w-6 h-6 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter hover:bg-toss-border transition-colors flex-shrink-0"
          aria-label="수정"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        {/* 삭제 버튼 */}
        <button
          onClick={() => deleteTransaction(item.id)}
          className="w-6 h-6 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter hover:bg-toss-border transition-colors flex-shrink-0"
          aria-label="삭제"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
