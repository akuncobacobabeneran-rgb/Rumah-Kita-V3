import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowDown,
  ArrowUp,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Edit3,
  GripVertical,
  Loader2,
  Plus,
  Repeat,
  ShoppingCart,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, formatTime24, getTodayIso } from '../../utils/format';
import { PALETTE_COLORS } from '../../components/ui/IconRenderer';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput, Time24Input } from '../../components/ui/DateTimeInputs';
import { CalendarEvent, FrequencyType, TaskCategory, TaskItem } from '../../types';

export function CalendarPage() {
  const navigate = useNavigate();
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const tasks = useFamilyStore((s) => s.tasks);
  const taskCategories = useFamilyStore((s) => s.taskCategories);
  const recurringTransactions = useFamilyStore((s) => s.recurringTransactions);
  const members = useFamilyStore((s) => s.members);
  const profile = useFamilyStore((s) => s.profile);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const addCalendarEvent = useFamilyStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useFamilyStore((s) => s.updateCalendarEvent);
  const toggleCalendarEventCompleted = useFamilyStore((s) => s.toggleCalendarEventCompleted);
  const deleteCalendarEvent = useFamilyStore((s) => s.deleteCalendarEvent);

  const addTaskCategory = useFamilyStore((s) => s.addTaskCategory);
  const updateTaskCategory = useFamilyStore((s) => s.updateTaskCategory);
  const deleteTaskCategory = useFamilyStore((s) => s.deleteTaskCategory);
  const reorderTaskCategories = useFamilyStore((s) => s.reorderTaskCategories);

  const addTask = useFamilyStore((s) => s.addTask);
  const updateTask = useFamilyStore((s) => s.updateTask);
  const toggleTaskStatus = useFamilyStore((s) => s.toggleTaskStatus);
  const deleteTask = useFamilyStore((s) => s.deleteTask);
  const executeRecurringTransactionNow = useFamilyStore((s) => s.executeRecurringTransactionNow);

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentCursorDate, setCurrentCursorDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayIso());

  // Drag and drop state for task categories
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [evTitle, setEvTitle] = useState('');
  const [evCategory, setEvCategory] = useState<CalendarEvent['category']>('Agenda');
  const [evDate, setEvDate] = useState(getTodayIso());
  const [evTime, setEvTime] = useState('19:00');
  const [evLocation, setEvLocation] = useState('');
  const [evNotes, setEvNotes] = useState('');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  // Task Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingTaskCat, setEditingTaskCat] = useState<TaskCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#2A4D3E');
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [tTitle, setTTitle] = useState('');
  const [tDesc, setTDesc] = useState('');
  const [tCatId, setTCatId] = useState('');
  const [tDueDate, setTDueDate] = useState(getTodayIso());
  const [tRecurrence, setTRecurrence] = useState<'Tidak berulang' | FrequencyType>('Tidak berulang');
  const [tAssignee, setTAssignee] = useState('');
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form submitting feedback
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);

  const sortedCategories = useMemo(
    () => [...taskCategories].sort((a, b) => a.sort_order - b.sort_order),
    [taskCategories]
  );

  // Days grid for Monthly or Weekly calendar
  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const start = startOfWeek(startOfMonth(currentCursorDate), { weekStartsOn: 1 });
      const end = endOfWeek(endOfMonth(currentCursorDate), { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    } else {
      const start = startOfWeek(currentCursorDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentCursorDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    }
  }, [viewMode, currentCursorDate]);

  // Activity map by date
  const activityByDate = useMemo(() => {
    const map = new Map<
      string,
      { hasEvent: boolean; hasTask: boolean; hasRecurring: boolean }
    >();

    const ensure = (d: string) => {
      if (!map.has(d)) {
        map.set(d, { hasEvent: false, hasTask: false, hasRecurring: false });
      }
      return map.get(d)!;
    };

    calendarEvents.forEach((ev) => {
      ensure(ev.date).hasEvent = true;
    });
    tasks.forEach((t) => {
      ensure(t.due_date).hasTask = true;
    });
    recurringTransactions.forEach((r) => {
      ensure(r.next_date).hasRecurring = true;
    });

    return map;
  }, [calendarEvents, tasks, recurringTransactions]);

  const selectedDateEvents = useMemo(
    () => calendarEvents.filter((e) => e.date === selectedDateStr),
    [calendarEvents, selectedDateStr]
  );

  const selectedDateTasks = useMemo(
    () => tasks.filter((t) => t.due_date === selectedDateStr),
    [tasks, selectedDateStr]
  );

  const selectedDateRecurring = useMemo(
    () => recurringTransactions.filter((r) => r.next_date === selectedDateStr),
    [recurringTransactions, selectedDateStr]
  );

  const handlePrevPeriod = () => {
    setCurrentCursorDate((prev) =>
      viewMode === 'month' ? subMonths(prev, 1) : subWeeks(prev, 1)
    );
  };

  const handleNextPeriod = () => {
    setCurrentCursorDate((prev) =>
      viewMode === 'month' ? addMonths(prev, 1) : addWeeks(prev, 1)
    );
  };

  // Drag and Drop Handlers for Task Categories
  const handleDragStart = (catId: string) => {
    setDraggedCatId(catId);
  };

  const handleDropOnCategory = (targetCatId: string) => {
    if (!draggedCatId || draggedCatId === targetCatId) return;
    const ids = sortedCategories.map((c) => c.id);
    const fromIdx = ids.indexOf(draggedCatId);
    const toIdx = ids.indexOf(targetCatId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedCatId);
    reorderTaskCategories(ids);
    setDraggedCatId(null);
  };

  const moveCategoryOrder = (catId: string, direction: 'up' | 'down') => {
    const ids = sortedCategories.map((c) => c.id);
    const idx = ids.indexOf(catId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;
    const swapped = [...ids];
    const temp = swapped[idx];
    swapped[idx] = swapped[targetIdx];
    swapped[targetIdx] = temp;
    reorderTaskCategories(swapped);
  };

  // Event CRUD Handlers
  const openCreateEvent = () => {
    setEditingEvent(null);
    setEvTitle('');
    setEvCategory('Agenda');
    setEvDate(selectedDateStr);
    setEvTime('19:00');
    setEvLocation('');
    setEvNotes('');
    setIsSavingEvent(false);
    setIsEventModalOpen(true);
  };

  const openEditEvent = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setEvTitle(ev.title);
    setEvCategory(ev.category);
    setEvDate(ev.date);
    setEvTime(ev.time || '19:00');
    setEvLocation(ev.location || '');
    setEvNotes(ev.notes);
    setIsSavingEvent(false);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    try {
      setIsSavingEvent(true);
      if (editingEvent) {
        await updateCalendarEvent(editingEvent.id, {
          title: evTitle.trim(),
          category: evCategory,
          date: evDate,
          time: evTime,
          location: evLocation.trim(),
          notes: evNotes.trim(),
        });
      } else {
        await addCalendarEvent({
          title: evTitle.trim(),
          category: evCategory,
          date: evDate,
          time: evTime,
          location: evLocation.trim(),
          notes: evNotes.trim(),
          is_completed: false,
          is_date_night: evCategory === 'Date Night',
        });
      }
      setIsSavingEvent(false);
      setIsEventModalOpen(false);
    } catch {
      setIsSavingEvent(false);
    }
  };

  // Category CRUD Handlers
  const openCreateCat = () => {
    setEditingTaskCat(null);
    setCatName('');
    setCatColor('#2A4D3E');
    setIsSavingCat(false);
    setIsCatModalOpen(true);
  };

  const openEditCat = (cat: TaskCategory) => {
    setEditingTaskCat(cat);
    setCatName(cat.name);
    setCatColor(cat.color);
    setIsSavingCat(false);
    setIsCatModalOpen(true);
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      setIsSavingCat(true);
      if (editingTaskCat) {
        await updateTaskCategory(editingTaskCat.id, {
          name: catName.trim(),
          color: catColor,
        });
      } else {
        await addTaskCategory(catName.trim(), catColor);
      }
      setIsSavingCat(false);
      setIsCatModalOpen(false);
    } catch {
      setIsSavingCat(false);
    }
  };

  // Task CRUD Handlers
  const openCreateTask = (defaultCatId?: string) => {
    setEditingTask(null);
    setTTitle('');
    setTDesc('');
    setTCatId(defaultCatId || sortedCategories[0]?.id || '');
    setTDueDate(selectedDateStr);
    setTRecurrence('Tidak berulang');
    setTAssignee(profile?.full_name || members[0]?.name || 'Keluarga');
    setIsSavingTask(false);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (t: TaskItem) => {
    setEditingTask(t);
    setTTitle(t.title);
    setTDesc(t.description);
    setTCatId(t.category_id);
    setTDueDate(t.due_date);
    setTRecurrence(t.recurrence);
    setTAssignee(t.assignee_name);
    setIsSavingTask(false);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    const chosenCat = tCatId || sortedCategories[0]?.id || '';
    try {
      setIsSavingTask(true);
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: tTitle.trim(),
          description: tDesc.trim(),
          category_id: chosenCat,
          due_date: tDueDate,
          recurrence: tRecurrence,
          assignee_name: tAssignee || 'Keluarga',
        });
      } else {
        await addTask({
          title: tTitle.trim(),
          description: tDesc.trim(),
          category_id: chosenCat,
          due_date: tDueDate,
          recurrence: tRecurrence,
          assignee_id: profile?.id || '',
          assignee_name: tAssignee || profile?.full_name || 'Keluarga',
          status: 'Belum selesai',
        });
      }
      setIsSavingTask(false);
      setIsTaskModalOpen(false);
    } catch {
      setIsSavingTask(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div>
            <h1 className="text-lg font-bold text-[#1E2D24]">Kalender & Tugas Keluarga</h1>
            <p className="text-xs text-[#5C6B62]">
              Kelola agenda bulanan/mingguan, daftar tugas, dan jadwal rutin
            </p>
          </div>
          {syncStatus === 'saving' && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-xs font-semibold border border-[#2A4D3E]/20 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Menyimpan...</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/belanja')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#FDF3E1] text-[#9B6B21] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F7E6C4]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Belanja & Menu</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E8E2D5]"
          >
            <Wrench className="w-4 h-4" />
            <span>Maintenance Rumah</span>
          </button>
          <button
            type="button"
            onClick={openCreateEvent}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Event</span>
          </button>
        </div>
      </div>

      {/* 1. KALENDER BULANAN / MINGGUAN */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPeriod}
              aria-label="Periode sebelumnya"
              className="min-h-[38px] min-w-[38px] rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-[#1E2D24] capitalize min-w-[140px] text-center">
              {format(currentCursorDate, 'MMMM yyyy', { locale: localeId })}
            </h2>
            <button
              type="button"
              onClick={handleNextPeriod}
              aria-label="Periode berikutnya"
              className="min-h-[38px] min-w-[38px] rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#F4EFE6] rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'month' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
              }`}
            >
              Mingguan
            </button>
          </div>
        </div>

        {/* Day of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#5C6B62]">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day) => {
            const iso = format(day, 'yyyy-MM-dd');
            const isSelected = iso === selectedDateStr;
            const isToday = iso === getTodayIso();
            const inMonth = isSameMonth(day, currentCursorDate);
            const activity = activityByDate.get(iso);

            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelectedDateStr(iso)}
                className={`min-h-[48px] sm:min-h-[56px] rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2A4D3E] text-white border-[#2A4D3E] shadow-xs'
                    : isToday
                    ? 'bg-[#F4EFE6] text-[#1E2D24] border-[#D4A359]'
                    : inMonth
                    ? 'bg-[#FAF7F2] text-[#1E2D24] border-transparent hover:border-[#E8E2D5]'
                    : 'bg-transparent text-[#8A968E] border-transparent'
                }`}
              >
                <span className="text-xs font-mono-num font-bold">{format(day, 'd')}</span>

                <div className="flex items-center gap-1 h-2">
                  {activity?.hasEvent && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#F4D393]' : 'bg-[#D4A359]'
                      }`}
                    />
                  )}
                  {activity?.hasTask && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-[#2A4D3E]'
                      }`}
                    />
                  )}
                  {activity?.hasRecurring && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-[#F7B2A1]' : 'bg-[#E07A5F]'
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#F0EBE1] text-[11px] text-[#5C6B62]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4A359]" />
            Event & Date Night
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2A4D3E]" />
            Task Keluarga
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
            Transaksi Rutin
          </span>
        </div>
      </section>

      {/* 2. AKTIVITAS PADA TANGGAL TERPILIH */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">
              Aktivitas Tanggal {formatDateId(selectedDateStr)}
            </h2>
            <p className="text-xs text-[#5C6B62]">
              {selectedDateEvents.length} Event · {selectedDateTasks.length} Task ·{' '}
              {selectedDateRecurring.length} Transaksi Rutin
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateEvent}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold"
            >
              + Event
            </button>
            <button
              type="button"
              onClick={() => openCreateTask()}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              + Task
            </button>
          </div>
        </div>

        {selectedDateEvents.length === 0 &&
        selectedDateTasks.length === 0 &&
        selectedDateRecurring.length === 0 ? (
          <p className="text-xs text-[#5C6B62] text-center py-6 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#DFD7C8]">
            Tidak ada jadwal event, task, atau transaksi rutin pada tanggal ini.
          </p>
        ) : (
          <div className="space-y-2.5">
            {selectedDateEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleCalendarEventCompleted(ev.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  {ev.is_completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2A4D3E] shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#D4A359] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        ev.is_completed ? 'line-through text-[#8A968E]' : 'text-[#1E2D24]'
                      }`}
                    >
                      {ev.title}
                    </p>
                    <p className="text-xs text-[#5C6B62]">
                      {ev.category} {ev.time ? `· ${formatTime24(ev.time)} WIB` : ''}{' '}
                      {ev.location ? `· ${ev.location}` : ''}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditEvent(ev)}
                    aria-label="Edit event"
                    className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#1E2D24]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingEventId(ev.id)}
                    aria-label="Hapus event"
                    className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#C84B31]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {selectedDateTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleTaskStatus(t.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                >
                  {t.status === 'Selesai' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#2A4D3E] shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#84A59D] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-bold truncate ${
                        t.status === 'Selesai' ? 'line-through text-[#8A968E]' : 'text-[#1E2D24]'
                      }`}
                    >
                      {t.title}
                    </p>
                    <p className="text-xs text-[#5C6B62]">
                      Task · PJ: {t.assignee_name} · {t.recurrence}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditTask(t)}
                    aria-label="Edit task"
                    className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#1E2D24]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingTaskId(t.id)}
                    aria-label="Hapus task"
                    className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#C84B31]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {selectedDateRecurring.map((r) => (
              <div
                key={r.id}
                onClick={() => navigate('/keuangan/rutin')}
                className="p-3.5 rounded-2xl bg-[#FDF3E1] border border-[#E5DEC9] flex flex-wrap items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Repeat className="w-4 h-4 text-[#B88228] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1E2D24] truncate">{r.name}</p>
                    <p className="text-xs text-[#5C6B62]">
                      Transaksi Rutin ({r.frequency}) · {formatRupiah(r.amount, hideNumbers)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    executeRecurringTransactionNow(r.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#213D31] shrink-0 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Catat Sekarang</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. KATEGORI TUGAS & DAFTAR TASK (WITH DRAG-AND-DROP REORDERING) */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-3xl border border-[#E8E2D5] p-5">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Kategori Tugas & Checklist Keluarga</h2>
            <p className="text-xs text-[#5C6B62]">
              Tarik kartu kategori (drag & drop) atau gunakan tombol panah untuk mengubah urutan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCreateCat}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold hover:bg-[#E8E2D5]"
            >
              + Kategori
            </button>
            <button
              type="button"
              onClick={() => openCreateTask()}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              + Task Baru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedCategories.map((cat, idx) => {
            const catTasks = tasks.filter((t) => t.category_id === cat.id);
            const doneCount = catTasks.filter((t) => t.status === 'Selesai').length;
            const totalCount = catTasks.length;
            const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

            return (
              <div
                key={cat.id}
                draggable
                onDragStart={() => handleDragStart(cat.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnCategory(cat.id)}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4 transition-shadow hover:shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="cursor-grab active:cursor-grabbing text-[#8A968E] hover:text-[#1E2D24] p-1"
                      title="Geser untuk mengubah urutan kategori"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-[#1E2D24] truncate">{cat.name}</h3>
                      <p className="text-[11px] text-[#5C6B62]">
                        {doneCount}/{totalCount} selesai ({pct}%)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCategoryOrder(cat.id, 'up')}
                      aria-label="Geser urutan ke atas"
                      className="p-1.5 rounded-lg text-[#5C6B62] hover:bg-[#F4EFE6] disabled:opacity-30"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sortedCategories.length - 1}
                      onClick={() => moveCategoryOrder(cat.id, 'down')}
                      aria-label="Geser urutan ke bawah"
                      className="p-1.5 rounded-lg text-[#5C6B62] hover:bg-[#F4EFE6] disabled:opacity-30"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openCreateTask(cat.id)}
                      aria-label="Tambah task di kategori ini"
                      className="p-1.5 rounded-lg text-[#2A4D3E] hover:bg-[#F4EFE6]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCat(cat)}
                      aria-label="Edit kategori task"
                      className="p-1.5 rounded-lg text-[#5C6B62] hover:bg-[#F4EFE6]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCatId(cat.id)}
                      aria-label="Hapus kategori task"
                      className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-[#F4EFE6] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: cat.color }}
                  />
                </div>

                {/* Task items in this category */}
                {catTasks.length === 0 ? (
                  <p className="text-xs text-[#5C6B62] py-3 text-center bg-[#FAF7F2] rounded-2xl">
                    Belum ada task di kategori ini.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F0EBE1]">
                    {catTasks.map((t) => (
                      <div
                        key={t.id}
                        className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(t.id)}
                          className="flex items-start gap-2.5 min-w-0 flex-1 text-left"
                        >
                          <div className="mt-0.5 text-[#2A4D3E] shrink-0">
                            {t.status === 'Selesai' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#2A4D3E]" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#84A59D]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold ${
                                t.status === 'Selesai'
                                  ? 'line-through text-[#8A968E]'
                                  : 'text-[#1E2D24]'
                              }`}
                            >
                              {t.title}
                            </p>
                            <p className="text-[11px] text-[#5C6B62]">
                              {formatDateId(t.due_date, 'd MMM')} · {t.assignee_name}
                              {t.recurrence !== 'Tidak berulang' ? ` · ${t.recurrence}` : ''}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditTask(t)}
                            aria-label="Edit task"
                            className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#1E2D24]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTaskId(t.id)}
                            aria-label="Hapus task"
                            className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#C84B31]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: ADD / EDIT EVENT */}
      <ResponsiveModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={editingEvent ? 'Edit Event Kalender' : 'Tambah Event Kalender'}
      >
        <form onSubmit={handleSaveEvent} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Event</label>
            <input
              type="text"
              required
              value={evTitle}
              onChange={(e) => setEvTitle(e.target.value)}
              placeholder="Contoh: Makan Malam Keluarga"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={evDate} onChange={setEvDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Waktu (24 Jam)
              </label>
              <Time24Input value={evTime} onChange={setEvTime} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={evCategory}
                onChange={(e) => setEvCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Agenda">Agenda</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Date Night">Date Night</option>
                <option value="Penting">Penting</option>
                <option value="Acara">Acara</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Lokasi</label>
              <input
                type="text"
                value={evLocation}
                onChange={(e) => setEvLocation(e.target.value)}
                placeholder="Lokasi acara"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <textarea
              rows={2}
              value={evNotes}
              onChange={(e) => setEvNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEventModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingEvent}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingEvent ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Event</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT TASK CATEGORY */}
      <ResponsiveModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingTaskCat ? 'Edit Kategori Tugas' : 'Tambah Kategori Tugas'}
      >
        <form onSubmit={handleSaveCat} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Nama Kategori Tugas
            </label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Kebersihan Rumah, Persiapan Sekolah"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Warna</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCatColor(c.value)}
                  className={`w-7 h-7 rounded-lg border-2 ${
                    catColor === c.value ? 'border-[#1E2D24] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCatModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingCat}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingCat ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Kategori</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT TASK */}
      <ResponsiveModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Tambah Task Baru'}
      >
        <form onSubmit={handleSaveTask} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Task</label>
            <input
              type="text"
              required
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              placeholder="Contoh: Beli galon air & beras"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={tCatId}
                onChange={(e) => setTCatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={tDueDate} onChange={setTDueDate} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Pengulangan</label>
              <select
                value={tRecurrence}
                onChange={(e) => setTRecurrence(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Tidak berulang">Tidak berulang</option>
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Penanggung Jawab
              </label>
              <select
                value={tAssignee}
                onChange={(e) => setTAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={tDesc}
              onChange={(e) => setTDesc(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingTask}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingTask ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Task</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingEventId)}
        onClose={() => setDeletingEventId(null)}
        onConfirm={() => {
          if (deletingEventId) deleteCalendarEvent(deletingEventId);
        }}
        title="Hapus Event?"
        description="Agenda ini akan dihapus dari kalender keluarga."
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCatId)}
        onClose={() => setDeletingCatId(null)}
        onConfirm={() => {
          if (deletingCatId) deleteTaskCategory(deletingCatId);
        }}
        title="Hapus Kategori Tugas?"
        description="Menghapus kategori ini juga akan menghapus daftar task di dalamnya."
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTaskId)}
        onClose={() => setDeletingTaskId(null)}
        onConfirm={() => {
          if (deletingTaskId) deleteTask(deletingTaskId);
        }}
        title="Hapus Task?"
        description="Tugas ini akan dihapus secara permanen."
      />
    </div>
  );
}
