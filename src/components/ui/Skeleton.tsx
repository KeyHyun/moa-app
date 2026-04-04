import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  rounded?: "sm" | "md" | "lg" | "full";
}

export function Skeleton({ className, rounded = "md" }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "animate-pulse bg-toss-border",
        {
          "rounded-sm": rounded === "sm",
          "rounded-lg": rounded === "md",
          "rounded-card": rounded === "lg",
          "rounded-full": rounded === "full",
        },
        className
      )}
    />
  );
}
