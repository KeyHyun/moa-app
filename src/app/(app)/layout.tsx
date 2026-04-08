"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { AmountLockProvider } from "@/components/ui/AmountLockProvider";

function ViewModeToggle() {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);

  return (
    <div className="fixed bottom-20 right-4 z-40 flex items-center bg-white rounded-full p-1 shadow-lg border border-toss-border">
      <button
        onClick={() => setViewMode("private")}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          viewMode === "private" ? "bg-toss-blue" : "bg-transparent"
        }`}
        title="내 정보"
      >
        🧑
      </button>
      <button
        onClick={() => setViewMode("family")}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
          viewMode === "family" ? "bg-toss-blue" : "bg-transparent"
        }`}
        title="가족 정보"
      >
        👨‍👩‍👧‍👦
      </button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-toss-surface">
      <div className="max-w-lg mx-auto relative min-h-screen">
        <main className="pb-24">{children}</main>
        <BottomNavBar />
        <ViewModeToggle />
        <AmountLockProvider />
      </div>
    </div>
  );
}
