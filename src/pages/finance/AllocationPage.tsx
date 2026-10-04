import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatRupiah, getCurrentMonthIso } from '../../utils/format';

export function AllocationPage() {
  const navigate = useNavigate();
  const budgets = useFamilyStore((s) => s.budgets);
  const transactions = useFamilyStore((s) => s.transactions);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIso());

  const summary = useMemo(() => {
    const monthTx = transactions.filter((t) => t.date.startsWith(selectedMonth));
    const totalIncome = monthTx
      .filter((t) => t.type === 'Pemasukan')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = monthTx
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((s, t) => s + t.amount, 0);

    const groups: Array<{
      name: 'Kebutuhan Pokok' | 'Tabungan & Investasi' | 'Gaya Hidup & Keluarga';
      recommendedPct: number;
      color: string;
    }> = [
      { name: 'Kebutuhan Pokok', recommendedPct: 50, color: '#2A4D3E' },
      { name: 'Gaya Hidup & Keluarga', recommendedPct: 30, color: '#D4A359' },
      { name: 'Tabungan & Investasi', recommendedPct: 20, color: '#457B9D' },
    ];

    const breakdown = groups.map((g) => {
      const groupBudgets = budgets.filter(
        (b) => b.period_month === selectedMonth && (b.allocation_group || 'Kebutuhan Pokok') === g.name
      );
      const budgeted = groupBudgets.reduce((s, b) => s + b.amount, 0);
      const catIds = new Set(groupBudgets.map((b) => b.category_id));
      const actualSpent = monthTx
        .filter((t) => t.type === 'Pengeluaran' && catIds.has(t.category_id))
        .reduce((s, t) => s + t.amount, 0);

      const recommendedAmount = Math.round((totalIncome * g.recommendedPct) / 100);
      return {
        ...g,
        budgeted,
        actualSpent,
        recommendedAmount,
      };
    });

    return { totalIncome, totalExpense, breakdown };
  }, [budgets, transactions, selectedMonth]);

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
            <h1 className="text-lg font-bold text-[#1E2D24]">Alokasi Keuangan</h1>
            <p className="text-xs text-[#5C6B62]">
              Distribusi pemasukan & anggaran keluarga (50/30/20)
            </p>
          </div>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthIso())}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-semibold"
        />
      </div>

      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2A4D3E]">
          <Layers className="w-4 h-4" />
          <span>Basis Perhitungan Pemasukan Bulan Ini</span>
        </div>
        <p className="text-2xl font-mono-num font-bold text-[#1E2D24]">
          {formatRupiah(summary.totalIncome, hideNumbers)}
        </p>
        <p className="text-xs text-[#5C6B62]">
          Rekomendasi alokasi dihitung otomatis dari total pemasukan aktual keluarga pada periode{' '}
          {selectedMonth}.
        </p>
      </section>

      <div className="space-y-3">
        {summary.breakdown.map((item) => {
          const pctOfIncome =
            summary.totalIncome > 0
              ? Math.min(100, Math.round((item.actualSpent / summary.totalIncome) * 100))
              : 0;

          return (
            <div
              key={item.name}
              className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#1E2D24]">{item.name}</h3>
                  <p className="text-xs text-[#5C6B62]">
                    Ideal: {item.recommendedPct}% dari pemasukan (
                    {formatRupiah(item.recommendedAmount, hideNumbers)})
                  </p>
                </div>
                <span className="text-xs font-mono-num font-bold text-[#2A4D3E]">
                  {pctOfIncome}% dari pemasukan
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#F4EFE6] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pctOfIncome}%`, backgroundColor: item.color }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                  <span className="text-[#5C6B62] block">Dianggarkan</span>
                  <strong className="font-mono-num text-[#1E2D24]">
                    {formatRupiah(item.budgeted, hideNumbers)}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
                  <span className="text-[#5C6B62] block">Realisasi Terpakai</span>
                  <strong className="font-mono-num text-[#1E2D24]">
                    {formatRupiah(item.actualSpent, hideNumbers)}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
