"use client";

import * as React from "react";
import { Compass, RotateCcw, X } from "lucide-react";
import type { SkillNode } from "@/data/resume";
import {
  generateFibonacciSpherePoints,
  projectPoint,
  rotatePoint3D,
  type Point3D,
} from "@/lib/globe-math";

export interface TechGlobe3DProps {
  nodes: SkillNode[];
  selectedSkillId: string | null;
  onSelectSkill: (skillId: string | null) => void;
}

interface PositionedNode {
  node: SkillNode;
  screenX: number;
  screenY: number;
  z: number;
  scale: number;
  opacity: number;
}

const DEFAULT_ROTATION = { x: 0.25, y: 0.5 };
const STAGE_WIDTH = 640;
const STAGE_HEIGHT = 400;

export function TechGlobe3D({
  nodes,
  selectedSkillId,
  onSelectSkill,
}: TechGlobe3DProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [rotation, setRotation] = React.useState(DEFAULT_ROTATION);
  const [hoveredId, setHoveredId] = React.useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [canvasSupported, setCanvasSupported] = React.useState(true);
  const [stageSize, setStageSize] = React.useState({ width: STAGE_WIDTH, height: STAGE_HEIGHT });

  const dragStateRef = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    movedDistance: number;
  }>({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    movedDistance: 0,
  });

  const basePoints = React.useMemo<Point3D[]>(
    () => generateFibonacciSpherePoints(nodes.length),
    [nodes.length],
  );

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!media) return;
    setPrefersReducedMotion(media.matches);
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (prefersReducedMotion || selectedSkillId !== null) return;

    let rafId = 0;
    const tick = () => {
      if (!dragStateRef.current.active) {
        setRotation((prev) => ({
          x: prev.x,
          y: prev.y + 0.0045,
        }));
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, selectedSkillId]);

  const radius = Math.min(stageSize.width, stageSize.height) * 0.34;
  const centerX = stageSize.width / 2;
  const centerY = stageSize.height / 2;

  const positionedNodes = React.useMemo<PositionedNode[]>(() => {
    return nodes
      .map((node, index) => {
        const rotated = rotatePoint3D(basePoints[index], rotation.x, rotation.y);
        const projected = projectPoint(rotated, radius, centerX, centerY);
        return {
          node,
          ...projected,
        };
      })
      .sort((a, b) => a.z - b.z);
  }, [nodes, basePoints, rotation.x, rotation.y, radius, centerX, centerY]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCanvasSupported(false);
      return;
    }
    setCanvasSupported(true);

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    canvas.width = Math.max(1, Math.floor(stageSize.width * dpr));
    canvas.height = Math.max(1, Math.floor(stageSize.height * dpr));
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, stageSize.width, stageSize.height);

    // Outer equator halo
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.38)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latitude wireframe rings
    const latitudes = [-0.66, -0.33, 0, 0.33, 0.66];
    for (const lat of latitudes) {
      const ringRadius = Math.sqrt(Math.max(0, 1 - lat * lat));
      ctx.beginPath();
      const steps = 42;
      for (let i = 0; i <= steps; i += 1) {
        const angle = (i / steps) * Math.PI * 2;
        const pt = rotatePoint3D(
          {
            x: Math.cos(angle) * ringRadius,
            y: lat,
            z: Math.sin(angle) * ringRadius,
          },
          rotation.x,
          rotation.y,
        );
        const proj = projectPoint(pt, radius, centerX, centerY);
        if (i === 0) ctx.moveTo(proj.screenX, proj.screenY);
        else ctx.lineTo(proj.screenX, proj.screenY);
      }
      ctx.strokeStyle = lat === 0 ? "rgba(56, 189, 248, 0.55)" : "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = lat === 0 ? 1.4 : 1;
      ctx.stroke();
    }

    // Longitude meridians
    for (let m = 0; m < 6; m += 1) {
      const lon = (m / 6) * Math.PI;
      ctx.beginPath();
      const steps = 42;
      for (let i = 0; i <= steps; i += 1) {
        const phi = (i / steps) * Math.PI * 2;
        const pt = rotatePoint3D(
          {
            x: Math.cos(phi) * Math.cos(lon),
            y: Math.sin(phi),
            z: Math.cos(phi) * Math.sin(lon),
          },
          rotation.x,
          rotation.y,
        );
        const proj = projectPoint(pt, radius, centerX, centerY);
        if (i === 0) ctx.moveTo(proj.screenX, proj.screenY);
        else ctx.lineTo(proj.screenX, proj.screenY);
      }
      ctx.strokeStyle = "rgba(56, 189, 248, 0.24)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Spokes from sphere center to highlighted/selected nodes
    for (const item of positionedNodes) {
      if (item.node.id === selectedSkillId || item.node.id === hoveredId) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(item.screenX, item.screenY);
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [stageSize, rotation.x, rotation.y, radius, centerX, centerY, positionedNodes, selectedSkillId, hoveredId]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) {
      return;
    }
    dragStateRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      movedDistance: 0,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.active) return;
    const dx = event.clientX - dragStateRef.current.lastX;
    const dy = event.clientY - dragStateRef.current.lastY;
    dragStateRef.current.lastX = event.clientX;
    dragStateRef.current.lastY = event.clientY;
    dragStateRef.current.movedDistance += Math.hypot(dx, dy);

    setRotation((prev) => ({
      x: Math.max(-1.2, Math.min(1.2, prev.x + dy * 0.008)),
      y: prev.y + dx * 0.008,
    }));
  };

  const handlePointerUp = () => {
    dragStateRef.current.active = false;
  };

  const selectedNode = React.useMemo(
    () => nodes.find((item) => item.id === selectedSkillId) ?? null,
    [nodes, selectedSkillId],
  );

  return (
    <div
      data-testid="tech-globe-container"
      className="border-2 border-[#0F172A] bg-[#0B1120] text-[#FFFFFF] shadow-[4px_4px_0px_#0F172A]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#0F172A] bg-[#0F172A] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-[#FFFFFF]">
            Interactive 3D Tech Globe · {nodes.length} Resume Skills
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRotation(DEFAULT_ROTATION);
              onSelectSkill(null);
            }}
            className="inline-flex items-center gap-1.5 border-2 border-[#38BDF8] bg-[#0B1120] px-2.5 py-1 text-xs font-bold text-[#38BDF8] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {canvasSupported ? (
        <div
          ref={containerRef}
          role="region"
          aria-label="Interactive 3D Tech Globe Canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative h-[380px] sm:h-[420px] w-full select-none overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          />

          <div className="absolute inset-0">
            {positionedNodes.map(({ node, screenX, screenY, z, scale, opacity }, idx) => {
              const isSelected = selectedSkillId === node.id;
              const isHovered = hoveredId === node.id;

              return (
                <button
                  key={node.id}
                  type="button"
                  data-testid={`globe-node-${node.id}`}
                  aria-pressed={isSelected}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === node.id ? null : prev))}
                  onClick={() => onSelectSkill(isSelected ? null : node.id)}
                  style={{
                    transform: `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%) scale(${
                      isSelected ? 1.12 : isHovered ? 1.08 : scale
                    })`,
                    opacity: isSelected || isHovered ? 1 : opacity,
                    zIndex: isSelected ? 50 : Math.round((z + 1) * 20) + idx,
                  }}
                  className={`absolute left-0 top-0 whitespace-nowrap border-2 px-2.5 py-1 text-xs font-extrabold transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8] ${
                    isSelected
                      ? "border-[#FFFFFF] bg-[#38BDF8] text-[#0F172A] shadow-[4px_4px_0px_#0F172A]"
                      : isHovered
                        ? "border-[#38BDF8] bg-[#0284C7] text-[#FFFFFF]"
                        : "border-[#38BDF8] bg-[#0B1120] text-[#FFFFFF] hover:bg-[#0284C7]"
                  }`}
                >
                  {node.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          data-testid="globe-2d-fallback"
          className="flex flex-wrap gap-2 p-6"
          aria-label="2D Fallback Skill Nodes"
        >
          {nodes.map((node) => {
            const isSelected = selectedSkillId === node.id;
            return (
              <button
                key={node.id}
                type="button"
                data-testid={`globe-node-${node.id}`}
                aria-pressed={isSelected}
                onClick={() => onSelectSkill(isSelected ? null : node.id)}
                className={`border-2 px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                  isSelected
                    ? "border-[#FFFFFF] bg-[#38BDF8] text-[#0F172A]"
                    : "border-[#38BDF8] bg-[#0B1120] text-[#FFFFFF] hover:bg-[#0284C7]"
                }`}
              >
                {node.label}
              </button>
            );
          })}
        </div>
      )}

      <div
        aria-live="polite"
        data-testid="globe-selected-summary"
        className="border-t-2 border-[#38BDF8] bg-[#0F172A] px-4 py-4 sm:px-6"
      >
        {selectedNode ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-[#0F172A] bg-[#38BDF8] px-2.5 py-0.5 text-xs font-black text-[#0F172A]">
                  {selectedNode.label}
                </span>
                <span className="border border-[#38BDF8] px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-[#38BDF8]">
                  {selectedNode.category}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#F8FAFC]">
                {selectedNode.resumeUsageSummary}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectSkill(null)}
              className="inline-flex shrink-0 items-center gap-1.5 border-2 border-[#38BDF8] bg-[#0B1120] px-3 py-1.5 text-xs font-bold text-[#FFFFFF] hover:bg-[#0284C7] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear Selection</span>
            </button>
          </div>
        ) : (
          <p className="font-mono text-xs sm:text-sm text-[#38BDF8]">
            {prefersReducedMotion
              ? "Reduced motion enabled — auto-rotation paused. Drag or click any of the 22 skill nodes to inspect resume usage."
              : "Drag across the sphere to rotate, hover to highlight, or click any of the 22 skill nodes to inspect resume usage."}
          </p>
        )}
      </div>
    </div>
  );
}
