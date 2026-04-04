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
  address: string;
  price: number | null;
  property_type: string;
  area: number | null;
  floor: string;
  naver_url: string;
  notes: string;
  visibility: string;
  user_name: string;
  created_at: string;
}

interface PropertyForm {
  name: string;
  address: string;
  price: string;
  property_type: string;
  area: string;
  floor: string;
  naver_url: string;
  notes: string;
  visibility: Visibility;
}

const emptyForm = (): PropertyForm => ({
  name: "",
  address: "",
  price: "",
  property_type: "apartment",
  area: "",
  floor: "",
  naver_url: "",
  notes: "",
  visibility: "family",
});

const PROPERTY_TYPES = [
  { value: "apartment", label: "아파트", icon: "🏢" },
  { value: "villa",     label: "빌라",   icon: "🏘️" },
  { value: "house",     label: "단독주택", icon: "🏠" },
  { value: "officetel", label: "오피스텔", icon: "🏬" },
  { value: "land",      label: "토지",   icon: "🌱" },
];

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
    if (!form.name.trim()) { setError("매물명을 입력해주세요."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: form.price ? parseInt(form.price.replace(/,/g, ""), 10) : null,
          area: form.area ? parseFloat(form.area) : null,
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
    if (!confirm("이 매물을 삭제할까요?")) return;
    await fetch("/api/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const typeConfig = (type: string) =>
    PROPERTY_TYPES.find((t) => t.value === type) ?? { icon: "🏠", label: type };

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

      {/* 안내 배너 */}
      <div className="mx-4 mt-3 mb-3 px-4 py-3 bg-toss-blue-light rounded-xl flex items-start gap-2.5">
        <span className="text-base mt-0.5">💡</span>
        <p className="text-xs text-toss-blue leading-relaxed">
          네이버 부동산에서 마음에 드는 매물을 찾아 URL을 복사해 저장하세요.
          찜한 매물을 탭하면 바로 네이버 부동산으로 이동합니다.
        </p>
      </div>

      {loading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🏠</span>
          <p className="text-base font-semibold text-toss-text">찜한 매물이 없어요</p>
          <p className="text-sm text-toss-text-ter">네이버 부동산에서 마음에 드는 매물을 저장해보세요</p>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm()); setError(""); }}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill"
          >
            + 매물 추가
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {items.map((item) => {
            const type = typeConfig(item.property_type);
            return (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div
                  className={clsx("px-5 py-4", item.naver_url && "cursor-pointer active:bg-toss-surface")}
                  onClick={() => item.naver_url && window.open(item.naver_url, "_blank")}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-toss-surface flex items-center justify-center text-2xl flex-shrink-0">
                      {type.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-toss-text truncate">{item.name}</p>
                        {item.visibility === "private" && (
                          <span className="text-xs bg-toss-surface text-toss-text-ter px-1.5 py-0.5 rounded-full flex-shrink-0">나만</span>
                        )}
                        {item.naver_url && (
                          <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full flex-shrink-0">N 링크</span>
                        )}
                      </div>
                      <p className="text-xs text-toss-text-ter mt-0.5">{type.label}{item.address ? ` · ${item.address}` : ""}</p>
                      <div className="flex items-center gap-3 mt-2">
                        {item.price && (
                          <p className="text-sm font-bold text-toss-blue">{formatKRW(item.price)}</p>
                        )}
                        {item.area && (
                          <p className="text-xs text-toss-text-sub">{item.area}㎡</p>
                        )}
                        {item.floor && (
                          <p className="text-xs text-toss-text-sub">{item.floor}층</p>
                        )}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-toss-text-ter mt-1.5 line-clamp-2">{item.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter flex-shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-toss-text-ter mt-2">저장자: {item.user_name}</p>
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
              <h2 className="text-base font-bold text-toss-text">매물 추가</h2>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-4">
              {/* 매물 유형 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">유형</p>
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

              {/* 매물명 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">매물명 *</p>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="예: 강남 래미안 84㎡"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
              </div>

              {/* 주소 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">주소 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="예: 서울시 강남구 역삼동"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
              </div>

              {/* 가격 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">호가 (원) <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <input type="text" inputMode="numeric" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="예: 900000000"
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                {form.price && !isNaN(parseInt(form.price)) && (
                  <p className="text-xs text-toss-blue mt-1 pl-1">{formatKRW(parseInt(form.price))}</p>
                )}
              </div>

              {/* 면적 + 층수 */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">면적 (㎡)</p>
                  <input type="text" inputMode="decimal" value={form.area}
                    onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                    placeholder="예: 84.7"
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">층수</p>
                  <input type="text" value={form.floor}
                    onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                    placeholder="예: 15"
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
                </div>
              </div>

              {/* 네이버 부동산 URL */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">네이버 부동산 URL <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <input type="url" value={form.naver_url}
                  onChange={(e) => setForm((f) => ({ ...f, naver_url: e.target.value }))}
                  placeholder="https://new.land.naver.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue" />
              </div>

              {/* 메모 */}
              <div>
                <p className="text-xs font-semibold text-toss-text-sub mb-2">메모 <span className="font-normal text-toss-text-ter">(선택)</span></p>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="주변 환경, 교통, 학군 등 메모..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue resize-none" />
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

            <div className="px-5 pb-8 pt-3 flex-shrink-0 border-t border-toss-border">
              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-toss-blue disabled:bg-toss-border text-white font-semibold rounded-2xl">
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
