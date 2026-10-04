import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Calendar,
  CalendarPlus,
  Check,
  CheckCircle2,
  CheckSquare,
  CreditCard,
  FileBarChart,
  FolderKanban,
  HandCoins,
  Heart,
  HelpCircle,
  Landmark,
  LayoutGrid,
  Loader2,
  MessageCircleHeart,
  PieChart,
  Plus,
  Receipt,
  Repeat,
  RotateCcw,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Target,
  Wallet,
  Wrench,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { ResponsiveModal } from '../ui/ResponsiveModal';

interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  group: 'Operasional & Keluarga' | 'Keuangan & Aset' | 'Aksi Cepat (Popup)' | 'Sistem & Bantuan';
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
  actionType: 'route' | 'quick_sheet';
  target: string;
}

const ALL_SHORTCUTS: ShortcutDefinition[] = [
  // Operasional & Keluarga
  {
    id: 'dokumen',
    label: 'Brankas Dokumen',
    description: 'Simpan KTP, KK, STNK/BPKB & link Google Drive',
    group: 'Operasional & Keluarga',
    icon: FolderKanban,
    bg: '#E8F2EC',
    iconColor: '#2A4D3E',
    actionType: 'route',
    target: '/dokumen',
  },
  {
    id: 'belanja',
    label: 'Belanja & Menu',
    description: 'Daftar belanja dapur & Meal Planner mingguan',
    group: 'Operasional & Keluarga',
    icon: ShoppingCart,
    bg: '#FDF3E1',
    iconColor: '#B88228',
    actionType: 'route',
    target: '/belanja',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Jadwal servis kendaraan & perawatan rumah',
    group: 'Operasional & Keluarga',
    icon: Wrench,
    bg: '#FBECE8',
    iconColor: '#C85A32',
    actionType: 'route',
    target: '/maintenance',
  },
  {
    id: 'conversation_cards',
    label: 'Conversation Cards',
    description: 'Buka kartu obrolan mendalam pasangan',
    group: 'Operasional & Keluarga',
    icon: MessageCircleHeart,
    bg: '#F9EBF0',
    iconColor: '#B55B73',
    actionType: 'quick_sheet',
    target: 'conversation_card',
  },
  {
    id: 'berdua',
    label: 'Ruang Berdua',
    description: 'Date night, Love Timeline & Bucket List pasangan',
    group: 'Operasional & Keluarga',
    icon: Heart,
    bg: '#FCECEF',
    iconColor: '#C44569',
    actionType: 'route',
    target: '/berdua',
  },
  {
    id: 'jurnal',
    label: 'Jurnal Keluarga',
    description: 'Catatan refleksi & cerita harian keluarga',
    group: 'Operasional & Keluarga',
    icon: BookOpen,
    bg: '#EAF1F6',
    iconColor: '#36688A',
    actionType: 'route',
    target: '/jurnal',
  },
  {
    id: 'kalender',
    label: 'Kalender & Task',
    description: 'Agenda bulanan/mingguan & tugas rumah tangga',
    group: 'Operasional & Keluarga',
    icon: Calendar,
    bg: '#F3EDF4',
    iconColor: '#7C5D68',
    actionType: 'route',
    target: '/kalender',
  },

  // Keuangan & Aset
  {
    id: 'keuangan',
    label: 'Ringkasan Keuangan',
    description: 'Arus kas, transaksi & kondisi dompet keluarga',
    group: 'Keuangan & Aset',
    icon: Wallet,
    bg: '#E8F2EC',
    iconColor: '#2A4D3E',
    actionType: 'route',
    target: '/keuangan',
  },
  {
    id: 'anggaran',
    label: 'Anggaran Bulanan',
    description: 'Kelola batas budget pengeluaran per kategori',
    group: 'Keuangan & Aset',
    icon: PieChart,
    bg: '#FDF3E1',
    iconColor: '#9B6B21',
    actionType: 'route',
    target: '/keuangan/anggaran',
  },
  {
    id: 'wallet',
    label: 'Wallet & Transfer',
    description: 'Daftar rekening bank, e-wallet & pindah dana',
    group: 'Keuangan & Aset',
    icon: CreditCard,
    bg: '#EAF1F6',
    iconColor: '#2E5B7A',
    actionType: 'route',
    target: '/keuangan/wallet',
  },
  {
    id: 'goal',
    label: 'Goal Tabungan',
    description: 'Target dana darurat, liburan & impian keluarga',
    group: 'Keuangan & Aset',
    icon: Target,
    bg: '#F9EBF0',
    iconColor: '#A84A62',
    actionType: 'route',
    target: '/keuangan/goal',
  },
  {
    id: 'utang',
    label: 'Utang & Cicilan',
    description: 'Pantau KPR, cicilan & catatan piutang',
    group: 'Keuangan & Aset',
    icon: HandCoins,
    bg: '#FBECE8',
    iconColor: '#B84A27',
    actionType: 'route',
    target: '/keuangan/utang',
  },
  {
    id: 'aset',
    label: 'Aset & Kekayaan',
    description: 'Properti, emas, investasi & nilai bersih',
    group: 'Keuangan & Aset',
    icon: Landmark,
    bg: '#EEF3EF',
    iconColor: '#2A4D3E',
    actionType: 'route',
    target: '/keuangan/aset',
  },
  {
    id: 'alokasi',
    label: 'Alokasi Gaji',
    description: 'Simulasi pembagian persentase pemasukan bulanan',
    group: 'Keuangan & Aset',
    icon: Sparkles,
    bg: '#FDF3E1',
    iconColor: '#B88228',
    actionType: 'route',
    target: '/keuangan/alokasi',
  },
  {
    id: 'rutin',
    label: 'Tagihan Rutin',
    description: 'Jadwal tagihan listrik, internet & langganan',
    group: 'Keuangan & Aset',
    icon: Repeat,
    bg: '#F3EDF4',
    iconColor: '#6D4C7D',
    actionType: 'route',
    target: '/keuangan/rutin',
  },
  {
    id: 'laporan',
    label: 'Laporan PDF',
    description: 'Analisis grafik & unduh laporan keuangan PDF',
    group: 'Keuangan & Aset',
    icon: FileBarChart,
    bg: '#EEF3EF',
    iconColor: '#4E7566',
    actionType: 'route',
    target: '/keuangan/laporan',
  },

  // Aksi Cepat (Popup)
  {
    id: 'quick_tx',
    label: 'Catat Transaksi',
    description: 'Buka popup tambah pemasukan / pengeluaran cepat',
    group: 'Aksi Cepat (Popup)',
    icon: Receipt,
    bg: '#E8F2EC',
    iconColor: '#2A4D3E',
    actionType: 'quick_sheet',
    target: 'transaction',
  },
  {
    id: 'quick_task',
    label: 'Tambah Task',
    description: 'Buka popup buat tugas keluarga baru',
    group: 'Aksi Cepat (Popup)',
    icon: CheckSquare,
    bg: '#FDF3E1',
    iconColor: '#9B6B21',
    actionType: 'quick_sheet',
    target: 'task',
  },
  {
    id: 'quick_agenda',
    label: 'Tambah Agenda',
    description: 'Buka popup jadwalkan acara / Date Night',
    group: 'Aksi Cepat (Popup)',
    icon: CalendarPlus,
    bg: '#F9EBF0',
    iconColor: '#B55B73',
    actionType: 'quick_sheet',
    target: 'agenda',
  },

  // Sistem & Bantuan
  {
    id: 'bantuan',
    label: 'Panduan & FAQ',
    description: 'Petunjuk pemakaian lengkap fitur RumahKita',
    group: 'Sistem & Bantuan',
    icon: HelpCircle,
    bg: '#EAF1F6',
    iconColor: '#36688A',
    actionType: 'route',
    target: '/bantuan',
  },
  {
    id: 'lainnya',
    label: 'Menu Lainnya',
    description: 'Pengaturan profil, kode keluarga & backup Excel',
    group: 'Sistem & Bantuan',
    icon: LayoutGrid,
    bg: '#F4EFE6',
    iconColor: '#5C6B62',
    actionType: 'route',
    target: '/lainnya',
  },
];

const DEFAULT_SHORTCUT_IDS = [
  'dokumen',
  'belanja',
  'maintenance',
  'conversation_cards',
  'jurnal',
  'laporan',
  'kalender',
  'lainnya',
];

function resolveSavedShortcuts(family?: { id?: string; custom_shortcuts?: string[] } | null): string[] {
  if (Array.isArray(family?.custom_shortcuts) && family.custom_shortcuts.length > 0) {
    const valid = family.custom_shortcuts.filter((id) => ALL_SHORTCUTS.some((s) => s.id === id));
    if (valid.length > 0) return valid;
  }
  return DEFAULT_SHORTCUT_IDS;
}

export function FeatureShortcuts() {
  const navigate = useNavigate();
  const family = useFamilyStore((s) => s.family);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);
  const updateCustomShortcuts = useFamilyStore((s) => s.updateCustomShortcuts);

  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    resolveSavedShortcuts(useFamilyStore.getState().family)
  );
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [noticeText, setNoticeText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const resolved = resolveSavedShortcuts(family);
    setSelectedIds(resolved);
  }, [family?.id, family?.custom_shortcuts]);

  const activeShortcuts = useMemo(() => {
    return selectedIds
      .map((id) => ALL_SHORTCUTS.find((s) => s.id === id))
      .filter((item): item is ShortcutDefinition => Boolean(item));
  }, [selectedIds]);

  const groupedCatalog = useMemo(() => {
    const groups: Record<ShortcutDefinition['group'], ShortcutDefinition[]> = {
      'Operasional & Keluarga': [],
      'Keuangan & Aset': [],
      'Aksi Cepat (Popup)': [],
      'Sistem & Bantuan': [],
    };
    for (const item of ALL_SHORTCUTS) {
      groups[item.group].push(item);
    }
    return groups;
  }, []);

  const handleTriggerShortcut = (item: ShortcutDefinition) => {
    if (item.actionType === 'route') {
      navigate(item.target);
    } else {
      setActiveQuickSheet(
        item.target as
          | 'transaction'
          | 'wallet'
          | 'goal'
          | 'asset'
          | 'agenda'
          | 'task'
          | 'moment'
          | 'conversation_card'
      );
    }
  };

  const openCustomizeModal = () => {
    setDraftIds(selectedIds);
    setNoticeText('');
    setIsSaving(false);
    setIsCustomizeOpen(true);
  };

  const toggleDraftItem = (id: string) => {
    setDraftIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          setNoticeText('Minimal 1 menu pintasan harus tetap aktif.');
          return prev;
        }
        setNoticeText('');
        return prev.filter((item) => item !== id);
      }
      setNoticeText('');
      return [...prev, id];
    });
  };

  const moveDraftItem = (index: number, direction: -1 | 1) => {
    setDraftIds((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleResetDefault = () => {
    setDraftIds(DEFAULT_SHORTCUT_IDS);
    setNoticeText('Urutan diatur ke default. Klik "Simpan Perubahan" untuk menyimpan.');
  };

  const handleSaveShortcuts = async () => {
    const finalIds = draftIds.length > 0 ? draftIds : DEFAULT_SHORTCUT_IDS;
    setIsSaving(true);
    setSelectedIds(finalIds);

    try {
      await updateCustomShortcuts(finalIds);
      setIsSaving(false);
      setIsCustomizeOpen(false);
    } catch (err) {
      console.warn('Failed to update custom shortcuts in database:', err);
      setIsSaving(false);
      setIsCustomizeOpen(false);
    }
  };

  return (
    <>
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Pintasan Fitur</h2>
            <p className="text-xs text-[#5C6B62]">Akses cepat menu utama sesuai pilihan Anda</p>
          </div>
          <button
            type="button"
            onClick={openCustomizeModal}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFE6] border border-[#E8E2D5] text-xs font-semibold text-[#2A4D3E] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Ubah Menu</span>
          </button>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {activeShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTriggerShortcut(item)}
                className="flex flex-col items-center text-center group cursor-pointer focus:outline-none"
              >
                <div
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95"
                  style={{ backgroundColor: item.bg, color: item.iconColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#1E2D24] mt-2 leading-tight line-clamp-2">
                  {item.label}
                </span>
              </button>
            );
          })}

          {activeShortcuts.length < 8 && (
            <button
              type="button"
              onClick={openCustomizeModal}
              className="flex flex-col items-center text-center group cursor-pointer focus:outline-none"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border border-dashed border-[#C9C1B4] bg-[#FAF7F2] text-[#5C6B62] flex items-center justify-center transition-colors group-hover:border-[#2A4D3E] group-hover:text-[#2A4D3E]">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-[#5C6B62] mt-2 leading-tight">
                Tambah
              </span>
            </button>
          )}
        </div>
      </section>

      <ResponsiveModal
        isOpen={isCustomizeOpen}
        onClose={() => setIsCustomizeOpen(false)}
        title="Atur Menu Pintasan Cepat"
        subtitle="Pilih dan urutkan menu yang ingin ditampilkan di Beranda"
        maxWidth="max-w-xl"
      >
        <div className="space-y-5">
          {noticeText && (
            <div className="px-3.5 py-2 rounded-xl bg-[#FDF3E1] text-[#9B6B21] text-xs font-semibold">
              {noticeText}
            </div>
          )}

          {/* 1. Urutan Menu Aktif */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-[#1E2D24] uppercase tracking-wider">
                  Urutan Menu Aktif ({draftIds.length} dipilih)
                </h3>
                <p className="text-[11px] text-[#5C6B62]">
                  Gunakan panah untuk mengubah urutan tampilan di Beranda
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-2.5 py-1.5 rounded-lg bg-[#F4EFE6] hover:bg-[#E8E2D5] text-[11px] font-semibold text-[#2A4D3E] flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
              {draftIds.map((id, idx) => {
                const item = ALL_SHORTCUTS.find((s) => s.id === id);
                if (!item) return null;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-white border border-[#E8E2D5]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-[11px] font-mono-num font-bold text-[#5C6B62]">
                        {idx + 1}.
                      </span>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: item.bg, color: item.iconColor }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-[#1E2D24] truncate">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveDraftItem(idx, -1)}
                        aria-label="Geser naik"
                        className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] disabled:opacity-35 hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === draftIds.length - 1}
                        onClick={() => moveDraftItem(idx, 1)}
                        aria-label="Geser turun"
                        className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] disabled:opacity-35 hover:bg-[#F4EFE6] cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Katalog Seluruh Pilihan Menu */}
          <div className="space-y-4 pt-2 border-t border-[#E8E2D5]">
            <div>
              <h3 className="text-xs font-bold text-[#1E2D24] uppercase tracking-wider">
                Pilih Menu Pintasan ({ALL_SHORTCUTS.length} Tersedia)
              </h3>
              <p className="text-[11px] text-[#5C6B62]">
                Ketuk kartu menu di bawah untuk menambahkan atau menghapus dari akses cepat
              </p>
            </div>

            {(Object.keys(groupedCatalog) as Array<ShortcutDefinition['group']>).map((groupName) => (
              <div key={groupName} className="space-y-2">
                <h4 className="text-xs font-bold text-[#2A4D3E]">{groupName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedCatalog[groupName].map((item) => {
                    const Icon = item.icon;
                    const isSelected = draftIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleDraftItem(item.id)}
                        className={`flex items-center justify-between gap-3 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F2EC]/60 border-[#2A4D3E] shadow-2xs'
                            : 'bg-white border-[#E8E2D5] hover:border-[#C9C1B4]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: item.bg, color: item.iconColor }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1E2D24] truncate">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-[#5C6B62] line-clamp-1">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#2A4D3E] text-white'
                              : 'border border-[#C9C1B4] bg-[#FAF7F2] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#E8E2D5]">
            <div className="flex items-center gap-1.5 min-w-0">
              {isSaving && (
                <div className="flex items-center gap-1.5 text-xs text-[#2A4D3E] font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A4D3E]" />
                  <span>Menyimpan...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setIsCustomizeOpen(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] hover:bg-[#F4EFE6] cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                onClick={handleSaveShortcuts}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Perubahan</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </ResponsiveModal>
    </>
  );
}
