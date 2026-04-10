"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { AmountLockProvider } from "@/components/ui/AmountLockProvider";

function ViewModeToggle({ onClose }: { onClose: () => void }) {
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const router = useRouter();

  return (
    <>
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* 액션 시트 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 pb-safe">
        <div className="w-10 h-1 bg-toss-border rounded-full mx-auto mt-3 mb-1" />
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-toss-text">메뉴</h2>
            <button onClick={onClose} className="text-toss-text-ter text-sm">닫기</button>
          </div>

          {/* 뷰 모드 전환 */}
          <div className="mb-4">
            <p className="text-xs text-toss-text-ter mb-2">보기 모드</p>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("private")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  viewMode === "private"
                    ? "bg-toss-blue text-white"
                    : "bg-toss-surface text-toss-text"
                }`}
              >
                🧑 내 정보
              </button>
              <button
                onClick={() => setViewMode("family")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                  viewMode === "family"
                    ? "bg-toss-blue text-white"
                    : "bg-toss-surface text-toss-text"
                }`}
              >
                👨‍👩‍👧‍👦 가족 정보
              </button>
            </div>
          </div>

          {/* 추가 기능들 */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onClose();
                router.push("/spending/add");
              }}
              className="w-full flex items-center gap-3 bg-toss-surface rounded-xl px-4 py-3"
            >
              <span className="text-xl">💸</span>
              <span className="text-sm font-medium text-toss-text">지출내역 입력</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FloatingMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const viewMode = useDashboardStore((s) => s.viewMode);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 w-14 h-14 flex items-center justify-center bg-white rounded-full shadow-lg border border-toss-border"
      >
        {viewMode === "private" ? "🧑" : "👨‍👩‍👧‍👦"}
      </button>

      {isOpen && <ViewModeToggle onClose={() => setIsOpen(false)} />}
    </>
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
        <FloatingMenuButton />
        <AmountLockProvider />
      </div>
    </div>
  );
}
