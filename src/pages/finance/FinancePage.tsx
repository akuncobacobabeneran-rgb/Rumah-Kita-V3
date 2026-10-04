import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDays, subDays, format, parseISO } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileBarChart,
  Filter,
  HandCoins,
  Layers,
  Loader2,
  PieChart,
  Plus,
  Receipt,
  Repeat,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  Trash2,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { useFinanceSummary } from '../../hooks/useFinanceSummary';
import {
  formatDateId,
  formatMonthYearId,
  formatRupiah,
  formatRupiahInput,
  parseRupiahInput,
  getCurrentMonthIso,
  getTodayIso,
} from '../../utils/format';
import { exportFinanceReportToPdf } from '../../utils/pdfReport';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/StateFeedback';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { IconRenderer } from '../../components/ui/IconRenderer';
import { Transaction } from '../../types';

export function FinancePage() {
  const navigate = useNavigate();
  const isLoading = useFamilyStore((s) => s.isLoading);
  const error = useFamilyStore((s) => s.error);
  const refreshData = useFamilyStore((s) => s.refreshData);

  const hideNumbers = useFamilyStore((s) => s.hideNumbers);
  const toggleHideNumbers = useFamilyStore((s) => s.toggleHideNumbers);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);
  const txSyncStatus = useFamilyStore((s) => s.txSyncStatus);

  const family = useFamilyStore((s) => s.family);
  const wallets = useFamilyStore((s) => s.wallets);
  const transactions = useFamilyStore((s) => s.transactions);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const assets = useFamilyStore((s) => s.assets);
  const goals = useFamilyStore((s) => s.goals);
  const debts = useFamilyStore((s) => s.debts);
  const members = useFamilyStore((s) => s.members);
  const profile = useFamilyStore((s) => s.profile);

  const addTransaction = useFamilyStore((s) => s.addTransaction);
  const updateTransaction = useFamilyStore((s) => s.updateTransaction);
  const deleteTransaction = useFamilyStore((s) => s.deleteTransaction);
  const addWallet = useFamilyStore((s) => s.addWallet);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthIso());
  const [selectedWalletId, setSelectedWalletId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'Pemasukan' | 'Pengeluaran' | 'Transfer'>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Date Filtering Mode for Riwayat Transaksi (Default: 'TODAY' -> "hanya tampilkan yang di hari itu saja")
  type DateFilterMode = 'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'RANGE' | 'ALL';
  const [dateFilterMode, setDateFilterMode] = useState<DateFilterMode>('TODAY');
  const [singleDate, setSingleDate] = useState<string>(getTodayIso());
  const [rangeStartDate, setRangeStartDate] = useState<string>(
    format(subDays(new Date(), 6), 'yyyy-MM-dd')
  );
  const [rangeEndDate, setRangeEndDate] = useState<string>(getTodayIso());

  // Modals
  const [showNeracaDetail, setShowNeracaDetail] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);
  const [isTxFormOpen, setIsTxFormOpen] = useState(false);

  // Transaction Form state
  const [formType, setFormType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(getTodayIso());
  const [formCatId, setFormCatId] = useState('');
  const [formWalletId, setFormWalletId] = useState('');
  const [formMember, setFormMember] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSavingTx, setIsSavingTx] = useState(false);

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

  const finance = useFinanceSummary(selectedMonth, selectedWalletId);

  // 1. Transaksi Terbaru: Tampilkan yang terbaru saja (5 transaksi paling baru dicatat)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        if (d !== 0) return d;
        return (b.created_at || '').localeCompare(a.created_at || '');
      })
      .slice(0, 5);
  }, [transactions]);

  // 2. Riwayat Transaksi: Default hanya tampilkan yang di hari itu saja, serta filter tanggal / rentang tanggal
  const filteredHistoryTransactions = useMemo(() => {
    const todayIso = getTodayIso();
    const yesterdayIso = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const sevenDaysAgoIso = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const thisMonthIso = getCurrentMonthIso();

    return transactions
      .filter((tx) => {
        // Wallet filter
        if (
          selectedWalletId !== 'ALL' &&
          tx.wallet_id !== selectedWalletId &&
          tx.to_wallet_id !== selectedWalletId
        ) {
          return false;
        }

        // Type filter
        if (selectedType !== 'ALL' && tx.type !== selectedType) {
          return false;
        }

        // Category filter
        if (selectedCategoryId !== 'ALL' && tx.category_id !== selectedCategoryId) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const catName =
            transactionCategories.find((c) => c.id === tx.category_id)?.name.toLowerCase() || '';
          const match =
            tx.notes.toLowerCase().includes(q) ||
            tx.member_name.toLowerCase().includes(q) ||
            catName.includes(q) ||
            String(tx.amount).includes(q);
          if (!match) return false;
        }

        // Date filter
        if (dateFilterMode === 'TODAY') {
          return tx.date === singleDate;
        } else if (dateFilterMode === 'YESTERDAY') {
          return tx.date === yesterdayIso;
        } else if (dateFilterMode === 'LAST_7_DAYS') {
          return tx.date >= sevenDaysAgoIso && tx.date <= todayIso;
        } else if (dateFilterMode === 'THIS_MONTH') {
          return tx.date.startsWith(thisMonthIso);
        } else if (dateFilterMode === 'RANGE') {
          if (rangeStartDate && tx.date < rangeStartDate) return false;
          if (rangeEndDate && tx.date > rangeEndDate) return false;
          return true;
        }

        return true;
      })
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        if (d !== 0) return d;
        return (b.created_at || '').localeCompare(a.created_at || '');
      });
  }, [
    transactions,
    selectedWalletId,
    selectedType,
    selectedCategoryId,
    searchQuery,
    dateFilterMode,
    singleDate,
    rangeStartDate,
    rangeEndDate,
    transactionCategories,
  ]);

  const historySummary = useMemo(() => {
    const income = filteredHistoryTransactions
      .filter((t) => t.type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = filteredHistoryTransactions
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      income,
      expense,
      net: income - expense,
      count: filteredHistoryTransactions.length,
    };
  }, [filteredHistoryTransactions]);

  const activeDateLabel = useMemo(() => {
    const todayIso = getTodayIso();
    const yesterdayIso = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (dateFilterMode === 'TODAY') {
      if (singleDate === todayIso) {
        return `Hari Ini (${formatDateId(singleDate, 'd MMMM yyyy')})`;
      } else if (singleDate === yesterdayIso) {
        return `Kemarin (${formatDateId(singleDate, 'd MMMM yyyy')})`;
      }
      return formatDateId(singleDate, 'd MMMM yyyy');
    }
    if (dateFilterMode === 'YESTERDAY') {
      return `Kemarin (${formatDateId(yesterdayIso, 'd MMMM yyyy')})`;
    }
    if (dateFilterMode === 'LAST_7_DAYS') {
      const sevenDaysAgoIso = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      return `7 Hari Terakhir (${formatDateId(sevenDaysAgoIso, 'd MMM')} – ${formatDateId(todayIso, 'd MMM yyyy')})`;
    }
    if (dateFilterMode === 'THIS_MONTH') {
      return `Bulan Ini (${formatMonthYearId(getCurrentMonthIso())})`;
    }
    if (dateFilterMode === 'RANGE') {
      const from = rangeStartDate ? formatDateId(rangeStartDate, 'd MMM yyyy') : 'Awal';
      const to = rangeEndDate ? formatDateId(rangeEndDate, 'd MMM yyyy') : 'Sekarang';
      return `Rentang: ${from} – ${to}`;
    }
    return 'Semua Periode';
  }, [dateFilterMode, singleDate, rangeStartDate, rangeEndDate]);

  const goToPrevDay = () => {
    try {
      const cur = parseISO(singleDate);
      const prev = subDays(cur, 1);
      setSingleDate(format(prev, 'yyyy-MM-dd'));
      setDateFilterMode('TODAY');
    } catch {
      setSingleDate(getTodayIso());
    }
  };

  const goToNextDay = () => {
    try {
      const cur = parseISO(singleDate);
      const next = addDays(cur, 1);
      setSingleDate(format(next, 'yyyy-MM-dd'));
      setDateFilterMode('TODAY');
    } catch {
      setSingleDate(getTodayIso());
    }
  };

  const goToToday = () => {
    setSingleDate(getTodayIso());
    setDateFilterMode('TODAY');
  };

  const displayedTransactions = filteredHistoryTransactions;

  if (isLoading) return <PageSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refreshData} />;

  const financeMenus = [
    {
      label: 'Anggaran & Kategori',
      icon: PieChart,
      bg: '#E8F2EC',
      color: '#2A4D3E',
      path: '/keuangan/anggaran',
    },
    {
      label: 'Utang Piutang',
      icon: HandCoins,
      bg: '#FBECE8',
      color: '#C85A32',
      path: '/keuangan/utang',
    },
    {
      label: 'Goal & Tabungan',
      icon: Target,
      bg: '#FDF3E1',
      color: '#B88228',
      path: '/keuangan/goal',
    },
    {
      label: 'Aset & Investasi',
      icon: Coins,
      bg: '#EEF3EF',
      color: '#4E7566',
      path: '/keuangan/aset',
    },
    {
      label: 'Alokasi',
      icon: Layers,
      bg: '#F3EDF4',
      color: '#7C5D68',
      path: '/keuangan/alokasi',
    },
    {
      label: 'Wallet & Transfer',
      icon: ArrowLeftRight,
      bg: '#EAF1F6',
      color: '#36688A',
      path: '/keuangan/wallet',
    },
    {
      label: 'Transaksi Rutin',
      icon: Repeat,
      bg: '#F9EBF0',
      color: '#B55B73',
      path: '/keuangan/rutin',
    },
    {
      label: 'Laporan & PDF',
      icon: FileBarChart,
      bg: '#F4EFE6',
      color: '#2A4D3E',
      path: '/keuangan/laporan',
    },
  ];

  const openCreateTxModal = (targetDate?: string) => {
    setEditingTx(null);
    setFormType('Pengeluaran');
    setFormAmount('');
    setFormDate(targetDate || (dateFilterMode === 'TODAY' ? singleDate : getTodayIso()));
    const expCats = transactionCategories.filter((c) => c.type === 'Pengeluaran');
    setFormCatId(expCats[0]?.id || '');
    setFormWalletId(wallets[0]?.id || '');
    setFormMember(loggedInMemberName);
    setFormNotes('');
    setFormError('');
    setIsSavingTx(false);
    setIsTxFormOpen(true);
  };

  const openEditTxModal = (tx: Transaction) => {
    setEditingTx(tx);
    setFormType(tx.type === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran');
    setFormAmount(formatRupiahInput(tx.amount));
    setFormDate(tx.date);
    setFormCatId(tx.category_id);
    setFormWalletId(tx.wallet_id);
    setFormMember(tx.member_name);
    setFormNotes(tx.notes);
    setFormError('');
    setIsSavingTx(false);
    setIsTxFormOpen(true);
  };

  const handleSaveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseRupiahInput(formAmount);
    if (!num || num <= 0) {
      setFormError('Nominal transaksi harus lebih besar dari 0.');
      return;
    }

    setIsSavingTx(true);

    try {
      let targetWalletId = formWalletId || wallets[0]?.id;
      if (!targetWalletId) {
        await addWallet({
          name: 'Dompet Utama',
          type: 'Tunai',
          balance: 0,
          color: '#2A4D3E',
          icon: 'Wallet',
        });
        targetWalletId = useFamilyStore.getState().wallets[0]?.id || '';
      }

      const catsForType = transactionCategories.filter((c) => c.type === formType);
      const chosenCat = formCatId || catsForType[0]?.id || '';

      const chosenMember = formMember || loggedInMemberName;
      const matchedMemberObj = members.find(
        (m) => m.name.toLowerCase() === chosenMember.toLowerCase()
      );

      if (editingTx) {
        await updateTransaction(editingTx.id, {
          type: formType,
          amount: num,
          date: formDate,
          category_id: chosenCat,
          wallet_id: targetWalletId,
          member_id: matchedMemberObj?.user_id || matchedMemberObj?.id || editingTx.member_id,
          member_name: chosenMember,
          notes: formNotes.trim() || formType,
        });
      } else {
        await addTransaction({
          type: formType,
          amount: num,
          date: formDate,
          category_id: chosenCat,
          wallet_id: targetWalletId,
          member_id: matchedMemberObj?.user_id || matchedMemberObj?.id || profile?.id || '',
          member_name: chosenMember,
          notes: formNotes.trim() || formType,
        });
      }

      setIsTxFormOpen(false);
      setEditingTx(null);
      setIsSavingTx(false);
    } catch (err: any) {
      setFormError(err?.message || 'Gagal menyimpan transaksi.');
      setIsSavingTx(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. NERACA KELUARGA */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2A4D3E] via-[#315847] to-[#1E3A2E] text-[#FAF7F2] p-5 sm:p-6 shadow-sm space-y-4 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#F4D393] truncate">
            Neraca Keluarga · Kekayaan Bersih
          </span>
          <button
            type="button"
            onClick={() => setShowNeracaDetail(true)}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition-colors shrink-0 cursor-pointer"
          >
            Detail Neraca
          </button>
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-mono-num font-bold tracking-tight text-white truncate">
              {formatRupiah(finance.netWorth, hideNumbers)}
            </h1>
            <button
              type="button"
              onClick={toggleHideNumbers}
              aria-label="Sembunyikan atau tampilkan nominal neraca"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] transition-colors shrink-0 cursor-pointer"
            >
              {hideNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-[#FAF7F2]/75 mt-1.5 leading-relaxed">
            Formula otomatis: Total Harta (Wallet + Tabungan Goal + Aset + Piutang) − Total Utang
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/15">
          <div className="bg-white/10 rounded-2xl p-3.5 min-w-0">
            <span className="text-xs text-[#FAF7F2]/80 block truncate">Total Harta (Aset)</span>
            <p className="text-base sm:text-lg font-mono-num font-bold text-[#F4D393] mt-1 truncate">
              {formatRupiah(finance.totalHarta, hideNumbers)}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-3.5 min-w-0">
            <span className="text-xs text-[#FAF7F2]/80 block truncate">Total Utang</span>
            <p className="text-base sm:text-lg font-mono-num font-bold text-[#F7B2A1] mt-1 truncate">
              {formatRupiah(finance.totalDebts, hideNumbers)}
            </p>
          </div>
        </div>
      </section>

      {/* 2. MENU KEUANGAN (8 SUBMENUS) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#1E2D24]">Menu Keuangan</h2>
          <span className="text-xs text-[#5C6B62]">Kelola seluruh pos finansial</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {financeMenus.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => navigate(m.path)}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                  style={{ backgroundColor: m.bg, color: m.color }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-[#1E2D24] mt-2 leading-tight">
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. WALLET SECTION */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Daftar Wallet Keluarga</h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Saldo Aktif: {formatRupiah(finance.activeBalance, hideNumbers)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/keuangan/wallet')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold hover:bg-[#E8E2D5] transition-colors"
            >
              Kelola & Transfer
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickSheet('wallet')}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Wallet</span>
            </button>
          </div>
        </div>

        {wallets.length === 0 ? (
          <EmptyState
            icon={WalletIcon}
            title="Belum ada wallet"
            description="Tambahkan dompet tunai, rekening bank, atau dompet digital keluarga Anda."
            actionLabel="Tambah Wallet Pertama"
            onAction={() => setActiveQuickSheet('wallet')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {wallets.map((w) => (
              <div
                key={w.id}
                onClick={() => navigate('/keuangan/wallet')}
                className="p-4 rounded-2xl border border-[#E8E2D5] bg-[#FAF7F2] hover:border-[#2A4D3E]/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: w.color }}
                  >
                    <IconRenderer name={w.icon || 'Wallet'} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#1E2D24] truncate">{w.name}</p>
                    <p className="text-xs text-[#5C6B62]">{w.type}</p>
                  </div>
                </div>
                <p className="text-sm font-mono-num font-bold text-[#1E2D24] shrink-0">
                  {formatRupiah(w.balance, hideNumbers)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. FILTER & RINGKASAN SALDO AKTIF, PEMASUKAN, PENGELUARAN */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#2A4D3E]" />
            <h2 className="text-sm font-bold text-[#1E2D24]">Filter & Arus Kas</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={selectedMonth === 'ALL' ? '' : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || 'ALL')}
              aria-label="Filter bulan"
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-medium text-[#1E2D24]"
            />
            <button
              type="button"
              onClick={() =>
                setSelectedMonth(selectedMonth === 'ALL' ? getCurrentMonthIso() : 'ALL')
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                selectedMonth === 'ALL'
                  ? 'bg-[#2A4D3E] text-white border-[#2A4D3E]'
                  : 'bg-[#FAF7F2] text-[#5C6B62] border-[#E8E2D5]'
              }`}
            >
              Semua Periode
            </button>

            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              aria-label="Filter wallet"
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-medium text-[#1E2D24]"
            >
              <option value="ALL">Semua Wallet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <span className="text-xs text-[#5C6B62]">Saldo Aktif Wallet</span>
            <p className="text-lg font-mono-num font-bold text-[#1E2D24] mt-1">
              {formatRupiah(finance.activeBalance, hideNumbers)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <div className="flex items-center gap-1.5 text-xs text-[#2A4D3E] font-medium">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Total Pemasukan</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-[#2A4D3E] mt-1">
              {formatRupiah(finance.totalIncome, hideNumbers)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <div className="flex items-center gap-1.5 text-xs text-[#C84B31] font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Total Pengeluaran</span>
            </div>
            <p className="text-lg font-mono-num font-bold text-[#C84B31] mt-1">
              {formatRupiah(finance.totalExpense, hideNumbers)}
            </p>
          </div>
        </div>
      </section>

      {/* 5. DAFTAR TRANSAKSI TERBARU (HANYA YANG TERBARU SAJA) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#2A4D3E]" />
              <h2 className="text-sm font-bold text-[#1E2D24]">Transaksi Terbaru</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-[10px] font-bold">
                5 Terkini
              </span>
            </div>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Menampilkan 5 transaksi mutasi paling baru yang dicatat keluarga Anda
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDateFilterMode('ALL');
              const el = document.getElementById('riwayat-transaksi-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="text-xs font-semibold text-[#2A4D3E] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Belum ada transaksi"
            description="Mulai catat transaksi pertamamu agar laporan keuangan keluarga terhitung otomatis."
            actionLabel="Catat Transaksi Pertama"
            onAction={() => openCreateTxModal()}
          />
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => {
              const cat = transactionCategories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              return (
                <div
                  key={tx.id}
                  onClick={() => setViewingTx(tx)}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E]/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                        style={{
                          backgroundColor:
                            tx.type === 'Transfer' ? '#457B9D' : cat?.color || '#2A4D3E',
                        }}
                      >
                        <IconRenderer
                          name={tx.type === 'Transfer' ? 'Repeat' : cat?.icon || 'Receipt'}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1E2D24] truncate">
                          {tx.notes || cat?.name || tx.type}
                        </p>
                        <p className="text-xs text-[#5C6B62] truncate mt-0.5">
                          {tx.type === 'Transfer' ? 'Transfer Wallet' : cat?.name || tx.type} ·{' '}
                          {wallet?.name || 'Wallet'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`block text-sm font-mono-num font-bold ${
                          tx.type === 'Pemasukan'
                            ? 'text-[#2A4D3E]'
                            : tx.type === 'Pengeluaran'
                            ? 'text-[#C84B31]'
                            : 'text-[#457B9D]'
                        }`}
                      >
                        {tx.type === 'Pemasukan' ? '+' : tx.type === 'Pengeluaran' ? '-' : ''}
                        {formatRupiah(tx.amount, hideNumbers)}
                      </span>
                      <span className="block text-[11px] text-[#5C6B62] mt-0.5">
                        {formatDateId(tx.date, 'd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. RIWAYAT TRANSAKSI (DEFAULT: HARI ITU SAJA + FILTER TANGGAL / RENTANG TANGGAL) */}
      <section id="riwayat-transaksi-section" className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2A4D3E]" />
              <h2 className="text-sm font-bold text-[#1E2D24]">Riwayat Transaksi</h2>
              {txSyncStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-[11px] font-semibold border border-[#2A4D3E]/20 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin text-[#2A4D3E]" />
                  <span>Menyimpan...</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Menampilkan {filteredHistoryTransactions.length} transaksi untuk:{' '}
              <strong className="text-[#2A4D3E] font-semibold">{activeDateLabel}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                exportFinanceReportToPdf({
                  family,
                  periodLabel: activeDateLabel,
                  transactions: filteredHistoryTransactions,
                  transactionCategories,
                  wallets,
                  assets,
                  goals,
                  debts,
                })
              }
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] border border-[#2A4D3E]/20 text-xs font-semibold hover:bg-[#E8E2D5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor PDF</span>
            </button>
            <button
              type="button"
              onClick={() => openCreateTxModal(dateFilterMode === 'TODAY' ? singleDate : undefined)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </button>
          </div>
        </div>

        {/* Filter Tanggal & Rentang Tanggal Box */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1E2D24] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#2A4D3E]" />
              <span>Filter Periode & Rentang Tanggal</span>
            </span>
            {dateFilterMode !== 'TODAY' && (
              <button
                type="button"
                onClick={goToToday}
                className="text-[11px] font-semibold text-[#2A4D3E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Kembali ke Hari Ini</span>
              </button>
            )}
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'YESTERDAY', label: 'Kemarin' },
              { id: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
              { id: 'THIS_MONTH', label: 'Bulan Ini' },
              { id: 'RANGE', label: 'Rentang Tanggal' },
              { id: 'ALL', label: 'Semua Waktu' },
            ].map((p) => {
              const isActive = dateFilterMode === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateFilterMode(p.id as DateFilterMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2A4D3E] text-white shadow-sm'
                      : 'bg-white border border-[#E8E2D5] text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Sub-bar: Specific Date Navigator (when TODAY or single date mode) */}
          {dateFilterMode === 'TODAY' && (
            <div className="pt-2 border-t border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevDay}
                  title="Hari Sebelumnya"
                  className="w-8 h-8 rounded-lg bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6] cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-[140px]">
                  <DateInput
                    value={singleDate}
                    onChange={(val) => {
                      setSingleDate(val);
                      setDateFilterMode('TODAY');
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={goToNextDay}
                  title="Hari Berikutnya"
                  className="w-8 h-8 rounded-lg bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6] cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {singleDate !== getTodayIso() && (
                  <button
                    type="button"
                    onClick={goToToday}
                    className="px-2.5 py-1.5 rounded-lg bg-[#E8F2EC] text-[#2A4D3E] text-[11px] font-semibold hover:bg-[#d5e7dc] cursor-pointer"
                  >
                    Hari Ini
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#5C6B62]">
                Menampilkan mutasi pada hari <strong className="text-[#1E2D24]">{formatDateId(singleDate, 'EEEE, d MMMM yyyy')}</strong>
              </div>
            </div>
          )}

          {/* Sub-bar: Custom Date Range (when RANGE mode) */}
          {dateFilterMode === 'RANGE' && (
            <div className="pt-2 border-t border-[#E8E2D5] space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-[#5C6B62] shrink-0">Dari:</span>
                  <div className="flex-1">
                    <DateInput value={rangeStartDate} onChange={setRangeStartDate} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-[#5C6B62] shrink-0">Sampai:</span>
                  <div className="flex-1">
                    <DateInput value={rangeEndDate} onChange={setRangeEndDate} />
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-[#5C6B62]">
                Menampilkan transaksi dalam rentang tanggal yang dipilih di atas.
              </div>
            </div>
          )}

          {/* Sub-bar: Ringkasan Nilai Tanggal/Rentang Terpilih */}
          <div className="pt-2 border-t border-[#E8E2D5] grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-white border border-[#E8E2D5]">
              <span className="text-[10px] text-[#5C6B62] block">Pemasukan</span>
              <strong className="text-xs font-mono-num font-bold text-[#2A4D3E]">
                {formatRupiah(historySummary.income, hideNumbers)}
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E8E2D5]">
              <span className="text-[10px] text-[#5C6B62] block">Pengeluaran</span>
              <strong className="text-xs font-mono-num font-bold text-[#C84B31]">
                {formatRupiah(historySummary.expense, hideNumbers)}
              </strong>
            </div>
            <div className="p-2 rounded-xl bg-white border border-[#E8E2D5]">
              <span className="text-[10px] text-[#5C6B62] block">Selisih Net</span>
              <strong
                className={`text-xs font-mono-num font-bold ${
                  historySummary.net >= 0 ? 'text-[#2A4D3E]' : 'text-[#C84B31]'
                }`}
              >
                {formatRupiah(historySummary.net, hideNumbers)}
              </strong>
            </div>
          </div>
        </div>

        {/* Additional Filters: Search, Type, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#5C6B62] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari catatan, anggota, nominal..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1E2D24]"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            aria-label="Filter jenis transaksi"
            className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1E2D24]"
          >
            <option value="ALL">Semua Jenis Transaksi</option>
            <option value="Pengeluaran">Pengeluaran</option>
            <option value="Pemasukan">Pemasukan</option>
            <option value="Transfer">Transfer Antar Wallet</option>
          </select>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            aria-label="Filter kategori transaksi"
            className="px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1E2D24]"
          >
            <option value="ALL">Semua Kategori</option>
            {transactionCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* List of Transactions */}
        {filteredHistoryTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={
              dateFilterMode === 'TODAY'
                ? `Belum ada transaksi di ${activeDateLabel}`
                : `Tidak ada transaksi pada ${activeDateLabel}`
            }
            description="Mulai catat transaksi untuk tanggal ini, atau ubah filter periode di atas untuk melihat tanggal lain."
            actionLabel={`Catat Transaksi untuk ${dateFilterMode === 'TODAY' ? 'Hari Ini' : 'Tanggal Ini'}`}
            onAction={() => openCreateTxModal(dateFilterMode === 'TODAY' ? singleDate : undefined)}
          />
        ) : (
          <div className="space-y-3">
            {filteredHistoryTransactions.map((tx) => {
              const cat = transactionCategories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              return (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E]/40 transition-colors space-y-2.5"
                >
                  {/* Top Row: Icon + Title/Category on Left, Nominal on Right */}
                  <div
                    onClick={() => setViewingTx(tx)}
                    className="flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5"
                        style={{
                          backgroundColor:
                            tx.type === 'Transfer' ? '#457B9D' : cat?.color || '#2A4D3E',
                        }}
                      >
                        <IconRenderer
                          name={tx.type === 'Transfer' ? 'Repeat' : cat?.icon || 'Receipt'}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-[#1E2D24] truncate">
                          {tx.notes || cat?.name || tx.type}
                        </p>
                        <p className="text-xs text-[#5C6B62] truncate mt-0.5">
                          {tx.type === 'Transfer' ? 'Transfer Wallet' : cat?.name || tx.type} ·{' '}
                          {wallet?.name || 'Wallet'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`block text-sm font-mono-num font-bold ${
                          tx.type === 'Pemasukan'
                            ? 'text-[#2A4D3E]'
                            : tx.type === 'Pengeluaran'
                            ? 'text-[#C84B31]'
                            : 'text-[#457B9D]'
                        }`}
                      >
                        {tx.type === 'Pemasukan' ? '+' : tx.type === 'Pengeluaran' ? '-' : ''}
                        {formatRupiah(tx.amount, hideNumbers)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Date & Member on Left, Action Buttons on Right */}
                  <div className="pt-2 border-t border-[#E8E2D5]/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#5C6B62] min-w-0 truncate">
                      <span>{formatDateId(tx.date, 'd MMM yyyy')}</span>
                      {tx.member_name && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{tx.member_name}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {tx.type !== 'Transfer' && (
                        <button
                          type="button"
                          onClick={() => openEditTxModal(tx)}
                          aria-label="Edit transaksi"
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#E8E2D5]/60 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setDeletingTxId(tx.id)}
                        aria-label="Hapus transaksi"
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-[#C84B31] hover:bg-[#FDECEC] flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL: DETAIL NERACA KELUARGA */}
      <ResponsiveModal
        isOpen={showNeracaDetail}
        onClose={() => setShowNeracaDetail(false)}
        title="Rincian Neraca Keluarga"
        subtitle="Komposisi Harta, Utang, dan Kekayaan Bersih secara real-time"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#2A4D3E] text-white">
            <span className="text-xs text-[#F4D393]">Total Kekayaan Bersih</span>
            <p className="text-2xl font-mono-num font-bold mt-1">
              {formatRupiah(finance.netWorth, hideNumbers)}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#1E2D24]">Komponen Harta (Aset Positif)</h4>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D5] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Saldo Seluruh Wallet</span>
                <span className="font-mono-num font-semibold text-[#1E2D24]">
                  {formatRupiah(finance.activeBalance, hideNumbers)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Nilai Aset & Investasi</span>
                <span className="font-mono-num font-semibold text-[#1E2D24]">
                  {formatRupiah(finance.totalPhysicalAssets, hideNumbers)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Tabungan Goal Terkumpul</span>
                <span className="font-mono-num font-semibold text-[#1E2D24]">
                  {formatRupiah(finance.totalGoalSavings, hideNumbers)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Piutang Belum Tertagih</span>
                <span className="font-mono-num font-semibold text-[#1E2D24]">
                  {formatRupiah(finance.totalReceivables, hideNumbers)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E8E2D5] font-bold text-[#2A4D3E]">
                <span>Total Harta</span>
                <span className="font-mono-num">{formatRupiah(finance.totalHarta, hideNumbers)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-[#1E2D24]">Komponen Kewajiban (Utang)</h4>
            <div className="p-3.5 rounded-2xl bg-white border border-[#E8E2D5] space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#C84B31]">
                <span>Sisa Utang Belum Lunas</span>
                <span className="font-mono-num">{formatRupiah(finance.totalDebts, hideNumbers)}</span>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveModal>

      {/* MODAL: DETAIL TRANSAKSI */}
      <ResponsiveModal
        isOpen={Boolean(viewingTx)}
        onClose={() => setViewingTx(null)}
        title="Detail Transaksi"
      >
        {viewingTx && (
          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Jenis Transaksi</span>
                <span className="font-bold text-[#1E2D24]">{viewingTx.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Nominal</span>
                <span className="font-mono-num font-bold text-sm text-[#2A4D3E]">
                  {formatRupiah(viewingTx.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Tanggal</span>
                <span className="font-semibold text-[#1E2D24]">{formatDateId(viewingTx.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Kategori</span>
                <span className="font-semibold text-[#1E2D24]">
                  {transactionCategories.find((c) => c.id === viewingTx.category_id)?.name ||
                    viewingTx.type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Wallet</span>
                <span className="font-semibold text-[#1E2D24]">
                  {wallets.find((w) => w.id === viewingTx.wallet_id)?.name || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Dicatat Oleh</span>
                <span className="font-semibold text-[#1E2D24]">{viewingTx.member_name}</span>
              </div>
              <div className="pt-2 border-t border-[#E8E2D5]">
                <span className="text-[#5C6B62] block mb-1">Catatan:</span>
                <p className="text-[#1E2D24] font-medium">{viewingTx.notes}</p>
              </div>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT TRANSAKSI */}
      <ResponsiveModal
        isOpen={isTxFormOpen}
        onClose={() => setIsTxFormOpen(false)}
        title={editingTx ? 'Edit Transaksi' : 'Tambah Transaksi'}
      >
        <form onSubmit={handleSaveTx} className="space-y-3.5">
          {formError && (
            <p className="text-xs text-[#C84B31] bg-[#FDECEC] px-3 py-2 rounded-xl">{formError}</p>
          )}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4EFE6] rounded-xl">
            {(['Pengeluaran', 'Pemasukan'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setFormType(t);
                  const firstCat = transactionCategories.find((c) => c.type === t);
                  setFormCatId(firstCat?.id || '');
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                  formType === t ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <CurrencyInput
            label="Nominal Transaksi"
            required
            value={formAmount}
            onChange={(val) => setFormAmount(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={formDate} onChange={setFormDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={formCatId}
                onChange={(e) => setFormCatId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {transactionCategories
                  .filter((c) => c.type === formType)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Wallet</label>
              <select
                value={formWalletId}
                onChange={(e) => setFormWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {wallets.length === 0 ? (
                  <option value="">Dompet Utama (Otomatis)</option>
                ) : (
                  wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Anggota Keluarga
              </label>
              <select
                value={formMember || loggedInMemberName}
                onChange={(e) => setFormMember(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
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
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Keterangan transaksi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {isSavingTx && (
                <div className="flex items-center gap-1.5 text-xs text-[#2A4D3E] font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2A4D3E]" />
                  <span>
                    {editingTx ? 'Menyimpan perubahan...' : 'Menyimpan...'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isSavingTx}
                onClick={() => {
                  setIsTxFormOpen(false);
                  setEditingTx(null);
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingTx}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-80"
              >
                {isSavingTx ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{editingTx ? 'Menyimpan Perubahan...' : 'Menyimpan...'}</span>
                  </>
                ) : (
                  <span>{editingTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingTxId)}
        onClose={() => setDeletingTxId(null)}
        onConfirm={() => {
          if (deletingTxId) deleteTransaction(deletingTxId);
        }}
        title="Hapus Transaksi?"
        description="Menghapus transaksi ini akan otomatis mengembalikan mutasi saldo pada wallet terkait."
      />
    </div>
  );
}
