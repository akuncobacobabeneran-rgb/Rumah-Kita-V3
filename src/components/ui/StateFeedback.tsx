import React from 'react';
import { AlertCircle, Plus, RefreshCw } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8 px-4 rounded-2xl bg-[#FAF7F2] border border-dashed border-[#DFD7C8]">
      <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] flex items-center justify-center text-[#2A4D3E] mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-[#1E2D24]">{title}</h4>
      <p className="text-xs text-[#5C6B62] mt-1 max-w-xs leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  message = 'Data belum dapat dimuat.',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl bg-white border border-[#E8E2D5]">
      <div className="w-12 h-12 rounded-2xl bg-[#FDECEC] flex items-center justify-center text-[#C84B31] mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-[#1E2D24]">{message}</h4>
      <p className="text-xs text-[#5C6B62] mt-1 max-w-xs">
        Periksa koneksi Anda atau muat ulang data keluarga.
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba lagi</span>
        </button>
      )}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-5 py-1" aria-label="Memuat data keluarga">
      {/* Top Hero / Banner Loader Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2A4D3E]/90 via-[#315847]/85 to-[#1E3A2E]/90 p-5 sm:p-6 text-white shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2.5 min-w-0 flex-1">
            <div className="h-4 w-28 sm:w-36 rounded-full bg-white/20 animate-pulse" />
            <div className="h-6 sm:h-7 w-48 sm:w-72 rounded-xl bg-white/30 animate-pulse" />
            <div className="h-3.5 w-40 sm:w-56 rounded-full bg-white/15 animate-pulse" />
          </div>
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 animate-pulse shrink-0 hidden sm:flex items-center justify-center" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
      </div>

      {/* Feature Shortcuts Skeleton */}
      <div className="rounded-3xl bg-white border border-[#E8E2D5] p-5 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded-md bg-[#EDE6DA] animate-pulse" />
            <div className="h-3 w-44 rounded-md bg-[#EDE6DA]/70 animate-pulse" />
          </div>
          <div className="h-7 w-20 rounded-xl bg-[#EDE6DA] animate-pulse" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl bg-[#EDE6DA] animate-pulse" />
              <div className="h-2.5 w-10 rounded bg-[#EDE6DA]/70 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Cards Skeleton (Financial & Agenda) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-[#E8E2D5] p-5 space-y-3 relative overflow-hidden">
          <div className="h-4 w-32 rounded-md bg-[#EDE6DA] animate-pulse" />
          <div className="h-7 w-44 rounded-xl bg-[#EDE6DA] animate-pulse" />
          <div className="h-3 w-48 rounded-md bg-[#EDE6DA]/60 animate-pulse" />
        </div>
        <div className="rounded-3xl bg-white border border-[#E8E2D5] p-5 space-y-3 relative overflow-hidden">
          <div className="h-4 w-36 rounded-md bg-[#EDE6DA] animate-pulse" />
          <div className="h-7 w-40 rounded-xl bg-[#EDE6DA] animate-pulse" />
          <div className="h-3 w-44 rounded-md bg-[#EDE6DA]/60 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

