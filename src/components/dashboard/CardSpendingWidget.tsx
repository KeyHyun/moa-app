"use client";

import { Card } from "@/components/ui/Card";
import { formatKRW } from "@/lib/formatters";
import { useDashboardStore } from "@/store/dashboardStore";

interface GroupedCard {
  card_name: string;
  total: number;
  members: { user_name: string; total: number }[];
}

export function CardSpendingWidget() {
  const now = new Date();
  const summary = useDashboardStore((s) => s.cardSummary);

  const grouped = summary.reduce<Record<string, GroupedCard>>((acc, row) => {
    if (!acc[row.card_name]) acc[row.card_name] = { card_name: row.card_name, total: 0, members: [] };
    acc[row.card_name].total += row.total;
    acc[row.card_name].members.push({ user_name: row.user_name, total: row.total });
    return acc;
  }, {});
  const groups = Object.values(grouped).sort((a, b) => b.total - a.total);
  const grandTotal = groups.reduce((s, g) => s + g.total, 0);

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-toss-text-sub">
          💳 {now.getMonth() + 1}월 카드별 지출
        </h3>
        {grandTotal > 0 && (
          <p className="text-sm font-bold text-toss-red">{formatKRW(grandTotal)}</p>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="px-5 pb-5 text-center py-4">
          <p className="text-xs text-toss-text-ter">지출 입력 시 카드를 선택하면 여기에 표시돼요</p>
        </div>
      ) : (
        <div className="divide-y divide-toss-border">
          {groups.map((group) => (
            <div key={group.card_name} className="px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">💳</span>
                  <p className="text-sm font-semibold text-toss-text">{group.card_name}</p>
                </div>
                <p className="text-sm font-bold text-toss-red">{formatKRW(group.total)}</p>
              </div>
              {group.members.length > 1 && (
                <div className="mt-1.5 space-y-1 pl-7">
                  {group.members.map((m) => (
                    <div key={m.user_name} className="flex justify-between">
                      <p className="text-xs text-toss-text-ter">{m.user_name}</p>
                      <p className="text-xs text-toss-text-sub">{formatKRW(m.total)}</p>
                    </div>
                  ))}
                </div>
              )}
              {group.members.length === 1 && (
                <p className="text-xs text-toss-text-ter mt-0.5 pl-7">{group.members[0].user_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
