"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorMessage({ message, onDismiss }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="rounded-xl bg-rose-950/50 border border-rose-500/40 p-4 text-rose-200 shadow-lg shadow-rose-950/20 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-rose-300">Request Error</h4>
            <p className="mt-0.5 text-xs text-rose-200/90 leading-relaxed break-words">{message}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            className="p-1 text-rose-400 hover:text-rose-200 hover:bg-rose-900/40 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
