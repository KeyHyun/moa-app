"use client";

import { useState } from "react";
import { SPENDING_CATEGORIES, INCOME_CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";
import { clsx } from "clsx";

interface CategoryPickerProps {
  value: string;
  onChange: (cat: string) => void;
  type?: "expense" | "income";
}

export function CategoryPicker({ value, onChange, type = "expense" }: CategoryPickerProps) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const categories = type === "income" ? INCOME_CATEGORIES : SPENDING_CATEGORIES;
  const isCustom = !(categories as readonly string[]).includes(value) && value !== "";

  const handleCustomConfirm = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setShowCustom(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat] ?? CATEGORY_CONFIG["기타"];
          const isSelected = value === cat;
          return (
            <button
              key={cat}
              onClick={() => { onChange(cat); setShowCustom(false); }}
              className={clsx(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
                isSelected ? "" : "bg-toss-surface hover:bg-toss-border"
              )}
              style={isSelected ? { backgroundColor: config.bg, outline: `2px solid ${config.color}`, outlineOffset: "-1px" } : {}}
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

        {/* 직접 입력 버튼 */}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={clsx(
            "flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all",
            (showCustom || isCustom) ? "bg-toss-blue-light ring-2 ring-toss-blue" : "bg-toss-surface hover:bg-toss-border"
          )}
        >
          <span className="text-2xl">✏️</span>
          <span className={clsx("text-xs font-medium", (showCustom || isCustom) ? "text-toss-blue" : "text-toss-text-sub")}>
            {isCustom ? value : "직접 입력"}
          </span>
        </button>
      </div>

      {/* 직접 입력 필드 */}
      {showCustom && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
            placeholder="카테고리 이름 입력"
            autoFocus
            className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
          />
          <button
            onClick={handleCustomConfirm}
            disabled={!customInput.trim()}
            className="px-4 py-2.5 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}
