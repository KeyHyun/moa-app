"use client";

import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useSpendingStore, Transaction } from "@/store/spendingStore";
import { useAssetStore } from "@/store/assetStore";
import { formatKRW } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";

type Period = "일" | "월" | "년";

const ASSET_COLORS = ["#3182F6", "#2DB400", "#FF8C00", "#EC4899", "#8B5CF6"];

/* ── 집계 헬퍼 ── */
function groupTransactions(transactions: Transaction[], period: Period) {
  const map = new Map<string, { income: number; expense: number }>();

  const now = new Date();

  transactions.forEach((t) => {
    const d = new Date(t.date.replace(/-/g, "/"));
    let key = "";

    if (period === "일") {
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff > 13) return; // 최근 14일만
      key = `${d.getMonth() + 1}/${d.getDate()}`;
    } else if (period === "월") {
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths > 11) return; // 최근 12개월
      key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = String(d.getFullYear());
    }

    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
    const entry = map.get(key)!;
    if (t.type === "income") entry.income += t.amount;
    else entry.expense += t.amount;
  });

  // 빈 슬롯 채우기
  const result: { label: string; income: number; expense: number }[] = [];

  if (period === "일") {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      result.push({ label: key, ...(map.get(key) ?? { income: 0, expense: 0 }) });
    }
  } else if (period === "월") {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = `${d.getMonth() + 1}월`;
      result.push({ label, ...(map.get(key) ?? { income: 0, expense: 0 }) });
    }
  } else {
    const years = Array.from(map.keys()).sort();
    const startYear = Math.min(...years.map(Number), now.getFullYear() - 2);
    for (let y = startYear; y <= now.getFullYear(); y++) {
      result.push({ label: `${y}년`, ...(map.get(String(y)) ?? { income: 0, expense: 0 }) });
    }
  }

  return result;
}

/* ── 툴팁 ── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-toss-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-toss-text mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatKRW(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ── 메인 컴포넌트 ── */
export function StatsChart() {
  const [period, setPeriod] = useState<Period>("월");
  const transactions = useSpendingStore((s) => s.transactions);
  const assets = useAssetStore((s) => s.assets);

  const barData = useMemo(() => groupTransactions(transactions, period), [transactions, period]);

  const assetPieData = useMemo(() =>
    assets.map((a) => ({
      name: ASSET_TYPE_CONFIG[a.type]?.label ?? a.type,
      value: a.amount,
    })),
    [assets]
  );

  const totalIncome = barData.reduce((s, d) => s + d.income, 0);
  const totalExpense = barData.reduce((s, d) => s + d.expense, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* 탭 */}
      <div className="flex border-b border-toss-border">
        {(["일", "월", "년"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              period === p
                ? "text-toss-blue border-b-2 border-toss-blue"
                : "text-toss-text-ter"
            }`}
          >
            {p}별
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-5">
        {/* 수입/지출 요약 */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-toss-surface rounded-xl px-3 py-2.5">
            <p className="text-xs text-toss-text-ter mb-0.5">수입</p>
            <p className="text-sm font-bold text-toss-green">+{formatKRW(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-toss-surface rounded-xl px-3 py-2.5">
            <p className="text-xs text-toss-text-ter mb-0.5">지출</p>
            <p className="text-sm font-bold text-toss-red">-{formatKRW(totalExpense)}</p>
          </div>
          <div className="flex-1 bg-toss-surface rounded-xl px-3 py-2.5">
            <p className="text-xs text-toss-text-ter mb-0.5">순수익</p>
            <p className={`text-sm font-bold ${totalIncome - totalExpense >= 0 ? "text-toss-green" : "text-toss-red"}`}>
              {totalIncome - totalExpense >= 0 ? "+" : ""}{formatKRW(totalIncome - totalExpense)}
            </p>
          </div>
        </div>

        {/* 수입/지출 바 차트 */}
        <p className="text-xs font-semibold text-toss-text-sub mb-2">수입 · 지출</p>
        {barData.every((d) => d.income === 0 && d.expense === 0) ? (
          <div className="h-32 flex items-center justify-center text-sm text-toss-text-ter">
            거래 내역이 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={barData} barCategoryGap="30%" barGap={2}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#8B95A1" }}
                axisLine={false}
                tickLine={false}
                interval={period === "일" ? 3 : 0}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="income" name="수입" fill="#2DB400" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="#F04452" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 자산 구성 파이 차트 */}
        {assetPieData.length > 0 && (
          <>
            <p className="text-xs font-semibold text-toss-text-sub mt-4 mb-2">자산 구성</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={assetPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {assetPieData.map((_, i) => (
                    <Cell key={i} fill={ASSET_COLORS[i % ASSET_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatKRW(Number(v))}
                  contentStyle={{ fontSize: 12, borderRadius: 12, border: "1px solid #E5E8EB" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </div>
  );
}
