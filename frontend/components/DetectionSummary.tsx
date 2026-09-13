"use client";

import React from "react";
import { Detection } from "@/lib/api";
import { ShieldCheck, Users, AlertOctagon, Target } from "lucide-react";

interface DetectionSummaryProps {
  detections: Detection[];
  count: number;
}

export function DetectionSummary({ detections, count }: DetectionSummaryProps) {
  const peopleCount = detections.filter(
    (d) => d.class.toLowerCase() === "person"
  ).length;

  const ppeCompliantClasses = ["helmet", "gloves", "vest", "boots", "goggles"];
  const ppeCount = detections.filter((d) =>
    ppeCompliantClasses.includes(d.class.toLowerCase())
  ).length;

  const violationClasses = ["no_helmet", "no_goggle", "no_gloves", "no_boots"];
  const violationCount = detections.filter((d) =>
    violationClasses.includes(d.class.toLowerCase())
  ).length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Detections */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg shadow-black/30 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Detections
          </p>
          <p className="text-2xl font-bold text-white mt-1 font-mono">
            {count}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Objects localized</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Target className="w-5 h-5" />
        </div>
      </div>

      {/* People */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg shadow-black/30 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            People
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            {peopleCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Workers identified</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* PPE Detected */}
      <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 shadow-lg shadow-black/30 backdrop-blur-sm flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            PPE Detected
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {ppeCount}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Compliant gear</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* Non-compliance */}
      <div
        className={`rounded-xl border p-4 shadow-lg shadow-black/30 backdrop-blur-sm flex items-center justify-between transition-colors ${
          violationCount > 0
            ? "bg-rose-950/40 border-rose-500/40"
            : "bg-slate-900/90 border-slate-800"
        }`}
      >
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Non-Compliance
          </p>
          <p
            className={`text-2xl font-bold mt-1 font-mono ${
              violationCount > 0 ? "text-rose-400" : "text-slate-300"
            }`}
          >
            {violationCount}
          </p>
          <p
            className={`text-[11px] mt-0.5 ${
              violationCount > 0 ? "text-rose-300/80 font-medium" : "text-slate-500"
            }`}
          >
            {violationCount > 0 ? "Violation detected!" : "Zero explicit violations"}
          </p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            violationCount > 0
              ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
              : "bg-slate-800/80 border-slate-700/60 text-slate-400"
          }`}
        >
          <AlertOctagon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
