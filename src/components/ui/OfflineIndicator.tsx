import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2.5 rounded-2xl bg-[#C84B31] px-4 py-2.5 text-xs font-semibold text-white shadow-xl animate-fade-in"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Mode Offline — Anda tetap dapat menggunakan data tersimpan.</span>
    </div>
  );
}
