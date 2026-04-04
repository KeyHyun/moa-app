"use client";

import { SpendingCategory } from "@/types";
import { SPENDING_CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { clsx } from "clsx";

interface CategoryPickerProps {
  value: SpendingCategory;
  onChange: (cat: SpendingCategory) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-3 px-5 py-4">
      {SPENDING_CATEGORIES.map((cat) => {
        const config = CATEGORY_CONFIG[cat];
        const isSelected = value === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat as SpendingCategory)}
            className={clsx(
              "flex flex-col items-center gap-1.5 py-3 rounded-card transition-all",
              isSelected
                ? "ring-2"
                : "bg-toss-surface hover:bg-toss-border"
            )}
            style={isSelected ? { backgroundColor: config.bg } : {}}
          >
            <span className="text-2xl">{config.icon}</span>
            <span
              className={clsx("text-xs font-medium", {
                "text-toss-text": isSelected,
                "text-toss-text-sub": !isSelected,
              })}
              style={isSelected ? { color: config.color } : {}}
            >
              {cat}
            </span>
          </button>
        );
      })}
    </div>
  );
}
