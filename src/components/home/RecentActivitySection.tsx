import React, { useState } from 'react';
import { Activity, ArrowRight, ChevronRight, History } from 'lucide-react';
import { UnifiedActivityItem, useRecentActivities } from '../../hooks/useRecentActivities';
import { RecentActivityDetailModal } from './RecentActivityDetailModal';
import { IconRenderer } from '../ui/IconRenderer';
import { EmptyState } from '../ui/StateFeedback';
import { formatRupiah } from '../../utils/format';
import { useFamilyStore } from '../../stores/useFamilyStore';

export function RecentActivitySection() {
  const activities = useRecentActivities(5);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);

  const [selectedItem, setSelectedItem] = useState<UnifiedActivityItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (item: UnifiedActivityItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <>
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1E2D24] tracking-tight">
                Aktivitas Terkini
              </h2>
              <span className="text-[11px] text-[#5C6B62] font-medium">
                · 5 Terakhir
              </span>
            </div>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Catatan mutasi, tugas selesai, jurnal, dan agenda terbaru keluarga
            </p>
          </div>

          <div className="w-8 h-8 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        {/* Activities List */}
        {activities.length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum ada aktivitas"
            description="Mulai catat transaksi, tugas rumah, atau jurnal harian keluarga untuk melihat rangkuman aktivitas di sini."
            actionLabel="Catat Transaksi Pertama"
            onAction={() => setActiveQuickSheet('transaction')}
          />
        ) : (
          <div className="space-y-2.5">
            {activities.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleItemClick(item);
                  }
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E]/40 hover:bg-[#F7F3EC] transition-all cursor-pointer group focus-visible:ring-2 focus-visible:ring-[#2A4D3E] outline-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: item.iconBgColor,
                        color: item.iconTextColor,
                      }}
                    >
                      <IconRenderer name={item.icon} className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#5C6B62]">
                        <span className="font-medium">{item.badgeLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num text-[#8A7B68]">{item.relativeTime}</span>
                      </div>

                      <p className="text-sm font-bold text-[#1E2D24] truncate mt-0.5">
                        {item.title}
                      </p>

                      <p className="text-xs text-[#5C6B62] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    {typeof item.amount === 'number' && (
                      <span
                        className={`text-sm font-mono-num font-bold ${
                          item.amountType === 'Pemasukan'
                            ? 'text-[#2A4D3E]'
                            : item.amountType === 'Pengeluaran'
                            ? 'text-[#C84B31]'
                            : 'text-[#3B6A94]'
                        }`}
                      >
                        {item.amountType === 'Pemasukan'
                          ? '+'
                          : item.amountType === 'Pengeluaran'
                          ? '-'
                          : ''}
                        {formatRupiah(item.amount, hideNumbers)}
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-[#8A7B68] group-hover:text-[#1E2D24] transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      <RecentActivityDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
