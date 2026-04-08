"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAssetStore } from "@/store/assetStore";
import { useAuthStore } from "@/store/authStore";
import { useLockStore } from "@/store/lockStore";
import { formatKRW } from "@/lib/formatters";

export function TotalAssetCard() {
  const { assets, isLoading } = useAssetStore();
  const user = useAuthStore((s) => s.user);
  const { isAmountVisible, openUnlockModal } = useLockStore();

  const liabilityTypes = new Set(["loan", "mortgage", "creditLoan"]);
  const totalAssets = assets
    .filter((a) => !liabilityTypes.has(a.type))
    .reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = assets
    .filter((a) => liabilityTypes.has(a.type))
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <Card padding="lg">
      <p className="text-sm text-toss-text-sub mb-1">{user?.name}님의 순자산</p>

      {isLoading ? (
        <>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
        </>
      ) : !isAmountVisible ? (
        <button
          onClick={openUnlockModal}
          className="w-full py-4 flex flex-col items-center justify-center gap-1 text-toss-text-ter hover:bg-toss-surface rounded-xl transition-colors"
        >
          <span className="text-2xl">🔒</span>
          <span className="text-sm font-medium">잠금 해제 후 확인</span>
        </button>
      ) : (
        <>
          {/* 총 자산 (부채 미차감) */}
          <div className="mb-2">
            <p className="text-xs text-toss-text-ter mb-0.5">총 자산</p>
            <h2 className="text-3xl font-bold text-toss-text tracking-tight">
              {formatKRW(totalAssets)}
            </h2>
          </div>

          {/* 부채 */}
          {totalLiabilities > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-toss-text-ter">부채</span>
              <span className="text-sm font-semibold text-toss-red">
                -{formatKRW(totalLiabilities)}
              </span>
            </div>
          )}

          {/* 구분선 + 순자산 */}
          <div className="pt-2 border-t border-toss-border">
            <div className="flex items-center justify-between">
              <span className="text-xs text-toss-text-ter">순자산</span>
              <span className={`text-sm font-bold ${netWorth >= 0 ? "text-toss-blue" : "text-toss-red"}`}>
                {formatKRW(netWorth)}
              </span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
