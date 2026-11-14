import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "sky" | "white" | "dark" | "canvas";
}

const BADGE_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  sky: "bg-[#38BDF8] text-[#0F172A]",
  white: "bg-[#FFFFFF] text-[#0F172A]",
  dark: "bg-[#0F172A] text-[#FFFFFF]",
  canvas: "bg-[#F8FAFC] text-[#0F172A]",
};

export function Badge({
  variant = "white",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border-2 border-[#0F172A] px-2.5 py-1 text-xs font-bold uppercase tracking-wide shadow-[4px_4px_0px_#0F172A] ${BADGE_CLASSES[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
