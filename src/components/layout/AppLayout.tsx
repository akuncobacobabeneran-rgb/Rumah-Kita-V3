import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBanner } from './TopBanner';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { ContextFab } from './ContextFab';
import { GlobalModals } from './GlobalModals';
import { OfflineIndicator } from '../ui/OfflineIndicator';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { getNativeNotificationPermission, sendNativeNotification } from '../../utils/nativeNotifications';

export function AppLayout() {
  const evaluateNotifications = useFamilyStore((s) => s.evaluateNotifications);
  const notifications = useFamilyStore((s) => s.notifications);
  const tasks = useFamilyStore((s) => s.tasks);
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const maintenanceItems = useFamilyStore((s) => s.maintenanceItems);
  const budgets = useFamilyStore((s) => s.budgets);
  const transactions = useFamilyStore((s) => s.transactions);
  const debts = useFamilyStore((s) => s.debts);

  const lastAlertedRef = useRef<number>(0);

  // Evaluate notifications on mount and whenever related records change
  useEffect(() => {
    evaluateNotifications();
  }, [tasks, calendarEvents, maintenanceItems, budgets, transactions, debts, evaluateNotifications]);

  // If user granted native notification permission, push an alert to phone notification tray
  useEffect(() => {
    if (getNativeNotificationPermission() !== 'granted') return;

    const urgentUnread = notifications.filter((n) => n.priority === 'urgent' && !n.is_read);
    if (urgentUnread.length === 0) return;

    const now = Date.now();
    // Throttle to avoid repeated alerts in the same session (min 15 min interval)
    if (now - lastAlertedRef.current < 15 * 60 * 1000) return;

    lastAlertedRef.current = now;

    if (urgentUnread.length === 1) {
      sendNativeNotification({
        title: urgentUnread[0].title,
        body: urgentUnread[0].message,
        tag: `urgent-${urgentUnread[0].id}`,
        playSound: true,
      });
    } else {
      sendNativeNotification({
        title: `RumahKita: ${urgentUnread.length} Pengingat Mendesak`,
        body: `Ada tugas yang terlewat, anggaran overbudget, atau tagihan jatuh tempo. Ketuk untuk membuka panel notifikasi.`,
        tag: 'urgent-summary',
        playSound: true,
      });
    }
  }, [notifications]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E2D24]">
      <TopBanner />
      <AppHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-4 pb-28">
        <Outlet />
      </main>
      <ContextFab />
      <BottomNav />
      <GlobalModals />
      <OfflineIndicator />
    </div>
  );
}
