"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
  transparent?: boolean;
}

export function TopBar({
  title,
  showBack = false,
  rightAction,
  className,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={clsx(
        "flex items-center justify-between px-5 h-14 sticky top-0 z-40",
        transparent ? "bg-transparent" : "bg-toss-surface",
        className
      )}
    >
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-1 -ml-1 rounded-full hover:bg-toss-border transition-colors"
            aria-label="뒤로 가기"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="#191F28"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {title && (
        <h1 className="text-base font-semibold text-toss-text">{title}</h1>
      )}

      <div className="min-w-[40px] flex justify-end">{rightAction}</div>
    </header>
  );
}
