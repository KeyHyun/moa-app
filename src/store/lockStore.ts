"use client";

import { create } from "zustand";

const LOCK_DURATION_MS = 60_000; // 1분
const WARN_BEFORE_MS = 15_000;   // 잠금 15초 전에 연장 팝업

interface LockState {
  isAmountVisible: boolean;
  expiresAt: number | null;
  showExtendPrompt: boolean;
  showUnlockModal: boolean;

  openUnlockModal: () => void;
  closeUnlockModal: () => void;
  unlock: (password: string, email: string) => Promise<void>;
  lock: () => void;
  extend: () => void;
  tick: () => void;       // 매초 호출해서 타이머 체크
}

export const useLockStore = create<LockState>()((set, get) => ({
  isAmountVisible: false,
  expiresAt: null,
  showExtendPrompt: false,
  showUnlockModal: false,

  openUnlockModal: () => set({ showUnlockModal: true }),
  closeUnlockModal: () => set({ showUnlockModal: false }),

  unlock: async (password: string, email: string) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });
    if (!res.ok) throw new Error("비밀번호가 올바르지 않습니다.");
    set({
      isAmountVisible: true,
      expiresAt: Date.now() + LOCK_DURATION_MS,
      showExtendPrompt: false,
      showUnlockModal: false,
    });
  },

  lock: () => set({ isAmountVisible: false, expiresAt: null, showExtendPrompt: false }),

  extend: () => set({ expiresAt: Date.now() + LOCK_DURATION_MS, showExtendPrompt: false }),

  tick: () => {
    const { expiresAt, isAmountVisible } = get();
    if (!isAmountVisible || !expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      set({ isAmountVisible: false, expiresAt: null, showExtendPrompt: false });
    } else if (remaining <= WARN_BEFORE_MS) {
      set({ showExtendPrompt: true });
    }
  },
}));

/** 금액 표시 헬퍼 */
export function maskedAmount(formatted: string, visible: boolean): string {
  return visible ? formatted : "₩ ••••••";
}
