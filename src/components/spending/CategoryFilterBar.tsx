"use client";

import { useSpendingStore } from "@/store/spendingStore";
import { SPENDING_CATEGORIES, INCOME_CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { SpendingCategory } from "@/types";
import { clsx } from "clsx";

export function CategoryFilterBar() {
  const selectedCategory = useSpendingStore((s) => s.selectedCategory);
  const setSelectedCategory = useSpendingStore((s) => s.setSelectedCategory);
  const selectedType = useSpendingStore((s) => s.selectedType);
  const setSelectedType = useSpendingStore((s) => s.setSelectedType);

  const categories = selectedType === "income" ? INCOME_CATEGORIES : SPENDING_CATEGORIES;

  return (
    <div className="bg-white border-b border-toss-border">
      {/* 수입/지출/전체 타입 토글 */}
      <div className="flex gap-1.5 px-4 pt-2.5 pb-2">
        {([
          { value: "all",     label: "전체" },
          { value: "expense", label: "지출" },
          { value: "income",  label: "수입" },
        ] as { value: "all" | "expense" | "income"; label: string }[]).map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={clsx(
              "px-3.5 py-1.5 rounded-pill text-xs font-semibold transition-colors",
              selectedType === t.value
                ? t.value === "income"
                  ? "bg-toss-green text-white"
                  : t.value === "expense"
                    ? "bg-toss-red text-white"
                    : "bg-toss-blue text-white"
                : "bg-toss-surface text-toss-text-sub"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 카테고리 가로 스크롤 */}
      <div
        className="flex items-center gap-2 px-4 pb-2.5 overflow-x-auto no-scrollbar"
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
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG["기타"];
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
    </div>
  );
}
