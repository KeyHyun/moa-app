"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { Visibility } from "@/types";
import { clsx } from "clsx";

interface Property {
  id: number;
  user_id: number;
  name: string;
  location: string;
  property_type: string;
  trade_type: string;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  notes: string;
  visibility: string;
  user_name: string;
  created_at: string;
}

interface PropertyForm {
  name: string;
  location: string;
  property_type: string;
  trade_type: string;
  min_price: string;
  max_price: string;
  min_area: string;
  max_area: string;
  notes: string;
  visibility: Visibility;
}

const emptyForm = (): PropertyForm => ({
  name: "",
  location: "",
  property_type: "APT",
  trade_type: "A1",
  min_price: "",
  max_price: "",
  min_area: "",
  max_area: "",
  notes: "",
  visibility: "family",
});

const PROPERTY_TYPES = [
  { value: "APT",   label: "아파트",   icon: "🏢", naverCode: "APT" },
  { value: "VL",    label: "빌라/연립", icon: "🏘️", naverCode: "VL:DDDGG:JWJT:YGJT" },
  { value: "OPST",  label: "오피스텔", icon: "🏬", naverCode: "OPST" },
  { value: "DDDGG", label: "단독주택", icon: "🏠", naverCode: "DDDGG" },
];

const TRADE_TYPES = [
  { value: "A1", label: "매매", naverCode: "RETAIL" },
  { value: "B1", label: "전세", naverCode: "LEASE" },
  { value: "B2", label: "월세", naverCode: "MONTH" },
];

function buildNaverUrl(item: Property): string {
  const pt = PROPERTY_TYPES.find((p) => p.value === item.property_type);
  const tt = TRADE_TYPES.find((t) => t.value === item.trade_type);
  const params = new URLSearchParams();
  params.set("ms", "37.5,127,15");
  if (pt) params.set("a", pt.naverCode);
  if (tt) params.set("e", tt.naverCode);
  if (item.min_price || item.max_price) {
    const minP = item.min_price ? Math.round(item.min_price / 100000000) : 0;
    const maxP = item.max_price ? Math.round(item.max_price / 100000000) : 99;
    params.set("p", `${minP}:${maxP}`);
  }
  if (item.min_area || item.max_area) {
    const minA = item.min_area ?? 0;
    const maxA = item.max_area ?? 999;
    params.set("aa", `${minA}:${maxA}`);
  }
  const base = pt?.value === "APT" ? "apartments" : pt?.value === "OPST" ? "office-studios" : "houses";
  return `https://new.land.naver.com/${base}?${params.toString()}`;
}

export default function WishlistPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PropertyForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/wishlist");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("찜 이름을 입력해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          min_price: form.min_price ? parseInt(form.min_price, 10) : null,
          max_price: form.max_price ? parseInt(form.max_price, 10) : null,
          min_area: form.min_area ? parseFloat(form.min_area) : null,
          max_area: form.max_area ? parseFloat(form.max_area) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); return; }
      await fetchItems();
      setShowForm(false);
      setForm(emptyForm());
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 찜을 삭제할까요?")) return;
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const ptConfig = (type: string) => PROPERTY_TYPES.find((p) => p.value === type) ?? PROPERTY_TYPES[0];
  const ttConfig = (type: string) => TRADE_TYPES.find((t) => t.value === type) ?? TRADE_TYPES[0];

  return (
    <div className="min-h-screen bg-toss-surface pb-24">
      <TopBar
        showBack
        title="부동산 찜 목록"
        rightAction={
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm()); setError(""); }}
            className="text-sm font-semibold text-toss-blue"
          >
            + 추가
          </button>
        }
      />

      {loading ? (
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🏠</span>
          <p className="text-base font-semibold text-toss-text">찜한 지역이 없어요</p>
          <p className="text-sm text-toss-text-ter">관심 지역과 조건을 저장해보세요</p>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm()); setError(""); }}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill"
          >
            + 조건 추가
          </button>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {items.map((item) => {
            const pt = ptConfig(item.property_type);
            const tt = ttConfig(item.trade_type);
            const naverUrl = buildNaverUrl(item);
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-toss-surface flex items-center justify-center text-2xl flex-shrink-0">
                      {pt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-toss-text">{item.name}</p>
                        {item.visibility === "private" && (
                          <span className="text-xs bg-toss-surface text-toss-text-ter px-1.5 py-0.5 rounded-full flex-shrink-0">나만</span>
                        )}
                      </div>

                      {/* 위치 */}
                      {item.location && (
                        <p className="text-xs text-toss-text-sub mt-0.5">📍 {item.location}</p>
                      )}

                      {/* 필터 뱃지 */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                          {pt.label}
                        </span>
                        <span className="text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
                          {tt.label}
                        </span>
                        {(item.min_area || item.max_area) && (
                          <span className="text-[11px] bg-toss-surface text-toss-text-sub px-2 py-0.5 rounded-full">
                            {item.min_area ?? 0}~{item.max_area ?? "∞"}㎡
                          </span>
                        )}
                        {(item.min_price || item.max_price) && (
                          <span className="text-[11px] bg-toss-surface text-toss-text-sub px-2 py-0.5 rounded-full">
                            {item.min_price ? formatKRW(item.min_price) : "0"}~{item.max_price ? formatKRW(item.max_price) : "∞"}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-toss-text-ter mt-1.5 line-clamp-2">{item.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* 네이버 검색 버튼 */}
                  <button
                    onClick={() => window.open(naverUrl, "_blank")}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-50 active:bg-green-100 transition-colors"
                  >
                    <span className="text-sm font-semibold text-green-700">🏠 네이버 부동산에서 검색</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <p className="text-xs text-toss-text-ter mt-2">저장: {item.user_name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 바텀시트 */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowForm(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl max-w-lg mx-auto flex flex-col max-h-[90vh]">
            <div className="px-5 pt-5 pb-3 flex-shrink-0">
              <div className="w-10 h-1 bg-toss-border rounded-full mx-auto mb-4" />
              <h2 className="text-base font-bold text-toss-text">관심 매물 조건 추가</h2>
              <p className="text-xs text-toss-text-ter mt-0.5">조건을 저장하면 네이버 부동산에서 바로 검색할 수 있어요</p>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
              {/* 찜 이름 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">찜 이름 *</p>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 강남 아파트 탐색, 용산 전세 후보"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                />
              </div>

              {/* 지역명 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">지역명 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="예: 서울 강남구, 경기 분당구, 마포구"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                />
              </div>

              {/* 매물 유형 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">매물 유형</p>
                <div className="flex gap-2 flex-wrap">
                  {PROPERTY_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm((f) => ({ ...f, property_type: t.value }))}
                      className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-medium transition-colors", {
                        "bg-toss-blue text-white": form.property_type === t.value,
                        "bg-toss-surface text-toss-text-sub": form.property_type !== t.value,
                      })}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 거래 유형 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">거래 유형</p>
                <div className="flex gap-2">
                  {TRADE_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setForm((f) => ({ ...f, trade_type: t.value }))}
                      className={clsx("flex-1 py-2 rounded-xl text-sm font-medium transition-colors", {
                        "bg-toss-blue text-white": form.trade_type === t.value,
                        "bg-toss-surface text-toss-text-sub": form.trade_type !== t.value,
                      })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 면적 범위 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">면적 범위 (㎡) <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.min_area}
                    onChange={(e) => setForm((f) => ({ ...f, min_area: e.target.value.replace(/[^0-9.]/g, "") }))}
                    placeholder="최소 (예: 59)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <span className="text-toss-text-ter text-sm">~</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.max_area}
                    onChange={(e) => setForm((f) => ({ ...f, max_area: e.target.value.replace(/[^0-9.]/g, "") }))}
                    placeholder="최대 (예: 85)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[["소형", "33", "59"], ["중형", "59", "85"], ["대형", "85", "135"]].map(([label, min, max]) => (
                    <button
                      key={label}
                      onClick={() => setForm((f) => ({ ...f, min_area: min, max_area: max }))}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-toss-surface text-toss-text-sub active:bg-toss-border transition-colors"
                    >
                      {label} ({min}~{max}㎡)
                    </button>
                  ))}
                </div>
              </div>

              {/* 호가 범위 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">
                  호가 범위 (원) <span className="font-normal text-toss-text-ter">(선택)</span>
                </p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.min_price}
                    onChange={(e) => setForm((f) => ({ ...f, min_price: e.target.value.replace(/[^0-9]/g, "") }))}
                    placeholder="최소"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <span className="text-toss-text-ter text-sm">~</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.max_price}
                    onChange={(e) => setForm((f) => ({ ...f, max_price: e.target.value.replace(/[^0-9]/g, "") }))}
                    placeholder="최대"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                </div>
                {(form.min_price || form.max_price) && (
                  <p className="text-xs text-toss-blue mt-1 pl-1">
                    {form.min_price ? formatKRW(parseInt(form.min_price, 10)) : "0"} ~ {form.max_price ? formatKRW(parseInt(form.max_price, 10)) : "제한 없음"}
                  </p>
                )}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[["~5억", "", "500000000"], ["5~10억", "500000000", "1000000000"], ["10억~", "1000000000", ""]].map(([label, min, max]) => (
                    <button
                      key={label}
                      onClick={() => setForm((f) => ({ ...f, min_price: min, max_price: max }))}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-toss-surface text-toss-text-sub active:bg-toss-border transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 메모 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">메모 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="학군, 교통, 입지 등 메모..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue resize-none"
                />
              </div>

              {/* 공개 여부 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">공개 여부</p>
                <div className="flex gap-2">
                  {(["family", "private"] as Visibility[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                      className={clsx("flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors", {
                        "bg-toss-blue text-white": form.visibility === v,
                        "bg-toss-surface text-toss-text-sub": form.visibility !== v,
                      })}
                    >
                      {v === "family" ? "🏠 가족 공유" : "🔒 나만 보기"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-toss-red">{error}</p>}
            </div>

            <div className="px-5 pb-8 pt-3 flex-shrink-0 border-t border-toss-border">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-toss-blue disabled:bg-toss-border text-white font-semibold rounded-2xl"
              >
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
