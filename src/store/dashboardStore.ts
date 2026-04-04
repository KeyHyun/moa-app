"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetId =
  | "totalAsset"
  | "assetTrend"
  | "statsChart"
  | "spendingSnapshot"
  | "goals"
  | "assetBreakdown"
  | "cardSpending";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  enabled: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: "totalAsset",       label: "총 자산",        enabled: true },
  { id: "assetTrend",       label: "자산 추이",       enabled: true },
  { id: "statsChart",       label: "수입·지출 그래프", enabled: true },
  { id: "spendingSnapshot", label: "오늘 지출",       enabled: true },
  { id: "goals",            label: "가족 목표",        enabled: true },
  { id: "assetBreakdown",   label: "자산 구성",        enabled: true },
  { id: "cardSpending",     label: "카드별 지출",       enabled: true },
];

export interface Goal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  emoji: string;
  deadline: string | null;
}

export interface CardSummaryItem {
  card_name: string;
  user_id: number;
  user_name: string;
  total: number;
}

export interface SnapshotPoint {
  date: string;
  total: number;
}

interface DashboardState {
  widgets: WidgetConfig[];
  goals: Goal[];
  cardSummary: CardSummaryItem[];
  snapshots: SnapshotPoint[];
  toggleWidget: (id: WidgetId) => void;
  moveWidget: (id: WidgetId, direction: "up" | "down") => void;
  isEnabled: (id: WidgetId) => boolean;
  setGoals: (goals: Goal[]) => void;
  setCardSummary: (summary: CardSummaryItem[]) => void;
  setSnapshots: (snapshots: SnapshotPoint[]) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      widgets: DEFAULT_WIDGETS,
      goals: [],
      cardSummary: [],
      snapshots: [],

      setGoals: (goals) => set({ goals }),
      setCardSummary: (cardSummary) => set({ cardSummary }),
      setSnapshots: (snapshots) => set({ snapshots }),

      toggleWidget: (id) =>
        set((s) => ({
          widgets: s.widgets.map((w) =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
          ),
        })),

      moveWidget: (id, direction) =>
        set((s) => {
          const arr = [...s.widgets];
          const idx = arr.findIndex((w) => w.id === id);
          if (idx < 0) return s;
          const swap = direction === "up" ? idx - 1 : idx + 1;
          if (swap < 0 || swap >= arr.length) return s;
          [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
          return { widgets: arr };
        }),

      isEnabled: (id) => get().widgets.find((w) => w.id === id)?.enabled ?? true,
    }),
    { name: "moa-dashboard-widgets" }
  )
);
