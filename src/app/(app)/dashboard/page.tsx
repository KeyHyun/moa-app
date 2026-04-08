"use client";

import { useEffect, useState } from "react";
import { useAssetStore } from "@/store/assetStore";
import { useSpendingStore } from "@/store/spendingStore";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore, WidgetId } from "@/store/dashboardStore";
import { TotalAssetCard } from "@/components/dashboard/TotalAssetCard";
import { AssetBreakdownList } from "@/components/dashboard/AssetBreakdownList";
import { AssetTrendChart } from "@/components/dashboard/AssetTrendChart";
import { SpendingSnapshotCard } from "@/components/dashboard/SpendingSnapshotCard";
import { GoalsWidget } from "@/components/dashboard/GoalsWidget";
import { StatsChart } from "@/components/dashboard/StatsChart";
import { CardSpendingWidget } from "@/components/dashboard/CardSpendingWidget";

/* ── 위젯 렌더러 ── */
function Widget({ id }: { id: WidgetId }) {
  switch (id) {
    case "totalAsset":       return <TotalAssetCard />;
    case "assetTrend":       return <AssetTrendChart />;
    case "statsChart":       return <StatsChart />;
    case "spendingSnapshot": return <SpendingSnapshotCard />;
    case "goals":            return <GoalsWidget />;
    case "assetBreakdown":   return <AssetBreakdownList />;
    case "cardSpending":     return <CardSpendingWidget />;
    default:                 return null;
  }
}

/* ── 커스터마이즈 드로어 ── */
function CustomizeDrawer({ onClose }: { onClose: () => void }) {
  const { widgets, toggleWidget, moveWidget } = useDashboardStore();

  return (
    <>
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      {/* 바텀시트 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe">
        <div className="w-10 h-1 bg-toss-border rounded-full mx-auto mt-3 mb-1" />
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-toss-text">위젯 설정</h2>
            <button onClick={onClose} className="text-toss-text-ter text-sm">닫기</button>
          </div>
          <p className="text-xs text-toss-text-ter mb-3">표시할 위젯을 선택하고 순서를 조정하세요</p>

          <div className="space-y-2">
            {widgets.map((w, idx) => (
              <div
                key={w.id}
                className="flex items-center gap-3 bg-toss-surface rounded-xl px-4 py-3"
              >
                {/* 순서 조정 */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveWidget(w.id, "up")}
                    disabled={idx === 0}
                    className="text-toss-text-ter text-xs disabled:opacity-30 leading-none"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveWidget(w.id, "down")}
                    disabled={idx === widgets.length - 1}
                    className="text-toss-text-ter text-xs disabled:opacity-30 leading-none"
                  >
                    ▼
                  </button>
                </div>

                <span className="flex-1 text-sm font-medium text-toss-text">{w.label}</span>

                {/* 토글 스위치 */}
                <button
                  onClick={() => toggleWidget(w.id)}
                  className={`relative inline-flex w-11 h-6 items-center rounded-full transition-colors ${
                    w.enabled ? "bg-toss-blue" : "bg-toss-border"
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      w.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── 메인 ── */
export default function DashboardPage() {
  const setAssets = useAssetStore((s) => s.setAssets);
  const setTransactions = useSpendingStore((s) => s.setTransactions);
  const { setGoals, setCardSummary, setSnapshots, widgets, viewMode } = useDashboardStore();
  const { user, logout } = useAuthStore();
  const [showCustomize, setShowCustomize] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard?view=${viewMode}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.assets) setAssets(d.assets);
        if (d.transactions) setTransactions(d.transactions);
        if (d.goals) setGoals(d.goals);
        if (d.cardSummary) setCardSummary(d.cardSummary);
        if (d.snapshots) setSnapshots(d.snapshots);
      });
  }, [setAssets, setTransactions, setGoals, setCardSummary, setSnapshots, viewMode]);

  const enabledWidgets = widgets.filter((w) => w.enabled);

  return (
    <div className="bg-toss-surface">
      {/* Top bar */}
      <header className="flex items-center justify-between px-5 pt-12 pb-3">
        <p className="text-xl font-bold text-toss-text">{user?.name ?? ""}님 👋</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomize(true)}
            className="text-xs text-toss-text-ter px-3 py-1.5 rounded-pill bg-white border border-toss-border"
          >
            편집
          </button>
          <button
            onClick={logout}
            className="text-xs text-toss-text-ter px-3 py-1.5 rounded-pill bg-white border border-toss-border"
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {enabledWidgets.map((w) => (
          <Widget key={w.id} id={w.id} />
        ))}

        <p className="text-center text-xs text-toss-text-ter py-2">
          데이터는 실시간으로 반영됩니다
        </p>
      </div>

      {showCustomize && <CustomizeDrawer onClose={() => setShowCustomize(false)} />}
    </div>
  );
}
