import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  HandCoins,
  Plus,
  Trash2,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, formatRupiahInput, parseRupiahInput, getTodayIso } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { Debt, DebtType } from '../../types';

export function DebtPage() {
  const navigate = useNavigate();
  const debts = useFamilyStore((s) => s.debts);
  const wallets = useFamilyStore((s) => s.wallets);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const addDebt = useFamilyStore((s) => s.addDebt);
  const updateDebt = useFamilyStore((s) => s.updateDebt);
  const recordDebtPayment = useFamilyStore((s) => s.recordDebtPayment);
  const deleteDebt = useFamilyStore((s) => s.deleteDebt);

  const [activeType, setActiveType] = useState<'ALL' | DebtType>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<DebtType>('Utang');
  const [personName, setPersonName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [startDate, setStartDate] = useState(getTodayIso());
  const [dueDate, setDueDate] = useState(getTodayIso());
  const [notes, setNotes] = useState('');

  // Payment modal state
  const [paymentInput, setPaymentInput] = useState('');
  const [paymentWalletId, setPaymentWalletId] = useState('');

  const filteredDebts = debts.filter((d) => (activeType === 'ALL' ? true : d.type === activeType));

  const totalRemainingUtang = debts
    .filter((d) => d.type === 'Utang' && d.status !== 'Lunas')
    .reduce((sum, d) => sum + Math.max(0, d.total_amount - d.paid_amount), 0);

  const totalRemainingPiutang = debts
    .filter((d) => d.type === 'Piutang' && d.status !== 'Lunas')
    .reduce((sum, d) => sum + Math.max(0, d.total_amount - d.paid_amount), 0);

  const openCreateModal = () => {
    setEditingDebt(null);
    setType('Utang');
    setPersonName('');
    setTotalAmount('');
    setPaidAmount('0');
    setStartDate(getTodayIso());
    setDueDate(getTodayIso());
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (d: Debt) => {
    setEditingDebt(d);
    setType(d.type);
    setPersonName(d.person_name);
    setTotalAmount(formatRupiahInput(d.total_amount));
    setPaidAmount(formatRupiahInput(d.paid_amount));
    setStartDate(d.start_date);
    setDueDate(d.due_date);
    setNotes(d.notes);
    setIsFormOpen(true);
  };

  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseRupiahInput(totalAmount);
    if (!personName.trim() || !total || total <= 0) return;
    if (editingDebt) {
      await updateDebt(editingDebt.id, {
        type,
        person_name: personName.trim(),
        total_amount: total,
        paid_amount: parseRupiahInput(paidAmount) || 0,
        start_date: startDate,
        due_date: dueDate,
        notes: notes.trim(),
      });
    } else {
      await addDebt({
        type,
        person_name: personName.trim(),
        total_amount: total,
        paid_amount: parseRupiahInput(paidAmount) || 0,
        start_date: startDate,
        due_date: dueDate,
        notes: notes.trim(),
      });
    }
    setIsFormOpen(false);
  };

  const openPaymentModal = (d: Debt) => {
    setPayingDebt(d);
    setPaymentInput(formatRupiahInput(Math.max(0, d.total_amount - d.paid_amount)));
    setPaymentWalletId('');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt) return;
    const amt = parseRupiahInput(paymentInput);
    if (!amt || amt <= 0) return;
    await recordDebtPayment(payingDebt.id, amt, paymentWalletId || undefined);
    setPayingDebt(null);
  };

  return (
    <div className="space-y-5">
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
            <h1 className="text-lg font-bold text-[#1E2D24]">Utang & Piutang</h1>
            <p className="text-xs text-[#5C6B62]">Terintegrasi otomatis dengan Neraca Keluarga</p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5">
          <span className="text-xs text-[#5C6B62]">Sisa Utang Belum Lunas</span>
          <p className="text-lg sm:text-xl font-mono-num font-bold text-[#C84B31] mt-1">
            {formatRupiah(totalRemainingUtang, hideNumbers)}
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E8E2D5] p-5">
          <span className="text-xs text-[#5C6B62]">Sisa Piutang Belum Tertagih</span>
          <p className="text-lg sm:text-xl font-mono-num font-bold text-[#2A4D3E] mt-1">
            {formatRupiah(totalRemainingPiutang, hideNumbers)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'Utang', 'Piutang'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveType(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              activeType === tab
                ? 'bg-[#2A4D3E] text-white'
                : 'bg-white border border-[#E8E2D5] text-[#5C6B62]'
            }`}
          >
            {tab === 'ALL' ? 'Semua' : tab}
          </button>
        ))}
      </div>

      {filteredDebts.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="Belum ada catatan utang atau piutang"
          description="Catat cicilan, pinjaman, atau piutang beserta jatuh temponya di sini."
          actionLabel="Tambah Catatan"
          onAction={openCreateModal}
        />
      ) : (
        <div className="space-y-3">
          {filteredDebts.map((d) => {
            const remaining = Math.max(0, d.total_amount - d.paid_amount);
            const pct =
              d.total_amount > 0 ? Math.min(100, Math.round((d.paid_amount / d.total_amount) * 100)) : 0;

            return (
              <div
                key={d.id}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
                      <span
                        className={`font-bold ${
                          d.type === 'Utang' ? 'text-[#C84B31]' : 'text-[#2A4D3E]'
                        }`}
                      >
                        {d.type}
                      </span>
                      <span>·</span>
                      <span>Status: {d.status}</span>
                      <span>·</span>
                      <span>Jatuh tempo: {formatDateId(d.due_date, 'd MMM yyyy')}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#1E2D24] mt-1">{d.person_name}</h3>
                    {d.notes && <p className="text-xs text-[#5C6B62] mt-0.5">{d.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {d.status !== 'Lunas' && (
                      <button
                        type="button"
                        onClick={() => openPaymentModal(d)}
                        className="px-3 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31]"
                      >
                        Bayar / Cicil
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditModal(d)}
                      aria-label="Edit catatan"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDebtId(d.id)}
                      aria-label="Hapus catatan"
                      className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-[#F4EFE6] overflow-hidden">
                  <div
                    className="h-full bg-[#2A4D3E] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs">
                  <span className="text-[#5C6B62]">
                    Terbayar:{' '}
                    <strong className="font-mono-num text-[#1E2D24]">
                      {formatRupiah(d.paid_amount, hideNumbers)}
                    </strong>{' '}
                    dari {formatRupiah(d.total_amount, hideNumbers)} ({pct}%)
                  </span>
                  <span className="font-mono-num font-bold text-[#C84B31]">
                    Sisa: {formatRupiah(remaining, hideNumbers)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT DEBT */}
      <ResponsiveModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingDebt ? 'Edit Utang / Piutang' : 'Catat Utang / Piutang'}
      >
        <form onSubmit={handleSaveDebt} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F4EFE6] rounded-xl">
            {(['Utang', 'Piutang'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-xs font-semibold rounded-lg ${
                  type === t ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Nama Pihak / Keterangan
            </label>
            <input
              type="text"
              required
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Contoh: Cicilan KPR, Pinjaman Saudara"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyInput
              label="Total Nominal"
              required
              value={totalAmount}
              onChange={(val) => setTotalAmount(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
            />
            <CurrencyInput
              label="Sudah Dibayar (Rp)"
              value={paidAmount}
              onChange={(val) => setPaidAmount(val)}
              placeholder="0"
              showQuickButtons={false}
              showTerbilang={false}
            />
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
                Jatuh Tempo (dd/mm/yyyy)
              </label>
              <DateInput required value={dueDate} onChange={setDueDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
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
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: RECORD PARTIAL / FULL PAYMENT */}
      <ResponsiveModal
        isOpen={Boolean(payingDebt)}
        onClose={() => setPayingDebt(null)}
        title={`Catat Pembayaran ${payingDebt?.type || ''}`}
        subtitle={payingDebt?.person_name}
      >
        {payingDebt && (
          <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-[#F4EFE6] text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#5C6B62]">Sisa Belum Terbayar:</span>
                <strong className="font-mono-num text-[#1E2D24]">
                  {formatRupiah(Math.max(0, payingDebt.total_amount - payingDebt.paid_amount))}
                </strong>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#5C6B62]">Pilih opsi pelunasan cepat:</span>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentInput(formatRupiahInput(Math.max(0, payingDebt.total_amount - payingDebt.paid_amount)))
                  }
                  className="text-[11px] font-semibold text-[#2A4D3E] hover:underline cursor-pointer"
                >
                  Isi Bayar Penuh (Lunas)
                </button>
              </div>
              <CurrencyInput
                label="Nominal Pembayaran"
                required
                value={paymentInput}
                onChange={(val) => setPaymentInput(val)}
                placeholder="0"
                showQuickButtons={true}
                showTerbilang={true}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Gunakan Wallet (Opsional)
              </label>
              <select
                value={paymentWalletId}
                onChange={(e) => setPaymentWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="">Tanpa potong/tambah saldo wallet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayingDebt(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Konfirmasi Pembayaran</span>
              </button>
            </div>
          </form>
        )}
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingDebtId)}
        onClose={() => setDeletingDebtId(null)}
        onConfirm={() => {
          if (deletingDebtId) deleteDebt(deletingDebtId);
        }}
        title="Hapus Catatan Utang/Piutang?"
        description="Menghapus data ini akan langsung memperbarui perhitungan Neraca Keluarga."
      />
    </div>
  );
}
