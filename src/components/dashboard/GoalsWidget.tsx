"use client";

import { Card } from "@/components/ui/Card";
import { formatKRW } from "@/lib/formatters";
import { useDashboardStore } from "@/store/dashboardStore";

function CircleProgress({ percent, size = 48 }: { percent: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2F4F6" strokeWidth={5} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#3182F6" strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

export function GoalsWidget() {
  const goals = useDashboardStore((s) => s.goals);

  if (goals.length === 0) return null;

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-sm font-semibold text-toss-text-sub">가족 목표</h3>
      </div>
      <div className="divide-y divide-toss-border">
        {goals.map((goal) => {
          const percent = goal.target_amount > 0 ? goal.current_amount / goal.target_amount : 0;
          const pct = Math.round(percent * 100);
          return (
            <div key={goal.id} className="flex items-center gap-4 px-5 py-4">
              <div className="relative flex-shrink-0">
                <CircleProgress percent={percent} size={52} />
                <span className="absolute inset-0 flex items-center justify-center text-lg">
                  {goal.emoji}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-toss-text truncate">{goal.name}</p>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  <span className="text-xs text-toss-blue font-medium flex-shrink-0">{pct}%</span>
                  <span className="text-xs text-toss-text-ter truncate">
                    {formatKRW(goal.current_amount)} / {formatKRW(goal.target_amount)}
                  </span>
                </div>
                {goal.deadline && (
                  <p className="text-xs text-toss-text-ter mt-0.5">
                    목표일: {goal.deadline}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
