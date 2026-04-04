"use client";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAssetStore } from "@/store/assetStore";
import { formatKRW } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";

export function AssetBreakdownList() {
  const { assets, isLoading } = useAssetStore();

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-sm font-semibold text-toss-text-sub">자산 구성</h3>
      </div>
      <div className="divide-y divide-toss-border">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10" rounded="full" />
                  <div className="space-y-1.5">
                    <Skeleton className="w-16 h-4" />
                    <Skeleton className="w-20 h-3" />
                  </div>
                </div>
                <Skeleton className="w-24 h-5" />
              </div>
            ))
          : assets.map((asset) => {
              const config = ASSET_TYPE_CONFIG[asset.type] ?? { icon: "💰", label: asset.type, isLiability: false };
              const isLiability = config.isLiability;
              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-toss-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${isLiability ? "bg-red-50" : "bg-toss-blue-light"}`}>
                      {config.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-toss-text">{asset.label}</p>
                      <p className="text-xs text-toss-text-ter mt-0.5">{config.label}{asset.institution ? ` · ${asset.institution}` : ""}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${isLiability ? "text-toss-red" : "text-toss-text"}`}>
                    {isLiability ? "-" : ""}{formatKRW(Math.abs(asset.amount))}
                  </p>
                </div>
              );
            })}
      </div>
    </Card>
  );
}
