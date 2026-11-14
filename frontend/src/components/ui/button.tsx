import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-[#38BDF8] text-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0F172A]",
  secondary:
    "bg-[#FFFFFF] text-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0F172A]",
  dark:
    "bg-[#0F172A] text-[#FFFFFF] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#0F172A]",
  ghost:
    "bg-transparent text-[#0F172A] border-2 border-transparent hover:border-[#0F172A] hover:bg-[#38BDF8]",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-colors duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F172A] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
