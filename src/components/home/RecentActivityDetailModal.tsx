import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Calendar, CheckCircle2, Clock, MapPin, Tag, User } from 'lucide-react';
import { ResponsiveModal } from '../ui/ResponsiveModal';
import { IconRenderer } from '../ui/IconRenderer';
import { UnifiedActivityItem } from '../../hooks/useRecentActivities';
import { formatRupiah } from '../../utils/format';
import { useFamilyStore } from '../../stores/useFamilyStore';

interface RecentActivityDetailModalProps {
  item: UnifiedActivityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecentActivityDetailModal({
  item,
  isOpen,
  onClose,
}: RecentActivityDetailModalProps) {
  const navigate = useNavigate();
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  if (!item) return null;

  const handleNavigate = () => {
    onClose();
    if (item.detailData.navigateTo) {
      navigate(item.detailData.navigateTo);
    }
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Aktivitas"
      subtitle={item.badgeLabel}
    >
      <div className="p-5 space-y-4">
        {/* Header Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] flex items-start gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs mt-0.5"
            style={{
              backgroundColor: item.iconBgColor,
              color: item.iconTextColor,
            }}
          >
            <IconRenderer name={item.icon} className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold tracking-wider text-[#5C6B62] uppercase">
                {item.badgeLabel}
              </span>
              <span className="text-[11px] text-[#8A7B68] font-mono-num shrink-0">
                {item.relativeTime}
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1E2D24] mt-0.5 leading-snug break-words">
              {item.title}
            </h3>
            <p className="text-xs text-[#5C6B62] mt-0.5">{item.subtitle}</p>
          </div>
        </div>

        {/* Amount Card for Transactions */}
        {typeof item.amount === 'number' && (
          <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] flex items-center justify-between">
            <span className="text-xs text-[#5C6B62] font-medium">Nominal Transaksi</span>
            <span
              className={`text-lg font-mono-num font-bold ${
                item.amountType === 'Pemasukan'
                  ? 'text-[#2A4D3E]'
                  : item.amountType === 'Pengeluaran'
                  ? 'text-[#C84B31]'
                  : 'text-[#3B6A94]'
              }`}
            >
              {item.amountType === 'Pemasukan' ? '+' : item.amountType === 'Pengeluaran' ? '-' : ''}
              {formatRupiah(item.amount, hideNumbers)}
            </span>
          </div>
        )}

        {/* Detailed Metadata Grid */}
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] space-y-3 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-[#F4EFE6]">
            <span className="text-[#5C6B62] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8A7B68]" />
              <span>Tanggal</span>
            </span>
            <span className="font-medium text-[#1E2D24] font-mono-num">
              {item.formattedDate}
            </span>
          </div>

          {item.detailData.categoryName && (
            <div className="flex items-center justify-between py-1 border-b border-[#F4EFE6]">
              <span className="text-[#5C6B62] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#8A7B68]" />
                <span>Kategori</span>
              </span>
              <span className="font-semibold text-[#1E2D24]">
                {item.detailData.categoryName}
              </span>
            </div>
          )}

          {item.actorName && (
            <div className="flex items-center justify-between py-1 border-b border-[#F4EFE6]">
              <span className="text-[#5C6B62] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8A7B68]" />
                <span>Anggota</span>
              </span>
              <span className="font-medium text-[#1E2D24]">{item.actorName}</span>
            </div>
          )}

          {item.detailData.statusLabel && (
            <div className="flex items-center justify-between py-1 border-b border-[#F4EFE6]">
              <span className="text-[#5C6B62] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#8A7B68]" />
                <span>Status</span>
              </span>
              <span className="font-medium text-[#1E2D24]">{item.detailData.statusLabel}</span>
            </div>
          )}

          {item.detailData.extraNote && (
            <div className="flex items-center justify-between py-1 border-b border-[#F4EFE6]">
              <span className="text-[#5C6B62] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#8A7B68]" />
                <span>Informasi Tambahan</span>
              </span>
              <span className="font-medium text-[#1E2D24]">{item.detailData.extraNote}</span>
            </div>
          )}

          {/* Description / Content Body */}
          <div className="pt-2">
            <span className="block text-[#5C6B62] font-medium mb-1">Catatan / Keterangan</span>
            <p className="p-3 rounded-xl bg-[#FAF7F2] text-[#1E2D24] text-xs leading-relaxed whitespace-pre-wrap">
              {item.detailData.description || 'Tidak ada catatan tambahan.'}
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] hover:bg-[#F4EFE6] transition-colors"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleNavigate}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>{item.detailData.navigationLabel}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
