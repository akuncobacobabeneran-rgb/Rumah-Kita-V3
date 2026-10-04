import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileBarChart,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFamilyStore } from '../../stores/useFamilyStore';
import {
  formatCompactRupiah,
  formatDateId,
  formatMonthYearId,
  formatRupiah,
  getCurrentMonthIso,
  getTodayIso,
} from '../../utils/format';
import { exportFinanceReportToPdf } from '../../utils/pdfReport';
import { EmptyState } from '../../components/ui/StateFeedback';
import { ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';

type FilterMode = 'month' | 'year' | 'range';

export function ReportPage() {
  const navigate = useNavigate();
  const family = useFamilyStore((s) => s.family);
  const transactions = useFamilyStore((s) => s.transactions);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const wallets = useFamilyStore((s) => s.wallets);
  const assets = useFamilyStore((s) => s.assets);
  const goals = useFamilyStore((s) => s.goals);
  const debts = useFamilyStore((s) => s.debts);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const [filterMode, setFilterMode] = useState<FilterMode>('month');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthIso());
  const [selectedYear, setSelectedYear] = useState(getTodayIso().slice(0, 4));
  const [startDate, setStartDate] = useState(`${getCurrentMonthIso()}-01`);
  const [endDate, setEndDate] = useState(getTodayIso());

  // PDF Export Modal & Options
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [includeBalanceSheet, setIncludeBalanceSheet] = useState(true);
  const [includeCategoryBreakdown, setIncludeCategoryBreakdown] = useState(true);
  const [includeWalletBreakdown, setIncludeWalletBreakdown] = useState(true);
  const [includeTransactionTable, setIncludeTransactionTable] = useState(true);
  const [pdfNotice, setPdfNotice] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    if (filterMode === 'month') return formatMonthYearId(selectedMonth);
    if (filterMode === 'year') return `Tahun ${selectedYear}`;
    return `${formatDateId(startDate)} - ${formatDateId(endDate)}`;
  }, [filterMode, selectedMonth, selectedYear, startDate, endDate]);

  const report = useMemo(() => {
    const filtered = transactions.filter((t) => {
      if (filterMode === 'month') return t.date.startsWith(selectedMonth);
      if (filterMode === 'year') return t.date.startsWith(selectedYear);
      return t.date >= startDate && t.date <= endDate;
    });

    const totalIncome = filtered
      .filter((t) => t.type === 'Pemasukan')
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = filtered
      .filter((t) => t.type === 'Pengeluaran')
      .reduce((s, t) => s + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Expense by Category
    const catMap = new Map<string, { name: string; amount: number; color: string }>();
    filtered
      .filter((t) => t.type === 'Pengeluaran')
      .forEach((t) => {
        const cat = transactionCategories.find((c) => c.id === t.category_id);
        const key = cat?.id || 'other';
        const prev = catMap.get(key) || {
          name: cat?.name || 'Lainnya',
          amount: 0,
          color: cat?.color || '#84A59D',
        };
        prev.amount += t.amount;
        catMap.set(key, prev);
      });
    const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

    // Expense by Wallet
    const walletMap = new Map<string, { name: string; amount: number; color: string }>();
    filtered
      .filter((t) => t.type === 'Pengeluaran')
      .forEach((t) => {
        const w = wallets.find((item) => item.id === t.wallet_id);
        const key = w?.id || 'other';
        const prev = walletMap.get(key) || {
          name: w?.name || 'Dompet Lain',
          amount: 0,
          color: w?.color || '#2A4D3E',
        };
        prev.amount += t.amount;
        walletMap.set(key, prev);
      });
    const byWallet = Array.from(walletMap.values()).sort((a, b) => b.amount - a.amount);

    // Period Comparison (Monthly breakdown for the selected year)
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const periodComparison = months.map((m, idx) => {
      const prefix = `${selectedYear}-${m}`;
      const mTx = transactions.filter((t) => t.date.startsWith(prefix));
      const inc = mTx.filter((t) => t.type === 'Pemasukan').reduce((s, t) => s + t.amount, 0);
      const exp = mTx.filter((t) => t.type === 'Pengeluaran').reduce((s, t) => s + t.amount, 0);
      return {
        month: monthNames[idx],
        Pemasukan: inc,
        Pengeluaran: exp,
      };
    });

    return {
      filtered,
      totalIncome,
      totalExpense,
      netBalance,
      byCategory,
      byWallet,
      periodComparison,
      count: filtered.length,
    };
  }, [
    transactions,
    transactionCategories,
    wallets,
    filterMode,
    selectedMonth,
    selectedYear,
    startDate,
    endDate,
  ]);

  const handleExportPdf = (customModalClose = false) => {
    const fileName = exportFinanceReportToPdf({
      family,
      periodLabel,
      transactions: report.filtered,
      transactionCategories,
      wallets,
      assets,
      goals,
      debts,
      includeBalanceSheet,
      includeCategoryBreakdown,
      includeWalletBreakdown,
      includeTransactionTable,
    });
    if (customModalClose) {
      setIsPdfModalOpen(false);
    }
    setPdfNotice(`Laporan PDF berhasil diunduh: ${fileName}`);
    setTimeout(() => setPdfNotice(null), 5000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
            <h1 className="text-lg font-bold text-[#1E2D24]">Laporan Keuangan</h1>
            <p className="text-xs text-[#5C6B62]">
              Analisis arus kas, kategori, wallet, perbandingan periode & ekspor PDF
            </p>
          </div>
        </div>

        {/* Action Buttons: Pengaturan PDF & Unduh PDF Langsung */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] hover:border-[#2A4D3E] text-xs font-semibold text-[#1E2D24] flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Atur isi laporan sebelum ekspor PDF"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2A4D3E]" />
            <span>Opsi PDF</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportPdf(false)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor PDF Laporan</span>
          </button>
        </div>
      </div>

      {pdfNotice && (
        <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A4D3E]/25 flex items-center gap-2.5 text-xs font-semibold text-[#2A4D3E]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{pdfNotice}</span>
        </div>
      )}

      {/* Filter Controls: Bulan, Tahun, Rentang Tanggal */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F4EFE6] rounded-xl">
            <button
              type="button"
              onClick={() => setFilterMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'month' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
              }`}
            >
              Bulan
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'year' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
              }`}
            >
              Tahun
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('range')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                filterMode === 'range' ? 'bg-[#2A4D3E] text-white' : 'text-[#5C6B62]'
              }`}
            >
              Rentang Tanggal
            </button>
          </div>

          {filterMode === 'month' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || getCurrentMonthIso())}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-semibold"
            />
          )}

          {filterMode === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-semibold"
            >
              {[2024, 2025, 2026, 2027].map((yr) => (
                <option key={yr} value={String(yr)}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          )}

          {filterMode === 'range' && (
            <div className="flex items-center gap-2">
              <DateInput
                value={startDate}
                onChange={setStartDate}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1E2D24] min-w-[125px]"
              />
              <span className="text-xs text-[#5C6B62]">s/d</span>
              <DateInput
                value={endDate}
                onChange={setEndDate}
                className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs text-[#1E2D24] min-w-[125px]"
              />
            </div>
          )}
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <span className="text-xs text-[#5C6B62]">Total Pemasukan ({periodLabel})</span>
            <p className="text-lg font-mono-num font-bold text-[#2A4D3E] mt-1">
              {formatRupiah(report.totalIncome, hideNumbers)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <span className="text-xs text-[#5C6B62]">Total Pengeluaran ({periodLabel})</span>
            <p className="text-lg font-mono-num font-bold text-[#C84B31] mt-1">
              {formatRupiah(report.totalExpense, hideNumbers)}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <span className="text-xs text-[#5C6B62]">Selisih / Saldo Periode</span>
            <p
              className={`text-lg font-mono-num font-bold mt-1 ${
                report.netBalance >= 0 ? 'text-[#2A4D3E]' : 'text-[#C84B31]'
              }`}
            >
              {formatRupiah(report.netBalance, hideNumbers)}
            </p>
          </div>
        </div>
      </section>

      {report.count === 0 ? (
        <EmptyState
          icon={FileBarChart}
          title="Belum ada data transaksi pada periode ini"
          description="Catat transaksi pemasukan atau pengeluaran untuk melihat grafik laporan keuangan, atau klik Ekspor PDF di atas untuk mencetak posisi neraca saat ini."
          actionLabel="Ke Halaman Keuangan"
          onAction={() => navigate('/keuangan')}
        />
      ) : (
        <>
          {/* Pengeluaran Berdasarkan Kategori & Wallet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#1E2D24]">
                Pengeluaran Berdasarkan Kategori
              </h2>

              {report.byCategory.length === 0 ? (
                <p className="text-xs text-[#5C6B62] py-6 text-center">
                  Belum ada pengeluaran pada periode ini.
                </p>
              ) : (
                <>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.byCategory}
                          dataKey="amount"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={78}
                          paddingAngle={3}
                        >
                          {report.byCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    {report.byCategory.map((item) => {
                      const pct =
                        report.totalExpense > 0
                          ? Math.round((item.amount / report.totalExpense) * 100)
                          : 0;
                      return (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="font-medium text-[#1E2D24]">{item.name}</span>
                          </div>
                          <span className="font-mono-num font-semibold text-[#1E2D24]">
                            {formatRupiah(item.amount, hideNumbers)} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
              <h2 className="text-sm font-bold text-[#1E2D24]">
                Pengeluaran Berdasarkan Wallet
              </h2>

              {report.byWallet.length === 0 ? (
                <p className="text-xs text-[#5C6B62] py-6 text-center">
                  Belum ada pengeluaran dari wallet pada periode ini.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.byWallet.map((w) => {
                    const pct =
                      report.totalExpense > 0
                        ? Math.round((w.amount / report.totalExpense) * 100)
                        : 0;
                    return (
                      <div key={w.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-[#1E2D24]">{w.name}</span>
                          <span className="font-mono-num font-bold text-[#1E2D24]">
                            {formatRupiah(w.amount, hideNumbers)} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[#F4EFE6] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, backgroundColor: w.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Perbandingan Periode Bulanan */}
          <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#1E2D24]">
                Perbandingan Periode Bulanan ({selectedYear})
              </h2>
              <p className="text-xs text-[#5C6B62]">
                Perbandingan pemasukan vs pengeluaran sepanjang tahun
              </p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.periodComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E2D5" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#5C6B62' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#5C6B62' }}
                    tickFormatter={(v) => formatCompactRupiah(Number(v))}
                  />
                  <Tooltip formatter={(val: any) => formatRupiah(Number(val))} />
                  <Bar dataKey="Pemasukan" fill="#2A4D3E" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="Pengeluaran" fill="#E07A5F" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}

      {/* MODAL PENGATURAN & EKSPOR PDF LAPORAN KEUANGAN */}
      <ResponsiveModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Ekspor PDF Laporan Keuangan"
        subtitle={`Cetak dokumen laporan keuangan resmi untuk periode ${periodLabel}`}
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF4EE] text-[#2A4D3E] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#1E2D24]">
                Periode Aktif: {periodLabel} ({report.count} Transaksi)
              </p>
              <p className="text-[11px] text-[#5C6B62]">
                File PDF disusun rapi dengan format A4 siap cetak maupun dibagikan ke pasangan
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-[#1E2D24]">
              Pilih Bagian yang Disertakan dalam PDF:
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] cursor-pointer">
              <div>
                <span className="block text-xs font-semibold text-[#1E2D24]">
                  Posisi Neraca & Kekayaan Bersih
                </span>
                <span className="text-[11px] text-[#5C6B62]">
                  Total kas wallet, nilai aset, dana goal tabungan, dan sisa utang
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeBalanceSheet}
                onChange={(e) => setIncludeBalanceSheet(e.target.checked)}
                className="w-4 h-4 accent-[#2A4D3E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] cursor-pointer">
              <div>
                <span className="block text-xs font-semibold text-[#1E2D24]">
                  Rincian Pengeluaran per Kategori
                </span>
                <span className="text-[11px] text-[#5C6B62]">
                  Tabel frekuensi transaksi, nominal, dan persentase per kategori
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeCategoryBreakdown}
                onChange={(e) => setIncludeCategoryBreakdown(e.target.checked)}
                className="w-4 h-4 accent-[#2A4D3E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] cursor-pointer">
              <div>
                <span className="block text-xs font-semibold text-[#1E2D24]">
                  Rincian Dompet (Wallet) Keluarga
                </span>
                <span className="text-[11px] text-[#5C6B62]">
                  Mutasi pemasukan, pengeluaran, dan posisi saldo akhir tiap dompet
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeWalletBreakdown}
                onChange={(e) => setIncludeWalletBreakdown(e.target.checked)}
                className="w-4 h-4 accent-[#2A4D3E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] cursor-pointer">
              <div>
                <span className="block text-xs font-semibold text-[#1E2D24]">
                  Tabel Riwayat Transaksi Lengkap
                </span>
                <span className="text-[11px] text-[#5C6B62]">
                  Daftar seluruh transaksi beserta tanggal, kategori, dompet, anggota & catatan
                </span>
              </div>
              <input
                type="checkbox"
                checked={includeTransactionTable}
                onChange={(e) => setIncludeTransactionTable(e.target.checked)}
                className="w-4 h-4 accent-[#2A4D3E]"
              />
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(false)}
              className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => handleExportPdf(true)}
              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File PDF Sekarang</span>
            </button>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
