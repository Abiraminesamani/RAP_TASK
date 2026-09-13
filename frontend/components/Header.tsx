"use client";

import React from "react";
import { ShieldCheck, HardHat, ExternalLink, Activity } from "lucide-react";
import { ApiStatus } from "./ApiStatus";
import { getApiBaseUrl } from "@/lib/api";

interface HeaderProps {
  onApiStatusChange?: (isConnected: boolean) => void;
}

export function Header({ onApiStatusChange }: HeaderProps) {
  const apiUrl = getApiBaseUrl();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 text-slate-950 font-black">
              <HardHat className="w-6 h-6 text-slate-950" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
                <ShieldCheck className="w-2.5 h-2.5 text-slate-950" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-mono">
                  PPE Safety <span className="text-amber-400">AI</span>
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  RT-DETR-L
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Construction Site Safety Intelligence
              </p>
            </div>
          </div>

          {/* Right Section: Status & Swagger link */}
          <div className="flex items-center gap-3 sm:gap-4">
            <a
              href={`${apiUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Open FastAPI Swagger Interactive Docs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Swagger API</span>
            </a>

            <ApiStatus onStatusChange={onApiStatusChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
