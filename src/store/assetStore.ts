"use client";

import { create } from "zustand";

export type AssetType = "cash" | "savings" | "installment" | "investment" | "realEstate" | "loan" | "mortgage" | "creditLoan";

export interface AssetItem {
  id: number;
  type: AssetType;
  label: string;
  amount: number;
  institution: string;
  visibility?: string;
  user_id?: number;
  user_name?: string;
}

interface AssetState {
  assets: AssetItem[];
  isLoading: boolean;
  fetchAssets: (viewMode?: "private" | "family") => Promise<void>;
  setAssets: (assets: AssetItem[]) => void;
  get totalAsset(): number;
}

export const useAssetStore = create<AssetState>()((set, get) => ({
  assets: [],
  isLoading: false,

  setAssets: (assets) => set({ assets }),

  fetchAssets: async (viewMode = "family") => {
    set({ isLoading: true });
    try {
      const res = await fetch(`/api/assets?view=${viewMode}`);
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
