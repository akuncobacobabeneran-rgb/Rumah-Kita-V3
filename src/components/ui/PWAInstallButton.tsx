import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { ResponsiveModal } from './ResponsiveModal';

interface PWAInstallButtonProps {
  variant?: 'header' | 'button' | 'card';
  className?: string;
}

export function PWAInstallButton({
  variant = 'button',
  className = '',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running in standalone PWA mode, don't show the prompt
  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="p-4 rounded-2xl bg-[#E8F2EC] border border-[#2A4D3E]/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2A4D3E] text-white flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#2A4D3E]">Aplikasi Terpasang</h4>
            <p className="text-[11px] text-[#5C6B62] mt-0.5">
              RumahKita sudah berjalan sebagai aplikasi terinstal di perangkat ini.
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback instruction for browsers without direct prompt
      setShowIOSGuide(true);
    }
  };

  // Header compact pill button
  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={handleInstallClick}
          aria-label="Instal aplikasi RumahKita"
          className={`min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-all flex items-center gap-1.5 shadow-xs ${className}`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Instal App</span>
        </button>

        <IOSInstallModal isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </>
    );
  }

  // Card banner variant (for More / Settings page)
  if (variant === 'card') {
    return (
      <>
        <div className={`p-4 rounded-2xl bg-[#F4EFE6] border border-[#E5DEC9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2A4D3E] text-white flex items-center justify-center shrink-0 mt-0.5">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1E2D24]">Pasang Aplikasi di Layar Utama HP</h4>
              <p className="text-[11px] text-[#5C6B62] mt-0.5 leading-relaxed">
                Akses cepat seperti aplikasi Android & iPhone, tanpa perlu membuka browser secara manual.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstallClick}
            disabled={isInstalling}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isInstalling ? 'Memasang...' : 'Pasang Sekarang'}</span>
          </button>
        </div>

        <IOSInstallModal isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`min-h-[42px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors flex items-center justify-center gap-2 shadow-xs ${className}`}
      >
        <Download className="w-4 h-4" />
        <span>{isInstalling ? 'Memasang...' : 'Instal Aplikasi RumahKita'}</span>
      </button>

      <IOSInstallModal isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}

function IOSInstallModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pasang di Layar Utama Ponsel"
      subtitle="Panduan instalasi untuk iPhone / iPad atau browser ponsel"
    >
      <div className="p-5 space-y-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] space-y-3 text-xs leading-relaxed text-[#1E2D24]">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2A4D3E] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <p className="font-semibold text-[#1E2D24]">Buka menu Bagikan (Share)</p>
              <p className="text-[#5C6B62] mt-0.5">
                Di Safari, ketuk tombol <strong>Share</strong> (ikon kotak berpanah ke atas) di bagian bawah layar. Di Chrome, ketuk titik tiga di pojok kanan atas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2A4D3E] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <p className="font-semibold text-[#1E2D24]">Pilih "Tambah ke Layar Utama"</p>
              <p className="text-[#5C6B62] mt-0.5">
                Gulir ke bawah dan ketuk opsi <strong>"Add to Home Screen"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#2A4D3E] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <p className="font-semibold text-[#1E2D24]">Selesai & Buka RumahKita</p>
              <p className="text-[#5C6B62] mt-0.5">
                Ketuk <strong>Add / Tambah</strong> di pojok kanan atas. Ikon RumahKita akan muncul di layar utama HP Anda layaknya aplikasi native.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors"
        >
          Mengerti, Saya Siap Memasang
        </button>
      </div>
    </ResponsiveModal>
  );
}
