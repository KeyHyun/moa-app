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
      icon: <img src="/man.png" alt="내 정보" className="w-6 h-6 object-contain" />,
      onClick: () => setViewMode("private"),
      active: viewMode === "private",
    },
    {
      id: "family",
      label: "가족 정보",
      icon: <img src="/family.png" alt="가족 정보" className="w-6 h-6 object-contain" />,
      onClick: () => setViewMode("family"),
      active: viewMode === "family",
    },
    {
      id: "travel",
      label: "여행가계부",
      icon: <span>✈️</span>,
      onClick: () => {
        setIsOpen(false);
        router.push("/travel");
      },
    },
    {
      id: "spending",
      label: "지출내역 입력",
      icon: <span>💸</span>,
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
          <button
            key={item.id}
            onClick={() => {
              item.onClick();
              setIsOpen(false);
            }}
            className="absolute bottom-full mb-2 right-0 flex items-center gap-2 text-sm font-medium text-toss-text bg-white px-4 py-2.5 rounded-full shadow-lg whitespace-nowrap transition-all duration-200 ease-out min-w-max"
            style={{
              transform: isOpen
                ? `translateY(${-(menuItems.length - 1 - index) * 48}px)`
                : "translateY(0)",
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
            }}
          >
            {item.icon}
            <span className={item.active ? "text-toss-blue" : ""}>{item.label}</span>
          </button>
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
            {isOpen ? "+" : (
              viewMode === "private" ? (
                <img src="/man.png" alt="내 정보" className="w-8 h-8 object-contain" />
              ) : (
                <img src="/family.png" alt="가족 정보" className="w-8 h-8 object-contain" />
              )
            )}
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
