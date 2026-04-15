"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { CURRENCY_OPTIONS } from "@/lib/formatters";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AddTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("KRW");
  const [saving, setSaving] = useState(false);

  const canSave = name.trim() && destination.trim() && startDate && endDate;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: name.trim(),
          destination: destination.trim(),
          start_date: startDate,
          end_date: endDate,
          description: description.trim(),
          currency,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        router.replace(`/travel/${data.tripId}`);
      } else {
        alert(data.error || "생성에 실패했습니다.");
      }
    } catch {
      alert("생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar showBack title="새 여행 만들기" />

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-5">
        {/* 여행 이름 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">여행 이름</p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 도쿄 여행 2025"
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors placeholder:text-toss-text-ter"
            maxLength={30}
          />
        </div>

        {/* 여행 위치 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">여행 위치</p>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="예: 일본 도쿄"
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors placeholder:text-toss-text-ter"
            maxLength={50}
          />
        </div>

        {/* 화폐 단위 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">화폐 단위</p>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors bg-white appearance-none"
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 여행 일자 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-xs font-semibold text-toss-text-sub mb-2">시작일</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-toss-text-sub mb-2">종료일</p>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
            />
          </div>
        </div>

        {/* 여행 설명 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">
            여행 컨셉 / 설명 <span className="font-normal text-toss-text-ter">(선택)</span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="예: 맛집 탐방 위주의 여유로운 여행"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors resize-none placeholder:text-toss-text-ter"
            maxLength={200}
          />
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="sticky bottom-0 px-5 py-4 bg-white border-t border-toss-border">
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full py-4 rounded-2xl font-semibold text-sm transition-colors bg-toss-blue text-white disabled:opacity-50"
        >
          {saving ? "만드는 중..." : "여행 만들기"}
        </button>
      </div>
    </div>
  );
}