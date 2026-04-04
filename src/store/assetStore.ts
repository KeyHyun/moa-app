"use client";

import { create } from "zustand";

export type AssetType = "cash" | "savings" | "installment" | "investment" | "realEstate";

export interface AssetItem {
  id: number;
  type: AssetType;
  label: string;
  amount: number;
  institution: string;
}

interface AssetState {
  assets: AssetItem[];
  isLoading: boolean;
  fetchAssets: () => Promise<void>;
  get totalAsset(): number;
}

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: [],
  isLoading: false,

  fetchAssets: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/assets");
      if (res.ok) {
        const data = await res.json();
        set({ assets: data });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  get totalAsset() {
    return get().assets.reduce((sum, a) => sum + a.amount, 0);
  },
}));
