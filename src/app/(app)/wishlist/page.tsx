"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { Visibility } from "@/types";
import { clsx } from "clsx";

interface Property {
  id: number;
  name: string;
  location: string;
  property_type: string;
  trade_type: string;
  min_price: number | null;
  max_price: number | null;
  min_area: number | null;
  max_area: number | null;
  naver_complex_url: string;
  floor_min: number | null;
  floor_max: number | null;
  notes: string;
  visibility: string;
  user_name: string;
}

interface PropertyForm {
  name: string;
  location: string;
  property_type: string;
  trade_type: string;
  naver_complex_url: string;
  floor_min: string;
  floor_max: string;
  min_area: string;
  max_area: string;
  min_price: string;
  max_price: string;
  notes: string;
  visibility: Visibility;
}

interface PriceResult {
  complexName: string;
  minPrice: number | null;
  matchCount: number;
  totalFetched: number;
  listings: { floor: string; area: number; price: string; direction: string }[];
  error?: string;
}

const TRADE_TYPES = [
  { value: "A1", label: "매매", naverCode: "RETAIL" },
  { value: "B1", label: "전세", naverCode: "LEASE" },
  { value: "B2", label: "월세", naverCode: "MONTH" },
];

const PROPERTY_TYPES = [
  { value: "APT",   label: "아파트",   icon: "🏢", naverCode: "APT" },
  { value: "VL",    label: "빌라/연립", icon: "🏘️", naverCode: "VL:DDDGG:JWJT:YGJT" },
  { value: "OPST",  label: "오피스텔", icon: "🏬", naverCode: "OPST" },
  { value: "DDDGG", label: "단독주택", icon: "🏠", naverCode: "DDDGG" },
];

const emptyForm = (): PropertyForm => ({
  name: "",
  location: "",
  property_type: "APT",
  trade_type: "A1",
  naver_complex_url: "",
  floor_min: "",
  floor_max: "",
  min_area: "",
  max_area: "",
  min_price: "",
  max_price: "",
  notes: "",
  visibility: "family",
});

function buildNaverUrl(item: Property): string {
  if (item.naver_complex_url) return item.naver_complex_url;
  const pt = PROPERTY_TYPES.find((p) => p.value === item.property_type);
  const tt = TRADE_TYPES.find((t) => t.value === item.trade_type);
  const params = new URLSearchParams();
  params.set("ms", "37.5,127,15");
  if (pt) params.set("a", pt.naverCode);
  if (tt) params.set("e", tt.naverCode);
  if (item.min_area || item.max_area) params.set("aa", `${item.min_area ?? 0}:${item.max_area ?? 999}`);
  const base = pt?.value === "OPST" ? "office-studios" : pt?.value === "APT" ? "apartments" : "houses";
  return `https://new.land.naver.com/${base}?${params.toString()}`;
}

export default function WishlistPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PropertyForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 최저가 조회 상태 (카드별)
  const [priceResults, setPriceResults] = useState<Record<number, PriceResult>>({});
  const [fetching, setFetching] = useState<Record<number, boolean>>({});

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
          floor_min: form.floor_min ? parseInt(form.floor_min, 10) : null,
          floor_max: form.floor_max ? parseInt(form.floor_max, 10) : null,
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
    setPriceResults((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const fetchMinPrice = async (item: Property) => {
    if (!item.naver_complex_url) return;
    setFetching((p) => ({ ...p, [item.id]: true }));
    try {
      const res = await fetch("/api/naver-land", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: item.naver_complex_url,
          trade_type: item.trade_type,
          floor_min: item.floor_min,
          floor_max: item.floor_max,
          min_area: item.min_area,
          max_area: item.max_area,
        }),
      });
      const data = await res.json();
      setPriceResults((p) => ({ ...p, [item.id]: data }));
    } catch {
      setPriceResults((p) => ({ ...p, [item.id]: { complexName: "", minPrice: null, matchCount: 0, totalFetched: 0, listings: [], error: "네트워크 오류" } }));
    } finally {
      setFetching((p) => ({ ...p, [item.id]: false }));
    }
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
          {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🏠</span>
          <p className="text-base font-semibold text-toss-text">찜한 매물이 없어요</p>
          <p className="text-sm text-toss-text-ter">관심 단지를 저장하고 최저가를 확인해보세요</p>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm()); setError(""); }}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill"
          >
            + 단지 추가
          </button>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {items.map((item) => {
            const pt = ptConfig(item.property_type);
            const tt = ttConfig(item.trade_type);
            const result = priceResults[item.id];
            const isFetching = fetching[item.id];
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  {/* 헤더 */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-toss-surface flex items-center justify-center text-xl flex-shrink-0">
                        {pt.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-toss-text truncate">{item.name}</p>
                          {item.visibility === "private" && (
                            <span className="text-[10px] bg-toss-surface text-toss-text-ter px-1.5 py-0.5 rounded-full flex-shrink-0">나만</span>
                          )}
                        </div>
                        {item.location && (
                          <p className="text-xs text-toss-text-sub mt-0.5 truncate">📍 {item.location}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-7 h-7 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter flex-shrink-0"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  {/* 조건 뱃지 */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{pt.label}</span>
                    <span className="text-[11px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">{tt.label}</span>
                    {(item.min_area || item.max_area) && (
                      <span className="text-[11px] bg-toss-surface text-toss-text-sub px-2 py-0.5 rounded-full">
                        면적 {item.min_area ?? 0}~{item.max_area ?? "∞"}㎡
                      </span>
                    )}
                    {(item.floor_min || item.floor_max) && (
                      <span className="text-[11px] bg-toss-surface text-toss-text-sub px-2 py-0.5 rounded-full">
                        {item.floor_min ?? 1}~{item.floor_max ?? "∞"}층
                      </span>
                    )}
                  </div>

                  {/* 최저가 결과 */}
                  {result && (
                    <div className={clsx("mt-3 p-3 rounded-xl", result.error ? "bg-red-50" : "bg-toss-surface")}>
                      {result.error ? (
                        <p className="text-xs text-toss-red">{result.error}</p>
                      ) : result.minPrice === null ? (
                        <p className="text-xs text-toss-text-ter">
                          조건에 맞는 매물이 없어요 (전체 {result.totalFetched}개 조회)
                        </p>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <span className="text-xs text-toss-text-sub">최저 호가</span>
                            <span className="text-base font-bold text-toss-blue">{formatKRW(result.minPrice)}</span>
                            <span className="text-xs text-toss-text-ter">({result.matchCount}개 매물)</span>
                          </div>
                          {result.complexName && (
                            <p className="text-xs text-toss-text-ter mb-1.5">🏢 {result.complexName}</p>
                          )}
                          {result.listings.length > 0 && (
                            <div className="space-y-1">
                              {result.listings.map((l, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                  <span className="text-toss-text-sub">
                                    {l.floor}층 · {l.area}㎡{l.direction ? ` · ${l.direction}` : ""}
                                  </span>
                                  <span className="font-semibold text-toss-text">{l.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {item.notes && (
                    <p className="text-xs text-toss-text-ter mt-2 line-clamp-2">{item.notes}</p>
                  )}

                  {/* 버튼 영역 */}
                  <div className="flex gap-2 mt-3">
                    {item.naver_complex_url && (
                      <button
                        onClick={() => fetchMinPrice(item)}
                        disabled={isFetching}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-toss-blue-light text-toss-blue text-xs font-semibold active:bg-blue-100 transition-colors disabled:opacity-60"
                      >
                        {isFetching ? (
                          <>
                            <span className="w-3 h-3 border-2 border-toss-blue border-t-transparent rounded-full animate-spin" />
                            조회 중...
                          </>
                        ) : (
                          <>🔍 최저가 확인</>
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => window.open(buildNaverUrl(item), "_blank")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-green-50 text-green-700 text-xs font-semibold active:bg-green-100 transition-colors"
                    >
                      🏠 네이버에서 보기
                    </button>
                  </div>

                  <p className="text-[10px] text-toss-text-ter mt-2">저장: {item.user_name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 추가 모달 (중앙 배치) ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[88vh]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-toss-border">
              <h2 className="text-base font-bold text-toss-text">관심 단지 추가</h2>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-sub hover:bg-toss-border transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* 찜 이름 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">찜 이름 *</p>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 래미안 강남 84㎡ 10층대"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                />
              </div>

              {/* 네이버 부동산 단지 URL */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-1">네이버 부동산 단지 URL</p>
                <p className="text-[11px] text-toss-text-ter mb-2">
                  단지 페이지 URL을 입력하면 최저가를 자동으로 조회할 수 있어요
                </p>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={form.naver_complex_url}
                    onChange={(e) => setForm((f) => ({ ...f, naver_complex_url: e.target.value }))}
                    placeholder="https://new.land.naver.com/complexes/..."
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <button
                    onClick={() => window.open("https://new.land.naver.com/", "_blank")}
                    className="px-3 py-2.5 rounded-xl bg-green-50 text-green-700 text-xs font-semibold whitespace-nowrap"
                  >
                    🏠 검색
                  </button>
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

              {/* 희망 층수 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">희망 층수 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <div className="flex gap-2 items-center">
                  <input
                    type="text" inputMode="numeric"
                    value={form.floor_min}
                    onChange={(e) => setForm((f) => ({ ...f, floor_min: e.target.value.replace(/\D/g, "") }))}
                    placeholder="최저 층 (예: 5)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <span className="text-toss-text-ter">~</span>
                  <input
                    type="text" inputMode="numeric"
                    value={form.floor_max}
                    onChange={(e) => setForm((f) => ({ ...f, floor_max: e.target.value.replace(/\D/g, "") }))}
                    placeholder="최고 층 (예: 20)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[["저층", "1", "5"], ["중층", "6", "15"], ["고층", "16", ""]].map(([label, min, max]) => (
                    <button key={label} onClick={() => setForm((f) => ({ ...f, floor_min: min, floor_max: max }))}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-toss-surface text-toss-text-sub active:bg-toss-border">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 희망 면적 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">희망 면적 (㎡) <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <div className="flex gap-2 items-center">
                  <input type="text" inputMode="decimal"
                    value={form.min_area}
                    onChange={(e) => setForm((f) => ({ ...f, min_area: e.target.value.replace(/[^0-9.]/g, "") }))}
                    placeholder="최소 (예: 59)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                  <span className="text-toss-text-ter">~</span>
                  <input type="text" inputMode="decimal"
                    value={form.max_area}
                    onChange={(e) => setForm((f) => ({ ...f, max_area: e.target.value.replace(/[^0-9.]/g, "") }))}
                    placeholder="최대 (예: 85)"
                    className="flex-1 px-3 py-2.5 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[["소형", "33", "59"], ["중형", "59", "85"], ["대형", "85", "135"]].map(([label, min, max]) => (
                    <button key={label} onClick={() => setForm((f) => ({ ...f, min_area: min, max_area: max }))}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-toss-surface text-toss-text-sub active:bg-toss-border">
                      {label} ({min}~{max}㎡)
                    </button>
                  ))}
                </div>
              </div>

              {/* 지역명 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">지역명 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <input type="text" value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  placeholder="예: 서울 강남구 역삼동"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
                />
              </div>

              {/* 메모 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">메모 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="학군, 교통, 입지 등..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue resize-none"
                />
              </div>

              {/* 공개 여부 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">공개 여부</p>
                <div className="flex gap-2">
                  {(["family", "private"] as Visibility[]).map((v) => (
                    <button key={v} onClick={() => setForm((f) => ({ ...f, visibility: v }))}
                      className={clsx("flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors", {
                        "bg-toss-blue text-white": form.visibility === v,
                        "bg-toss-surface text-toss-text-sub": form.visibility !== v,
                      })}>
                      {v === "family" ? "🏠 가족 공유" : "🔒 나만 보기"}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-toss-red">{error}</p>}
            </div>

            <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-toss-border">
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-toss-blue disabled:bg-toss-border text-white font-semibold rounded-2xl">
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
