import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "white" | "sky" | "navy";
}

const TONE_CLASSES: Record<NonNullable<CardProps["tone"]>, string> = {
  white: "bg-[#FFFFFF] text-[#0F172A]",
  sky: "bg-[#38BDF8] text-[#0F172A]",
  navy: "bg-[#0B1120] text-[#FFFFFF]",
};

export function Card({
  tone = "white",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] ${TONE_CLASSES[tone]} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
