import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  BellOff,
  BellRing,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  DollarSign,
  ExternalLink,
  Flame,
  PieChart,
  Receipt,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { NotificationItem } from '../../types';
import {
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  sendTestNotification,
  playNotificationChime,
} from '../../utils/nativeNotifications';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'urgent' | 'agenda_tasks' | 'finance';

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const notifications = useFamilyStore((s) => s.notifications);
  const markNotificationRead = useFamilyStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useFamilyStore((s) => s.markAllNotificationsRead);
  const deleteNotification = useFamilyStore((s) => s.deleteNotification);
  const toggleTaskStatus = useFamilyStore((s) => s.toggleTaskStatus);

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [nativePerm, setNativePerm] = useState(getNativeNotificationPermission());
  const [isTestingPush, setIsTestingPush] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filtered notifications
  const urgentCount = useMemo(
    () => notifications.filter((n) => n.priority === 'urgent' && !n.is_read).length,
    [notifications]
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'urgent':
        return notifications.filter((n) => n.priority === 'urgent' || n.priority === 'high');
      case 'agenda_tasks':
        return notifications.filter((n) => n.source === 'Task' || n.source === 'Agenda');
      case 'finance':
        return notifications.filter(
          (n) => n.source === 'Budget' || n.source === 'Jatuh tempo' || n.source === 'Transaksi'
        );
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, activeTab]);

  const handleRequestPermission = async () => {
    const perm = await requestNativeNotificationPermission();
    setNativePerm(perm);
    if (perm === 'granted') {
      sendTestNotification();
      showToast('Izin notifikasi HP berhasil diaktifkan!');
    }
  };

  const handleTestChime = async () => {
    setIsTestingPush(true);
    playNotificationChime();
    const sent = await sendTestNotification();
    setIsTestingPush(false);
    if (sent) {
      showToast('Notifikasi uji coba dikirim ke panel ponsel!');
    } else {
      showToast('Suara pengingat berbunyi.');
    }
  };

  const handleCompleteTaskDirectly = async (taskId: string, notifId: string) => {
    try {
      await toggleTaskStatus(taskId);
      await markNotificationRead(notifId);
      showToast('Tugas berhasil diselesaikan!');
    } catch {
      showToast('Gagal mengubah status tugas.');
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer Container (Sliding Panel) */}
      <div className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 ease-out border-l border-[#E8E2D5]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#E8E2D5] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2A4D3E]/10 flex items-center justify-center text-[#2A4D3E]">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#1E2D24]">Panel Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C84B31] text-white">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5C6B62]">Pengingat agenda, task & anggaran keluarga</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panel"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Temporary Success Toast */}
        {actionSuccessMsg && (
          <div className="bg-[#2A4D3E] text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 animate-in fade-in duration-150">
            <Check className="w-3.5 h-3.5" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* System HP Notification Status Banner */}
        <div className="p-3.5 bg-[#F4EFE6] border-b border-[#E8E2D5] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {nativePerm === 'granted' ? (
                <div className="w-7 h-7 rounded-lg bg-[#2A4D3E]/15 text-[#2A4D3E] flex items-center justify-center shrink-0">
                  <Bell className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#D4A359]/20 text-[#8B651B] flex items-center justify-center shrink-0">
                  <BellOff className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1E2D24] truncate">
                  {nativePerm === 'granted' ? 'Notifikasi HP: Aktif' : 'Notifikasi HP Belum Aktif'}
                </p>
                <p className="text-[11px] text-[#5C6B62] truncate">
                  {nativePerm === 'granted'
                    ? 'Pengingat otomatis muncul di bilah status HP'
                    : 'Aktifkan agar muncul pop-up di status bar HP'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {nativePerm !== 'granted' ? (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors shadow-xs"
                >
                  Izinkan
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isTestingPush}
                  onClick={handleTestChime}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E8E2D5] bg-white text-[#1E2D24] text-xs font-medium hover:bg-[#FAF7F2] transition-colors flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3 text-[#2A4D3E]" />
                  <span>{isTestingPush ? 'Menguji...' : 'Tes Notif'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-3 pt-3 pb-1 border-b border-[#E8E2D5] bg-white shrink-0">
          <div className="grid grid-cols-4 gap-1 p-1 bg-[#FAF7F2] rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-[#1E2D24] shadow-xs font-bold'
                  : 'text-[#5C6B62] hover:text-[#1E2D24]'
              }`}
            >
              Semua
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('urgent')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all relative flex items-center justify-center gap-1 ${
                activeTab === 'urgent'
                  ? 'bg-white text-[#C84B31] shadow-xs font-bold'
                  : 'text-[#5C6B62] hover:text-[#1E2D24]'
              }`}
            >
              <Flame className="w-3 h-3 text-[#C84B31]" />
              <span>Mendesak</span>
              {urgentCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C84B31] absolute top-1 right-1" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('agenda_tasks')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                activeTab === 'agenda_tasks'
                  ? 'bg-white text-[#1E2D24] shadow-xs font-bold'
                  : 'text-[#5C6B62] hover:text-[#1E2D24]'
              }`}
            >
              Agenda
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                activeTab === 'finance'
                  ? 'bg-white text-[#1E2D24] shadow-xs font-bold'
                  : 'text-[#5C6B62] hover:text-[#1E2D24]'
              }`}
            >
              Budget
            </button>
          </div>

          {/* Quick Mark All Read Link */}
          {unreadCount > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0EBE0] text-xs text-[#5C6B62]">
              <span>{unreadCount} belum ditandai</span>
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="text-[#2A4D3E] font-semibold hover:underline flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Tandai Semua Dibaca</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification List Scroll Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8E2D5] flex items-center justify-center mx-auto mb-3 shadow-xs">
                {activeTab === 'urgent' ? (
                  <CheckCircle2 className="w-7 h-7 text-[#2A4D3E]" />
                ) : (
                  <Bell className="w-7 h-7 text-[#84A59D]" />
                )}
              </div>
              <h4 className="text-sm font-bold text-[#1E2D24]">
                {activeTab === 'urgent'
                  ? 'Semua Urusan Aman & Terkendali'
                  : 'Belum Ada Notifikasi di Sini'}
              </h4>
              <p className="text-xs text-[#5C6B62] mt-1 max-w-xs mx-auto leading-relaxed">
                {activeTab === 'urgent'
                  ? 'Tidak ada tugas terlewat, anggaran overbudget, atau tagihan yang terlambat saat ini.'
                  : 'Pengingat agenda harian, tugas keluarga, dan peringatan limit anggaran otomatis tercatat di sini.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => {
              const isUrgent = n.priority === 'urgent';
              const isHigh = n.priority === 'high';

              return (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-150 ${
                    !n.is_read
                      ? isUrgent
                        ? 'bg-[#FDECEC] border-[#C84B31]/30 shadow-xs'
                        : isHigh
                        ? 'bg-[#FDF7EB] border-[#D4A359]/40 shadow-xs'
                        : 'bg-[#F4EFE6] border-[#D4A359]/30 shadow-xs'
                      : 'bg-white border-[#E8E2D5]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon indicator */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isUrgent
                          ? 'bg-[#C84B31]/15 text-[#C84B31]'
                          : isHigh
                          ? 'bg-[#D4A359]/20 text-[#8B651B]'
                          : n.source === 'Agenda'
                          ? 'bg-[#2A4D3E]/10 text-[#2A4D3E]'
                          : n.source === 'Budget'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-[#84A59D]/20 text-[#2A4D3E]'
                      }`}
                    >
                      {isUrgent ? (
                        <AlertOctagon className="w-5 h-5" />
                      ) : isHigh ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : n.source === 'Agenda' ? (
                        <Calendar className="w-5 h-5" />
                      ) : n.source === 'Budget' ? (
                        <PieChart className="w-5 h-5" />
                      ) : n.source === 'Jatuh tempo' ? (
                        <Receipt className="w-5 h-5" />
                      ) : (
                        <CheckSquare className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isUrgent
                                ? 'bg-[#C84B31] text-white'
                                : isHigh
                                ? 'bg-[#D4A359] text-white'
                                : 'bg-[#E8E2D5] text-[#1E2D24]'
                            }`}
                          >
                            {isUrgent ? 'Mendesak' : isHigh ? 'Penting' : n.source}
                          </span>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-[#C84B31]" />
                          )}
                        </div>

                        {/* Top corner actions */}
                        <div className="flex items-center gap-1">
                          {!n.is_read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(n.id)}
                              title="Tandai dibaca"
                              className="p-1 rounded-lg text-[#5C6B62] hover:text-[#2A4D3E] hover:bg-white/80"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteNotification(n.id)}
                            title="Hapus"
                            className="p-1 rounded-lg text-[#5C6B62] hover:text-[#C84B31] hover:bg-white/80"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-[#1E2D24] mt-1 leading-snug">
                        {n.title}
                      </h4>
                      <p className="text-xs text-[#5C6B62] mt-0.5 leading-relaxed">
                        {n.message}
                      </p>

                      {/* Interactive Action Buttons */}
                      <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between gap-2 flex-wrap">
                        {/* Direct action if Task: Complete right away! */}
                        {n.action_type === 'task' && n.action_id && (
                          <button
                            type="button"
                            onClick={() => handleCompleteTaskDirectly(n.action_id!, n.id)}
                            className="px-2.5 py-1 rounded-lg bg-[#2A4D3E] hover:bg-[#213D31] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Selesaikan Tugas Langsung</span>
                          </button>
                        )}

                        {/* Direct link navigation if path exists */}
                        {n.link_path && (
                          <button
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              onClose();
                              navigate(n.link_path!);
                            }}
                            className="text-[11px] font-semibold text-[#2A4D3E] hover:underline flex items-center gap-1 ml-auto"
                          >
                            <span>Buka Halaman</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions footer */}
        <div className="p-3.5 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs text-[#5C6B62] shrink-0">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2A4D3E]" />
            <span>Pemeriksaan otomatis setiap saat</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2A4D3E] text-white font-semibold hover:bg-[#213D31] transition-colors text-xs"
          >
            Tutup Panel
          </button>
        </div>
      </div>
    </div>
  );
};
