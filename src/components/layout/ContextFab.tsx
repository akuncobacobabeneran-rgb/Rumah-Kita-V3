import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CalendarPlus,
  CheckSquare,
  Coins,
  Heart,
  MessageCircleHeart,
  Plus,
  Receipt,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react';
import { QuickSheetType, useFamilyStore } from '../../stores/useFamilyStore';

interface FabOption {
  id: Exclude<QuickSheetType, null>;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function ContextFab() {
  const location = useLocation();
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const path = location.pathname;

  let contextTitle = 'Aksi Cepat Beranda';
  let options: FabOption[] = [
    {
      id: 'transaction',
      label: 'Tambah Transaksi',
      description: 'Catat pemasukan atau pengeluaran baru',
      icon: Receipt,
      color: '#2A4D3E',
    },
    {
      id: 'agenda',
      label: 'Tambah Agenda',
      description: 'Buat jadwal acara atau pengingat keluarga',
      icon: CalendarPlus,
      color: '#D4A359',
    },
    {
      id: 'task',
      label: 'Tambah Task',
      description: 'Buat daftar tugas rumah tangga',
      icon: CheckSquare,
      color: '#457B9D',
    },
  ];

  if (path.startsWith('/keuangan')) {
    contextTitle = 'Aksi Cepat Keuangan';
    options = [
      {
        id: 'transaction',
        label: 'Tambah Transaksi',
        description: 'Catat pemasukan atau pengeluaran keluarga',
        icon: Receipt,
        color: '#2A4D3E',
      },
      {
        id: 'wallet',
        label: 'Tambah Wallet',
        description: 'Buat dompet tunai, rekening bank, atau e-wallet',
        icon: Wallet,
        color: '#457B9D',
      },
      {
        id: 'goal',
        label: 'Tambah Goal',
        description: 'Buat target tabungan impian keluarga',
        icon: Target,
        color: '#D4A359',
      },
      {
        id: 'asset',
        label: 'Tambah Aset',
        description: 'Catat aset rumah, emas, kendaraan, atau investasi',
        icon: Coins,
        color: '#6B9080',
      },
    ];
  } else if (path.startsWith('/kalender')) {
    contextTitle = 'Aksi Cepat Kalender';
    options = [
      {
        id: 'agenda',
        label: 'Tambah Event',
        description: 'Tambahkan agenda atau jadwal di kalender',
        icon: CalendarPlus,
        color: '#D4A359',
      },
      {
        id: 'task',
        label: 'Tambah Task',
        description: 'Tambahkan checklist tugas sesuai tanggal',
        icon: CheckSquare,
        color: '#2A4D3E',
      },
    ];
  } else if (path.startsWith('/berdua')) {
    contextTitle = 'Aksi Cepat Berdua';
    options = [
      {
        id: 'moment',
        label: 'Tambah Moment',
        description: 'Simpan cerita & foto di Love Timeline',
        icon: Heart,
        color: '#D88C9A',
      },
      {
        id: 'date_night',
        label: 'Tambah Date Night',
        description: 'Rencanakan kencan spesial berdua',
        icon: Sparkles,
        color: '#D4A359',
      },
      {
        id: 'conversation_card',
        label: 'Conversation Card',
        description: 'Buka kartu obrolan mendalam bersama pasangan',
        icon: MessageCircleHeart,
        color: '#9D8189',
      },
    ];
  }

  return (
    <>
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#FAF7F2] sm:rounded-3xl rounded-t-3xl border border-[#E8E2D5] p-5 shadow-2xl space-y-3 mb-0 sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sm:hidden w-10 h-1.5 bg-[#D8D0C5] rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-2 border-b border-[#E8E2D5]">
              <h3 className="text-sm font-bold text-[#1E2D24]">{contextTitle}</h3>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Tutup menu aksi cepat"
                className="p-1.5 rounded-xl text-[#5C6B62] hover:bg-[#F4EFE6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 pt-1">
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveQuickSheet(opt.id);
                    }}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E]/40 hover:bg-[#F4EFE6]/50 transition-colors text-left"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: opt.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#1E2D24]">{opt.label}</p>
                      <p className="text-xs text-[#5C6B62] truncate">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-20 right-4 sm:right-8 z-30">
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Tambah data baru"
          className="w-13 h-13 rounded-2xl bg-[#2A4D3E] text-[#FAF7F2] shadow-lg shadow-[#2A4D3E]/25 flex items-center justify-center hover:bg-[#213D31] active:scale-95 transition-all cursor-pointer"
        >
          <Plus className={`w-6 h-6 transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`} />
        </button>
      </div>
    </>
  );
}
