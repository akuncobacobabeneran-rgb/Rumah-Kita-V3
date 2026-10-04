import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';

export function TopBanner() {
  const isDismissed = useFamilyStore((s) => s.isTopBannerDismissed);
  const dismissTopBanner = useFamilyStore((s) => s.dismissTopBanner);
  const family = useFamilyStore((s) => s.family);

  if (isDismissed) return null;

  return (
    <div className="bg-[#2A4D3E] text-[#FAF7F2] px-4 py-2 text-xs border-b border-[#1E3A2E]">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-[#D4A359] shrink-0" />
          <p className="truncate">
            Kode Keluarga Anda:{' '}
            <span className="font-mono-num font-semibold text-[#F4D393]">
              {family?.invite_code || 'RK-HOME'}
            </span>{' '}
            · Bagikan kode ini untuk mengundang pasangan ke ruang keluarga.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissTopBanner}
          aria-label="Tutup banner informasi"
          className="p-1 rounded-lg hover:bg-white/10 text-[#FAF7F2]/80 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
