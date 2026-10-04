import React, { useEffect, useState } from 'react';
import { Heart, Home, Sparkles, Users } from 'lucide-react';

const LOADING_MESSAGES = [
  'Menyiapkan ruang hangat keluarga...',
  'Menyinkronkan catatan & impian bersama...',
  'Memuat dompet, aset, dan rencana hari ini...',
  'Menghubungkan kebersamaan keluarga...',
];

const FAMILY_TIPS = [
  'Catatan pengeluaran dan pemasukan otomatis disinkronkan dengan pasangan.',
  'Gunakan Conversation Cards untuk obrolan santai dan bermakna di malam hari.',
  'Fitur Brankas Dokumen menjaga arsip penting keluarga tetap rapi dan aman.',
  'Cek Ruang Berdua untuk merayakan momen berharga dan Date Night bersama.',
];

export function FamilyLoadingScreen({
  title = 'RumahKita',
  subtitle,
}: {
  title?: string;
  subtitle?: string;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [tipIndex] = useState(() => Math.floor(Math.random() * FAMILY_TIPS.length));
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1800);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const jump = Math.floor(Math.random() * 14) + 6;
        return Math.min(prev + jump, 92);
      });
    }, 400);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen bg-gradient-to-b from-[#FAF7F2] via-[#F4EFE6] to-[#EAE2D5] flex flex-col items-center justify-between p-6 select-none relative overflow-hidden"
    >
      {/* Background Soft Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-[#D4A359]/10 blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/3 -right-20 w-80 h-80 rounded-full bg-[#2A4D3E]/10 blur-3xl pointer-events-none -z-0" />

      {/* Top Spacer / Brand Wordmark */}
      <div className="pt-4 flex items-center gap-2 opacity-85 z-10">
        <div className="w-6 h-6 rounded-lg bg-[#2A4D3E] flex items-center justify-center text-white">
          <Home className="w-3.5 h-3.5 text-[#F4D393]" />
        </div>
        <span className="text-xs font-bold tracking-tight text-[#1E2D24]">RumahKita</span>
      </div>

      {/* Centerpiece: Animated Home & Heart Emblem */}
      <div className="flex flex-col items-center text-center max-w-sm w-full my-auto z-10 space-y-6">
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Pulsing Halo */}
          <div className="absolute -inset-4 rounded-[32px] bg-[#2A4D3E]/10 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute -inset-2 rounded-[28px] border border-[#2A4D3E]/20 animate-pulse pointer-events-none" />

          {/* Main House Emblem */}
          <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-[#2A4D3E] via-[#315847] to-[#1E3A2E] text-white shadow-xl shadow-[#2A4D3E]/25 flex items-center justify-center relative transform transition-transform hover:scale-105">
            <Home className="w-10 h-10 sm:w-11 sm:h-11 text-[#FAF7F2]" />

            {/* Floating Warm Accent Badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-gradient-to-br from-[#D4A359] to-[#B88228] text-white flex items-center justify-center shadow-md animate-bounce">
              <Heart className="w-4 h-4 fill-white" />
            </div>

            {/* Sparkle top accent */}
            <div className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-white/90 text-[#2A4D3E] flex items-center justify-center shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A359]" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1E2D24]">
            {title}
          </h1>
          <p className="text-xs text-[#5C6B62] font-medium max-w-xs mx-auto leading-relaxed">
            {subtitle || 'Harmoni Keuangan & Keseharian Keluarga'}
          </p>
        </div>

        {/* Animated Progress Track */}
        <div className="w-full max-w-xs space-y-2">
          <div className="h-2 w-full bg-[#E5DDD0] rounded-full overflow-hidden relative shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#2A4D3E] via-[#D4A359] to-[#2A4D3E] rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Shimmer light bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full animate-shimmer" />
            </div>
          </div>

          {/* Dynamic Rotating Message with Smooth Transition */}
          <div className="h-6 flex items-center justify-center">
            <p
              key={msgIndex}
              className="text-xs font-semibold text-[#2A4D3E] animate-fade-in flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-[#D4A359] shrink-0" />
              <span>{LOADING_MESSAGES[msgIndex]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Helpful Family Tip Card */}
      <div className="w-full max-w-sm z-10 pb-4">
        <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-md border border-[#E8E2D5] shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#D4A359]">
            <Sparkles className="w-3 h-3" />
            <span>Kilas Hangat Rumah</span>
          </div>
          <p className="text-xs text-[#5C6B62] leading-relaxed">
            {FAMILY_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
