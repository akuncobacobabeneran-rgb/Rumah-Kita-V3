import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Edit3,
  Plus,
  Trash2,
  Wallet as WalletIcon,
  X,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, formatRupiahInput, parseRupiahInput, getTodayIso } from '../../utils/format';
import { IconRenderer, PALETTE_COLORS } from '../../components/ui/IconRenderer';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { Wallet, WalletType } from '../../types';

export function WalletTransferPage() {
  const navigate = useNavigate();
  const wallets = useFamilyStore((s) => s.wallets);
  const transactions = useFamilyStore((s) => s.transactions);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const addWallet = useFamilyStore((s) => s.addWallet);
  const updateWallet = useFamilyStore((s) => s.updateWallet);
  const deleteWallet = useFamilyStore((s) => s.deleteWallet);
  const transferBetweenWallets = useFamilyStore((s) => s.transferBetweenWallets);

  // Wallet Form Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('Bank');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#2A4D3E');
  const [icon, setIcon] = useState('Landmark');
  const [deletingWalletId, setDeletingWalletId] = useState<string | null>(null);

  // Transfer Form Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDate, setTransferDate] = useState(getTodayIso());
  const [transferNotes, setTransferNotes] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferNotice, setTransferNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const transferHistory = transactions.filter((t) => t.type === 'Transfer');
  const selectedFromWallet = wallets.find((w) => w.id === fromWalletId);
  const numericTransferAmount = parseRupiahInput(transferAmount);
  const isInsufficientBalance =
    Boolean(selectedFromWallet) &&
    numericTransferAmount > 0 &&
    numericTransferAmount > selectedFromWallet!.balance;

  const openCreateWallet = () => {
    setEditingWallet(null);
    setName('');
    setType('Bank');
    setBalance('');
    setColor('#2A4D3E');
    setIcon('Landmark');
    setIsWalletModalOpen(true);
  };

  const openEditWallet = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setType(w.type);
    setBalance(formatRupiahInput(w.balance));
    setColor(w.color);
    setIcon(w.icon);
    setIsWalletModalOpen(true);
  };

  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingWallet) {
      await updateWallet(editingWallet.id, {
        name: name.trim(),
        type,
        balance: parseRupiahInput(balance) || 0,
        color,
        icon,
      });
    } else {
      await addWallet({
        name: name.trim(),
        type,
        balance: parseRupiahInput(balance) || 0,
        color,
        icon,
      });
    }
    setIsWalletModalOpen(false);
  };

  const openTransferModal = () => {
    setFromWalletId(wallets[0]?.id || '');
    setToWalletId(wallets[1]?.id || wallets[0]?.id || '');
    setTransferAmount('');
    setTransferDate(getTodayIso());
    setTransferNotes('');
    setTransferError('');
    setIsTransferOpen(true);
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseRupiahInput(transferAmount);
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
      setTransferError('Pilih wallet asal dan wallet tujuan yang berbeda.');
      return;
    }
    if (!amt || amt <= 0) {
      setTransferError('Nominal transfer harus lebih dari 0.');
      return;
    }

    const result = await transferBetweenWallets({
      fromWalletId,
      toWalletId,
      amount: amt,
      date: transferDate,
      notes: transferNotes,
    });

    if (!result.success) {
      setTransferError(result.message);
      setTransferNotice({
        type: 'error',
        text: result.message,
      });
      return;
    }

    setTransferError('');
    setTransferNotice({
      type: 'success',
      text: result.message,
    });
    setIsTransferOpen(false);
  };

  return (
    <div className="space-y-5">
      {transferNotice && (
        <div
          role="alert"
          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            transferNotice.type === 'error'
              ? 'bg-[#FDECEC] border-[#C84B31]/30 text-[#C84B31]'
              : 'bg-[#E8F2EC] border-[#2A4D3E]/30 text-[#2A4D3E]'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {transferNotice.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-bold">
                {transferNotice.type === 'error'
                  ? 'Notifikasi Transfer Wallet Gagal'
                  : 'Transfer Wallet Berhasil'}
              </p>
              <p className="text-xs mt-0.5 leading-relaxed">{transferNotice.text}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTransferNotice(null)}
            aria-label="Tutup notifikasi"
            className="p-1 rounded-lg hover:bg-black/5 shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            <h1 className="text-lg font-bold text-[#1E2D24]">Wallet & Transfer</h1>
            <p className="text-xs text-[#5C6B62]">
              Total Saldo Aktif: {formatRupiah(totalBalance, hideNumbers)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wallets.length >= 2 && (
            <button
              type="button"
              onClick={openTransferModal}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#E8E2D5]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transfer</span>
            </button>
          )}
          <button
            type="button"
            onClick={openCreateWallet}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Wallet</span>
          </button>
        </div>
      </div>

      {wallets.length === 0 ? (
        <EmptyState
          icon={WalletIcon}
          title="Belum ada wallet keluarga"
          description="Buat wallet Tunai, Bank, atau Dompet Digital untuk mulai mengelola saldo."
          actionLabel="Buat Wallet Pertama"
          onAction={openCreateWallet}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {wallets.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: w.color }}
                >
                  <IconRenderer name={w.icon || 'Wallet'} className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-medium text-[#5C6B62]">{w.type}</span>
                  <h3 className="text-sm font-bold text-[#1E2D24] truncate">{w.name}</h3>
                  <p className="text-base font-mono-num font-bold text-[#2A4D3E] mt-0.5">
                    {formatRupiah(w.balance, hideNumbers)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditWallet(w)}
                  aria-label="Edit wallet"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingWalletId(w.id)}
                  aria-label="Hapus wallet"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riwayat Transfer Antar Wallet */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-[#1E2D24]">Riwayat Transfer Antar Wallet</h2>
          <p className="text-xs text-[#5C6B62]">
            Transfer memindahkan saldo antar dompet tanpa dihitung sebagai pemasukan atau pengeluaran keluarga.
          </p>
        </div>

        {transferHistory.length === 0 ? (
          <p className="text-xs text-[#5C6B62] py-4 text-center">
            Belum ada riwayat transfer antar wallet.
          </p>
        ) : (
          <div className="divide-y divide-[#F0EBE1]">
            {transferHistory.map((tx) => {
              const fromW = wallets.find((w) => w.id === tx.wallet_id);
              const toW = wallets.find((w) => w.id === tx.to_wallet_id);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#1E2D24]">{tx.notes}</p>
                    <p className="text-[11px] text-[#5C6B62] mt-0.5">
                      {fromW?.name || 'Asal'} → {toW?.name || 'Tujuan'} · {formatDateId(tx.date)}
                    </p>
                  </div>
                  <span className="text-xs font-mono-num font-bold text-[#457B9D]">
                    {formatRupiah(tx.amount, hideNumbers)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL: ADD / EDIT WALLET */}
      <ResponsiveModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        title={editingWallet ? 'Edit Wallet' : 'Tambah Wallet'}
      >
        <form onSubmit={handleSaveWallet} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Wallet</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Bank Mandiri, OVO, Kas Rumah"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Jenis Wallet</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WalletType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Bank">Bank</option>
                <option value="Dompet Digital">Dompet Digital</option>
                <option value="Tunai">Tunai</option>
              </select>
            </div>
            <CurrencyInput
              label="Saldo Saat Ini"
              value={balance}
              onChange={(val) => setBalance(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Warna Wallet</label>
            <div className="flex flex-wrap gap-2">
              {PALETTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-lg border-2 ${
                    color === c.value ? 'border-[#1E2D24] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsWalletModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Wallet
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: TRANSFER BETWEEN WALLETS */}
      <ResponsiveModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="Transfer Antar Wallet"
        subtitle="Mutasi saldo antar dompet keluarga"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-3.5">
          {transferError && (
            <div
              role="alert"
              className="p-3.5 rounded-2xl bg-[#FDECEC] border border-[#C84B31]/30 text-[#C84B31] flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Transfer Wallet Gagal</p>
                <p className="text-xs mt-0.5 leading-relaxed">{transferError}</p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Dari Wallet</label>
              <select
                value={fromWalletId}
                onChange={(e) => {
                  setFromWalletId(e.target.value);
                  setTransferError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Ke Wallet</label>
              <select
                value={toWalletId}
                onChange={(e) => {
                  setToWalletId(e.target.value);
                  setTransferError('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <CurrencyInput
                label="Nominal Transfer"
                required
                value={transferAmount}
                onChange={(val) => {
                  setTransferAmount(val);
                  if (transferError) setTransferError('');
                }}
                placeholder="0"
                showQuickButtons={true}
                showTerbilang={true}
                quickAmounts={[100_000, 250_000, 500_000, 1_000_000, 2_000_000]}
              />
              {selectedFromWallet && (
                <p
                  className={`text-[11px] mt-1 font-medium ${
                    isInsufficientBalance ? 'text-[#C84B31] font-semibold' : 'text-[#5C6B62]'
                  }`}
                >
                  {isInsufficientBalance
                    ? `Saldo ${selectedFromWallet.name} tidak mencukupi (${formatRupiah(
                        selectedFromWallet.balance
                      )})`
                    : `Saldo tersedia: ${formatRupiah(selectedFromWallet.balance)}`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal (dd/mm/yyyy)
              </label>
              <DateInput required value={transferDate} onChange={setTransferDate} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
            <input
              type="text"
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              placeholder="Contoh: Top up dompet belanja harian"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsTransferOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] cursor-pointer"
            >
              Lakukan Transfer
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingWalletId)}
        onClose={() => setDeletingWalletId(null)}
        onConfirm={() => {
          if (deletingWalletId) deleteWallet(deletingWalletId);
        }}
        title="Hapus Wallet?"
        description="Wallet ini beserta transaksi yang terikat langsung padanya akan dihapus."
      />
    </div>
  );
}
