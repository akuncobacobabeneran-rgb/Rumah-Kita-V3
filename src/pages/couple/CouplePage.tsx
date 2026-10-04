import React, { useMemo, useState } from 'react';
import {
  CalendarHeart,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Heart,
  MapPin,
  MessageCircleHeart,
  Plus,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatTime24, getTodayIso } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput, Time24Input } from '../../components/ui/DateTimeInputs';
import { EmptyState } from '../../components/ui/StateFeedback';
import { CalendarEvent, ConversationCategory, CoupleMoment } from '../../types';

export function CouplePage() {
  const family = useFamilyStore((s) => s.family);
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const coupleMoments = useFamilyStore((s) => s.coupleMoments);
  const conversationCards = useFamilyStore((s) => s.conversationCards);
  const coupleBucketItems = useFamilyStore((s) => s.coupleBucketItems);

  const updateFamily = useFamilyStore((s) => s.updateFamily);
  const addCalendarEvent = useFamilyStore((s) => s.addCalendarEvent);
  const updateCalendarEvent = useFamilyStore((s) => s.updateCalendarEvent);
  const deleteCalendarEvent = useFamilyStore((s) => s.deleteCalendarEvent);

  const addCoupleMoment = useFamilyStore((s) => s.addCoupleMoment);
  const updateCoupleMoment = useFamilyStore((s) => s.updateCoupleMoment);
  const deleteCoupleMoment = useFamilyStore((s) => s.deleteCoupleMoment);

  const toggleConversationDiscussed = useFamilyStore((s) => s.toggleConversationDiscussed);
  const saveConversationAnswerNotes = useFamilyStore((s) => s.saveConversationAnswerNotes);
  const toggleConversationFavorite = useFamilyStore((s) => s.toggleConversationFavorite);
  const addConversationCard = useFamilyStore((s) => s.addConversationCard);

  const addCoupleBucketItem = useFamilyStore((s) => s.addCoupleBucketItem);
  const updateCoupleBucketItem = useFamilyStore((s) => s.updateCoupleBucketItem);
  const toggleCoupleBucketAchieved = useFamilyStore((s) => s.toggleCoupleBucketAchieved);
  const deleteCoupleBucketItem = useFamilyStore((s) => s.deleteCoupleBucketItem);

  // Edit Couple Info Modal
  const [isCoupleInfoOpen, setIsCoupleInfoOpen] = useState(false);
  const [p1Name, setP1Name] = useState(family?.partner_1_name || 'Suami');
  const [p2Name, setP2Name] = useState(family?.partner_2_name || 'Istri');
  const [p1Avatar, setP1Avatar] = useState(family?.partner_1_avatar || '');
  const [p2Avatar, setP2Avatar] = useState(family?.partner_2_avatar || '');
  const [motto, setMotto] = useState(family?.couple_motto || '');
  const [annivDate, setAnnivDate] = useState(family?.anniversary_date || '');

  // Date Night Modal
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [editingDateEvent, setEditingDateEvent] = useState<CalendarEvent | null>(null);
  const [dnTitle, setDnTitle] = useState('');
  const [dnDate, setDnDate] = useState(getTodayIso());
  const [dnTime, setDnTime] = useState('19:30');
  const [dnLocation, setDnLocation] = useState('');
  const [dnNotes, setDnNotes] = useState('');
  const [deletingDateId, setDeletingDateId] = useState<string | null>(null);

  // Love Timeline Moment Modal
  const [isMomentModalOpen, setIsMomentModalOpen] = useState(false);
  const [editingMoment, setEditingMoment] = useState<CoupleMoment | null>(null);
  const [mTitle, setMTitle] = useState('');
  const [mDate, setMDate] = useState(getTodayIso());
  const [mStory, setMStory] = useState('');
  const [mPhoto, setMPhoto] = useState('');
  const [deletingMomentId, setDeletingMomentId] = useState<string | null>(null);

  // Conversation Cards State
  const [selectedCardCat, setSelectedCardCat] = useState<
    'Semua' | 'Belum Dibahas' | 'Sudah Dibahas' | 'Favorit' | ConversationCategory
  >('Semua');
  const [cardCursor, setCardCursor] = useState(0);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newCardCat, setNewCardCat] = useState<ConversationCategory>('Hubungan');
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [isEditingCardNotes, setIsEditingCardNotes] = useState(false);
  const [cardNotesDraft, setCardNotesDraft] = useState('');

  // Bucket List State
  const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [bTitle, setBTitle] = useState('');
  const [bCategory, setBCategory] = useState<
    'Liburan & Perjalanan' | 'Rumah & Kehidupan' | 'Pengalaman Berdua' | 'Ibadah & Spiritual' | 'Romantis'
  >('Liburan & Perjalanan');
  const [bTargetDate, setBTargetDate] = useState('');
  const [bNotes, setBNotes] = useState('');
  const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);

  const dateNights = useMemo(
    () =>
      calendarEvents
        .filter((e) => e.category === 'Date Night' || e.is_date_night)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [calendarEvents]
  );

  const sortedMoments = useMemo(
    () => [...coupleMoments].sort((a, b) => b.date.localeCompare(a.date)),
    [coupleMoments]
  );

  const filteredCards = useMemo(() => {
    if (selectedCardCat === 'Semua') return conversationCards;
    if (selectedCardCat === 'Belum Dibahas')
      return conversationCards.filter((c) => !c.is_discussed);
    if (selectedCardCat === 'Sudah Dibahas')
      return conversationCards.filter((c) => c.is_discussed);
    if (selectedCardCat === 'Favorit') return conversationCards.filter((c) => c.is_favorite);
    return conversationCards.filter((c) => c.category === selectedCardCat);
  }, [conversationCards, selectedCardCat]);

  const safeCardIndex =
    filteredCards.length > 0
      ? ((cardCursor % filteredCards.length) + filteredCards.length) % filteredCards.length
      : 0;
  const activeCard = filteredCards.length > 0 ? filteredCards[safeCardIndex] : null;

  const discussedCount = conversationCards.filter((c) => c.is_discussed).length;

  const daysTogether = useMemo(() => {
    if (!family?.anniversary_date) return null;
    try {
      const diff = differenceInDays(new Date(), parseISO(family.anniversary_date));
      return diff >= 0 ? diff : null;
    } catch {
      return null;
    }
  }, [family?.anniversary_date]);

  const handleSaveCoupleInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateFamily({
      partner_1_name: p1Name.trim() || 'Pasangan 1',
      partner_2_name: p2Name.trim() || 'Pasangan 2',
      partner_1_avatar: p1Avatar.trim() || undefined,
      partner_2_avatar: p2Avatar.trim() || undefined,
      couple_motto: motto.trim(),
      anniversary_date: annivDate || undefined,
    });
    setIsCoupleInfoOpen(false);
  };

  const openCreateDateNight = () => {
    setEditingDateEvent(null);
    setDnTitle('');
    setDnDate(getTodayIso());
    setDnTime('19:30');
    setDnLocation('');
    setDnNotes('');
    setIsDateModalOpen(true);
  };

  const openEditDateNight = (ev: CalendarEvent) => {
    setEditingDateEvent(ev);
    setDnTitle(ev.title);
    setDnDate(ev.date);
    setDnTime(ev.time || '19:30');
    setDnLocation(ev.location || '');
    setDnNotes(ev.notes);
    setIsDateModalOpen(true);
  };

  const handleSaveDateNight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnTitle.trim()) return;
    if (editingDateEvent) {
      await updateCalendarEvent(editingDateEvent.id, {
        title: dnTitle.trim(),
        category: 'Date Night',
        date: dnDate,
        time: dnTime,
        location: dnLocation.trim(),
        notes: dnNotes.trim(),
        is_date_night: true,
      });
    } else {
      await addCalendarEvent({
        title: dnTitle.trim(),
        category: 'Date Night',
        date: dnDate,
        time: dnTime,
        location: dnLocation.trim(),
        notes: dnNotes.trim(),
        is_completed: false,
        is_date_night: true,
      });
    }
    setIsDateModalOpen(false);
  };

  const openCreateMoment = () => {
    setEditingMoment(null);
    setMTitle('');
    setMDate(getTodayIso());
    setMStory('');
    setMPhoto('');
    setIsMomentModalOpen(true);
  };

  const openEditMoment = (m: CoupleMoment) => {
    setEditingMoment(m);
    setMTitle(m.title);
    setMDate(m.date);
    setMStory(m.story);
    setMPhoto(m.photo_url || '');
    setIsMomentModalOpen(true);
  };

  const handleSaveMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mTitle.trim() || !mStory.trim()) return;
    if (editingMoment) {
      await updateCoupleMoment(editingMoment.id, {
        title: mTitle.trim(),
        date: mDate,
        story: mStory.trim(),
        photo_url: mPhoto.trim() || undefined,
      });
    } else {
      await addCoupleMoment({
        title: mTitle.trim(),
        date: mDate,
        story: mStory.trim(),
        photo_url: mPhoto.trim() || undefined,
      });
    }
    setIsMomentModalOpen(false);
  };

  const handleSaveNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardQuestion.trim()) return;
    await addConversationCard(newCardCat, newCardQuestion.trim());
    setNewCardQuestion('');
    setIsAddCardOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER BERDUA & PASANGAN */}
      <section className="rounded-3xl bg-gradient-to-br from-[#9D8189] via-[#B56D7E] to-[#7C5D68] text-white p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#F9EBF0]">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Ruang Berdua</span>
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-1">Berdua</h1>
            <p className="text-xs text-white/85 mt-0.5">
              Rawat keintiman, obrolan hangat, dan kenangan perjalanan cinta kalian
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setP1Name(family?.partner_1_name || 'Suami');
              setP2Name(family?.partner_2_name || 'Istri');
              setP1Avatar(family?.partner_1_avatar || '');
              setP2Avatar(family?.partner_2_avatar || '');
              setMotto(family?.couple_motto || '');
              setAnnivDate(family?.anniversary_date || '');
              setIsCoupleInfoOpen(true);
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold text-white flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Pasangan</span>
          </button>
        </div>

        {/* Couple Avatars & Names */}
        <div className="flex items-center justify-center gap-5 py-2">
          <div className="flex flex-col items-center text-center">
            {family?.partner_1_avatar ? (
              <img
                src={family.partner_1_avatar}
                alt={family.partner_1_name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xl font-bold">
                {(family?.partner_1_name || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold mt-2">{family?.partner_1_name || 'Suami'}</span>
          </div>

          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#F4D393] fill-current" />
          </div>

          <div className="flex flex-col items-center text-center">
            {family?.partner_2_avatar ? (
              <img
                src={family.partner_2_avatar}
                alt={family.partner_2_name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-xl font-bold">
                {(family?.partner_2_name || 'I').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm font-bold mt-2">{family?.partner_2_name || 'Istri'}</span>
          </div>
        </div>
      </section>

      {/* 2. CARD "KITA, HARI INI" */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D88C9A]" />
            <h2 className="text-sm font-bold text-[#1E2D24]">Kita, hari ini</h2>
          </div>
          <span className="text-xs text-[#5C6B62]">{formatDateId(getTodayIso())}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#1E2D24]">
              "{family?.couple_motto || 'Bertumbuh bersama dalam hangatnya keluarga'}"
            </p>
            <p className="text-xs text-[#5C6B62]">
              {daysTogether !== null
                ? `Telah melangkah bersama selama ${daysTogether} hari sejak ${formatDateId(
                    family?.anniversary_date || ''
                  )}.`
                : `${discussedCount} topik obrolan mendalam telah dibahas bersama · ${sortedMoments.length} momen kenangan tersimpan.`}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-center">
              <span className="block font-mono-num font-bold text-sm text-[#2A4D3E]">
                {dateNights.length}
              </span>
              <span className="text-[11px] text-[#5C6B62]">Date Night</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-center">
              <span className="block font-mono-num font-bold text-sm text-[#B55B73]">
                {sortedMoments.length}
              </span>
              <span className="text-[11px] text-[#5C6B62]">Momen</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CONVERSATION CARDS */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">
              Conversation Cards ({conversationCards.length} Kartu)
            </h2>
            <p className="text-xs text-[#5C6B62]">
              {discussedCount} dari {conversationCards.length} kartu telah dibahas · 6 Kategori
              Deep Talk Pasangan
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddCardOpen(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pertanyaan Baru</span>
          </button>
        </div>

        {/* Category & Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              'Semua',
              'Belum Dibahas',
              'Sudah Dibahas',
              'Favorit',
              'Hubungan',
              'Komunikasi',
              'Masa depan',
              'Keuangan',
              'Keluarga',
              'Fun',
            ] as const
          ).map((cat) => {
            const count =
              cat === 'Semua'
                ? conversationCards.length
                : cat === 'Belum Dibahas'
                ? conversationCards.filter((c) => !c.is_discussed).length
                : cat === 'Sudah Dibahas'
                ? conversationCards.filter((c) => c.is_discussed).length
                : cat === 'Favorit'
                ? conversationCards.filter((c) => c.is_favorite).length
                : conversationCards.filter((c) => c.category === cat).length;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCardCat(cat);
                  setCardCursor(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCardCat === cat
                    ? 'bg-[#2A4D3E] text-white'
                    : 'bg-[#FAF7F2] border border-[#E8E2D5] text-[#5C6B62]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono-num px-1.5 py-0.5 rounded-md ${
                    selectedCardCat === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-[#E8E2D5]/70 text-[#1E2D24]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {activeCard ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2A4D3E] to-[#1E3A2E] text-white space-y-5">
            <div className="flex items-center justify-between text-xs text-[#F4D393]">
              <span className="font-semibold flex items-center gap-1.5">
                <MessageCircleHeart className="w-4 h-4" />
                <span>Kategori: {activeCard.category}</span>
              </span>
              <span className="font-mono-num">
                Kartu {safeCardIndex + 1} / {filteredCards.length}
              </span>
            </div>

            <p className="text-base sm:text-lg font-semibold leading-relaxed">
              "{activeCard.question}"
            </p>

            {/* Saved Answer Notes or Note Editor */}
            {isEditingCardNotes ? (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 space-y-2.5">
                <label className="block text-xs font-semibold text-[#F4D393]">
                  Catatan Jawaban / Kesimpulan Obrolan Suami & Istri:
                </label>
                <textarea
                  rows={3}
                  value={cardNotesDraft}
                  onChange={(e) => setCardNotesDraft(e.target.value)}
                  placeholder="Tulis hasil obrolan, harapan, atau kesepakatan berdua dari pertanyaan ini..."
                  className="w-full px-3 py-2 rounded-xl bg-white text-[#1E2D24] text-xs leading-relaxed"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCardNotes(false)}
                    className="min-h-[36px] px-3 py-1 rounded-xl bg-white/15 text-white text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await saveConversationAnswerNotes(activeCard.id, cardNotesDraft);
                      setIsEditingCardNotes(false);
                    }}
                    className="min-h-[36px] px-3.5 py-1 rounded-xl bg-[#D4A359] text-[#1E2D24] text-xs font-bold"
                  >
                    Simpan Catatan
                  </button>
                </div>
              </div>
            ) : activeCard.answer_notes ? (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#F4D393]">
                  <span className="font-semibold">Catatan Jawaban Pasangan</span>
                  <div className="flex items-center gap-2">
                    {activeCard.discussed_at && (
                      <span className="font-mono-num">
                        Dibahas: {formatDateId(activeCard.discussed_at.slice(0, 10))}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCardNotesDraft(activeCard.answer_notes || '');
                        setIsEditingCardNotes(true);
                      }}
                      className="underline font-semibold text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/95 leading-relaxed whitespace-pre-line">
                  {activeCard.answer_notes}
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/15">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleConversationDiscussed(activeCard.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeCard.is_discussed
                      ? 'bg-[#D4A359] text-[#1E2D24]'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{activeCard.is_discussed ? 'Sudah Dibahas' : 'Tandai Dibahas'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCardNotesDraft(activeCard.answer_notes || '');
                    setIsEditingCardNotes(true);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/15 text-white hover:bg-white/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{activeCard.answer_notes ? 'Edit Jawaban' : 'Catat Jawaban'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleConversationFavorite(activeCard.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    activeCard.is_favorite
                      ? 'bg-[#D88C9A] text-[#1E2D24]'
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  <span>Favorit</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCardNotes(false);
                    setCardCursor((prev) => prev - 1);
                  }}
                  aria-label="Kartu sebelumnya"
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-semibold flex items-center gap-1 hover:bg-white/25"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCardNotes(false);
                    if (filteredCards.length <= 1) return;
                    let nextIdx = Math.floor(Math.random() * filteredCards.length);
                    if (nextIdx === safeCardIndex) {
                      nextIdx = (nextIdx + 1) % filteredCards.length;
                    }
                    setCardCursor(nextIdx);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#D4A359] text-[#1E2D24] text-xs font-bold flex items-center gap-1.5 hover:bg-[#DFB36B]"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Acak</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditingCardNotes(false);
                    setCardCursor((prev) => prev + 1);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white text-[#1E2D24] text-xs font-bold flex items-center gap-1 hover:bg-[#F4EFE6]"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#5C6B62] text-center py-6">
            Belum ada kartu pada filter ini.
          </p>
        )}
      </section>

      {/* 4. DATE NIGHT */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Agenda Date Night</h2>
            <p className="text-xs text-[#5C6B62]">
              Otomatis tersinkronisasi dengan halaman Kalender Keluarga
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateDateNight}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Date Night</span>
          </button>
        </div>

        {dateNights.length === 0 ? (
          <EmptyState
            icon={CalendarHeart}
            title="Belum ada jadwal Date Night"
            description="Rencanakan waktu berkualitas berdua agar hubungan selalu hangat."
            actionLabel="Rencanakan Date Night"
            onAction={openCreateDateNight}
          />
        ) : (
          <div className="space-y-2.5">
            {dateNights.map((dn) => (
              <div
                key={dn.id}
                className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-start justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6B62]">
                    <span className="font-semibold text-[#B55B73]">
                      {formatDateId(dn.date, 'EEEE, dd/MM/yyyy')}
                    </span>
                    {dn.time && (
                      <>
                        <span>·</span>
                        <span>{formatTime24(dn.time)} WIB</span>
                      </>
                    )}
                    {dn.location && (
                      <span className="inline-flex items-center gap-1">
                        · <MapPin className="w-3 h-3" /> {dn.location}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#1E2D24]">{dn.title}</h3>
                  {dn.notes && <p className="text-xs text-[#5C6B62]">{dn.notes}</p>}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditDateNight(dn)}
                    aria-label="Edit date night"
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-white"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingDateId(dn.id)}
                    aria-label="Hapus date night"
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4B. BUCKET LIST & IMPIAN PASANGAN */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Bucket List & Wish List Berdua</h2>
            <p className="text-xs text-[#5C6B62]">
              {coupleBucketItems.filter((i) => i.is_achieved).length} dari{' '}
              {coupleBucketItems.length} impian pasangan telah terwujud
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingBucketId(null);
              setBTitle('');
              setBCategory('Liburan & Perjalanan');
              setBTargetDate('');
              setBNotes('');
              setIsBucketModalOpen(true);
            }}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Impian</span>
          </button>
        </div>

        {coupleBucketItems.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="Belum ada daftar Bucket List pasangan"
            description="Tulis daftar impian yang ingin kalian wujudkan bersama, seperti destinasi liburan, ibadah, atau cita-cita rumah tangga."
            actionLabel="Tulis Impian Pertama"
            onAction={() => {
              setEditingBucketId(null);
              setBTitle('');
              setBCategory('Liburan & Perjalanan');
              setBTargetDate('');
              setBNotes('');
              setIsBucketModalOpen(true);
            }}
          />
        ) : (
          <div className="space-y-2.5">
            {coupleBucketItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.is_achieved
                    ? 'bg-[#F4F9F5] border-[#C6E2D1]'
                    : 'bg-[#FAF7F2] border-[#E8E2D5]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCoupleBucketAchieved(item.id)}
                    className={`mt-0.5 min-h-[36px] min-w-[36px] rounded-xl flex items-center justify-center border transition-colors ${
                      item.is_achieved
                        ? 'bg-[#2A4D3E] border-[#2A4D3E] text-white'
                        : 'bg-white border-[#C7BFA8] text-transparent hover:border-[#2A4D3E]'
                    }`}
                    aria-label="Tandai impian tercapai"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6B62]">
                      <span className="font-semibold text-[#B55B73]">{item.category}</span>
                      {item.target_date && (
                        <>
                          <span>·</span>
                          <span className="font-mono-num">
                            Target: {formatDateId(item.target_date)}
                          </span>
                        </>
                      )}
                      {item.is_achieved && item.achieved_date && (
                        <>
                          <span>·</span>
                          <span className="font-mono-num font-semibold text-[#2A6F4E]">
                            Tercapai: {formatDateId(item.achieved_date)}
                          </span>
                        </>
                      )}
                    </div>
                    <h3
                      className={`text-sm font-bold ${
                        item.is_achieved ? 'line-through text-[#5C6B62]' : 'text-[#1E2D24]'
                      }`}
                    >
                      {item.title}
                    </h3>
                    {item.notes && <p className="text-xs text-[#5C6B62]">{item.notes}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {item.is_achieved && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMoment(null);
                        setMTitle(`Impian Terwujud: ${item.title}`);
                        setMDate(item.achieved_date || getTodayIso());
                        setMStory(
                          item.notes ||
                            `Alhamdulillah salah satu Bucket List kami (${item.title}) telah tercapai bersama.`
                        );
                        setMPhoto('');
                        setIsMomentModalOpen(true);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-[#C6E2D1] text-[#2A4D3E] text-xs font-semibold hover:bg-[#EBF5EE]"
                    >
                      + Ke Love Timeline
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBucketId(item.id);
                      setBTitle(item.title);
                      setBCategory(item.category);
                      setBTargetDate(item.target_date || '');
                      setBNotes(item.notes || '');
                      setIsBucketModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-white"
                    aria-label="Edit bucket list"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingBucketId(item.id)}
                    className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-white"
                    aria-label="Hapus bucket list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. LOVE TIMELINE */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Love Timeline</h2>
            <p className="text-xs text-[#5C6B62]">
              Jejak kenangan dan cerita indah perjalanan kalian berdua
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateMoment}
            className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Momen</span>
          </button>
        </div>

        {sortedMoments.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Belum ada cerita di Love Timeline"
            description="Abadikan momen berharga seperti hari pernikahan, pindah rumah, atau perjalanan berkesan."
            actionLabel="Tulis Momen Pertama"
            onAction={openCreateMoment}
          />
        ) : (
          <div className="relative pl-5 border-l-2 border-[#E8E2D5] space-y-5">
            {sortedMoments.map((m) => (
              <div key={m.id} className="relative">
                <span className="w-3 h-3 rounded-full bg-[#D88C9A] ring-4 ring-white absolute -left-[27px] top-1.5" />
                <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-[#B55B73]">
                        {formatDateId(m.date)}
                      </span>
                      <h3 className="text-sm font-bold text-[#1E2D24] mt-0.5">{m.title}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditMoment(m)}
                        aria-label="Edit momen"
                        className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#1E2D24]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingMomentId(m.id)}
                        aria-label="Hapus momen"
                        className="p-1.5 rounded-lg text-[#5C6B62] hover:text-[#C84B31]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-[#5C6B62] leading-relaxed whitespace-pre-line">
                    {m.story}
                  </p>
                  {m.photo_url && (
                    <img
                      src={m.photo_url}
                      alt={m.title}
                      referrerPolicy="no-referrer"
                      className="w-full max-h-60 object-cover rounded-xl border border-[#E8E2D5]"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL: EDIT COUPLE INFO */}
      <ResponsiveModal
        isOpen={isCoupleInfoOpen}
        onClose={() => setIsCoupleInfoOpen(false)}
        title="Profil Pasangan Berdua"
      >
        <form onSubmit={handleSaveCoupleInfo} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Nama Pasangan 1
              </label>
              <input
                type="text"
                required
                value={p1Name}
                onChange={(e) => setP1Name(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Nama Pasangan 2
              </label>
              <input
                type="text"
                required
                value={p2Name}
                onChange={(e) => setP2Name(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                URL Foto Pasangan 1 (Opsional)
              </label>
              <input
                type="url"
                value={p1Avatar}
                onChange={(e) => setP1Avatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                URL Foto Pasangan 2 (Opsional)
              </label>
              <input
                type="url"
                value={p2Avatar}
                onChange={(e) => setP2Avatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Tanggal Pernikahan / Anniversary (dd/mm/yyyy)
            </label>
            <DateInput value={annivDate} onChange={setAnnivDate} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Motto / Kutipan Kita Hari Ini
            </label>
            <input
              type="text"
              value={motto}
              onChange={(e) => setMotto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCoupleInfoOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: DATE NIGHT */}
      <ResponsiveModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        title={editingDateEvent ? 'Edit Date Night' : 'Buat Agenda Date Night'}
      >
        <form onSubmit={handleSaveDateNight} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Date</label>
            <input
              type="text"
              required
              value={dnTitle}
              onChange={(e) => setDnTitle(e.target.value)}
              placeholder="Contoh: Dinner Romantis & Ngobrol Santai"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={dnDate} onChange={setDnDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Waktu (24 Jam)
              </label>
              <Time24Input value={dnTime} onChange={setDnTime} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Lokasi</label>
            <input
              type="text"
              value={dnLocation}
              onChange={(e) => setDnLocation(e.target.value)}
              placeholder="Contoh: Restoran Taman Senja"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <textarea
              rows={2}
              value={dnNotes}
              onChange={(e) => setDnNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsDateModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Date Night
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: LOVE TIMELINE MOMENT */}
      <ResponsiveModal
        isOpen={isMomentModalOpen}
        onClose={() => setIsMomentModalOpen(false)}
        title={editingMoment ? 'Edit Momen Kenangan' : 'Tambah Momen Love Timeline'}
      >
        <form onSubmit={handleSaveMoment} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Momen</label>
            <input
              type="text"
              required
              value={mTitle}
              onChange={(e) => setMTitle(e.target.value)}
              placeholder="Contoh: Liburan Pertama Bersama"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Tanggal (dd/mm/yyyy)
            </label>
            <DateInput required value={mDate} onChange={setMDate} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Cerita</label>
            <textarea
              rows={3}
              required
              value={mStory}
              onChange={(e) => setMStory(e.target.value)}
              placeholder="Ceritakan kenangan indah kalian..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              URL Foto (Opsional)
            </label>
            <input
              type="url"
              value={mPhoto}
              onChange={(e) => setMPhoto(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMomentModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Momen
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD CONVERSATION CARD */}
      <ResponsiveModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Tambah Pertanyaan Conversation Card"
      >
        <form onSubmit={handleSaveNewCard} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
            <select
              value={newCardCat}
              onChange={(e) => setNewCardCat(e.target.value as ConversationCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              <option value="Hubungan">Hubungan</option>
              <option value="Komunikasi">Komunikasi</option>
              <option value="Masa depan">Masa depan</option>
              <option value="Keuangan">Keuangan</option>
              <option value="Keluarga">Keluarga</option>
              <option value="Fun">Fun</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Pertanyaan</label>
            <textarea
              rows={3}
              required
              value={newCardQuestion}
              onChange={(e) => setNewCardQuestion(e.target.value)}
              placeholder="Tulis pertanyaan mendalam untuk dibahas bersama pasangan..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddCardOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Kartu
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT BUCKET LIST */}
      <ResponsiveModal
        isOpen={isBucketModalOpen}
        onClose={() => setIsBucketModalOpen(false)}
        title={editingBucketId ? 'Edit Impian Bucket List' : 'Tambah Impian Bucket List Berdua'}
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!bTitle.trim()) return;
            if (editingBucketId) {
              await updateCoupleBucketItem(editingBucketId, {
                title: bTitle.trim(),
                category: bCategory,
                target_date: bTargetDate || undefined,
                notes: bNotes.trim(),
              });
            } else {
              await addCoupleBucketItem({
                title: bTitle.trim(),
                category: bCategory,
                target_date: bTargetDate || undefined,
                is_achieved: false,
                notes: bNotes.trim(),
              });
            }
            setIsBucketModalOpen(false);
          }}
          className="space-y-3.5"
        >
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Impian / Wish List Pasangan
            </label>
            <input
              type="text"
              required
              value={bTitle}
              onChange={(e) => setBTitle(e.target.value)}
              placeholder="Contoh: Umrah Berdua, Liburan ke Jepang, Punya Kebun Kecil di Rumah"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={bCategory}
                onChange={(e) => setBCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Liburan & Perjalanan">Liburan & Perjalanan</option>
                <option value="Rumah & Kehidupan">Rumah & Kehidupan</option>
                <option value="Pengalaman Berdua">Pengalaman Berdua</option>
                <option value="Ibadah & Spiritual">Ibadah & Spiritual</option>
                <option value="Romantis">Romantis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Target Tanggal (dd/mm/yyyy)
              </label>
              <DateInput value={bTargetDate} onChange={setBTargetDate} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Catatan / Rencana Langkah
            </label>
            <textarea
              rows={2}
              value={bNotes}
              onChange={(e) => setBNotes(e.target.value)}
              placeholder="Tulis rencana singkat bagaimana kalian ingin mewujudkannya..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBucketModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Impian
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingBucketId)}
        onClose={() => setDeletingBucketId(null)}
        onConfirm={() => {
          if (deletingBucketId) deleteCoupleBucketItem(deletingBucketId);
        }}
        title="Hapus Impian Bucket List?"
        description="Item ini akan dihapus dari daftar Bucket List pasangan."
      />

      <ConfirmDialog
        isOpen={Boolean(deletingDateId)}
        onClose={() => setDeletingDateId(null)}
        onConfirm={() => {
          if (deletingDateId) deleteCalendarEvent(deletingDateId);
        }}
        title="Hapus Jadwal Date Night?"
        description="Agenda kencan ini akan dihapus dari halaman Berdua dan Kalender."
      />

      <ConfirmDialog
        isOpen={Boolean(deletingMomentId)}
        onClose={() => setDeletingMomentId(null)}
        onConfirm={() => {
          if (deletingMomentId) deleteCoupleMoment(deletingMomentId);
        }}
        title="Hapus Momen Kenangan?"
        description="Cerita ini akan dihapus dari Love Timeline."
      />
    </div>
  );
}
