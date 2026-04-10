"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { AmountLockProvider } from "@/components/ui/AmountLockProvider";

function FloatingMenuButton() {
  const [isOpen, setIsOpen] = useState(false);
  const viewMode = useDashboardStore((s) => s.viewMode);
  const setViewMode = useDashboardStore((s) => s.setViewMode);
  const router = useRouter();

  const menuItems = [
    {
      id: "private",
      label: "내 정보",
      emoji: "🧑",
      onClick: () => setViewMode("private"),
      active: viewMode === "private",
    },
    {
      id: "family",
      label: "가족 정보",
      emoji: "👨‍👩‍👧‍👦",
      onClick: () => setViewMode("family"),
      active: viewMode === "family",
    },
    {
      id: "spending",
      label: "지출내역 입력",
      emoji: "💸",
      onClick: () => {
        setIsOpen(false);
        router.push("/spending/add");
      },
    },
  ];

  return (
    <>
      {/* 딤 배경 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 펼쳐지는 메뉴들 */}
      <div className="fixed bottom-20 right-4 z-40">
        {menuItems.map((item, index) => (
          <div
            key={item.id}
            className="absolute bottom-full mb-2 right-0 flex items-center gap-2 transition-all duration-200 ease-out"
            style={{
              transform: isOpen
                ? `translateY(${-(menuItems.length - 1 - index) * 56}px)`
                : "translateY(0)",
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
            }}
          >
            <span className="text-sm font-medium text-toss-text bg-white px-3 py-1.5 rounded-lg shadow-md whitespace-nowrap">
              {item.label}
            </span>
            <button
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`w-12 h-12 flex items-center justify-center rounded-full shadow-lg ${
                item.active
                  ? "bg-toss-blue text-white"
                  : "bg-white"
              }`}
            >
              <span className="text-xl">{item.emoji}</span>
            </button>
          </div>
        ))}

        {/* 메인 버튼 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 flex items-center justify-center rounded-full shadow-lg border transition-transform duration-200 ${
            isOpen
              ? "bg-toss-blue border-toss-blue rotate-45"
              : "bg-white border-toss-border"
          }`}
        >
          <span className={`text-2xl ${isOpen ? "text-white" : ""}`}>
            {isOpen ? "+" : (viewMode === "private" ? "🧑" : "👨‍👩‍👧‍👦")}
          </span>
        </button>
      </div>
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
