"use client";

import { useEffect, useState } from "react";
import { useLockStore } from "@/store/lockStore";
import { useAuthStore } from "@/store/authStore";

/** 앱 레이아웃에 한 번만 마운트 — 타이머 tick + 모달 렌더 담당 */
export function AmountLockProvider() {
  const { tick, showExtendPrompt, extend, lock, showUnlockModal, closeUnlockModal, unlock } = useLockStore();
  const user = useAuthStore((s) => s.user);
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 매초 tick
  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);

  const handleUnlock = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError("");
    try {
      await unlock(pw, user.email);
      setPw("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 잠금 연장 팝업 */}
      {showExtendPrompt && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-toss-text text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4 w-[calc(100%-2rem)] max-w-sm">
          <p className="flex-1 text-sm font-medium">곧 금액이 가려집니다</p>
          <button
            onClick={extend}
            className="px-3 py-1.5 bg-white text-toss-text text-xs font-bold rounded-xl"
          >
            1분 연장
          </button>
          <button onClick={lock} className="text-xs text-white/60">
            잠금
          </button>
        </div>
      )}

      {/* 잠금 해제 모달 */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 pb-safe">
          <div className="bg-white w-full max-w-md rounded-t-2xl px-6 pt-6 pb-10">
            <div className="w-10 h-1 bg-toss-border rounded-full mx-auto mb-5" />
            <h2 className="text-base font-bold text-toss-text mb-1">금액 확인</h2>
            <p className="text-sm text-toss-text-ter mb-5">비밀번호를 입력하면 1분 동안 금액을 볼 수 있어요</p>
            <input
              type="password"
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue mb-2"
              autoFocus
            />
            {error && <p className="text-xs text-toss-red mb-3">{error}</p>}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { closeUnlockModal(); setPw(""); setError(""); }}
                className="flex-1 py-3 bg-toss-surface text-toss-text-sub text-sm font-semibold rounded-xl"
              >
                취소
              </button>
              <button
                onClick={handleUnlock}
                disabled={loading || !pw}
                className="flex-1 py-3 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-xl"
              >
                {loading ? "확인 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
