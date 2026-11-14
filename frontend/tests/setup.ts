import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

// Polyfill native <dialog> modal APIs when running in jsdom
if (typeof HTMLDialogElement !== "undefined") {
  if (!HTMLDialogElement.prototype.showModal) {
    HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.show) {
    HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (!HTMLDialogElement.prototype.close) {
    HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
      this.removeAttribute("open");
      if (returnValue !== undefined) {
        this.returnValue = returnValue;
      }
      this.dispatchEvent(new Event("close"));
    };
  }
}

// Mock IntersectionObserver for scroll-spy hook
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
}

if (typeof window !== "undefined") {
  if (!("IntersectionObserver" in window)) {
    Object.defineProperty(window, "IntersectionObserver", {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  }

  if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  if (typeof Element !== "undefined" && typeof Element.prototype.scrollIntoView !== "function") {
    Object.defineProperty(Element.prototype, "scrollIntoView", {
      writable: true,
      configurable: true,
      value: () => {},
    });
  }
}

// Mock minimal Canvas 2D context for TechGlobe3D tests in jsdom
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() => ({
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
    save: () => {},
    restore: () => {},
    scale: () => {},
    setLineDash: () => {},
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
