import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  CheckSquare,
  Edit3,
  FolderKanban,
  Heart,
  Loader2,
  MessageCircleHeart,
  Receipt,
  Search,
  ShoppingCart,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Trash2,
  Wallet,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { ResponsiveModal } from '../ui/ResponsiveModal';
import { DateInput, Time24Input } from '../ui/DateTimeInputs';
import { CurrencyInput } from '../ui/CurrencyInput';
import { AVAILABLE_ICON_NAMES, IconRenderer, PALETTE_COLORS } from '../ui/IconRenderer';
import { formatDateId, formatRupiah, formatRupiahInput, parseRupiahInput, getTodayIso } from '../../utils/format';
import { AssetCategory, ConversationCategory, FrequencyType, WalletType } from '../../types';
import { NotificationDrawer } from './NotificationDrawer';

export function GlobalModals() {
  const navigate = useNavigate();

  const isSearchOpen = useFamilyStore((s) => s.isSearchOpen);
  const setSearchOpen = useFamilyStore((s) => s.setSearchOpen);

  const isNotificationsOpen = useFamilyStore((s) => s.isNotificationsOpen);
  const setNotificationsOpen = useFamilyStore((s) => s.setNotificationsOpen);

  const activeQuickSheet = useFamilyStore((s) => s.activeQuickSheet);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);

  const profile = useFamilyStore((s) => s.profile);
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const wallets = useFamilyStore((s) => s.wallets);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const transactions = useFamilyStore((s) => s.transactions);
  const taskCategories = useFamilyStore((s) => s.taskCategories);
  const tasks = useFamilyStore((s) => s.tasks);
  const goals = useFamilyStore((s) => s.goals);
  const calendarEvents = useFamilyStore((s) => s.calendarEvents);
  const journalEntries = useFamilyStore((s) => s.journalEntries);
  const notifications = useFamilyStore((s) => s.notifications);
  const conversationCards = useFamilyStore((s) => s.conversationCards);
  const familyDocuments = useFamilyStore((s) => s.familyDocuments);
  const shoppingItems = useFamilyStore((s) => s.shoppingItems);
  const coupleBucketItems = useFamilyStore((s) => s.coupleBucketItems);

  const addWallet = useFamilyStore((s) => s.addWallet);
  const addTransaction = useFamilyStore((s) => s.addTransaction);
  const addGoal = useFamilyStore((s) => s.addGoal);
  const addAsset = useFamilyStore((s) => s.addAsset);
  const addCalendarEvent = useFamilyStore((s) => s.addCalendarEvent);
  const addTask = useFamilyStore((s) => s.addTask);
  const addCoupleMoment = useFamilyStore((s) => s.addCoupleMoment);
  const toggleConversationDiscussed = useFamilyStore((s) => s.toggleConversationDiscussed);
  const toggleConversationFavorite = useFamilyStore((s) => s.toggleConversationFavorite);
  const saveConversationAnswerNotes = useFamilyStore((s) => s.saveConversationAnswerNotes);
  const markNotificationRead = useFamilyStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useFamilyStore((s) => s.markAllNotificationsRead);
  const deleteNotification = useFamilyStore((s) => s.deleteNotification);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    return {
      transactions: transactions.filter(
        (t) =>
          t.notes.toLowerCase().includes(q) ||
          t.member_name.toLowerCase().includes(q) ||
          String(t.amount).includes(q)
      ),
      tasks: tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.assignee_name.toLowerCase().includes(q)
      ),
      journals: journalEntries.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q) ||
          j.author_name.toLowerCase().includes(q)
      ),
      goals: goals.filter((g) => g.name.toLowerCase().includes(q)),
      wallets: wallets.filter(
        (w) => w.name.toLowerCase().includes(q) || w.type.toLowerCase().includes(q)
      ),
      events: calendarEvents.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q))
      ),
      documents: familyDocuments.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          (d.document_number || '').toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.owner_name.toLowerCase().includes(q) ||
          (d.notes || '').toLowerCase().includes(q)
      ),
      shopping: shoppingItems.filter(
        (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
      ),
      bucketList: coupleBucketItems.filter(
        (b) => b.title.toLowerCase().includes(q) || b.notes.toLowerCase().includes(q)
      ),
    };
  }, [
    searchQuery,
    transactions,
    tasks,
    journalEntries,
    goals,
    wallets,
    calendarEvents,
    familyDocuments,
    shoppingItems,
    coupleBucketItems,
  ]);

  const loggedInMemberName = useMemo(() => {
    const matched = members.find(
      (m) =>
        (profile?.id && m.user_id === profile.id) ||
        (profile?.email && m.email && m.email.toLowerCase() === profile.email.toLowerCase()) ||
        (profile?.full_name && m.name.toLowerCase() === profile.full_name.toLowerCase())
    );
    return matched?.name || profile?.full_name?.trim() || members[0]?.name || 'Keluarga';
  }, [members, profile]);

  const familyMemberOptions = useMemo(() => {
    const names: string[] = [];
    const addUnique = (val?: string) => {
      const trimmed = val?.trim();
      if (!trimmed) return;
      if (!names.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
        names.push(trimmed);
      }
    };
    addUnique(loggedInMemberName);
    members.forEach((m) => addUnique(m.name));
    addUnique('Keluarga Bersama');
    return names;
  }, [loggedInMemberName, members]);

  // Quick Transaction Form state
  const [txType, setTxType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(getTodayIso());
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txWalletId, setTxWalletId] = useState('');
  const [txMemberName, setTxMemberName] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txError, setTxError] = useState('');
  const [txIsSubmitting, setTxIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeQuickSheet === 'transaction') {
      setTxMemberName(loggedInMemberName);
      setTxIsSubmitting(false);
    }
  }, [activeQuickSheet, loggedInMemberName]);

  // Quick Wallet Form state
  const [walletName, setWalletName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('Bank');
  const [walletBalance, setWalletBalance] = useState('');
  const [walletColor, setWalletColor] = useState('#2A4D3E');
  const [walletIcon, setWalletIcon] = useState('Landmark');
  const [walletError, setWalletError] = useState('');

  // Quick Goal Form state
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('0');
  const [goalDeadline, setGoalDeadline] = useState(getTodayIso());
  const [goalColor, setGoalColor] = useState('#D4A359');
  const [goalIcon, setGoalIcon] = useState('Target');
  const [goalError, setGoalError] = useState('');

  // Quick Asset Form state
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState<AssetCategory>('Rumah');
  const [assetValue, setAssetValue] = useState('');
  const [assetDate, setAssetDate] = useState(getTodayIso());
  const [assetNotes, setAssetNotes] = useState('');
  const [assetError, setAssetError] = useState('');

  // Quick Agenda / Date Night Form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<'Keluarga' | 'Agenda' | 'Date Night' | 'Penting' | 'Acara'>('Agenda');
  const [eventDate, setEventDate] = useState(getTodayIso());
  const [eventTime, setEventTime] = useState('19:00');
  const [eventLocation, setEventLocation] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventError, setEventError] = useState('');

  // Quick Task Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskCatId, setTaskCatId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(getTodayIso());
  const [taskRecurrence, setTaskRecurrence] = useState<'Tidak berulang' | FrequencyType>('Tidak berulang');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskError, setTaskError] = useState('');

  // Quick Moment Form state
  const [momentTitle, setMomentTitle] = useState('');
  const [momentDate, setMomentDate] = useState(getTodayIso());
  const [momentStory, setMomentStory] = useState('');
  const [momentPhoto, setMomentPhoto] = useState('');
  const [momentError, setMomentError] = useState('');

  // Quick submit loading states
  const [eventIsSubmitting, setEventIsSubmitting] = useState(false);
  const [taskIsSubmitting, setTaskIsSubmitting] = useState(false);
  const [walletIsSubmitting, setWalletIsSubmitting] = useState(false);
  const [goalIsSubmitting, setGoalIsSubmitting] = useState(false);
  const [assetIsSubmitting, setAssetIsSubmitting] = useState(false);
  const [momentIsSubmitting, setMomentIsSubmitting] = useState(false);

  // Quick Conversation Card state
  const [cardCatFilter, setCardCatFilter] = useState<'Semua' | 'Favorit' | ConversationCategory>('Semua');
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isEditingModalNote, setIsEditingModalNote] = useState(false);
  const [modalNoteDraft, setModalNoteDraft] = useState('');

  const filteredConvCards = useMemo(() => {
    const list =
      cardCatFilter === 'Semua'
        ? conversationCards
        : cardCatFilter === 'Favorit'
        ? conversationCards.filter((c) => c.is_favorite)
        : conversationCards.filter((c) => c.category === cardCatFilter);
    return list.length > 0 ? list : conversationCards;
  }, [conversationCards, cardCatFilter]);

  const safeModalCardIdx =
    filteredConvCards.length > 0
      ? ((activeCardIndex % filteredConvCards.length) + filteredConvCards.length) %
        filteredConvCards.length
      : 0;
  const currentConvCard = filteredConvCards[safeModalCardIdx];

  const handleQuickTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseRupiahInput(txAmount);
    if (!numericAmount || numericAmount <= 0) {
      setTxError('Masukkan nominal transaksi lebih dari 0.');
      return;
    }

    let targetWalletId = txWalletId || wallets[0]?.id;
    if (!targetWalletId) {
      // Automatically create a default wallet if none exists yet so user isn't blocked
      await addWallet({
        name: 'Dompet Utama',
        type: 'Tunai',
        balance: 0,
        color: '#2A4D3E',
        icon: 'Wallet',
      });
      targetWalletId = useFamilyStore.getState().wallets[0]?.id || '';
    }

    const availableCats = transactionCategories.filter((c) => c.type === txType);
    const chosenCatId = txCategoryId || availableCats[0]?.id || '';
    const chosenMember = txMemberName || loggedInMemberName;
    const matchedMemberObj = members.find(
      (m) => m.name.toLowerCase() === chosenMember.toLowerCase()
    );

    setTxIsSubmitting(true);

    try {
      await addTransaction({
        type: txType,
        amount: numericAmount,
        date: txDate || getTodayIso(),
        category_id: chosenCatId,
        wallet_id: targetWalletId,
        member_id: matchedMemberObj?.user_id || matchedMemberObj?.id || profile?.id || '',
        member_name: chosenMember,
        notes: txNotes.trim() || (txType === 'Pemasukan' ? 'Pemasukan Keluarga' : 'Pengeluaran Keluarga'),
      });

      setTxAmount('');
      setTxNotes('');
      setTxError('');
      setTxMemberName(loggedInMemberName);
      setTxIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setTxError(err?.message || 'Gagal menyimpan transaksi.');
      setTxIsSubmitting(false);
    }
  };

  const handleQuickWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletName.trim()) {
      setWalletError('Nama wallet wajib diisi.');
      return;
    }
    try {
      setWalletIsSubmitting(true);
      setWalletError('');
      await addWallet({
        name: walletName.trim(),
        type: walletType,
        balance: parseRupiahInput(walletBalance) || 0,
        color: walletColor,
        icon: walletIcon,
      });
      setWalletName('');
      setWalletBalance('');
      setWalletError('');
      setWalletIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setWalletError(err?.message || 'Gagal menyimpan wallet.');
      setWalletIsSubmitting(false);
    }
  };

  const handleQuickGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseRupiahInput(goalTarget);
    if (!goalName.trim() || !targetNum || targetNum <= 0) {
      setGoalError('Nama goal dan target nominal (> 0) wajib diisi.');
      return;
    }
    try {
      setGoalIsSubmitting(true);
      setGoalError('');
      await addGoal({
        name: goalName.trim(),
        target_amount: targetNum,
        current_amount: parseRupiahInput(goalCurrent) || 0,
        deadline: goalDeadline || getTodayIso(),
        icon: goalIcon,
        color: goalColor,
      });
      setGoalName('');
      setGoalTarget('');
      setGoalCurrent('0');
      setGoalError('');
      setGoalIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setGoalError(err?.message || 'Gagal menyimpan goal.');
      setGoalIsSubmitting(false);
    }
  };

  const handleQuickAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseRupiahInput(assetValue);
    if (!assetName.trim() || !val || val <= 0) {
      setAssetError('Nama aset dan nilai estimasi (> 0) wajib diisi.');
      return;
    }
    try {
      setAssetIsSubmitting(true);
      setAssetError('');
      await addAsset({
        name: assetName.trim(),
        category: assetCategory,
        value: val,
        acquisition_date: assetDate || getTodayIso(),
        notes: assetNotes.trim(),
      });
      setAssetName('');
      setAssetValue('');
      setAssetNotes('');
      setAssetError('');
      setAssetIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setAssetError(err?.message || 'Gagal menyimpan aset.');
      setAssetIsSubmitting(false);
    }
  };

  const handleQuickEventSubmit = async (e: React.FormEvent, forceDateNight = false) => {
    e.preventDefault();
    if (!eventTitle.trim()) {
      setEventError('Judul agenda wajib diisi.');
      return;
    }
    const finalCat = forceDateNight ? 'Date Night' : eventCategory;
    try {
      setEventIsSubmitting(true);
      setEventError('');
      await addCalendarEvent({
        title: eventTitle.trim(),
        category: finalCat,
        date: eventDate || getTodayIso(),
        time: eventTime,
        location: eventLocation.trim(),
        notes: eventNotes.trim(),
        is_completed: false,
        is_date_night: finalCat === 'Date Night',
      });
      setEventTitle('');
      setEventLocation('');
      setEventNotes('');
      setEventError('');
      setEventIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setEventError(err?.message || 'Gagal menyimpan agenda.');
      setEventIsSubmitting(false);
    }
  };

  const handleQuickTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setTaskError('Judul task wajib diisi.');
      return;
    }
    const chosenCat = taskCatId || taskCategories[0]?.id || '';
    const chosenAssignee = taskAssignee || profile?.full_name || members[0]?.name || 'Keluarga';
    try {
      setTaskIsSubmitting(true);
      setTaskError('');
      await addTask({
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        category_id: chosenCat,
        due_date: taskDueDate || getTodayIso(),
        recurrence: taskRecurrence,
        assignee_id: profile?.id || '',
        assignee_name: chosenAssignee,
        status: 'Belum selesai',
      });
      setTaskTitle('');
      setTaskDesc('');
      setTaskError('');
      setTaskIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setTaskError(err?.message || 'Gagal menyimpan task.');
      setTaskIsSubmitting(false);
    }
  };

  const handleQuickMomentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momentTitle.trim() || !momentStory.trim()) {
      setMomentError('Judul dan cerita kenangan wajib diisi.');
      return;
    }
    try {
      setMomentIsSubmitting(true);
      setMomentError('');
      await addCoupleMoment({
        title: momentTitle.trim(),
        date: momentDate || getTodayIso(),
        story: momentStory.trim(),
        photo_url: momentPhoto.trim() || undefined,
      });
      setMomentTitle('');
      setMomentStory('');
      setMomentPhoto('');
      setMomentError('');
      setMomentIsSubmitting(false);
      setActiveQuickSheet(null);
    } catch (err: any) {
      setMomentError(err?.message || 'Gagal menyimpan kenangan.');
      setMomentIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. GLOBAL SEARCH MODAL */}
      <ResponsiveModal
        isOpen={isSearchOpen}
        onClose={() => setSearchOpen(false)}
        title="Pencarian Keluarga"
        subtitle="Cari transaksi, task, jurnal, goal, wallet, atau agenda"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik kata kunci pencarian..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#2A4D3E]"
            />
          </div>

          {!searchQuery.trim() ? (
            <p className="text-xs text-[#5C6B62] text-center py-6">
              Masukkan kata kunci untuk mencari di seluruh aktivitas keluarga Anda.
            </p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Transactions */}
              {searchResults && searchResults.transactions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Transaksi ({searchResults.transactions.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.transactions.map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/keuangan');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{tx.notes}</p>
                          <p className="text-[11px] text-[#5C6B62]">
                            {formatDateId(tx.date)} · {tx.member_name}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-mono-num font-semibold shrink-0 ${
                            tx.type === 'Pemasukan' ? 'text-[#2A4D3E]' : 'text-[#C84B31]'
                          }`}
                        >
                          {formatRupiah(tx.amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks */}
              {searchResults && searchResults.tasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    <span>Task ({searchResults.tasks.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.tasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/kalender');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{t.title}</p>
                          <p className="text-[11px] text-[#5C6B62]">
                            {formatDateId(t.due_date)} · {t.assignee_name}
                          </p>
                        </div>
                        <span className="text-[11px] text-[#5C6B62]">{t.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Events */}
              {searchResults && searchResults.events.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Event & Agenda ({searchResults.events.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.events.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/kalender');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{ev.title}</p>
                          <p className="text-[11px] text-[#5C6B62]">
                            {formatDateId(ev.date)} · {ev.category}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallets */}
              {searchResults && searchResults.wallets.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Wallet ({searchResults.wallets.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.wallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/keuangan/wallet');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <span className="text-xs font-semibold text-[#1E2D24]">{w.name}</span>
                        <span className="text-xs font-mono-num text-[#2A4D3E]">
                          {formatRupiah(w.balance)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              {searchResults && searchResults.goals.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    <span>Goal & Tabungan ({searchResults.goals.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.goals.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/keuangan/goal');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <span className="text-xs font-semibold text-[#1E2D24]">{g.name}</span>
                        <span className="text-xs font-mono-num text-[#2A4D3E]">
                          {formatRupiah(g.current_amount)} / {formatRupiah(g.target_amount)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {searchResults && searchResults.documents.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Brankas Dokumen ({searchResults.documents.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.documents.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/dokumen');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{doc.title}</p>
                          <p className="text-[11px] text-[#5C6B62] truncate">
                            {doc.category} · {doc.owner_name}
                            {doc.document_number ? ` · ${doc.document_number}` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shopping */}
              {searchResults && searchResults.shopping.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Daftar Belanja ({searchResults.shopping.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.shopping.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/belanja');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{item.name}</p>
                          <p className="text-[11px] text-[#5C6B62]">
                            {item.category} · {item.quantity}
                          </p>
                        </div>
                        <span className="text-xs font-mono-num text-[#2A4D3E]">
                          {formatRupiah(item.estimated_price)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Journals */}
              {searchResults && searchResults.journals.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-[#5C6B62] mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Jurnal Keluarga ({searchResults.journals.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {searchResults.journals.map((j) => (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          navigate('/jurnal');
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-left"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-semibold text-[#1E2D24] truncate">{j.title}</p>
                          <p className="text-[11px] text-[#5C6B62]">
                            {formatDateId(j.date)} · Oleh {j.author_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults &&
                searchResults.transactions.length === 0 &&
                searchResults.tasks.length === 0 &&
                searchResults.events.length === 0 &&
                searchResults.wallets.length === 0 &&
                searchResults.goals.length === 0 &&
                searchResults.documents.length === 0 &&
                searchResults.shopping.length === 0 &&
                searchResults.journals.length === 0 && (
                  <p className="text-xs text-[#5C6B62] text-center py-8">
                    Tidak ada hasil yang cocok untuk "{searchQuery}".
                  </p>
                )}
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* 2. NOTIFICATIONS MOBILE SLIDING DRAWER */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* 3. QUICK SHEET: TAMBAH TRANSAKSI */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'transaction'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Transaksi"
        subtitle="Catat pemasukan atau pengeluaran keluarga"
      >
        <form onSubmit={handleQuickTransactionSubmit} className="space-y-3.5">
          {txError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{txError}</p>
          )}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4EFE6] rounded-xl">
            {(['Pengeluaran', 'Pemasukan'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setTxType(type);
                  setTxCategoryId('');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  txType === type
                    ? 'bg-[#2A4D3E] text-white shadow-xs'
                    : 'text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <CurrencyInput
            label="Nominal Transaksi"
            required
            value={txAmount}
            onChange={(val) => setTxAmount(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={txDate} onChange={setTxDate} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {transactionCategories
                  .filter((c) => c.type === txType)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Wallet</label>
              <select
                value={txWalletId}
                onChange={(e) => setTxWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {wallets.length === 0 ? (
                  <option value="">Dompet Utama (Otomatis dibuat)</option>
                ) : (
                  wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Anggota Keluarga</label>
              <select
                value={txMemberName || loggedInMemberName}
                onChange={(e) => setTxMemberName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {familyMemberOptions.map((memberName) => (
                  <option key={memberName} value={memberName}>
                    {memberName.toLowerCase() === loggedInMemberName.toLowerCase()
                      ? `${memberName} (Sedang Login)`
                      : memberName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <input
              type="text"
              value={txNotes}
              onChange={(e) => setTxNotes(e.target.value)}
              placeholder="Catatan transaksi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {txIsSubmitting && (
                <div className="flex items-center gap-1.5 text-xs text-[#2A4D3E] font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A4D3E]" />
                  <span>Menyimpan...</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={txIsSubmitting}
                onClick={() => setActiveQuickSheet(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={txIsSubmitting}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
              >
                {txIsSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Transaksi</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      {/* 4. QUICK SHEET: TAMBAH WALLET */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'wallet'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Wallet Baru"
        subtitle="Kelola sumber dana tunai, bank, atau dompet digital"
      >
        <form onSubmit={handleQuickWalletSubmit} className="space-y-3.5">
          {walletError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{walletError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Wallet</label>
            <input
              type="text"
              required
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
              placeholder="Contoh: BCA Keluarga, GoPay, Kas Rumah"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Jenis Wallet</label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as WalletType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                <option value="Bank">Bank</option>
                <option value="Dompet Digital">Dompet Digital</option>
                <option value="Tunai">Tunai</option>
              </select>
            </div>
          <CurrencyInput
            label="Saldo Saat Ini"
            value={walletBalance}
            onChange={(val) => setWalletBalance(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
          />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Warna Kartu</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setWalletColor(c.value)}
                  className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                    walletColor === c.value ? 'border-[#1E2D24] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={walletIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {walletIsSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Wallet</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* 5. QUICK SHEET: TAMBAH GOAL */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'goal'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Goal & Tabungan"
        subtitle="Rencanakan target finansial keluarga"
      >
        <form onSubmit={handleQuickGoalSubmit} className="space-y-3.5">
          {goalError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{goalError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Goal</label>
            <input
              type="text"
              required
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Contoh: Dana Darurat, Pendidikan Anak, Umrah"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyInput
              label="Target Nominal"
              required
              value={goalTarget}
              onChange={(val) => setGoalTarget(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
              quickAmounts={[1_000_000, 5_000_000, 10_000_000, 25_000_000]}
            />
            <CurrencyInput
              label="Saldo Awal Terkumpul"
              value={goalCurrent}
              onChange={(val) => setGoalCurrent(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={false}
              quickAmounts={[500_000, 1_000_000, 5_000_000]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Target Tanggal Tercapai (dd/mm/yyyy)
            </label>
            <DateInput required value={goalDeadline} onChange={setGoalDeadline} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Pilih Ikon & Warna</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Target', 'ShieldCheck', 'Plane', 'Home', 'GraduationCap', 'Car', 'Heart', 'PiggyBank'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setGoalIcon(ic)}
                  className={`p-2 rounded-xl border ${
                    goalIcon === ic
                      ? 'bg-[#2A4D3E] text-white border-[#2A4D3E]'
                      : 'bg-white text-[#1E2D24] border-[#E8E2D5]'
                  }`}
                >
                  <IconRenderer name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setGoalColor(c.value)}
                  className={`w-7 h-7 rounded-lg border-2 ${
                    goalColor === c.value ? 'border-[#1E2D24] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={goalIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {goalIsSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Goal</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* 6. QUICK SHEET: TAMBAH ASET */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'asset'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Aset & Investasi"
        subtitle="Nilai aset otomatis masuk ke perhitungan Kekayaan Bersih"
      >
        <form onSubmit={handleQuickAssetSubmit} className="space-y-3.5">
          {assetError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{assetError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Aset / Investasi</label>
            <input
              type="text"
              required
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              placeholder="Contoh: Rumah Tinggal, Emas Antam 10g, Reksadana"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Jenis Aset</label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value as AssetCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                <option value="Rumah">Rumah</option>
                <option value="Kendaraan">Kendaraan</option>
                <option value="Emas">Emas</option>
                <option value="Investasi">Investasi</option>
                <option value="Aset lainnya">Aset lainnya</option>
              </select>
            </div>
            <CurrencyInput
              label="Nilai Saat Ini"
              required
              value={assetValue}
              onChange={(val) => setAssetValue(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
              quickAmounts={[1_000_000, 10_000_000, 50_000_000, 100_000_000]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal Perolehan (dd/mm/yyyy)
              </label>
              <DateInput value={assetDate} onChange={setAssetDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
              <input
                type="text"
                value={assetNotes}
                onChange={(e) => setAssetNotes(e.target.value)}
                placeholder="Keterangan singkat..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={assetIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {assetIsSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Aset</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* 7. QUICK SHEET: TAMBAH AGENDA / EVENT / DATE NIGHT */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'agenda' || activeQuickSheet === 'date_night'}
        onClose={() => setActiveQuickSheet(null)}
        title={activeQuickSheet === 'date_night' ? 'Rencanakan Date Night' : 'Tambah Agenda & Event'}
        subtitle={
          activeQuickSheet === 'date_night'
            ? 'Jadwal kencan otomatis tampil di halaman Berdua & Kalender'
            : 'Jadwalkan acara keluarga di kalender'
        }
      >
        <form
          onSubmit={(e) => handleQuickEventSubmit(e, activeQuickSheet === 'date_night')}
          className="space-y-3.5"
        >
          {eventError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{eventError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Agenda</label>
            <input
              type="text"
              required
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder={
                activeQuickSheet === 'date_night'
                  ? 'Contoh: Makan Malam Anniversary & Jalan Sore'
                  : 'Contoh: Kunjungan Keluarga Akhir Pekan'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={eventDate} onChange={setEventDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Waktu (24 Jam)
              </label>
              <Time24Input value={eventTime} onChange={setEventTime} />
            </div>
          </div>

          {activeQuickSheet !== 'date_night' && (
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                <option value="Agenda">Agenda</option>
                <option value="Keluarga">Keluarga</option>
                <option value="Date Night">Date Night</option>
                <option value="Penting">Penting</option>
                <option value="Acara">Acara</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Lokasi</label>
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Contoh: Rumah, Taman Kota, Kafe Senja"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <textarea
              rows={2}
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={eventIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {eventIsSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Jadwal</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* 8. QUICK SHEET: TAMBAH TASK */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'task'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Task Baru"
        subtitle="Kelola tugas rumah tangga bersama keluarga"
      >
        <form onSubmit={handleQuickTaskSubmit} className="space-y-3.5">
          {taskError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{taskError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Tugas</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Contoh: Bayar iuran lingkungan, Rapikan gudang"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori Tugas</label>
              <select
                value={taskCatId}
                onChange={(e) => setTaskCatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                {taskCategories.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={taskDueDate} onChange={setTaskDueDate} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Pengulangan</label>
              <select
                value={taskRecurrence}
                onChange={(e) => setTaskRecurrence(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
              >
                <option value="Tidak berulang">Tidak berulang</option>
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Penanggung Jawab</label>
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
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
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              placeholder="Detail rincian tugas..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={taskIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {taskIsSubmitting ? (
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

      {/* 9. QUICK SHEET: TAMBAH MOMENT (LOVE TIMELINE) */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'moment'}
        onClose={() => setActiveQuickSheet(null)}
        title="Tambah Momen Kenangan"
        subtitle="Abadikan cerita perjalanan cinta di Love Timeline"
      >
        <form onSubmit={handleQuickMomentSubmit} className="space-y-3.5">
          {momentError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{momentError}</p>
          )}
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Judul Momen</label>
            <input
              type="text"
              required
              value={momentTitle}
              onChange={(e) => setMomentTitle(e.target.value)}
              placeholder="Contoh: Hari Pertama Pindah ke Rumah Baru"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Tanggal (dd/mm/yyyy)
            </label>
            <DateInput required value={momentDate} onChange={setMomentDate} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Cerita Kenangan</label>
            <textarea
              rows={3}
              required
              value={momentStory}
              onChange={(e) => setMomentStory(e.target.value)}
              placeholder="Tuliskan cerita dan perasaan berkesan dari momen ini..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              URL Foto Kenangan (Opsional)
            </label>
            <input
              type="url"
              value={momentPhoto}
              onChange={(e) => setMomentPhoto(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={momentIsSubmitting}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {momentIsSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Momen</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* 10. QUICK SHEET: CONVERSATION CARDS */}
      <ResponsiveModal
        isOpen={activeQuickSheet === 'conversation_card'}
        onClose={() => setActiveQuickSheet(null)}
        title={`Conversation Cards (${conversationCards.length} Kartu)`}
        subtitle="Kartu obrolan mendalam untuk mempererat hubungan pasangan"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(
              [
                'Semua',
                'Favorit',
                'Hubungan',
                'Komunikasi',
                'Masa depan',
                'Keuangan',
                'Keluarga',
                'Fun',
              ] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCardCatFilter(cat);
                  setActiveCardIndex(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  cardCatFilter === cat
                    ? 'bg-[#2A4D3E] text-white'
                    : 'bg-[#F4EFE6] text-[#5C6B62] hover:text-[#1E2D24]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {currentConvCard && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2A4D3E] to-[#1E3A2E] text-[#FAF7F2] space-y-5 shadow-md">
              <div className="flex items-center justify-between text-xs text-[#F4D393]">
                <span className="flex items-center gap-1.5 font-semibold">
                  <MessageCircleHeart className="w-4 h-4" />
                  <span>Topik: {currentConvCard.category}</span>
                </span>
                <span className="font-mono-num">
                  Kartu {safeModalCardIdx + 1} / {filteredConvCards.length} ·{' '}
                  {currentConvCard.is_discussed ? 'Sudah dibahas' : 'Belum dibahas'}
                </span>
              </div>

              <p className="text-base sm:text-lg font-semibold leading-relaxed text-white">
                "{currentConvCard.question}"
              </p>

              {/* Catatan Jawaban di Quick Sheet */}
              <div className="bg-black/20 rounded-2xl p-3.5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#F4D393]">
                    Catatan Jawaban & Kesimpulan Obrolan
                  </span>
                  {!isEditingModalNote && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalNoteDraft(currentConvCard.answer_notes || '');
                        setIsEditingModalNote(true);
                      }}
                      className="text-[11px] font-semibold text-white/90 hover:text-white underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{currentConvCard.answer_notes ? 'Ubah Catatan' : 'Tulis Jawaban'}</span>
                    </button>
                  )}
                </div>

                {isEditingModalNote ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={modalNoteDraft}
                      onChange={(e) => setModalNoteDraft(e.target.value)}
                      placeholder="Catat jawaban pasangan atau kesimpulan obrolan dari kartu ini..."
                      className="w-full px-3 py-2 rounded-xl bg-white/95 text-[#1E2D24] text-xs focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingModalNote(false)}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold hover:bg-white/20"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await saveConversationAnswerNotes(currentConvCard.id, modalNoteDraft);
                          setIsEditingModalNote(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#D4A359] text-[#1E2D24] text-xs font-bold hover:bg-[#DFB36B]"
                      >
                        Simpan Jawaban
                      </button>
                    </div>
                  </div>
                ) : currentConvCard.answer_notes ? (
                  <p className="text-xs text-white/95 whitespace-pre-line leading-relaxed">
                    {currentConvCard.answer_notes}
                  </p>
                ) : (
                  <p className="text-xs text-white/60 italic">
                    Belum ada catatan jawaban untuk pertanyaan ini.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/15">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleConversationDiscussed(currentConvCard.id)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      currentConvCard.is_discussed
                        ? 'bg-[#D4A359] text-[#1E2D24]'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{currentConvCard.is_discussed ? 'Sudah Dibahas' : 'Tandai Dibahas'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleConversationFavorite(currentConvCard.id)}
                    aria-label="Simpan ke favorit"
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      currentConvCard.is_favorite
                        ? 'bg-[#D88C9A] text-[#1E2D24]'
                        : 'bg-white/10 text-white hover:bg-white/20'
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
                      if (filteredConvCards.length <= 1) return;
                      let nextIdx = Math.floor(Math.random() * filteredConvCards.length);
                      if (nextIdx === safeModalCardIdx) {
                        nextIdx = (nextIdx + 1) % filteredConvCards.length;
                      }
                      setIsEditingModalNote(false);
                      setActiveCardIndex(nextIdx);
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#D4A359] text-[#1E2D24] text-xs font-bold flex items-center gap-1.5 hover:bg-[#DFB36B] transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Acak</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingModalNote(false);
                      setActiveCardIndex((prev) => prev + 1);
                    }}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-white text-[#1E2D24] text-xs font-bold flex items-center gap-1.5 hover:bg-[#F4EFE6] transition-colors"
                  >
                    <span>Berikutnya</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>
    </>
  );
}
