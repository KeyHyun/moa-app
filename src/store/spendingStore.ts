"use client";

import { create } from "zustand";
import { SpendingCategory } from "@/types";

export interface Transaction {
  id: number;
  type: "income" | "expense";
  category: string;
  amount: number;
  memo: string;
  date: string;
  user_name?: string;
  visibility?: "family" | "private";
}

interface SpendingState {
  transactions: Transaction[];
  selectedDate: Date;
  selectedCategory: SpendingCategory | null;
  isLoading: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (data: Omit<Transaction, "id" | "user_name">) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setSelectedCategory: (cat: SpendingCategory | null) => void;
}

export const useSpendingStore = create<SpendingState>()((set, get) => ({
  transactions: [],
  selectedDate: new Date(),
  selectedCategory: null,
  isLoading: false,

  fetchTransactions: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/transactions?limit=200");
      if (res.ok) {
        const data = await res.json();
        set({ transactions: data });
      }
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
    await get().fetchTransactions();
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
}));
