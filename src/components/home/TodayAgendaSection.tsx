import React, { useMemo } from 'react';
import { CalendarCheck, CheckCircle2, Circle, Loader2, Plus } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatTime24, getTodayIso } from '../../utils/format';
import { EmptyState } from '../ui/StateFeedback';

export function TodayAgendaSection() {
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const tasks = useFamilyStore((s) => s.tasks);
  const taskCategories = useFamilyStore((s) => s.taskCategories);
  const toggleCalendarEventCompleted = useFamilyStore((s) => s.toggleCalendarEventCompleted);
  const toggleTaskStatus = useFamilyStore((s) => s.toggleTaskStatus);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const todayIso = getTodayIso();

  const todayItems = useMemo(() => {
    const eventsToday = calendarEvents
      .filter((e) => e.date === todayIso)
      .map((e) => ({
        id: e.id,
        kind: 'event' as const,
        title: e.title,
        category: e.category,
        schedule: e.time ? `${formatTime24(e.time)} WIB` : formatDateId(e.date, 'dd/MM/yyyy'),
        isCompleted: e.is_completed,
      }));

    const tasksToday = tasks
      .filter((t) => t.due_date === todayIso)
      .map((t) => {
        const cat = taskCategories.find((c) => c.id === t.category_id);
        return {
          id: t.id,
          kind: 'task' as const,
          title: t.title,
          category: cat?.name || 'Tugas',
          schedule: `PJ: ${t.assignee_name}`,
          isCompleted: t.status === 'Selesai',
        };
      });

    return [...eventsToday, ...tasksToday];
  }, [calendarEvents, tasks, taskCategories, todayIso]);

  const completedCount = todayItems.filter((i) => i.isCompleted).length;
  const totalCount = todayItems.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Agenda Hari Ini</h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              {totalCount > 0
                ? `${completedCount} dari ${totalCount} agenda selesai (${progressPct}%)`
                : 'Jadwal kegiatan dan tugas jatuh tempo hari ini'}
            </p>
          </div>
          {syncStatus === 'saving' && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-[11px] font-semibold border border-[#2A4D3E]/20 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Menyimpan...</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setActiveQuickSheet('agenda')}
          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold hover:bg-[#E8E2D5] transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agenda</span>
        </button>
      </div>

      {totalCount > 0 && (
        <div className="w-full h-2 rounded-full bg-[#F4EFE6] overflow-hidden">
          <div
            className="h-full bg-[#2A4D3E] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {totalCount === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Belum ada agenda hari ini"
          description="Tambahkan jadwal kegiatan keluarga atau tugas harian agar tidak terlewat."
          actionLabel="Buat Agenda Baru"
          onAction={() => setActiveQuickSheet('agenda')}
        />
      ) : (
        <div className="divide-y divide-[#F0EBE1]">
          {todayItems.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
            >
              <button
                type="button"
                onClick={() =>
                  item.kind === 'event'
                    ? toggleCalendarEventCompleted(item.id)
                    : toggleTaskStatus(item.id)
                }
                className="flex items-center gap-3 min-w-0 flex-1 text-left group"
              >
                <div className="min-h-[40px] min-w-[40px] -ml-1 flex items-center justify-center rounded-xl text-[#2A4D3E]">
                  {item.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2A4D3E]" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#84A59D] group-hover:text-[#2A4D3E]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-semibold truncate ${
                      item.isCompleted ? 'line-through text-[#8A968E]' : 'text-[#1E2D24]'
                    }`}
                  >
                    {item.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-[#5C6B62] mt-0.5">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.schedule}</span>
                  </div>
                </div>
              </button>

              <span className="text-xs font-medium text-[#5C6B62] shrink-0">
                {item.isCompleted ? 'Selesai' : 'Aktif'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
