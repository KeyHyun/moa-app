import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-toss-text-sub">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            "w-full px-4 py-3.5 rounded-input border text-toss-text text-base",
            "placeholder:text-toss-text-ter outline-none transition-all",
            "focus:border-toss-blue focus:ring-2 focus:ring-toss-blue-light",
            error
              ? "border-toss-red bg-red-50"
              : "border-toss-border bg-white",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-toss-red font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
