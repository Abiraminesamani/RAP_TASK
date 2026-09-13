"use client";

import React from "react";
import { Detection } from "@/lib/api";
import { CheckCircle2, Shield } from "lucide-react";

interface EvidenceListProps {
  evidence: Detection[];
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (!evidence || evidence.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs text-slate-500 italic">
        No specific detector evidence was cited for this reasoning output.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          Detector Evidence Used ({evidence.length})
        </h5>
        <span className="text-[10px] text-slate-500">Filtered &ge; 0.50 conf</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {evidence.map((item, idx) => (
          <div
            key={`evidence-${idx}`}
            className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span className="font-semibold text-slate-200">{item.class}</span>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-emerald-400 font-medium">
                {(item.confidence * 100).toFixed(1)}%
              </span>
              <span className="text-slate-500 text-[10px] hidden sm:inline">
                [{item.bbox.map((n) => Math.round(n)).join(",")}]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
