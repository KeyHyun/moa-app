"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useSpendingStore } from "@/store/spendingStore";
import { formatKRW } from "@/lib/formatters";
import { CATEGORY_CONFIG } from "@/lib/constants";
import { SpendingCategory } from "@/types";
import { isSameDay, parseLocalDate } from "@/lib/formatters";

export function SpendingSnapshotCard() {
  const transactions = useSpendingStore((s) => s.transactions);

  const today = new Date();
  const todayItems = transactions.filter(
    (t) => t.type === "expense" && isSameDay(parseLocalDate(t.date), today)
  );
  const todayTotal = todayItems.reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-toss-text-sub">오늘 지출</h3>
        <Link href="/spending" className="text-xs text-toss-blue font-medium">
          전체 보기
        </Link>
      </div>

      <p className="text-2xl font-bold text-toss-text mb-4">{formatKRW(todayTotal)}</p>

      {todayItems.length === 0 ? (
        <p className="text-sm text-toss-text-ter text-center py-2">오늘 지출 내역이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {todayItems.slice(0, 3).map((item) => {
            const cat = CATEGORY_CONFIG[item.category as SpendingCategory] ?? CATEGORY_CONFIG["기타"];
            return (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style={{ backgroundColor: cat.bg }}
                  >
                    {cat.icon}
                  </span>
                  <span className="text-sm text-toss-text truncate">{item.memo || item.category}</span>
                </div>
                <span className="text-sm font-medium text-toss-red flex-shrink-0">-{formatKRW(item.amount)}</span>
              </div>
            );
          })}
          {todayItems.length > 3 && (
            <p className="text-xs text-toss-text-ter text-center pt-1">
              +{todayItems.length - 3}개 더 보기
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
