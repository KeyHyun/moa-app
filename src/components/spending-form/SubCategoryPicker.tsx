"use client";

import { useState } from "react";
import { SUB_CATEGORY_PRESETS } from "@/lib/constants";
import { clsx } from "clsx";

interface SubCategoryPickerProps {
  category: string;
  value: string;
  onChange: (sub: string) => void;
}

export function SubCategoryPicker({ category, value, onChange }: SubCategoryPickerProps) {
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const presets = SUB_CATEGORY_PRESETS[category] ?? [];
  const isCustomValue = value && !presets.includes(value);

  const handleCustomConfirm = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setShowCustom(false);
      setCustomInput("");
    }
  };

  const handleSelect = (sub: string) => {
    onChange(value === sub ? "" : sub); // 토글
    setShowCustom(false);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {/* 없음 (선택 해제) */}
        <button
          onClick={() => { onChange(""); setShowCustom(false); }}
          className={clsx(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            !value ? "border-toss-blue bg-toss-blue text-white" : "border-toss-border bg-white text-toss-text-sub"
          )}
        >
          없음
        </button>

        {/* 프리셋 목록 */}
        {presets.map((sub) => (
          <button
            key={sub}
            onClick={() => handleSelect(sub)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              value === sub
                ? "border-toss-blue bg-toss-blue text-white"
                : "border-toss-border bg-white text-toss-text-sub hover:border-toss-blue hover:text-toss-blue"
            )}
          >
            {sub}
          </button>
        ))}

        {/* 커스텀 입력 버튼 */}
        <button
          onClick={() => setShowCustom((v) => !v)}
          className={clsx(
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            (showCustom || isCustomValue)
              ? "border-toss-blue bg-toss-blue-light text-toss-blue"
              : "border-dashed border-toss-border bg-white text-toss-text-ter"
          )}
        >
          {isCustomValue ? `✓ ${value}` : "+ 직접 입력"}
        </button>
      </div>

      {showCustom && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCustomConfirm()}
            placeholder="세부 카테고리 입력"
            autoFocus
            className="flex-1 px-3 py-2 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
          />
          <button
            onClick={handleCustomConfirm}
            disabled={!customInput.trim()}
            className="px-4 py-2 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}
