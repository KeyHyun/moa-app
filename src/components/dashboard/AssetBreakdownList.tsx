"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAssetStore } from "@/store/assetStore";
import { useLockStore, maskedAmount } from "@/store/lockStore";
import { formatKRW } from "@/lib/formatters";
import { ASSET_TYPE_CONFIG } from "@/lib/constants";

export function AssetBreakdownList() {
  const { assets, isLoading } = useAssetStore();
  const { isAmountVisible } = useLockStore();
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const toggleType = (type: string) =>
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });

  // 유형별 그룹화
  const grouped = assets.reduce<Record<string, typeof assets>>((acc, asset) => {
    if (!acc[asset.type]) acc[asset.type] = [];
    acc[asset.type].push(asset);
    return acc;
  }, {});

  const groups = Object.entries(grouped).map(([type, items]) => {
    const config = ASSET_TYPE_CONFIG[type as keyof typeof ASSET_TYPE_CONFIG]
      ?? { icon: "💰", label: type, isLiability: false };
    const total = items.reduce((s, a) => s + a.amount, 0);
    return { type, config, items, total };
  });

  return (
    <Card padding="none">
      <div className="px-5 pt-5 pb-1">
        <h3 className="text-sm font-semibold text-toss-text-sub">자산 구성</h3>
      </div>
      <div className="divide-y divide-toss-border">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
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
          : groups.map(({ type, config, items, total }) => {
              const isLiability = config.isLiability;
              const isExpanded = expandedTypes.has(type);
              const hasMultiple = items.length > 1;

              return (
                <div key={type}>
                  {/* 유형 합산 행 */}
                  <div
                    className={`flex items-center justify-between px-5 py-4 ${hasMultiple ? "cursor-pointer hover:bg-toss-surface" : ""} transition-colors`}
                    onClick={() => hasMultiple && toggleType(type)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${isLiability ? "bg-red-50" : "bg-toss-blue-light"}`}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-toss-text">{config.label}</p>
                        <p className="text-xs text-toss-text-ter truncate">
                          {items.length}개 항목
                          {items.length === 1 && items[0].institution ? ` · ${items[0].institution}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <p className={`text-sm font-semibold ${isLiability ? "text-toss-red" : "text-toss-text"}`}>
                        {isLiability ? "-" : ""}{maskedAmount(formatKRW(Math.abs(total)), isAmountVisible)}
                      </p>
                      {hasMultiple && (
                        <span className="text-toss-text-ter text-xs">{isExpanded ? "▲" : "▼"}</span>
                      )}
                    </div>
                  </div>

                  {/* 개별 항목 (펼쳤을 때) */}
                  {isExpanded && items.map((asset) => (
                    <div key={asset.id} className="flex items-center justify-between px-5 py-3 bg-toss-surface border-t border-toss-border">
                      <div className="min-w-0 pl-13">
                        <p className="text-xs font-medium text-toss-text truncate">{asset.label}</p>
                        <p className="text-xs text-toss-text-ter truncate">
                          {asset.institution ? asset.institution : ""}
                          {asset.user_name ? ` · ${asset.user_name}` : ""}
                        </p>
                      </div>
                      <p className={`text-xs font-semibold flex-shrink-0 ml-2 ${isLiability ? "text-toss-red" : "text-toss-text-sub"}`}>
                        {isLiability ? "-" : ""}{maskedAmount(formatKRW(Math.abs(asset.amount)), isAmountVisible)}
                      </p>
                    </div>
                  ))}
                </div>
              );
            })}
      </div>
    </Card>
  );
}
