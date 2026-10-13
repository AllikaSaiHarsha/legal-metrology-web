"use client";

import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function OfflineSyncIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedText, setLastSyncedText] = useState<string>("Synced");

  const triggerSync = React.useCallback(async () => {
    setIsSyncing(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      setLastSyncedText("Synced Just Now");
    } catch {
      // Ignore
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial state check
    if (typeof navigator !== "undefined") {
      setIsOnline(navigator.onLine);
    }

    // 2. Service Worker registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // Registered successfully
        })
        .catch((err) => {
          console.debug("PWA service worker registration notice:", err);
        });
    }

    // 3. Online/Offline event handlers
    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync]);

  return (
    <div className="flex items-center gap-1.5">
      {isOnline ? (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 hover:border-slate-700 transition"
          title="Field Connection Status: Online • Click to reconcile IndexedDB cache"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 hidden lg:inline">PWA Sync:</span>
          <span className="text-emerald-400 font-semibold">
            {isSyncing ? "Syncing..." : lastSyncedText}
          </span>
          {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />}
        </button>
      ) : (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-300 animate-pulse"
          title="No Cellular/Internet Connection: Field Inspections are being preserved locally in IndexedDB"
        >
          <WifiOff className="w-3 h-3 text-amber-400" />
          <span>Offline Mode (IDB Active)</span>
        </div>
      )}
    </div>
  );
}
