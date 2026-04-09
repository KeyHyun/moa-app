"use client";

import { create } from "zustand";

const LOCK_DURATION_MS = 300_000; // 5분
const WARN_BEFORE_MS = 15_000;   // 잠금 15초 전에 연장 팝업

interface LockState {
  isAmountVisible: boolean;
  expiresAt: number | null;
  showExtendPrompt: boolean;
  showUnlockModal: boolean;
  remainingSeconds: number; // 남은 시간 (초)

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
  remainingSeconds: 0,

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
      remainingSeconds: LOCK_DURATION_MS / 1000,
    });
  },

  lock: () => set({ isAmountVisible: false, expiresAt: null, showExtendPrompt: false, remainingSeconds: 0 }),

  extend: () => set({ expiresAt: Date.now() + LOCK_DURATION_MS, showExtendPrompt: false, remainingSeconds: LOCK_DURATION_MS / 1000 }),

  tick: () => {
    const { expiresAt, isAmountVisible } = get();
    if (!isAmountVisible || !expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) {
      set({ isAmountVisible: false, expiresAt: null, showExtendPrompt: false, remainingSeconds: 0 });
    } else {
      const remainingSec = Math.ceil(remaining / 1000);
      set({ remainingSeconds: remainingSec });
      if (remaining <= WARN_BEFORE_MS) {
        set({ showExtendPrompt: true });
      }
    }
  },
}));

/** 금액 표시 헬퍼 */
export function maskedAmount(formatted: string, visible: boolean): string {
  return visible ? formatted : "🔒 잠금";
}
