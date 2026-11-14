"use client";

import * as React from "react";
import { X } from "lucide-react";

export interface NeoDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  subtitle?: string;
  layout?: "modal" | "drawer";
  children: React.ReactNode;
}

export function NeoDialog({
  open,
  onClose,
  titleId,
  title,
  subtitle,
  layout = "modal",
  children,
}: NeoDialogProps) {
  const dialogRef = React.useRef<HTMLDialogElement | null>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = "";
      onClose();
    };

    dialog.addEventListener("close", handleClose);

    // Fallback light-dismiss when HTMLDialogElement.prototype.closedBy is unsupported
    const supportsClosedBy =
      typeof HTMLDialogElement !== "undefined" && "closedBy" in HTMLDialogElement.prototype;

    const handleFallbackClick = (event: MouseEvent) => {
      if (supportsClosedBy || event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        dialog.close();
      }
    };

    dialog.addEventListener("click", handleFallbackClick);

    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("click", handleFallbackClick);
    };
  }, [onClose]);

  const positionClasses =
    layout === "drawer"
      ? "m-0 ml-auto h-dvh max-h-dvh w-full max-w-xl"
      : "m-auto w-[min(92vw,48rem)] max-h-[88dvh]";

  const closedByProps: Record<string, string> = { closedby: "any" };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      {...closedByProps}
      className={`${positionClasses} bg-[#FFFFFF] text-[#0F172A] border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] p-0 overflow-hidden open:flex open:flex-col`}
    >
      <div className="flex items-start justify-between gap-4 border-b-2 border-[#0F172A] bg-[#38BDF8] px-5 py-4">
        <div>
          <h2 id={titleId} className="text-lg sm:text-xl font-extrabold tracking-tight text-[#0F172A]">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs sm:text-sm font-semibold text-[#0F172A]">{subtitle}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close dialog"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#0F172A] bg-[#FFFFFF] text-[#0F172A] shadow-[4px_4px_0px_#0F172A] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-[#FFFFFF] p-5 sm:p-6">{children}</div>
    </dialog>
  );
}
