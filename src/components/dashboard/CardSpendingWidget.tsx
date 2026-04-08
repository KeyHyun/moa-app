"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatKRW } from "@/lib/formatters";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";

type ViewTarget = "mine" | "family";

export function CardSpendingWidget() {
  const now = new Date();
  const summary = useDashboardStore((s) => s.cardSummary);
  const user = useAuthStore((s) => s.user);
  const [viewTarget, setViewTarget] = useState<ViewTarget>("family");

  // 내 것만 / 가족 전체 필터
  const filtered = viewTarget === "mine"
    ? summary.filter((r) => r.user_id === user?.id)
    : summary;

  const grouped = filtered.reduce<Record<string, { card_name: string; total: number; members: { user_name: string; total: number }[] }>>((acc, row) => {
    if (!acc[row.card_name]) acc[row.card_name] = { card_name: row.card_name, total: 0, members: [] };
    acc[row.card_name].total += row.total;
    acc[row.card_name].members.push({ user_name: row.user_name, total: row.total });
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
  const grandTotal = groups.reduce((s, g) => s + g.total, 0);

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-toss-text-sub flex-shrink-0">
            💳 {now.getMonth() + 1}월 카드별 지출
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 전환 토글 */}
            <div className="flex bg-toss-surface rounded-lg overflow-hidden">
              {(["mine", "family"] as ViewTarget[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setViewTarget(t)}
                  className={`px-2 py-1 text-xs font-semibold transition-colors ${
                    viewTarget === t ? "bg-toss-blue text-white" : "text-toss-text-sub"
                  }`}
                >
                  {t === "mine" ? "내것" : "가족"}
                </button>
              ))}
            </div>
          </div>
        </div>
        {grandTotal > 0 && (
          <p className="text-sm font-bold text-toss-red mt-2">
            {maskedAmount(formatKRW(grandTotal), isAmountVisible)}
          </p>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="px-5 pb-5 text-center py-4">
          <p className="text-xs text-toss-text-ter">
            {viewTarget === "mine" ? "내 카드 지출이 없어요" : "지출 입력 시 카드를 선택하면 여기에 표시돼요"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-toss-border">
          {groups.map((group) => (
            <div key={group.card_name} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base flex-shrink-0">💳</span>
                  <p className="text-sm font-semibold text-toss-text truncate">{group.card_name}</p>
                </div>
                <p className="text-sm font-bold text-toss-red flex-shrink-0 ml-2">
                  {formatKRW(group.total)}
                </p>
              </div>
              {viewTarget === "family" && group.members.length > 1 && (
                <div className="mt-1.5 space-y-1 pl-7">
                  {group.members.map((m) => (
                    <div key={m.user_name} className="flex justify-between">
                      <p className="text-xs text-toss-text-ter truncate">{m.user_name}</p>
                      <p className="text-xs text-toss-text-sub flex-shrink-0 ml-2">
                        {formatKRW(m.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {viewTarget === "family" && group.members.length === 1 && (
                <p className="text-xs text-toss-text-ter mt-0.5 pl-7 truncate">{group.members[0].user_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
