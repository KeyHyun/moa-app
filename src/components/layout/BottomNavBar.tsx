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
          d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 19.5523 3 20V9.5Z"
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
    label: "가계부",
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
  {
    href: "/family",
    label: "가족",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="3" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" />
        <circle cx="17" cy="9" r="2.5" stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" />
        <path d="M2 20C2 17.2386 5.13401 15 9 15C12.866 15 16 17.2386 16 20"
          stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M17 14C19.2091 14 21 15.5 21 18"
          stroke={active ? "#3182F6" : "#8B95A1"} strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-toss-border safe-bottom z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = item.href === "/spending"
            ? pathname === "/spending" || pathname.startsWith("/spending/")
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-3 px-4 min-w-[64px]"
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
      </div>
    </nav>
  );
}
