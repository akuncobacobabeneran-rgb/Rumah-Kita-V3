import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Lightbulb,
  Plus,
  Receipt,
  Wallet,
} from 'lucide-react';
import { HeroCard } from '../../components/home/HeroCard';
import { FeatureShortcuts } from '../../components/home/FeatureShortcuts';
import { TodayAgendaSection } from '../../components/home/TodayAgendaSection';
import { RecentActivitySection } from '../../components/home/RecentActivitySection';
import { useFinanceSummary } from '../../hooks/useFinanceSummary';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, getCurrentMonthIso } from '../../utils/format';
import { EmptyState, ErrorState, PageSkeleton } from '../../components/ui/StateFeedback';
import { IconRenderer } from '../../components/ui/IconRenderer';

export function HomePage() {
  const navigate = useNavigate();
  const isLoading = useFamilyStore((s) => s.isLoading);
  const error = useFamilyStore((s) => s.error);
  const refreshData = useFamilyStore((s) => s.refreshData);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);
  const toggleHideNumbers = useFamilyStore((s) => s.toggleHideNumbers);
  const setActiveQuickSheet = useFamilyStore((s) => s.setActiveQuickSheet);
  const transactions = useFamilyStore((s) => s.transactions);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const wallets = useFamilyStore((s) => s.wallets);

  const currentMonth = getCurrentMonthIso();
  const finance = useFinanceSummary(currentMonth);

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refreshData} />;
  }

  const recentTransactions = React.useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        if (d !== 0) return d;
        return (b.created_at || '').localeCompare(a.created_at || '');
      })
      .slice(0, 5);
  }, [transactions]);

  // Dynamic family financial insight derived strictly from user data
  let insightText =
    'Belum ada catatan transaksi bulan ini. Mulai tambahkan dompet dan catat pemasukan atau pengeluaran pertama keluarga Anda.';
  if (transactions.length > 0) {
    if (finance.totalIncome > 0 && finance.totalExpense === 0) {
      insightText = `Bulan ini keluarga Anda telah mencatat pemasukan sebesar ${formatRupiah(
        finance.totalIncome,
        hideNumbers
      )} dan belum ada pengeluaran tercatat.`;
    } else if (finance.totalIncome > finance.totalExpense) {
      insightText = `Arus kas bulan ini positif! Anda menyisihkan ${finance.savingsRate}% dari pemasukan (${formatRupiah(
        finance.netCashflow,
        hideNumbers
      )}). Pertahankan kebiasaan baik ini.`;
    } else if (finance.totalExpense > finance.totalIncome) {
      insightText = `Pengeluaran bulan ini (${formatRupiah(
        finance.totalExpense,
        hideNumbers
      )}) melampaui pemasukan tercatat. Tinjau kembali halaman Anggaran & Kategori.`;
    } else {
      insightText = `Terdapat ${transactions.length} transaksi tercatat di ruang keluarga Anda.`;
    }
  }

  return (
    <div className="space-y-5">
      {/* 1. Hero Greeting Card */}
      <HeroCard />

      {/* 2. Feature Shortcuts */}
      <FeatureShortcuts />

      {/* 3. Agenda Hari Ini */}
      <TodayAgendaSection />

      {/* 4. Ringkasan Keuangan: Saldo Aktif, Pemasukan, Pengeluaran */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Ringkasan Keuangan Keluarga</h2>
            <p className="text-xs text-[#5C6B62] mt-0.5">
              Dihitung otomatis dari dompet & transaksi bulan ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleHideNumbers}
              aria-label="Sembunyikan atau tampilkan nominal"
              className="min-h-[38px] min-w-[38px] rounded-xl bg-[#F4EFE6] text-[#5C6B62] hover:text-[#1E2D24] flex items-center justify-center transition-colors"
            >
              {hideNumbers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Link
              to="/keuangan"
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold hover:bg-[#E8E2D5] transition-colors flex items-center gap-1"
            >
              <span>Detail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Saldo Aktif Banner */}
        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs text-[#5C6B62] font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-[#2A4D3E]" />
              <span>Saldo Aktif ({wallets.length} Wallet)</span>
            </span>
            <p className="text-2xl font-mono-num font-bold text-[#1E2D24] mt-1">
              {formatRupiah(finance.activeBalance, hideNumbers)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveQuickSheet('wallet')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#1E2D24] hover:bg-[#F4EFE6] transition-colors"
            >
              + Wallet
            </button>
            <button
              type="button"
              onClick={() => setActiveQuickSheet('transaction')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] transition-colors"
            >
              + Transaksi
            </button>
          </div>
        </div>

        {/* Pemasukan & Pengeluaran Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
              <div className="w-7 h-7 rounded-lg bg-[#E8F2EC] text-[#2A4D3E] flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <span className="font-medium">Pemasukan</span>
            </div>
            <p className="text-base sm:text-lg font-mono-num font-bold text-[#2A4D3E] mt-2 truncate">
              {formatRupiah(finance.totalIncome, hideNumbers)}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
              <div className="w-7 h-7 rounded-lg bg-[#FBECE8] text-[#C85A32] flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <span className="font-medium">Pengeluaran</span>
            </div>
            <p className="text-base sm:text-lg font-mono-num font-bold text-[#C84B31] mt-2 truncate">
              {formatRupiah(finance.totalExpense, hideNumbers)}
            </p>
          </div>
        </div>
      </section>

      {/* 5. Insight Keluarga */}
      <section className="rounded-3xl bg-[#F4EFE6] border border-[#E5DEC9] p-4 flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-2xl bg-[#D4A359]/20 text-[#9B6B21] flex items-center justify-center shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold text-[#1E2D24]">Insight Keuangan Keluarga</h3>
          <p className="text-xs text-[#5C6B62] mt-1 leading-relaxed">{insightText}</p>
        </div>
      </section>

      {/* 6. Transaksi Terbaru */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#1E2D24]">Transaksi Terbaru</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-[10px] font-semibold">
                5 Terkini
              </span>
            </div>
            <p className="text-xs text-[#5C6B62] mt-0.5">Menampilkan 5 mutasi pemasukan & pengeluaran paling baru</p>
          </div>
          {recentTransactions.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/keuangan')}
              className="text-xs font-semibold text-[#2A4D3E] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Belum ada transaksi"
            description="Mulai catat transaksi pertamamu agar laporan keuangan keluarga terhitung otomatis."
            actionLabel="Catat Transaksi Pertama"
            onAction={() => setActiveQuickSheet('transaction')}
          />
        ) : (
          <div className="space-y-2.5">
            {recentTransactions.map((tx) => {
              const cat = transactionCategories.find((c) => c.id === tx.category_id);
              const wallet = wallets.find((w) => w.id === tx.wallet_id);
              return (
                <div
                  key={tx.id}
                  onClick={() => navigate('/keuangan')}
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
                          {wallet?.name || 'Dompet'}
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

      {/* 7. Aktivitas Terkini (5 Aksi Terakhir Lintas Modul) */}
      <RecentActivitySection />
    </div>
  );
}
