"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useAssetStore, AssetItem, AssetType } from "@/store/assetStore";
import { formatKRW } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";

const ASSET_TYPES: { value: AssetType; label: string; icon: string }[] = [
  { value: "savings",      label: "예금",     icon: "🏦" },
  { value: "installment",  label: "적금",     icon: "💳" },
  { value: "investment",   label: "주식·펀드", icon: "📈" },
  { value: "realEstate",   label: "부동산",   icon: "🏠" },
  { value: "cash",         label: "현금",     icon: "💵" },
];

interface AssetForm {
  type: AssetType;
  label: string;
  amount: string;
  institution: string;
}

const emptyForm = (): AssetForm => ({
  type: "savings",
  label: "",
  amount: "",
  institution: "",
});

export default function AssetsPage() {
  const { assets, isLoading, fetchAssets } = useAssetStore();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetItem | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const totalAsset = assets.reduce((sum, a) => sum + a.amount, 0);

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setError("");
    setShowForm(true);
  };

  const openEdit = (asset: AssetItem) => {
    setEditTarget(asset);
    setForm({
      type: asset.type,
      label: asset.label,
      amount: asset.amount.toString(),
      institution: asset.institution,
    });
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const handleSave = async () => {
    const amountNum = parseInt(form.amount.replace(/,/g, ""), 10);
    if (!form.label.trim()) { setError("자산명을 입력해주세요."); return; }
    if (!amountNum || amountNum <= 0) { setError("금액을 올바르게 입력해주세요."); return; }

    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await fetch("/api/assets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            amount: amountNum,
            label: form.label.trim(),
            institution: form.institution.trim(),
          }),
        });
      } else {
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            label: form.label.trim(),
            amount: amountNum,
            institution: form.institution.trim(),
          }),
        });
      }
      await fetchAssets();
      closeForm();
    } catch {
      setError("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("이 자산을 삭제할까요?")) return;
    await fetch("/api/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAssets();
  };

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar
        title="자산 관리"
        rightAction={
          <button
            onClick={openAdd}
            className="text-sm font-semibold text-toss-blue px-1"
          >
            + 추가
          </button>
        }
      />

      {/* 총 자산 요약 */}
      <div className="mx-4 mt-2 mb-4 p-5 bg-white rounded-2xl shadow-sm">
        <p className="text-xs text-toss-text-sub mb-1">총 자산</p>
        <p className="text-2xl font-bold text-toss-text">{formatKRW(totalAsset)}</p>
        <p className="text-xs text-toss-text-ter mt-1">{assets.length}개 항목</p>
      </div>

      {/* 자산 유형별 섹션 */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🏦</span>
          <p className="text-base font-semibold text-toss-text">자산을 추가해보세요</p>
          <p className="text-sm text-toss-text-ter">예금, 적금, 투자, 부동산 등을 관리할 수 있어요</p>
          <button
            onClick={openAdd}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill"
          >
            + 자산 추가
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-2">
          {assets.map((asset) => {
            const config = ASSET_TYPE_CONFIG[asset.type] ?? { icon: "💰", label: asset.type };
            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
              >
                <div className="w-11 h-11 rounded-full bg-toss-blue-light flex items-center justify-center text-xl flex-shrink-0">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-toss-text truncate">{asset.label}</p>
                  <p className="text-xs text-toss-text-ter mt-0.5">{config.label}{asset.institution ? ` · ${asset.institution}` : ""}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-sm font-bold text-toss-text">{formatKRW(asset.amount)}</p>
                  <button
                    onClick={() => openEdit(asset)}
                    className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-sub hover:bg-toss-border transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-ter hover:bg-red-50 hover:text-toss-red transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가/수정 바텀 시트 */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={closeForm} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-xl max-w-lg mx-auto">
            <div className="px-5 pt-5 pb-8">
              {/* 핸들 */}
              <div className="w-10 h-1 bg-toss-border rounded-full mx-auto mb-5" />

              <h2 className="text-base font-bold text-toss-text mb-5">
                {editTarget ? "자산 수정" : "자산 추가"}
              </h2>

              <div className="space-y-4">
                {/* 자산 유형 (추가 시만) */}
                {!editTarget && (
                  <div>
                    <p className="text-xs font-semibold text-toss-text-sub mb-2">자산 유형</p>
                    <div className="flex gap-2 flex-wrap">
                      {ASSET_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-medium transition-colors ${
                            form.type === t.value
                              ? "bg-toss-blue text-white"
                              : "bg-toss-surface text-toss-text-sub"
                          }`}
                        >
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 자산명 */}
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">자산명</p>
                  <input
                    type="text"
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="예: 국민은행 예금통장"
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
                  />
                </div>

                {/* 금액 */}
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">금액 (원)</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, "") }))}
                    placeholder="예: 5000000"
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
                  />
                  {form.amount && !isNaN(parseInt(form.amount)) && (
                    <p className="text-xs text-toss-blue mt-1.5 pl-1">
                      {formatKRW(parseInt(form.amount))}
                    </p>
                  )}
                </div>

                {/* 금융기관 */}
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">
                    금융기관 <span className="font-normal text-toss-text-ter">(선택)</span>
                  </p>
                  <input
                    type="text"
                    value={form.institution}
                    onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))}
                    placeholder="예: 국민은행, 카카오뱅크..."
                    className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
                  />
                </div>

                {error && <p className="text-xs text-toss-red pl-1">{error}</p>}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-4 bg-toss-blue disabled:bg-toss-border text-white disabled:text-toss-text-ter font-semibold rounded-2xl transition-colors"
                >
                  {saving ? "저장 중..." : editTarget ? "수정 완료" : "추가하기"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
