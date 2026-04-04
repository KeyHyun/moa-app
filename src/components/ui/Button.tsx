import { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "font-semibold rounded-pill transition-all duration-150 active:scale-95",
        {
          "bg-toss-blue text-white hover:bg-toss-blue-dark":
            variant === "primary" && !disabled,
          "bg-toss-blue-light text-toss-blue hover:bg-blue-100":
            variant === "secondary",
          "bg-transparent text-toss-blue hover:bg-toss-blue-light":
            variant === "ghost",
          "bg-toss-red text-white hover:bg-red-600": variant === "danger",
          "bg-toss-border text-toss-text-ter cursor-not-allowed":
            disabled,
          "text-sm px-4 py-2": size === "sm",
          "text-base px-6 py-3.5": size === "md",
          "text-lg px-6 py-4": size === "lg",
          "w-full": fullWidth,
        },
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
