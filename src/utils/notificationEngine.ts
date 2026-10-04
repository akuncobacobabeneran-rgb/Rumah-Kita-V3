import {
  Budget,
  CalendarEvent,
  Debt,
  MaintenanceItem,
  NotificationItem,
  TaskItem,
  Transaction,
  TransactionCategory,
} from '../types';
import { formatDateId, formatRupiah, getTodayIso } from './format';

interface FamilyDataForNotifications {
  familyId: string;
  tasks: TaskItem[];
  calendarEvents: CalendarEvent[];
  maintenanceItems: MaintenanceItem[];
  budgets: Budget[];
  transactions: Transaction[];
  transactionCategories: TransactionCategory[];
  debts: Debt[];
  existingNotifications: NotificationItem[];
}

export function generateAutomatedFamilyNotifications(data: FamilyDataForNotifications): NotificationItem[] {
  const {
    familyId,
    tasks,
    calendarEvents,
    maintenanceItems,
    budgets,
    transactions,
    transactionCategories,
    debts,
    existingNotifications,
  } = data;

  const today = getTodayIso(); // YYYY-MM-DD
  const currentMonth = today.substring(0, 7); // YYYY-MM

  // Calculate tomorrow
  const todayDate = new Date(`${today}T00:00:00`);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  const generatedItems: NotificationItem[] = [];

  // Helper map to preserve user read states
  const existingMap = new Map<string, NotificationItem>();
  for (const n of existingNotifications) {
    if (n && n.id) {
      existingMap.set(n.id, n);
    }
  }

  const pushItem = (item: NotificationItem) => {
    const existing = existingMap.get(item.id);
    if (existing) {
      generatedItems.push({
        ...item,
        is_read: existing.is_read,
        created_at: existing.created_at || item.created_at,
      });
    } else {
      generatedItems.push(item);
    }
  };

  // 1. EVALUATE TASKS
  for (const task of tasks) {
    if (task.status === 'Selesai') continue;
    if (!task.due_date) continue;

    if (task.due_date < today) {
      // Overdue Task
      pushItem({
        id: `alert-task-overdue-${task.id}`,
        family_id: familyId,
        title: `⚠️ Tugas Terlewat: ${task.title}`,
        message: `Batas waktu ${formatDateId(task.due_date)}. Ditugaskan kepada ${task.assignee_name}.`,
        source: 'Task',
        is_read: false,
        priority: 'urgent',
        link_path: '/kalender',
        action_type: 'task',
        action_id: task.id,
        created_at: new Date().toISOString(),
      });
    } else if (task.due_date === today) {
      // Due Today Task
      pushItem({
        id: `alert-task-today-${task.id}-${today}`,
        family_id: familyId,
        title: `📌 Tugas Hari Ini: ${task.title}`,
        message: `Jatuh tempo hari ini untuk ${task.assignee_name}.`,
        source: 'Task',
        is_read: false,
        priority: 'high',
        link_path: '/kalender',
        action_type: 'task',
        action_id: task.id,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 2. EVALUATE CALENDAR EVENTS
  for (const ev of calendarEvents) {
    if (ev.is_completed) continue;
    if (ev.date === today) {
      pushItem({
        id: `alert-event-today-${ev.id}-${today}`,
        family_id: familyId,
        title: ev.is_date_night ? `🕯️ Date Night Hari Ini: ${ev.title}` : `🗓️ Agenda Hari Ini: ${ev.title}`,
        message: `Waktu: ${ev.time || 'Fleksibel'}${ev.location ? ` di ${ev.location}` : ''} (${ev.category})`,
        source: 'Agenda',
        is_read: false,
        priority: 'high',
        link_path: '/kalender',
        action_type: 'event',
        action_id: ev.id,
        created_at: new Date().toISOString(),
      });
    } else if (ev.date === tomorrow) {
      pushItem({
        id: `alert-event-tomorrow-${ev.id}-${tomorrow}`,
        family_id: familyId,
        title: `📅 Agenda Besok: ${ev.title}`,
        message: `Pukul ${ev.time || 'Jadwal hari besok'}${ev.location ? ` di ${ev.location}` : ''}.`,
        source: 'Agenda',
        is_read: false,
        priority: 'normal',
        link_path: '/kalender',
        action_type: 'event',
        action_id: ev.id,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 3. EVALUATE MAINTENANCE ITEMS
  for (const m of maintenanceItems) {
    if (m.status === 'Selesai') continue;
    const scheduleDate = m.scheduled_date || m.reminder_date;
    if (!scheduleDate) continue;

    const diffDays = Math.ceil(
      (new Date(`${scheduleDate}T00:00:00`).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      pushItem({
        id: `alert-maint-overdue-${m.id}`,
        family_id: familyId,
        title: `🛠️ Servis Rumah Terlewat: ${m.title}`,
        message: `Jadwal servis pada ${formatDateId(scheduleDate)} belum dikerjakan.`,
        source: 'Reminder',
        is_read: false,
        priority: 'urgent',
        link_path: '/tugas',
        created_at: new Date().toISOString(),
      });
    } else if (diffDays <= 3) {
      pushItem({
        id: `alert-maint-soon-${m.id}-${scheduleDate}`,
        family_id: familyId,
        title: `🛠️ Jadwal Servis: ${m.title}`,
        message: `Jatuh tempo dalam ${diffDays === 0 ? 'hari ini' : `${diffDays} hari`} (${formatDateId(scheduleDate)}).`,
        source: 'Reminder',
        is_read: false,
        priority: 'high',
        link_path: '/tugas',
        created_at: new Date().toISOString(),
      });
    }
  }

  // 4. EVALUATE BUDGETS & OVERBUDGET STATUS
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'Pengeluaran' && t.date.startsWith(currentMonth)
  );

  const activeBudgets = budgets.filter((b) => b.period_month === currentMonth && b.amount > 0);
  for (const b of activeBudgets) {
    const cat = transactionCategories.find((c) => c.id === b.category_id);
    const catName = cat?.name || 'Kategori Pengeluaran';
    const spent = currentMonthExpenses
      .filter((t) => t.category_id === b.category_id)
      .reduce((sum, t) => sum + t.amount, 0);

    const ratio = spent / b.amount;
    if (ratio > 1) {
      // Overbudget (>100%)
      const overAmount = spent - b.amount;
      pushItem({
        id: `alert-budget-over-${b.id}-${currentMonth}`,
        family_id: familyId,
        title: `🚨 Anggaran Terlampaui: ${catName}`,
        message: `Realisasi ${formatRupiah(spent)} melebihi anggaran ${formatRupiah(b.amount)} (+${formatRupiah(overAmount)} / ${Math.round(ratio * 100)}%).`,
        source: 'Budget',
        is_read: false,
        priority: 'urgent',
        link_path: '/keuangan/anggaran',
        action_type: 'budget',
        action_id: b.id,
        created_at: new Date().toISOString(),
      });
    } else if (ratio >= 0.85) {
      // Warning (>85%)
      pushItem({
        id: `alert-budget-warn-${b.id}-${currentMonth}`,
        family_id: familyId,
        title: `⚠️ Anggaran Menipis: ${catName}`,
        message: `Pengeluaran sudah mencapai ${Math.round(ratio * 100)}% (${formatRupiah(spent)} dari ${formatRupiah(b.amount)}).`,
        source: 'Budget',
        is_read: false,
        priority: 'high',
        link_path: '/keuangan/anggaran',
        action_type: 'budget',
        action_id: b.id,
        created_at: new Date().toISOString(),
      });
    }
  }

  // 5. EVALUATE DEBTS & BILLS
  for (const d of debts) {
    if (d.status === 'Lunas') continue;
    if (!d.due_date) continue;

    const remaining = Math.max(0, d.total_amount - d.paid_amount);
    if (remaining <= 0) continue;

    const diffDays = Math.ceil(
      (new Date(`${d.due_date}T00:00:00`).getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      pushItem({
        id: `alert-debt-overdue-${d.id}`,
        family_id: familyId,
        title: `💸 Tagihan Terlewat: ${d.type} ${d.person_name}`,
        message: `Sisa ${formatRupiah(remaining)} jatuh tempo pada ${formatDateId(d.due_date)}.`,
        source: 'Jatuh tempo',
        is_read: false,
        priority: 'urgent',
        link_path: '/keuangan/utang',
        action_type: 'debt',
        action_id: d.id,
        created_at: new Date().toISOString(),
      });
    } else if (diffDays <= 3) {
      pushItem({
        id: `alert-debt-soon-${d.id}-${d.due_date}`,
        family_id: familyId,
        title: `⏰ Jatuh Tempo: ${d.type} ${d.person_name}`,
        message: `Sisa ${formatRupiah(remaining)} jatuh tempo dalam ${diffDays === 0 ? 'hari ini' : `${diffDays} hari`}.`,
        source: 'Jatuh tempo',
        is_read: false,
        priority: 'high',
        link_path: '/keuangan/utang',
        action_type: 'debt',
        action_id: d.id,
        created_at: new Date().toISOString(),
      });
    }
  }

  // Also retain manual custom or non-alert notifications from existing list
  const generatedIds = new Set(generatedItems.map((g) => g.id));
  for (const old of existingNotifications) {
    if (!old.id.startsWith('alert-') && !generatedIds.has(old.id)) {
      generatedItems.push(old);
    }
  }

  // Sort by priority (urgent -> high -> normal) and created_at
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
  generatedItems.sort((a, b) => {
    const aPri = priorityOrder[a.priority || 'normal'] ?? 2;
    const bPri = priorityOrder[b.priority || 'normal'] ?? 2;
    if (aPri !== bPri) return aPri - bPri;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return generatedItems;
}
