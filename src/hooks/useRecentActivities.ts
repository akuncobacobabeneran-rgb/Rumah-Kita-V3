import { useMemo } from 'react';
import { useFamilyStore } from '../stores/useFamilyStore';
import { formatDateId } from '../utils/format';

export interface UnifiedActivityItem {
  id: string;
  sourceType: 'transaction' | 'task' | 'journal' | 'event';
  title: string;
  subtitle: string;
  timestamp: string; // ISO date-time string used for sorting
  relativeTime: string;
  formattedDate: string;
  actorName?: string;
  amount?: number;
  amountType?: 'Pemasukan' | 'Pengeluaran' | 'Transfer';
  icon: string;
  iconBgColor: string;
  iconTextColor: string;
  badgeLabel: string;
  detailData: {
    description?: string;
    categoryName?: string;
    statusLabel?: string;
    extraNote?: string;
    navigateTo: string;
    navigationLabel: string;
  };
}

function getRelativeTimeDesc(isoString: string): string {
  try {
    const timestamp = new Date(isoString).getTime();
    if (isNaN(timestamp)) return '';
    const now = Date.now();
    const diffSec = Math.floor((now - timestamp) / 1000);

    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Kemarin';
    if (diffDay < 7) return `${diffDay} hari lalu`;
    return formatDateId(isoString.slice(0, 10), 'd MMM yyyy');
  } catch {
    return '';
  }
}

export function useRecentActivities(limit: number = 5): UnifiedActivityItem[] {
  const transactions = useFamilyStore((s) => s.transactions);
  const tasks = useFamilyStore((s) => s.tasks);
  const journalEntries = useFamilyStore((s) => s.journalEntries);
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const taskCategories = useFamilyStore((s) => s.taskCategories);
  const wallets = useFamilyStore((s) => s.wallets);

  return useMemo(() => {
    const items: UnifiedActivityItem[] = [];

    // 1. Transactions (Pemasukan, Pengeluaran, Transfer)
    for (const tx of transactions) {
      const cat = transactionCategories.find((c) => c.id === tx.category_id);
      const wallet = wallets.find((w) => w.id === tx.wallet_id);
      const isoTimestamp = tx.updated_at || tx.created_at || (tx.date ? `${tx.date}T12:00:00.000Z` : new Date().toISOString());

      let badgeLabel = 'Pengeluaran';
      let icon = cat?.icon || 'Receipt';
      let iconBgColor = '#FBECE8';
      let iconTextColor = '#C84B31';

      if (tx.type === 'Pemasukan') {
        badgeLabel = 'Pemasukan';
        iconBgColor = '#E8F2EC';
        iconTextColor = '#2A4D3E';
      } else if (tx.type === 'Transfer') {
        badgeLabel = 'Transfer';
        icon = 'Repeat';
        iconBgColor = '#E8EEF5';
        iconTextColor = '#3B6A94';
      }

      items.push({
        id: `tx-${tx.id}`,
        sourceType: 'transaction',
        title: tx.notes?.trim() || cat?.name || (tx.type === 'Transfer' ? 'Transfer Saldo' : `Transaksi ${tx.type}`),
        subtitle: `${cat?.name || tx.type} · ${wallet?.name || 'Dompet'}`,
        timestamp: isoTimestamp,
        relativeTime: getRelativeTimeDesc(isoTimestamp),
        formattedDate: formatDateId(tx.date || isoTimestamp.slice(0, 10), 'd MMMM yyyy'),
        amount: tx.amount,
        amountType: tx.type,
        icon,
        iconBgColor,
        iconTextColor,
        badgeLabel,
        detailData: {
          categoryName: cat?.name || (tx.type === 'Transfer' ? 'Transfer Antar Dompet' : 'Tanpa Kategori'),
          statusLabel: `Tercatat di ${wallet?.name || 'Dompet Utama'}`,
          description: tx.notes || 'Tidak ada catatan tambahan untuk transaksi ini.',
          navigateTo: '/keuangan',
          navigationLabel: 'Buka Modul Keuangan',
        },
      });
    }

    // 2. Household Tasks
    for (const task of tasks) {
      const cat = taskCategories.find((c) => c.id === task.category_id);
      const isoTimestamp = task.updated_at || task.created_at || (task.due_date ? `${task.due_date}T12:00:00.000Z` : new Date().toISOString());
      const isCompleted = task.status === 'Selesai';

      items.push({
        id: `task-${task.id}`,
        sourceType: 'task',
        title: task.title,
        subtitle: `${cat?.name || 'Tugas Rumah'} · ${task.assignee_name || 'Keluarga'}`,
        timestamp: isoTimestamp,
        relativeTime: getRelativeTimeDesc(isoTimestamp),
        formattedDate: formatDateId(task.due_date || isoTimestamp.slice(0, 10), 'd MMMM yyyy'),
        actorName: task.assignee_name,
        icon: isCompleted ? 'CheckCircle2' : 'CheckSquare',
        iconBgColor: isCompleted ? '#E8F2EC' : '#F4EFE6',
        iconTextColor: isCompleted ? '#2A4D3E' : '#8A7B68',
        badgeLabel: isCompleted ? 'Tugas Selesai' : 'Tugas Diperbarui',
        detailData: {
          categoryName: cat?.name || 'Umum',
          statusLabel: isCompleted ? 'Selesai Dikerjakan' : 'Belum Selesai',
          description: task.description || 'Tidak ada deskripsi detail pada tugas ini.',
          extraNote: `Penanggung jawab: ${task.assignee_name || 'Semua Anggota'}`,
          navigateTo: '/maintenance',
          navigationLabel: 'Buka Tugas & Maintenance',
        },
      });
    }

    // 3. Family Journal Entries
    for (const journal of journalEntries) {
      const isoTimestamp = journal.updated_at || journal.created_at || (journal.date ? `${journal.date}T12:00:00.000Z` : new Date().toISOString());

      items.push({
        id: `journal-${journal.id}`,
        sourceType: 'journal',
        title: journal.title,
        subtitle: `Refleksi oleh ${journal.author_name || 'Keluarga'}`,
        timestamp: isoTimestamp,
        relativeTime: getRelativeTimeDesc(isoTimestamp),
        formattedDate: formatDateId(journal.date || isoTimestamp.slice(0, 10), 'd MMMM yyyy'),
        actorName: journal.author_name,
        icon: 'BookOpen',
        iconBgColor: '#F5ECE3',
        iconTextColor: '#9B5B2E',
        badgeLabel: 'Catatan Jurnal',
        detailData: {
          categoryName: 'Jurnal Kebersamaan',
          statusLabel: `Ditulis oleh ${journal.author_name || 'Keluarga'}`,
          description: journal.content || 'Tidak ada tulisan refleksi.',
          navigateTo: '/jurnal',
          navigationLabel: 'Buka Jurnal Keluarga',
        },
      });
    }

    // 4. Calendar Events & Date Nights
    for (const event of calendarEvents) {
      const isoTimestamp = event.updated_at || event.created_at || (event.date ? `${event.date}T${event.time || '12:00'}:00.000Z` : new Date().toISOString());
      const isDateNight = event.is_date_night || event.category === 'Date Night';

      items.push({
        id: `event-${event.id}`,
        sourceType: 'event',
        title: event.title,
        subtitle: `${event.category}${event.location ? ` · ${event.location}` : ''}`,
        timestamp: isoTimestamp,
        relativeTime: getRelativeTimeDesc(isoTimestamp),
        formattedDate: formatDateId(event.date || isoTimestamp.slice(0, 10), 'd MMMM yyyy'),
        icon: isDateNight ? 'Heart' : 'Calendar',
        iconBgColor: isDateNight ? '#FCEAE8' : '#E8EEF5',
        iconTextColor: isDateNight ? '#D1495B' : '#3B6A94',
        badgeLabel: isDateNight ? 'Momen Berdua' : 'Agenda Kalender',
        detailData: {
          categoryName: event.category,
          statusLabel: event.is_completed ? 'Agenda Selesai' : 'Terjadwal',
          description: event.notes || (event.location ? `Lokasi: ${event.location}` : 'Tidak ada catatan tambahan untuk agenda ini.'),
          extraNote: event.time ? `Waktu: ${event.time} WIB` : undefined,
          navigateTo: isDateNight ? '/berdua' : '/kalender',
          navigationLabel: isDateNight ? 'Buka Ruang Berdua' : 'Buka Kalender Keluarga',
        },
      });
    }

    // Sort descending by ISO timestamp
    items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    return items.slice(0, limit);
  }, [
    transactions,
    tasks,
    journalEntries,
    calendarEvents,
    transactionCategories,
    taskCategories,
    wallets,
    limit,
  ]);
}
