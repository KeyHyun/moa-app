"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { useAssetStore, AssetItem } from "@/store/assetStore";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { formatKRW } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";
import { AssetType, Visibility } from "@/types";
import { clsx } from "clsx";

interface FamilyMember {
  id: number;
  name: string;
  role: string;
}

const ASSET_TYPES: { value: AssetType; label: string; icon: string; isLiability?: boolean }[] = [
  { value: "savings",     label: "예금",         icon: "🏦" },
  { value: "installment", label: "적금",         icon: "💳" },
  { value: "investment",  label: "주식·펀드",    icon: "📈" },
  { value: "realEstate",  label: "부동산",       icon: "🏠" },
  { value: "cash",        label: "현금",         icon: "💵" },
  { value: "mortgage",    label: "주택담보대출", icon: "🏠", isLiability: true },
  { value: "loan",        label: "일반 대출",    icon: "📋", isLiability: true },
  { value: "creditLoan",  label: "신용대출",     icon: "💸", isLiability: true },
];

interface AssetForm {
  type: AssetType;
  label: string;
  amount: string;
  institution: string;
  visibility: Visibility;
  ownerUserId: number | null; // null = current user
}

const emptyForm = (defaultUserId: number | null = null): AssetForm => ({
  type: "savings",
  label: "",
  amount: "",
  institution: "",
  visibility: "family",
  ownerUserId: defaultUserId,
});

export default function AssetsPage() {
  const { assets, isLoading, fetchAssets } = useAssetStore();
  const currentUser = useAuthStore((s) => s.user);
  const viewMode2 = useDashboardStore((s) => s.viewMode);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<AssetItem | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "assets" | "liabilities">("all");
  const [members, setMembers] = useState<FamilyMember[]>([]);

  useEffect(() => { fetchAssets(viewMode2); }, [fetchAssets, viewMode2]);

  useEffect(() => {
    fetch("/api/family").then((r) => r.json()).then((d) => {
      if (d.members) setMembers(d.members);
    });
  }, []);

  const liabilityTypes = new Set(["loan", "mortgage", "creditLoan"]);
  const totalAssets = assets
    .filter((a) => !liabilityTypes.has(a.type))
    .reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = assets
    .filter((a) => liabilityTypes.has(a.type))
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);
  const netWorth = totalAssets - totalLiabilities;

  const displayedAssets = assets.filter((a) => {
    if (viewMode === "assets") return !liabilityTypes.has(a.type);
    if (viewMode === "liabilities") return liabilityTypes.has(a.type);
    return true;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm(currentUser?.id ?? null));
    setError("");
    setShowForm(true);
  };

  const openEdit = (asset: AssetItem) => {
    setEditTarget(asset);
    setForm({
      type: asset.type as AssetType,
      label: asset.label,
      amount: Math.abs(asset.amount).toString(),
      institution: asset.institution,
      visibility: (asset.visibility as Visibility) || "family",
      ownerUserId: asset.user_id ?? currentUser?.id ?? null,
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

    const config = ASSET_TYPE_CONFIG[form.type];
    const finalAmount = config?.isLiability ? -amountNum : amountNum;

    setSaving(true);
    setError("");
    try {
      if (editTarget) {
        await fetch("/api/assets", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editTarget.id,
            amount: finalAmount,
            label: form.label.trim(),
            institution: form.institution.trim(),
            visibility: form.visibility,
            owner_user_id: form.ownerUserId,
          }),
        });
      } else {
        await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: form.type,
            label: form.label.trim(),
            amount: finalAmount,
            institution: form.institution.trim(),
            visibility: form.visibility,
            owner_user_id: form.ownerUserId,
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
    if (!confirm("이 항목을 삭제할까요?")) return;
    await fetch("/api/assets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAssets();
  };

  return (
    <div className="min-h-screen bg-toss-surface">
      <TopBar title="자산 관리" />

      {/* 순자산 요약 */}
      <div className="mx-4 mt-2 mb-3 p-5 bg-white rounded-2xl shadow-sm">
        <p className="text-xs text-toss-text-sub mb-1">순자산</p>
        <p className="text-2xl font-bold text-toss-text">{formatKRW(netWorth)}</p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs text-toss-text-ter">총 자산</p>
            <p className="text-sm font-semibold text-toss-text">{formatKRW(totalAssets)}</p>
          </div>
          <div className="w-px bg-toss-border" />
          <div>
            <p className="text-xs text-toss-text-ter">총 부채</p>
            <p className="text-sm font-semibold text-toss-red">{formatKRW(totalLiabilities)}</p>
          </div>
        </div>
      </div>

      {/* 보기 필터 */}
      <div className="flex mx-4 mb-3 bg-white rounded-xl p-1 shadow-sm">
        {(["all", "assets", "liabilities"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={clsx("flex-1 py-2 text-xs font-semibold rounded-lg transition-all", {
              "bg-toss-blue text-white": viewMode === mode,
              "text-toss-text-sub": viewMode !== mode,
            })}
          >
            {mode === "all" ? "전체" : mode === "assets" ? "자산" : "부채"}
          </button>
        ))}
      </div>

      {/* 자산 목록 */}
      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : displayedAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <span className="text-5xl">🏦</span>
          <p className="text-base font-semibold text-toss-text">자산을 추가해보세요</p>
          <p className="text-sm text-toss-text-ter">자산, 부채, 대출 등을 관리할 수 있어요</p>
          <button
            onClick={openAdd}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill"
          >
            + 추가하기
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-2 pb-24">
          {displayedAssets.map((asset) => {
            const config = ASSET_TYPE_CONFIG[asset.type as AssetType] ?? { icon: "💰", label: asset.type, isLiability: false };
            const isLiability = config.isLiability;
            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm"
              >
                <div className={clsx("w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0",
                  isLiability ? "bg-red-50" : "bg-toss-blue-light"
                )}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-toss-text truncate">{asset.label}</p>
                    {asset.visibility === "private" && (
                      <span className="text-[10px] bg-toss-surface text-toss-text-ter px-1.5 py-0.5 rounded-full flex-shrink-0">나만</span>
                    )}
                  </div>
                  <p className="text-xs text-toss-text-ter mt-0.5 truncate">
                    {config.label}{asset.institution ? ` · ${asset.institution}` : ""}
                    {asset.user_name ? ` · ${asset.user_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className={clsx("text-sm font-bold", isLiability ? "text-toss-red" : "text-toss-text")}>
                    {isLiability ? "-" : ""}{formatKRW(Math.abs(asset.amount))}
                  </p>
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

      {/* 추가 FAB */}
      {!showForm && (
        <button
          onClick={openAdd}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-toss-blue flex items-center justify-center shadow-lg"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* 추가/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 딤 */}
          <div className="absolute inset-0 bg-black/50" onClick={closeForm} />

          {/* 모달 카드 */}
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 flex-shrink-0 border-b border-toss-border">
              <h2 className="text-base font-bold text-toss-text">
                {editTarget ? "자산 수정" : "자산 추가"}
              </h2>
              <button
                onClick={closeForm}
                className="w-8 h-8 rounded-full bg-toss-surface flex items-center justify-center text-toss-text-sub hover:bg-toss-border transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* 스크롤 영역 */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
              {/* 자산 유형 (추가 시만) */}
              {!editTarget && (
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">자산 유형</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-toss-text-ter mb-1.5">자산</p>
                      <div className="flex gap-2 flex-wrap">
                        {ASSET_TYPES.filter((t) => !t.isLiability).map((t) => (
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
                    <div>
                      <p className="text-xs text-toss-text-ter mb-1.5">부채 / 대출</p>
                      <div className="flex gap-2 flex-wrap">
                        {ASSET_TYPES.filter((t) => t.isLiability).map((t) => (
                          <button
                            key={t.value}
                            onClick={() => setForm((f) => ({ ...f, type: t.value }))}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-medium transition-colors ${
                              form.type === t.value
                                ? "bg-toss-red text-white"
                                : "bg-toss-surface text-toss-text-sub"
                            }`}
                          >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
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
                <p className="text-xs font-semibold text-toss-text-sub mb-2">
                  금액 (원){ASSET_TYPE_CONFIG[form.type]?.isLiability && <span className="text-toss-red font-normal ml-1">· 부채는 양수로 입력</span>}
                </p>
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

              {/* 소유자 (가족이 있을 때만) */}
              {members.length > 1 && (
                <div>
                  <p className="text-xs font-semibold text-toss-text-sub mb-2">소유자</p>
                  <div className="flex gap-2 flex-wrap">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setForm((f) => ({ ...f, ownerUserId: m.id }))}
                        className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors", {
                          "border-toss-blue bg-toss-blue-light text-toss-blue": form.ownerUserId === m.id,
                          "border-toss-border bg-white text-toss-text-sub": form.ownerUserId !== m.id,
                        })}
                      >
                        <span className="text-base">
                          {m.id === currentUser?.id ? "🙋" : "👤"}
                        </span>
                        <span>{m.name}</span>
                        {m.id === currentUser?.id && (
                          <span className="text-[10px] text-toss-text-ter">(나)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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

              {error && <p className="text-xs text-toss-red pl-1">{error}</p>}
            </div>

            {/* 저장 버튼 */}
            <div className="px-5 pb-5 pt-3 flex-shrink-0 border-t border-toss-border">
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
      )}
    </div>
  );
}
