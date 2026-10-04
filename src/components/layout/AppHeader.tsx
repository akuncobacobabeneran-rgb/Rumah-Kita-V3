import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Home, Loader2, RefreshCw, Search } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';

export function AppHeader() {
  const family = useFamilyStore((s) => s.family);
  const notifications = useFamilyStore((s) => s.notifications);
  const refreshData = useFamilyStore((s) => s.refreshData);
  const setSearchOpen = useFamilyStore((s) => s.setSearchOpen);
  const setNotificationsOpen = useFamilyStore((s) => s.setNotificationsOpen);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const hasUrgent = notifications.some((n) => n.priority === 'urgent' && !n.is_read);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 350);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8E2D5]">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Logo, Application Name & Family Name */}
        <Link
          to="/"
          className="flex items-center gap-2.5 min-w-0 group focus:outline-none"
          aria-label="RumahKita Beranda"
        >
          <div className="w-9 h-9 rounded-xl bg-[#2A4D3E] flex items-center justify-center text-[#FAF7F2] shadow-xs shrink-0 group-hover:bg-[#213D31] transition-colors">
            <Home className="w-4 h-4 text-[#F4D393]" />
          </div>
          <div className="min-w-0">
            <span className="block text-base font-bold tracking-tight text-[#1E2D24] truncate leading-tight">
              RumahKita
            </span>
            <span className="block text-[11px] font-medium text-[#5C6B62] truncate leading-tight">
              {family?.name || 'Keluarga Harmonis'}
            </span>
          </div>
        </Link>

        {/* Sync Status Badge (Unobtrusive Inline Indicator) */}
        {syncStatus === 'saving' && (
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-[10px] sm:text-xs font-semibold border border-[#2A4D3E]/20 animate-pulse">
            <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
            <span>Menyimpan...</span>
          </div>
        )}

        {/* Zone 3: Right Actions (Refresh, Search, Notification) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Muat ulang data"
            title="Muat ulang data"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2A4D3E]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Cari transaksi, tugas, jurnal, atau agenda"
            title="Pencarian"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Buka panel notifikasi HP"
            title="Panel Notifikasi"
            className="relative min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            <Bell className={`w-4 h-4 ${hasUrgent ? 'text-[#C84B31]' : ''}`} />
            {unreadCount > 0 && (
              <span
                className={`absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#FAF7F2] ${
                  hasUrgent ? 'bg-[#C84B31] animate-pulse' : 'bg-[#2A4D3E]'
                }`}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
