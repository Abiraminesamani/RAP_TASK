"use client";

import React, { useEffect, useState, useCallback } from "react";
import { checkApiHealth, HealthResponse, getApiBaseUrl } from "@/lib/api";
import { CheckCircle2, AlertCircle, RefreshCw, Server } from "lucide-react";

interface ApiStatusProps {
  onStatusChange?: (isConnected: boolean) => void;
}

export function ApiStatus({ onStatusChange }: ApiStatusProps) {
  const [status, setStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await checkApiHealth();
      setStatus("connected");
      setHealthData(data);
      onStatusChange?.(true);
    } catch {
      setStatus("offline");
      setHealthData(null);
      onStatusChange?.(false);
    } finally {
      setIsRefreshing(false);
      setLastChecked(new Date());
    }
  }, [onStatusChange]);

  useEffect(() => {
    checkHealth();
    // Re-check health every 15 seconds
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const apiUrl = getApiBaseUrl();

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${
          status === "connected"
            ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : status === "offline"
            ? "bg-rose-950/40 text-rose-300 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
            : "bg-slate-800/60 text-slate-400 border-slate-700"
        }`}
        title={`API Base: ${apiUrl}`}
      >
        <span className="relative flex h-2 w-2">
          {status === "connected" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          )}
          {status === "offline" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              status === "connected"
                ? "bg-emerald-500"
                : status === "offline"
                ? "bg-rose-500"
                : "bg-amber-400"
            }`}
          />
        </span>

        <span className="whitespace-nowrap">
          {status === "connected" && "API Connected"}
          {status === "offline" && "API Offline"}
          {status === "checking" && "Connecting..."}
        </span>

        {healthData && (
          <span className="hidden sm:inline-block text-[10px] text-emerald-400/70 border-l border-emerald-500/20 pl-2">
            {healthData.model} ({healthData.device.toUpperCase()})
          </span>
        )}
      </div>

      <button
        onClick={checkHealth}
        disabled={isRefreshing}
        aria-label="Refresh API connection"
        title={`Refresh connection to ${apiUrl}`}
        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 active:scale-95 rounded-lg border border-slate-700/60 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
      </button>
    </div>
  );
}
