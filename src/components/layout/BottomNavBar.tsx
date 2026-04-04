"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const navItems = [
  {
    href: "/dashboard",
    label: "홈",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z"
          fill={active ? "#3182F6" : "none"}
          stroke={active ? "#3182F6" : "#8B95A1"}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/spending",
    label: "지출",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 4H20C20.5523 4 21 4.44772 21 5V19C21 19.5523 20.5523 20 20 20H4C3.44772 20 3 19.5523 3 19V5C3 4.44772 3.44772 4 4 4Z"
          stroke={active ? "#3182F6" : "#8B95A1"}
          strokeWidth="1.8"
        />
        <path d="M3 9H21" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" />
        <path d="M7 15H9M11 15H13" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/assets",
    label: "자산",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="7" width="20" height="14" rx="2"
          fill={active ? "#3182F6" : "none"}
          stroke={active ? "#3182F6" : "#8B95A1"}
          strokeWidth="1.8"
        />
        <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
          stroke={active ? "#3182F6" : "#8B95A1"}
          strokeWidth="1.8" strokeLinecap="round"
        />
        <path d="M12 12v4M10 14h4"
          stroke={active ? "white" : "#8B95A1"}
          strokeWidth="1.8" strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-toss-border safe-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {/* 홈, 지출 */}
        {navItems.slice(0, 2).map((item) => {
          const active = item.href === "/spending"
            ? pathname === "/spending"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-3 px-6 min-w-[72px]"
            >
              {item.icon(active)}
              <span className={clsx("text-xs font-medium", {
                "text-toss-blue": active,
                "text-toss-text-ter": !active,
              })}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Center FAB */}
        <Link href="/spending/add" className="flex flex-col items-center gap-1 py-3 px-6">
          <div className="w-12 h-12 rounded-full bg-toss-blue flex items-center justify-center shadow-lg -mt-5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xs font-medium text-toss-text-ter">추가</span>
        </Link>

        {/* 자산 */}
        {navItems.slice(2).map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-3 px-6 min-w-[72px]"
            >
              {item.icon(active)}
              <span className={clsx("text-xs font-medium", {
                "text-toss-blue": active,
                "text-toss-text-ter": !active,
              })}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* 가족 (플레이스홀더) */}
        <button className="flex flex-col items-center gap-1 py-3 px-6 min-w-[72px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#8B95A1" strokeWidth="1.8" />
            <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20"
              stroke="#8B95A1" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-medium text-toss-text-ter">가족</span>
        </button>
      </div>
    </nav>
  );
}
