import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Minus,
  Plus,
  Target,
  Trash2,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, formatRupiahInput, parseRupiahInput, getTodayIso } from '../../utils/format';
import { IconRenderer, PALETTE_COLORS } from '../../components/ui/IconRenderer';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { Goal } from '../../types';

export function GoalPage() {
  const navigate = useNavigate();
  const goals = useFamilyStore((s) => s.goals);
  const wallets = useFamilyStore((s) => s.wallets);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const addGoal = useFamilyStore((s) => s.addGoal);
  const updateGoal = useFamilyStore((s) => s.updateGoal);
  const adjustGoalFunds = useFamilyStore((s) => s.adjustGoalFunds);
  const deleteGoal = useFamilyStore((s) => s.deleteGoal);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);

  // Add / Withdraw Funds Modal
  const [fundGoal, setFundGoal] = useState<Goal | null>(null);
  const [fundAction, setFundAction] = useState<'add' | 'withdraw'>('add');
  const [fundAmount, setFundAmount] = useState('');
  const [fundWalletId, setFundWalletId] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [deadline, setDeadline] = useState(getTodayIso());
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#2A4D3E');

  const totalSaved = goals.reduce((s, g) => s + g.current_amount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);

  const openCreateModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('0');
    setDeadline(getTodayIso());
    setIcon('Target');
    setColor('#2A4D3E');
    setIsFormOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(formatRupiahInput(g.target_amount));
    setCurrentAmount(formatRupiahInput(g.current_amount));
    setDeadline(g.deadline);
    setIcon(g.icon);
    setColor(g.color);
    setIsFormOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseRupiahInput(targetAmount);
    if (!name.trim() || !target || target <= 0) return;
    if (editingGoal) {
      await updateGoal(editingGoal.id, {
        name: name.trim(),
        target_amount: target,
        current_amount: parseRupiahInput(currentAmount) || 0,
        deadline,
        icon,
        color,
      });
    } else {
      await addGoal({
        name: name.trim(),
        target_amount: target,
        current_amount: parseRupiahInput(currentAmount) || 0,
        deadline,
        icon,
        color,
      });
    }
    setIsFormOpen(false);
  };

  const handleFundAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundGoal) return;
    const amt = parseRupiahInput(fundAmount);
    if (!amt || amt <= 0) return;
    const delta = fundAction === 'add' ? amt : -amt;
    await adjustGoalFunds(fundGoal.id, delta, fundWalletId || undefined);
    setFundGoal(null);
    setFundAmount('');
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
            <h1 className="text-lg font-bold text-[#1E2D24]">Goal & Tabungan</h1>
            <p className="text-xs text-[#5C6B62]">
              Terkumpul {formatRupiah(totalSaved, hideNumbers)} dari target{' '}
              {formatRupiah(totalTarget, hideNumbers)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Goal</span>
        </button>
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Belum ada target tabungan"
          description="Wujudkan impian keluarga seperti Dana Darurat, Pendidikan Anak, atau Liburan."
          actionLabel="Tambah Goal Pertama"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((g) => {
            const pct =
              g.target_amount > 0
                ? Math.min(100, Math.round((g.current_amount / g.target_amount) * 100))
                : 0;

            return (
              <div
                key={g.id}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: g.color }}
                      >
                        <IconRenderer name={g.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#1E2D24]">{g.name}</h3>
                        <p className="text-xs text-[#5C6B62]">
                          Target: {formatDateId(g.deadline, 'd MMM yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(g)}
                        aria-label="Edit goal"
                        className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingGoalId(g.id)}
                        aria-label="Hapus goal"
                        className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-mono-num font-bold text-[#2A4D3E]">
                        {formatRupiah(g.current_amount, hideNumbers)}
                      </span>
                      <span className="font-mono-num text-[#5C6B62]">
                        {formatRupiah(g.target_amount, hideNumbers)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#F4EFE6] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: g.color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0EBE1]">
                  <button
                    type="button"
                    onClick={() => {
                      setFundGoal(g);
                      setFundAction('add');
                      setFundAmount('');
                      setFundWalletId('');
                    }}
                    className="min-h-[38px] py-1.5 px-3 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#213D31]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Dana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFundGoal(g);
                      setFundAction('withdraw');
                      setFundAmount('');
                      setFundWalletId('');
                    }}
                    className="min-h-[38px] py-1.5 px-3 rounded-xl bg-[#F4EFE6] text-[#1E2D24] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E8E2D5]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Kurangi Dana</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT GOAL */}
      <ResponsiveModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingGoal ? 'Edit Goal' : 'Buat Goal Baru'}
      >
        <form onSubmit={handleSaveGoal} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Goal</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Dana Pendidikan Anak"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CurrencyInput
              label="Target Nominal"
              required
              value={targetAmount}
              onChange={(val) => setTargetAmount(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
              quickAmounts={[1_000_000, 5_000_000, 10_000_000, 25_000_000]}
            />
            <CurrencyInput
              label="Saldo Terkumpul Saat Ini"
              value={currentAmount}
              onChange={(val) => setCurrentAmount(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={false}
              quickAmounts={[500_000, 1_000_000, 5_000_000]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Deadline (dd/mm/yyyy)
            </label>
            <DateInput required value={deadline} onChange={setDeadline} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">Ikon & Warna</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Target', 'ShieldCheck', 'Plane', 'Home', 'GraduationCap', 'Car', 'Heart', 'PiggyBank'].map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  className={`p-2 rounded-xl border ${
                    icon === ic
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
              onClick={() => setIsFormOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Goal
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD / WITHDRAW GOAL FUNDS */}
      <ResponsiveModal
        isOpen={Boolean(fundGoal)}
        onClose={() => setFundGoal(null)}
        title={fundAction === 'add' ? 'Tambah Dana ke Goal' : 'Kurangi Dana dari Goal'}
        subtitle={fundGoal?.name}
      >
        <form onSubmit={handleFundAdjust} className="space-y-3.5">
          <CurrencyInput
            label="Nominal Dana"
            required
            value={fundAmount}
            onChange={(val) => setFundAmount(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
            quickAmounts={[100_000, 250_000, 500_000, 1_000_000, 2_500_000]}
          />
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Hubungkan dengan Wallet (Opsional)
            </label>
            <select
              value={fundWalletId}
              onChange={(e) => setFundWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              <option value="">Tanpa mengubah saldo wallet</option>
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
              onClick={() => setFundGoal(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Konfirmasi
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingGoalId)}
        onClose={() => setDeletingGoalId(null)}
        onConfirm={() => {
          if (deletingGoalId) deleteGoal(deletingGoalId);
        }}
        title="Hapus Goal Tabungan?"
        description="Target tabungan ini akan dihapus dari daftar keluarga Anda."
      />
    </div>
  );
}
