"use client";

import React, { useState } from "react";
import { Detection } from "@/lib/api";
import { ShieldCheck, ShieldAlert, User, Box, Search } from "lucide-react";

interface DetectionTableProps {
  detections: Detection[];
  onHighlightDetection?: (detection: Detection | null) => void;
}

export function DetectionTable({
  detections,
  onHighlightDetection,
}: DetectionTableProps) {
  const [filterClass, setFilterClass] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const classesPresent = Array.from(new Set(detections.map((d) => d.class)));

  const filteredDetections = detections.filter((d) => {
    const matchesClass = filterClass === "all" || d.class === filterClass;
    const matchesSearch =
      searchQuery === "" ||
      d.class.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const getConfidenceBadge = (confidence: number) => {
    const percent = (confidence * 100).toFixed(1);
    if (confidence >= 0.75) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          {percent}%
          <span className="text-[10px] text-emerald-400/70 font-normal">High</span>
        </span>
      );
    } else if (confidence >= 0.5) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          {percent}%
          <span className="text-[10px] text-amber-400/70 font-normal">Medium</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          {percent}%
          <span className="text-[10px] text-slate-500 font-normal">Low</span>
        </span>
      );
    }
  };

  const getClassBadge = (className: string) => {
    const lower = className.toLowerCase();
    if (lower.startsWith("no_")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-500/30">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          {className}
        </span>
      );
    }
    if (lower === "person") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-500/30">
          <User className="w-3.5 h-3.5 text-amber-400" />
          {className}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
        {className}
      </span>
    );
  };

  if (detections.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl shadow-black/40 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Box className="w-5 h-5 text-amber-400" />
            Detection Results Table
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real confidence scores &amp; bounding box coordinates from RT-DETR
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {classesPresent.length > 1 && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Classes ({detections.length})</option>
              {classesPresent.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({detections.filter((d) => d.class === cls).length})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Class</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Bounding Box [x1, y1, x2, y2]</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredDetections.map((det, index) => (
              <tr
                key={`${det.class}-${index}`}
                onMouseEnter={() => onHighlightDetection?.(det)}
                onMouseLeave={() => onHighlightDetection?.(null)}
                className="hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                <td className="py-3 px-4 font-sans">{getClassBadge(det.class)}</td>
                <td className="py-3 px-4">{getConfidenceBadge(det.confidence)}</td>
                <td className="py-3 px-4 text-slate-400 text-[11px]">
                  [{det.bbox.map((v) => v.toFixed(1)).join(", ")}]
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
