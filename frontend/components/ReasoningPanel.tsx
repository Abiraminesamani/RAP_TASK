"use client";

import React, { useState } from "react";
import { ReasonResponse } from "@/lib/api";
import { EvidenceList } from "./EvidenceList";
import {
  BrainCircuit,
  Send,
  HelpCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Ban,
} from "lucide-react";

interface ReasoningPanelProps {
  onAskQuestion: (question: string) => void;
  isLoading: boolean;
  reasonResult: ReasonResponse | null;
  hasImage: boolean;
}

const EXAMPLE_QUESTIONS = [
  "How many helmets are there?",
  "Are there any goggles?",
  "Is anyone without a helmet?",
  "How many people are there?",
  "What is the most common object?",
  "What is the weather today?",
];

export function ReasoningPanel({
  onAskQuestion,
  isLoading,
  reasonResult,
  hasImage,
}: ReasoningPanelProps) {
  const [questionInput, setQuestionInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || !hasImage || isLoading) return;
    onAskQuestion(questionInput.trim());
  };

  const handleChipClick = (q: string) => {
    setQuestionInput(q);
    if (hasImage && !isLoading) {
      onAskQuestion(q);
    }
  };

  const isInsufficientInfo =
    reasonResult?.answer?.toLowerCase().includes("insufficient information") ||
    false;

  const isUnsupported =
    reasonResult?.intent?.toLowerCase() === "unsupported" || false;

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl shadow-black/40 backdrop-blur-md flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-amber-400" />
          Ask About This Image
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          Reasoning Engine
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Ask a question about the detected PPE
      </p>

      {/* Suggested Quick Questions */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          Example Questions:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_QUESTIONS.map((example, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleChipClick(example)}
              disabled={!hasImage || isLoading}
              className="px-2.5 py-1 text-xs bg-slate-950/70 hover:bg-slate-800 text-slate-300 hover:text-amber-300 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Question Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            disabled={!hasImage || isLoading}
            placeholder={
              hasImage
                ? "e.g., How many helmets are there? or Is anyone without a helmet?"
                : "Upload an image first to ask questions..."
            }
            className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 disabled:opacity-40"
          />
        </div>
        <button
          type="submit"
          disabled={!hasImage || !questionInput.trim() || isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Ask Question</span>
        </button>
      </form>

      {/* Result Display */}
      {isLoading && (
        <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-7 h-7 text-amber-400 animate-spin mb-2" />
          <p className="text-sm font-semibold text-slate-200">
            Analyzing Detector Evidence...
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluating confidence threshold (0.50) &amp; handwritten reasoning rules
          </p>
        </div>
      )}

      {!isLoading && reasonResult && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Question & Intent banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Question
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Intent:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase tracking-wider ${
                    isUnsupported
                      ? "bg-rose-950/60 text-rose-300 border border-rose-500/30"
                      : "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                  }`}
                >
                  {reasonResult.intent}
                </span>
                <span className="text-[11px] text-slate-400">Source:</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {reasonResult.reasoning_source}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium text-white italic">
              &ldquo;{reasonResult.question}&rdquo;
            </p>
          </div>

          {/* Answer section */}
          {isUnsupported ? (
            /* Unsupported question alert */
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200">
              <div className="flex items-start gap-3">
                <Ban className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-300">
                    Unsupported Question
                  </h4>
                  <p className="text-xs text-amber-100/90 mt-1 font-medium">
                    This question cannot be answered from the PPE detector.
                  </p>
                  <p className="text-[11px] text-amber-300/80 mt-1.5 leading-relaxed">
                    The handwritten router rejected this question because it does
                    not inquire about PPE objects (helmet, vest, gloves, boots,
                    goggles, worker counting, or presence).
                  </p>
                </div>
              </div>
            </div>
          ) : isInsufficientInfo ? (
            /* Insufficient Information Guardrail Banner */
            <div className="p-4 rounded-xl bg-amber-950/50 border-2 border-amber-500/60 text-amber-100 shadow-lg shadow-amber-950/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Safety Guardrail: Insufficient Information
                    </h4>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                      Refusal to Guess
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {reasonResult.answer}
                  </p>
                  <p className="text-xs text-amber-200/80 leading-relaxed pt-1 border-t border-amber-500/30">
                    <strong>Guardrail rationale:</strong> The system strictly
                    avoids treating the absence of a detection as proof of absence.
                    Safety compliance requires explicit evidence rather than
                    assumptions.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Confident Positive/Answer Banner */
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Reasoning Answer
                  </h4>
                  <p className="text-base font-semibold text-white">
                    {reasonResult.answer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Evidence component */}
          <EvidenceList evidence={reasonResult.detections_used} />
        </div>
      )}
    </div>
  );
}
