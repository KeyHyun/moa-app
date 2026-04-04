"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { formatKRW } from "@/lib/formatters";

type Period = { label: string; days: number };

const PERIODS: Period[] = [
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
];

interface Point { date: string; total: number }

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const d = new Date(p.date + "T00:00:00");
  return (
    <div className="bg-toss-text text-white text-xs rounded-xl px-3 py-2 shadow-lg">
      <p className="text-[10px] text-gray-400">
        {d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
      </p>
      <p className="font-bold">{formatKRW(p.total)}</p>
    </div>
  );
}

export function AssetTrendChart() {
  const [period, setPeriod] = useState<Period>(PERIODS[0]);
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/asset-snapshots?days=${period.days}`)
      .then((r) => r.json())
      .then((d: Point[]) => setData(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [period]);

  const first = data[0]?.total ?? 0;
  const last = data[data.length - 1]?.total ?? 0;
  const diff = last - first;
  const diffPct = first > 0 ? ((diff / first) * 100).toFixed(1) : "0.0";
  const positive = diff >= 0;

  // XAxis에 표시할 레이블 간격 계산
  const tickInterval = Math.max(1, Math.floor(data.length / 4) - 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-toss-text-sub">자산 추이</p>
          <div className="flex gap-1">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                onClick={() => setPeriod(p)}
                className={`px-2 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                  period.label === p.label
                    ? "bg-toss-blue text-white"
                    : "text-toss-text-ter"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center text-sm text-toss-text-ter">
            로딩 중...
          </div>
        ) : data.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-toss-text-ter">
            데이터가 없습니다
          </div>
        ) : (
          <>
            <div className="mb-2">
              <p className="text-xl font-bold text-toss-text">{formatKRW(last)}</p>
              <p className={`text-xs font-semibold ${positive ? "text-toss-green" : "text-toss-red"}`}>
                {positive ? "+" : ""}{formatKRW(diff)} ({positive ? "+" : ""}{diffPct}%)
                <span className="text-toss-text-ter font-normal ml-1">{period.label} 기간</span>
              </p>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="assetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3182F6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3182F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: "#8B95A1" }}
                  axisLine={false}
                  tickLine={false}
                  interval={tickInterval}
                  tickFormatter={(v: string) => {
                    const d = new Date(v + "T00:00:00");
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis hide domain={["auto", "auto"]} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#3182F6"
                  strokeWidth={2}
                  fill="url(#assetGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#3182F6", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
