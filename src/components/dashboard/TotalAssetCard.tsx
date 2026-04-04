"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAssetStore } from "@/store/assetStore";
import { useAuthStore } from "@/store/authStore";
import { formatKRW } from "@/lib/formatters";

export function TotalAssetCard() {
  const { assets, isLoading } = useAssetStore();
  const user = useAuthStore((s) => s.user);

  const liabilityTypes = new Set(["loan", "mortgage", "creditLoan"]);
  const netWorth = assets.reduce((sum, a) => sum + a.amount, 0);
  const totalLiabilities = assets
    .filter((a) => liabilityTypes.has(a.type))
    .reduce((sum, a) => sum + Math.abs(a.amount), 0);

  return (
    <Card padding="lg">
      <p className="text-sm text-toss-text-sub mb-1">{user?.name}님의 순자산</p>

      {isLoading ? (
        <>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-32 mb-4" />
        </>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-toss-text tracking-tight mb-1">
            {formatKRW(netWorth)}
          </h2>
          <p className="text-sm text-toss-text-ter">
            {totalLiabilities > 0 ? `부채 ${formatKRW(totalLiabilities)} 포함` : `${assets.length}개 자산 항목`}
          </p>
        </>
      )}
    </Card>
  );
}
