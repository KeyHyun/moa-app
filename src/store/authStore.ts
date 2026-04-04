"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Family {
  id: number;
  name: string;
  invite_code: string;
  role: string;
}

interface AuthState {
  user: User | null;
  family: Family | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithFaceId: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  fetchMe: () => Promise<void>;
  setFamily: (family: Family | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      family: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "로그인에 실패했습니다.");
        set({ user: data.user, family: data.family ?? null, isAuthenticated: true });
      },

      loginWithFaceId: async (email: string) => {
        // 동적 import — 클라이언트에서만 실행
        const { startAuthentication } = await import("@simplewebauthn/browser");

        const beginRes = await fetch("/api/auth/webauthn/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "begin", email }),
        });
        const beginData = await beginRes.json();
        if (!beginRes.ok) throw new Error(beginData.error || "Face ID 인증 시작 실패");

        let authResponse;
        try {
          authResponse = await startAuthentication({ optionsJSON: beginData });
        } catch {
          throw new Error("Face ID 인증이 취소되었습니다.");
        }

        const completeRes = await fetch("/api/auth/webauthn/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete", email, response: authResponse }),
        });
        const completeData = await completeRes.json();
        if (!completeRes.ok) throw new Error(completeData.error || "Face ID 인증 실패");

        set({ user: completeData.user, family: completeData.family ?? null, isAuthenticated: true });
      },

      logout: async () => {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout" }),
        });
        set({ user: null, family: null, isAuthenticated: false });
      },

      register: async (name: string, email: string, password: string) => {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "회원가입에 실패했습니다.");
        set({ user: data.user, family: data.family ?? null, isAuthenticated: true });
      },

      fetchMe: async () => {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "me" }),
        });
        if (!res.ok) { set({ user: null, family: null, isAuthenticated: false }); return; }
        const data = await res.json();
        set({ user: data.user, family: data.family ?? null, isAuthenticated: true });
      },

      setFamily: (family) => set({ family }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        family: state.family,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
