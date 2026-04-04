"use client";

import { useSpendingStore } from "@/store/spendingStore";
import { SPENDING_CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { SpendingCategory } from "@/types";
import { clsx } from "clsx";

export function CategoryFilterBar() {
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);
  const setSelectedCategory = useSpendingStore((s) => s.setSelectedCategory);

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar bg-white border-b border-toss-border"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      style={{ WebkitOverflowScrolling: "touch" } as any}
    >
      <button
        onClick={() => setSelectedCategory(null)}
        className={clsx(
          "flex-shrink-0 px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors",
          !selectedCategory
            ? "bg-toss-blue text-white"
            : "bg-toss-surface text-toss-text-sub hover:bg-toss-border"
        )}
      >
        전체
      </button>
      {SPENDING_CATEGORIES.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(isSelected ? null : (cat as SpendingCategory))
            }
            className={clsx(
              "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-pill text-xs font-semibold transition-colors",
              isSelected
                ? "text-white"
                : "bg-toss-surface text-toss-text-sub hover:bg-toss-border"
            )}
            style={isSelected ? { backgroundColor: config.color } : {}}
          >
            <span>{config.icon}</span>
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
}
