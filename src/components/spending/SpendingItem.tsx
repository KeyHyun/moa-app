"use client";

import { formatKRW } from "@/lib/formatters";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { useSpendingStore, Transaction } from "@/store/spendingStore";
import { SpendingCategory } from "@/types";
import { useState } from "react";

interface SpendingItemProps {
  item: Transaction;
}

export function SpendingItem({ item }: SpendingItemProps) {
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
        <div>
          <p className="text-sm font-semibold text-toss-text">{item.memo || item.category}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: cat.color, backgroundColor: cat.bg }}
            >
              {item.category}
            </span>
            <span className="text-xs text-toss-text-ter">{item.date}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className={`text-sm font-semibold ${isExpense ? "text-toss-text" : "text-toss-green"}`}>
          {isExpense ? "-" : "+"}
          {formatKRW(item.amount)}
        </p>
        <button
          onClick={() => deleteTransaction(item.id)}
          className="w-6 h-6 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter hover:bg-toss-border transition-colors"
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
