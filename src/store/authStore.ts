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
