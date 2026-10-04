import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Edit3,
  PieChart,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatRupiah, formatRupiahInput, parseRupiahInput, getCurrentMonthIso } from '../../utils/format';
import { AVAILABLE_ICON_NAMES, IconRenderer, PALETTE_COLORS } from '../../components/ui/IconRenderer';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { TransactionCategory } from '../../types';

export function BudgetCategoryPage() {
  const navigate = useNavigate();
  const budgets = useFamilyStore((s) => s.budgets);
  const transactions = useFamilyStore((s) => s.transactions);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const upsertBudget = useFamilyStore((s) => s.upsertBudget);
  const deleteBudget = useFamilyStore((s) => s.deleteBudget);
  const addTransactionCategory = useFamilyStore((s) => s.addTransactionCategory);
  const updateTransactionCategory = useFamilyStore((s) => s.updateTransactionCategory);
  const deleteTransactionCategory = useFamilyStore((s) => s.deleteTransactionCategory);

  const [activeTab, setActiveTab] = useState<'budget' | 'category'>('budget');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIso());

  // Budget Modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetCatId, setBudgetCatId] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetGroup, setBudgetGroup] = useState<'Kebutuhan Pokok' | 'Tabungan & Investasi' | 'Gaya Hidup & Keluarga'>('Kebutuhan Pokok');

  // Category Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<TransactionCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran');
  const [catIcon, setCatIcon] = useState('Utensils');
  const [catColor, setCatColor] = useState('#2A4D3E');
  const [deletingCat, setDeletingCat] = useState<TransactionCategory | null>(null);

  const expenseCategories = useMemo(
    () => transactionCategories.filter((c) => c.type === 'Pengeluaran'),
    [transactionCategories]
  );

  const budgetRows = useMemo(() => {
    const monthB = budgets.filter((b) => b.period_month === selectedMonth);
    return monthB.map((b) => {
      const cat = transactionCategories.find((c) => c.id === b.category_id);
      const spent = transactions
        .filter(
          (t) =>
            t.type === 'Pengeluaran' &&
            t.category_id === b.category_id &&
            t.date.startsWith(selectedMonth)
        )
        .reduce((sum, t) => sum + t.amount, 0);
      const remaining = b.amount - spent;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return {
        budget: b,
        category: cat,
        spent,
        remaining,
        pct,
      };
    });
  }, [budgets, selectedMonth, transactionCategories, transactions]);

  const totalBudgeted = budgetRows.reduce((s, r) => s + r.budget.amount, 0);
  const totalSpent = budgetRows.reduce((s, r) => s + r.spent, 0);
  const totalRemaining = totalBudgeted - totalSpent;
  const totalPct = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseRupiahInput(budgetAmount);
    if (!num || num <= 0) return;
    const chosenCat = budgetCatId || expenseCategories[0]?.id;
    if (!chosenCat) return;
    await upsertBudget({
      category_id: chosenCat,
      amount: num,
      period_month: selectedMonth,
      allocation_group: budgetGroup,
    });
    setIsBudgetModalOpen(false);
  };

  const openNewCategoryModal = () => {
    setEditingCat(null);
    setCatName('');
    setCatType('Pengeluaran');
    setCatIcon('Tag');
    setCatColor('#2A4D3E');
    setIsCatModalOpen(true);
  };

  const openEditCategoryModal = (cat: TransactionCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatType(cat.type);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    if (editingCat) {
      await updateTransactionCategory(editingCat.id, {
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    } else {
      await addTransactionCategory({
        name: catName.trim(),
        type: catType,
        icon: catIcon,
        color: catColor,
      });
    }
    setIsCatModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Subpage Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/keuangan')}
            aria-label="Kembali ke Keuangan"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1E2D24]">Anggaran & Kategori</h1>
            <p className="text-xs text-[#5C6B62]">Atur batas pengeluaran bulanan & kategori transaksi</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F4EFE6] rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'budget' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
          }`}
        >
          Anggaran Bulanan
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('category')}
          className={`py-2.5 text-xs font-bold rounded-xl transition-colors ${
            activeTab === 'category' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
          }`}
        >
          Kategori Transaksi ({transactionCategories.length})
        </button>
      </div>

      {activeTab === 'budget' ? (
        <div className="space-y-4">
          {/* Month selector & Summary */}
          <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#1E2D24]">Ringkasan Anggaran</h2>
                <p className="text-xs text-[#5C6B62]">Terpakai {totalPct}% dari total anggaran</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthIso())}
                  className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBudgetCatId(expenseCategories[0]?.id || '');
                    setBudgetAmount('');
                    setIsBudgetModalOpen(true);
                  }}
                  className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Atur Budget</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <span className="text-[11px] text-[#5C6B62]">Total Budget</span>
                <p className="text-sm sm:text-base font-mono-num font-bold text-[#1E2D24] mt-1 truncate">
                  {formatRupiah(totalBudgeted, hideNumbers)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <span className="text-[11px] text-[#5C6B62]">Terpakai</span>
                <p className="text-sm sm:text-base font-mono-num font-bold text-[#C84B31] mt-1 truncate">
                  {formatRupiah(totalSpent, hideNumbers)}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                <span className="text-[11px] text-[#5C6B62]">Sisa Anggaran</span>
                <p className="text-sm sm:text-base font-mono-num font-bold text-[#2A4D3E] mt-1 truncate">
                  {formatRupiah(totalRemaining, hideNumbers)}
                </p>
              </div>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#F4EFE6] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  totalPct >= 100
                    ? 'bg-[#C84B31]'
                    : totalPct >= 80
                    ? 'bg-[#D4A359]'
                    : 'bg-[#2A4D3E]'
                }`}
                style={{ width: `${Math.min(100, totalPct)}%` }}
              />
            </div>
          </section>

          {budgetRows.length === 0 ? (
            <EmptyState
              icon={PieChart}
              title="Belum ada anggaran bulan ini"
              description="Tetapkan batas pengeluaran per kategori agar keuangan keluarga tetap terkendali."
              actionLabel="Atur Anggaran Pertama"
              onAction={() => {
                setBudgetCatId(expenseCategories[0]?.id || '');
                setBudgetAmount('');
                setIsBudgetModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-3">
              {budgetRows.map(({ budget, category, spent, remaining, pct }) => {
                const isNearLimit = pct >= 80 && pct < 100;
                const isOverLimit = pct >= 100;

                return (
                  <div
                    key={budget.id}
                    className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: category?.color || '#2A4D3E' }}
                        >
                          <IconRenderer name={category?.icon || 'Tag'} className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#1E2D24]">
                            {category?.name || 'Kategori'}
                          </h3>
                          <p className="text-xs text-[#5C6B62]">
                            Pos: {budget.allocation_group || 'Kebutuhan Pokok'} · {pct}% digunakan
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setBudgetCatId(budget.category_id);
                            setBudgetAmount(formatRupiahInput(budget.amount));
                            setBudgetGroup(budget.allocation_group || 'Kebutuhan Pokok');
                            setIsBudgetModalOpen(true);
                          }}
                          aria-label="Edit anggaran"
                          className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBudget(budget.id)}
                          aria-label="Hapus anggaran"
                          className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-[#F4EFE6] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverLimit
                            ? 'bg-[#C84B31]'
                            : isNearLimit
                            ? 'bg-[#D4A359]'
                            : 'bg-[#2A4D3E]'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#5C6B62]">
                        Pengeluaran:{' '}
                        <strong className="font-mono-num text-[#1E2D24]">
                          {formatRupiah(spent, hideNumbers)}
                        </strong>{' '}
                        dari {formatRupiah(budget.amount, hideNumbers)}
                      </span>
                      <span
                        className={`font-mono-num font-bold ${
                          remaining < 0 ? 'text-[#C84B31]' : 'text-[#2A4D3E]'
                        }`}
                      >
                        Sisa: {formatRupiah(remaining, hideNumbers)}
                      </span>
                    </div>

                    {(isNearLimit || isOverLimit) && (
                      <div
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${
                          isOverLimit
                            ? 'bg-[#FDECEC] text-[#C84B31]'
                            : 'bg-[#FDF3E1] text-[#9B6B21]'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          {isOverLimit
                            ? 'Anggaran kategori ini sudah melampaui batas bulanan!'
                            : 'Perhatian: Anggaran kategori ini hampir habis (lebih dari 80%).'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-3xl border border-[#E8E2D5] p-5">
            <div>
              <h2 className="text-sm font-bold text-[#1E2D24]">Daftar Kategori Transaksi</h2>
              <p className="text-xs text-[#5C6B62]">
                Tambah atau sesuaikan ikon & warna kategori pemasukan dan pengeluaran
              </p>
            </div>
            <button
              type="button"
              onClick={openNewCategoryModal}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Kategori</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transactionCategories.map((cat) => {
              const usedCount = transactions.filter((t) => t.category_id === cat.id).length;
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl border border-[#E8E2D5] p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconRenderer name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1E2D24] truncate">{cat.name}</p>
                      <p className="text-xs text-[#5C6B62]">
                        {cat.type} · Digunakan pada {usedCount} transaksi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditCategoryModal(cat)}
                      aria-label="Edit kategori"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCat(cat)}
                      aria-label="Hapus kategori"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: SET BUDGET */}
      <ResponsiveModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        title="Atur Anggaran Kategori"
        subtitle={`Periode: ${selectedMonth}`}
      >
        <form onSubmit={handleSaveBudget} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Pilih Kategori Pengeluaran
            </label>
            <select
              value={budgetCatId}
              onChange={(e) => setBudgetCatId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <CurrencyInput
            label="Batas Anggaran Bulanan"
            required
            value={budgetAmount}
            onChange={(val) => setBudgetAmount(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
            quickAmounts={[500_000, 1_000_000, 2_000_000, 5_000_000]}
          />

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Kelompok Alokasi
            </label>
            <select
              value={budgetGroup}
              onChange={(e) => setBudgetGroup(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              <option value="Kebutuhan Pokok">Kebutuhan Pokok</option>
              <option value="Tabungan & Investasi">Tabungan & Investasi</option>
              <option value="Gaya Hidup & Keluarga">Gaya Hidup & Keluarga</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsBudgetModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Budget
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD / EDIT CATEGORY */}
      <ResponsiveModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
      >
        <form onSubmit={handleSaveCategory} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Kategori</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Contoh: Belanja Bulanan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Jenis Kategori</label>
            <select
              value={catType}
              onChange={(e) => setCatType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              <option value="Pengeluaran">Pengeluaran</option>
              <option value="Pemasukan">Pemasukan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Pilih Ikon</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_ICON_NAMES.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setCatIcon(ic)}
                  className={`p-2 rounded-xl border ${
                    catIcon === ic
                      ? 'bg-[#2A4D3E] text-white border-[#2A4D3E]'
                      : 'bg-white text-[#1E2D24] border-[#E8E2D5]'
                  }`}
                >
                  <IconRenderer name={ic} className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Pilih Warna</label>
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
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Kategori
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingCat)}
        onClose={() => setDeletingCat(null)}
        onConfirm={() => {
          if (deletingCat) deleteTransactionCategory(deletingCat.id);
        }}
        title="Hapus Kategori?"
        description="Jika kategori ini sudah digunakan oleh transaksi yang ada, transaksi tersebut akan otomatis dipindahkan ke kategori 'Lainnya' agar riwayat transaksi keluarga tetap aman dan tidak rusak."
      />
    </div>
  );
}
