"use client";

import { Card } from "@/components/ui/Card";
import { formatKRW } from "@/lib/formatters";
import { useDashboardStore } from "@/store/dashboardStore";
import { useAuthStore } from "@/store/authStore";
import { useLockStore, maskedAmount } from "@/store/lockStore";

export function CardSpendingWidget() {
  const now = new Date();
  const summary = useDashboardStore((s) => s.cardSummary);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const user = useAuthStore((s) => s.user);
  const { isAmountVisible } = useLockStore();

  // 내 것만 / 가족 전체 필터
  const filtered = viewMode === "private"
    ? summary.filter((r) => r.user_id === user?.id)
    : summary;

  const grouped = filtered.reduce<Record<string, { card_name: string; total: number; members: { user_name: string; total: number }[] }>>((acc, row) => {
    if (!acc[row.card_name]) acc[row.card_name] = { card_name: row.card_name, total: 0, members: [] };
    acc[row.card_name].total += row.total;
    // 같은 사용자가 있으면 금액 합치기
    const existingMember = acc[row.card_name].members.find(m => m.user_name === row.user_name);
    if (existingMember) {
      existingMember.total += row.total;
    } else {
      acc[row.card_name].members.push({ user_name: row.user_name, total: row.total });
    }
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
            {viewMode === "private" ? "내 카드 지출이 없어요" : "지출 입력 시 카드를 선택하면 여기에 표시돼요"}
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
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
