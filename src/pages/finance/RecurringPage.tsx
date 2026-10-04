import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Edit3,
  Plus,
  Receipt,
  Repeat,
  Trash2,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import {
  formatDateId,
  formatRupiah,
  formatRupiahInput,
  parseRupiahInput,
  getTodayIso,
} from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { FrequencyType, RecurringTransaction } from '../../types';

export function RecurringPage() {
  const navigate = useNavigate();
  const recurringTransactions = useFamilyStore((s) => s.recurringTransactions);
  const transactions = useFamilyStore((s) => s.transactions);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const wallets = useFamilyStore((s) => s.wallets);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const addRecurringTransaction = useFamilyStore((s) => s.addRecurringTransaction);
  const updateRecurringTransaction = useFamilyStore((s) => s.updateRecurringTransaction);
  const executeRecurringTransactionNow = useFamilyStore((s) => s.executeRecurringTransactionNow);
  const deleteRecurringTransaction = useFamilyStore((s) => s.deleteRecurringTransaction);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRec, setEditingRec] = useState<RecurringTransaction | null>(null);
  const [deletingRecId, setDeletingRecId] = useState<string | null>(null);

  const [justRecordedId, setJustRecordedId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<'Pengeluaran' | 'Pemasukan'>('Pengeluaran');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [startDate, setStartDate] = useState(getTodayIso());
  const [frequency, setFrequency] = useState<FrequencyType>('Bulanan');
  const [endDate, setEndDate] = useState('');

  // Recorded transactions originating from recurring rules
  const recordedRecurringHistory = useMemo(
    () => transactions.filter((t) => t.notes.startsWith('Transaksi Rutin:')).slice(0, 8),
    [transactions]
  );

  const openCreateModal = () => {
    setEditingRec(null);
    setName('');
    setType('Pengeluaran');
    setAmount('');
    const expCats = transactionCategories.filter((c) => c.type === 'Pengeluaran');
    setCategoryId(expCats[0]?.id || '');
    setWalletId(wallets[0]?.id || '');
    setStartDate(getTodayIso());
    setFrequency('Bulanan');
    setEndDate('');
    setIsFormOpen(true);
  };

  const openEditModal = (r: RecurringTransaction) => {
    setEditingRec(r);
    setName(r.name);
    setType(r.type);
    setAmount(formatRupiahInput(r.amount));
    setCategoryId(r.category_id);
    setWalletId(r.wallet_id);
    setStartDate(r.start_date);
    setFrequency(r.frequency);
    setEndDate(r.end_date || '');
    setIsFormOpen(true);
  };

  const handleRecordNow = async (r: RecurringTransaction) => {
    await executeRecurringTransactionNow(r.id);
    setJustRecordedId(r.id);
    setStatusMessage(
      `Transaksi rutin "${r.name}" (${formatRupiah(
        r.amount,
        hideNumbers
      )}) berhasil dicatat ke Riwayat Transaksi hari ini & jadwal berikutnya telah diperbarui.`
    );
    setTimeout(() => {
      setJustRecordedId((prev) => (prev === r.id ? null : prev));
    }, 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseRupiahInput(amount);
    if (!name.trim() || !num || num <= 0) return;

    const chosenWallet = walletId || wallets[0]?.id || '';
    const chosenCat =
      categoryId || transactionCategories.find((c) => c.type === type)?.id || '';

    if (editingRec) {
      await updateRecurringTransaction(editingRec.id, {
        name: name.trim(),
        type,
        amount: num,
        category_id: chosenCat,
        wallet_id: chosenWallet,
        start_date: startDate,
        frequency,
        end_date: endDate || undefined,
      });
    } else {
      await addRecurringTransaction({
        name: name.trim(),
        type,
        amount: num,
        category_id: chosenCat,
        wallet_id: chosenWallet,
        start_date: startDate,
        frequency,
        end_date: endDate || undefined,
        is_active: true,
      });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/keuangan')}
            aria-label="Kembali ke Keuangan"
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white border border-[#E8E2D5] flex items-center justify-center text-[#1E2D24] hover:bg-[#F4EFE6] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-[#1E2D24]">Transaksi Rutin</h1>
            <p className="text-xs text-[#5C6B62]">
              Jadwal tagihan & pemasukan berulang otomatis tampil di Kalender
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rutin</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-2xl bg-[#EAF4EE] border border-[#2A4D3E]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs font-semibold text-[#2A4D3E]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/keuangan')}
            className="px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <span>Lihat di Keuangan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {recurringTransactions.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Belum ada transaksi rutin"
          description="Catat tagihan listrik, internet, cicilan, atau gaji bulanan agar jadwal berikutnya terhitung otomatis."
          actionLabel="Buat Transaksi Rutin"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map((r) => {
            const cat = transactionCategories.find((c) => c.id === r.category_id);
            const wallet = wallets.find((w) => w.id === r.wallet_id);
            const isRecordedJustNow = justRecordedId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5C6B62]">
                    <span className="font-semibold text-[#2A4D3E]">{r.frequency}</span>
                    <span>·</span>
                    <span>{cat?.name || r.type}</span>
                    <span>·</span>
                    <span>{wallet?.name || wallets[0]?.name || 'Dompet Utama'}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#1E2D24]">{r.name}</h3>
                  <p className="text-xs text-[#5C6B62]">
                    Jadwal Berikutnya:{' '}
                    <strong className="text-[#1E2D24]">{formatDateId(r.next_date)}</strong>
                    {r.end_date ? ` · Berakhir ${formatDateId(r.end_date)}` : ''}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBE1]">
                  <span
                    className={`text-sm font-mono-num font-bold ${
                      r.type === 'Pemasukan' ? 'text-[#2A4D3E]' : 'text-[#C84B31]'
                    }`}
                  >
                    {formatRupiah(r.amount, hideNumbers)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleRecordNow(r)}
                      title="Catat sebagai transaksi hari ini"
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isRecordedJustNow
                          ? 'bg-[#2A4D3E] text-white'
                          : 'bg-[#F4EFE6] text-[#2A4D3E] hover:bg-[#E8E2D5]'
                      }`}
                    >
                      {isRecordedJustNow ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tercatat Hari Ini</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Catat Sekarang</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(r)}
                      aria-label="Edit transaksi rutin"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6] cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingRecId(r.id)}
                      aria-label="Hapus transaksi rutin"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RIWAYAT TRANSAKSI RUTIN YANG TELAH DICATAT */}
      {recordedRecurringHistory.length > 0 && (
        <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#2A4D3E]" />
              <h2 className="text-sm font-bold text-[#1E2D24]">
                Riwayat Transaksi Rutin yang Dicatat
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/keuangan')}
              className="text-xs font-semibold text-[#2A4D3E] hover:underline cursor-pointer"
            >
              Semua Transaksi
            </button>
          </div>

          <div className="divide-y divide-[#F0EBE1]">
            {recordedRecurringHistory.map((tx) => {
              const w = wallets.find((item) => item.id === tx.wallet_id);
              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-[#1E2D24] truncate">{tx.notes}</p>
                    <p className="text-[#5C6B62] mt-0.5">
                      {formatDateId(tx.date, 'd MMM yyyy')} · {w?.name || 'Dompet Utama'}
                    </p>
                  </div>
                  <span
                    className={`font-mono-num font-bold shrink-0 ${
                      tx.type === 'Pemasukan' ? 'text-[#2A4D3E]' : 'text-[#C84B31]'
                    }`}
                  >
                    {tx.type === 'Pemasukan' ? '+' : '-'}
                    {formatRupiah(tx.amount, hideNumbers)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ResponsiveModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingRec ? 'Edit Transaksi Rutin' : 'Tambah Transaksi Rutin'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4EFE6] rounded-xl">
            {(['Pengeluaran', 'Pemasukan'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  const firstCat = transactionCategories.find((c) => c.type === t);
                  setCategoryId(firstCat?.id || '');
                }}
                className={`py-2 text-xs font-semibold rounded-lg cursor-pointer ${
                  type === t ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Nama Transaksi Rutin
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Langganan Internet, Listrik, Gaji"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyInput
              label="Nominal Transaksi"
              required
              value={amount}
              onChange={(val) => setAmount(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
              quickAmounts={[50_000, 100_000, 250_000, 500_000, 1_000_000]}
            />
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Frekuensi</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FrequencyType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
                <option value="Tahunan">Tahunan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {transactionCategories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Wallet</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {wallets.length === 0 ? (
                  <option value="">Dompet Utama (Otomatis dibuat)</option>
                ) : (
                  wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal Mulai (dd/mm/yyyy)
              </label>
              <DateInput required value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal Berakhir (dd/mm/yyyy)
              </label>
              <DateInput value={endDate} onChange={setEndDate} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold cursor-pointer"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingRecId)}
        onClose={() => setDeletingRecId(null)}
        onConfirm={() => {
          if (deletingRecId) deleteRecurringTransaction(deletingRecId);
        }}
        title="Hapus Transaksi Rutin?"
        description="Jadwal transaksi berulang ini akan dihapus dari daftar."
      />
    </div>
  );
}
