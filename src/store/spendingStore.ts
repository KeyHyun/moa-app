"use client";

import { create } from "zustand";
import { SpendingCategory } from "@/types";

export interface Transaction {
  id: number;
  user_id?: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  memo: string;
  date: string;
  user_name?: string;
  visibility?: "family" | "private";
  card_name?: string;
  sub_category?: string;
}

export type ViewMode = "day" | "month" | "range";

interface SpendingState {
  transactions: Transaction[];
  selectedDate: Date;
  selectedCategory: SpendingCategory | null;
  selectedType: "all" | "expense" | "income";
  viewMode: ViewMode;
  selectedMonth: { year: number; month: number };
  dateRange: { from: string; to: string };
  isLoading: boolean;
  fetchTransactions: (viewMode?: "private" | "family") => Promise<void>;
  fetchTransactionsByMonth: (year: number, month: number, viewMode?: "private" | "family") => Promise<void>;
  fetchTransactionsByRange: (from: string, to: string, viewMode?: "private" | "family") => Promise<void>;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (data: Omit<Transaction, "id" | "user_name" | "user_id">) => Promise<void>;
  updateTransaction: (id: number, data: Omit<Transaction, "id" | "user_name" | "user_id">) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setSelectedCategory: (cat: SpendingCategory | null) => void;
  setSelectedType: (t: "all" | "expense" | "income") => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedMonth: (year: number, month: number) => void;
  setDateRange: (from: string, to: string) => void;
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const useSpendingStore = create<SpendingState>()((set, get) => {
  const now = new Date();
  return {
    transactions: [],
    selectedDate: new Date(),
    selectedCategory: null,
    selectedType: "all",
    viewMode: "month",
    selectedMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
    dateRange: { from: todayYMD(), to: todayYMD() },
    isLoading: false,

    setTransactions: (transactions) => set({ transactions }),

    fetchTransactions: async (viewMode = "family") => {
      set({ isLoading: true });
      try {
        const res = await fetch(`/api/transactions?limit=500&view=${viewMode}`);
        if (res.ok) set({ transactions: await res.json() });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchTransactionsByMonth: async (year, month, viewMode = "family") => {
      set({ isLoading: true });
      try {
        const res = await fetch(`/api/transactions?year=${year}&month=${month}&view=${viewMode}`);
        if (res.ok) set({ transactions: await res.json() });
      } finally {
        set({ isLoading: false });
      }
    },

    fetchTransactionsByRange: async (from, to, viewMode = "family") => {
      set({ isLoading: true });
      try {
        const res = await fetch(`/api/transactions?from=${from}&to=${to}&view=${viewMode}`);
        if (res.ok) set({ transactions: await res.json() });
      } finally {
        set({ isLoading: false });
      }
    },

    addTransaction: async (data) => {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "저장에 실패했습니다.");
      }
      const { viewMode, selectedMonth, dateRange } = get();
      if (viewMode === "month") {
        await get().fetchTransactionsByMonth(selectedMonth.year, selectedMonth.month);
      } else if (viewMode === "range") {
        await get().fetchTransactionsByRange(dateRange.from, dateRange.to);
      } else {
        await get().fetchTransactions();
      }
    },

    updateTransaction: async (id, data) => {
      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "수정에 실패했습니다.");
      }
      const { viewMode, selectedMonth, dateRange } = get();
      if (viewMode === "month") {
        await get().fetchTransactionsByMonth(selectedMonth.year, selectedMonth.month);
      } else if (viewMode === "range") {
        await get().fetchTransactionsByRange(dateRange.from, dateRange.to);
      } else {
        await get().fetchTransactions();
      }
    },

    deleteTransaction: async (id) => {
      await fetch("/api/transactions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) }));
    },

    setSelectedDate: (date) => set({ selectedDate: date, selectedCategory: null }),
    setSelectedCategory: (cat) => set({ selectedCategory: cat }),
    setSelectedType: (t) => set({ selectedType: t }),
    setViewMode: (mode) => set({ viewMode: mode, selectedCategory: null, selectedType: "all" }),
    setSelectedMonth: (year, month) => set({ selectedMonth: { year, month } }),
    setDateRange: (from, to) => set({ dateRange: { from, to } }),
  };
});
