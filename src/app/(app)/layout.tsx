"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { useAuthStore } from "@/store/authStore";
import { AmountLockProvider } from "@/components/ui/AmountLockProvider";

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
        <AmountLockProvider />
      </div>
    </div>
  );
}
