"use client";

import React from "react";
import { Eye, ShieldAlert, Cpu, BrainCircuit } from "lucide-react";

export function Hero() {
  return (
    <div className="relative overflow-hidden pt-6 pb-4 border-b border-slate-800/60 bg-gradient-to-b from-slate-900/50 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              OSHA Safety Compliance & Detection Engine
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Construction PPE Detection &amp; Reasoning
            </h2>

            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
              Detect PPE compliance and ask natural-language questions about construction-site images using RT-DETR.
            </p>
          </div>

          {/* Metric chips */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>11 Detection Classes</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>0.50 Confidence Guardrail</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <BrainCircuit className="w-4 h-4 text-cyan-400" />
              <span>Deterministic &amp; LLM Reasoning</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
