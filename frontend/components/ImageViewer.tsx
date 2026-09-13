"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Detection } from "@/lib/api";
import { Layers, Eye, EyeOff, Maximize2, Tag } from "lucide-react";

interface ImageViewerProps {
  imageUrl: string | null;
  detections: Detection[];
  originalWidth: number;
  originalHeight: number;
  highlightedDetection?: Detection | null;
}

// Color palette mapped by class
const CLASS_COLORS: Record<string, { stroke: string; fill: string; text: string; bg: string }> = {
  // Compliant PPE
  helmet: { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.15)", text: "#ffffff", bg: "#047857" },
  vest: { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.15)", text: "#ffffff", bg: "#0e7490" },
  gloves: { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.15)", text: "#ffffff", bg: "#1d4ed8" },
  boots: { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.15)", text: "#ffffff", bg: "#6d28d9" },
  goggles: { stroke: "#14b8a6", fill: "rgba(20, 184, 166, 0.15)", text: "#ffffff", bg: "#0f766e" },

  // Person
  Person: { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.12)", text: "#ffffff", bg: "#b45309" },

  // Non-compliance violations
  no_helmet: { stroke: "#ef4444", fill: "rgba(239, 68, 68, 0.20)", text: "#ffffff", bg: "#b91c1c" },
  no_goggle: { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.20)", text: "#ffffff", bg: "#be123c" },
  no_gloves: { stroke: "#e11d48", fill: "rgba(225, 29, 72, 0.20)", text: "#ffffff", bg: "#9f1239" },
  no_boots: { stroke: "#dc2626", fill: "rgba(220, 38, 38, 0.20)", text: "#ffffff", bg: "#991b1b" },

  // Default / Neutral
  none: { stroke: "#94a3b8", fill: "rgba(148, 163, 184, 0.12)", text: "#ffffff", bg: "#475569" },
};

function getColorForClass(className: string) {
  return (
    CLASS_COLORS[className] || {
      stroke: "#f59e0b",
      fill: "rgba(245, 158, 11, 0.15)",
      text: "#ffffff",
      bg: "#b45309",
    }
  );
}

export function ImageViewer({
  imageUrl,
  detections,
  originalWidth,
  originalHeight,
  highlightedDetection,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showBoxes, setShowBoxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Redraw canvas boxes
  const drawBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const displayedWidth = img.clientWidth;
    const displayedHeight = img.clientHeight;

    // Set canvas internal resolution to match displayed size
    canvas.width = displayedWidth;
    canvas.height = displayedHeight;

    ctx.clearRect(0, 0, displayedWidth, displayedHeight);

    if (!showBoxes || detections.length === 0) return;

    // Calculate scale factor relative to original dimensions
    const scaleX = originalWidth > 0 ? displayedWidth / originalWidth : displayedWidth / img.naturalWidth;
    const scaleY = originalHeight > 0 ? displayedHeight / originalHeight : displayedHeight / img.naturalHeight;

    detections.forEach((det) => {
      const [x1, y1, x2, y2] = det.bbox;
      const isHighlighted =
        highlightedDetection &&
        highlightedDetection.class === det.class &&
        Math.abs(highlightedDetection.confidence - det.confidence) < 0.001;

      const sx = Math.max(0, x1 * scaleX);
      const sy = Math.max(0, y1 * scaleY);
      const sw = Math.min(displayedWidth - sx, (x2 - x1) * scaleX);
      const sh = Math.min(displayedHeight - sy, (y2 - y1) * scaleY);

      const color = getColorForClass(det.class);

      // Bounding box rectangle
      ctx.save();
      ctx.strokeStyle = isHighlighted ? "#ffffff" : color.stroke;
      ctx.lineWidth = isHighlighted ? 3 : 2;
      ctx.fillStyle = isHighlighted ? "rgba(255, 255, 255, 0.25)" : color.fill;

      ctx.fillRect(sx, sy, sw, sh);
      ctx.strokeRect(sx, sy, sw, sh);

      // Label badge
      if (showLabels) {
        const confPercent = Math.round(det.confidence * 100);
        const labelText = `${det.class} ${confPercent}%`;

        ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const badgeHeight = 18;
        const badgeWidth = textWidth + 12;

        let badgeY = sy - badgeHeight;
        if (badgeY < 0) {
          badgeY = sy; // place inside if top is cut off
        }

        // Badge background
        ctx.fillStyle = isHighlighted ? "#000000" : color.bg;
        ctx.beginPath();
        ctx.roundRect(sx, badgeY, badgeWidth, badgeHeight, 3);
        ctx.fill();

        // Badge border
        ctx.strokeStyle = isHighlighted ? "#ffffff" : color.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(labelText, sx + 6, badgeY + 13);
      }
      ctx.restore();
    });
  }, [
    detections,
    originalWidth,
    originalHeight,
    showBoxes,
    showLabels,
    imageLoaded,
    highlightedDetection,
  ]);

  // Handle window/container resize
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current) {
        setDimensions({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    drawBoxes();
  }, [drawBoxes, dimensions]);

  if (!imageUrl) {
    return (
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-8 flex flex-col items-center justify-center min-h-[360px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500 mb-3">
          <Layers className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-slate-300">No Image Uploaded</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Upload a construction-site image and run detection to visualize RT-DETR bounding boxes and compliance predictions.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 shadow-xl shadow-black/40 backdrop-blur-md flex flex-col">
      {/* Viewer Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Detection Visualizer
          </h3>
          {detections.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {detections.length} objects
            </span>
          )}
        </div>

        {/* Visibility Toggles */}
        {detections.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                showBoxes
                  ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                  : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showBoxes ? "Hide Boxes" : "Show Boxes"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              disabled={!showBoxes}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 ${
                showLabels && showBoxes
                  ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30"
                  : "bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Labels</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Image with Canvas Overlay */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center rounded-xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[300px] max-h-[580px]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={imageUrl}
          alt="Detection output visualization"
          onLoad={() => {
            setImageLoaded(true);
            if (imageRef.current) {
              setDimensions({
                width: imageRef.current.clientWidth,
                height: imageRef.current.clientHeight,
              });
            }
          }}
          className="max-h-[580px] w-auto max-w-full object-contain select-none block"
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none w-full h-full"
        />
      </div>

      {/* Class legend footer */}
      {detections.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              PPE (Compliant)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
              Person
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
              Violation (no_*)
            </span>
          </div>
          {originalWidth > 0 && (
            <span className="text-slate-500 font-mono text-[10px]">
              {originalWidth} × {originalHeight} px
            </span>
          )}
        </div>
      )}
    </div>
  );
}
