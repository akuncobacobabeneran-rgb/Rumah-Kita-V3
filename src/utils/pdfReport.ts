import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Asset,
  Debt,
  Family,
  Goal,
  Transaction,
  TransactionCategory,
  Wallet,
} from '../types';
import { formatDateId, formatDateTime24, formatRupiah } from './format';

export interface PdfFinanceReportOptions {
  family: Family | null;
  periodLabel: string;
  transactions: Transaction[];
  transactionCategories: TransactionCategory[];
  wallets: Wallet[];
  assets?: Asset[];
  goals?: Goal[];
  debts?: Debt[];
  includeBalanceSheet?: boolean;
  includeCategoryBreakdown?: boolean;
  includeWalletBreakdown?: boolean;
  includeTransactionTable?: boolean;
}

export function exportFinanceReportToPdf(options: PdfFinanceReportOptions): string {
  const {
    family,
    periodLabel,
    transactions,
    transactionCategories,
    wallets,
    assets = [],
    goals = [],
    debts = [],
    includeBalanceSheet = true,
    includeCategoryBreakdown = true,
    includeWalletBreakdown = true,
    includeTransactionTable = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const familyName = family?.name || 'Keluarga RumahKita';
  const printedAt = formatDateTime24(new Date());

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'Pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  const totalWalletCash = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
  const totalGoals = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);
  const totalRemainingPayables = debts
    .filter((d) => d.type === 'Utang' && d.status !== 'Lunas')
    .reduce((sum, d) => sum + Math.max(0, Number(d.total_amount) - Number(d.paid_amount)), 0);
  const netWorth = totalWalletCash + totalAssets + totalGoals - totalRemainingPayables;

  // Header Banner
  doc.setFillColor(42, 77, 62); // #2A4D3E
  doc.rect(0, 0, 210, 34, 'F');

  doc.setTextColor(250, 247, 242); // #FAF7F2
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('LAPORAN KEUANGAN KELUARGA', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${familyName}  •  Periode: ${periodLabel}`, 14, 21);
  doc.setFontSize(8.5);
  doc.setTextColor(244, 211, 147); // #F4D393
  doc.text(`Dicetak pada: ${printedAt}`, 14, 27.5);

  let currentY = 42;

  // Section 1: Ringkasan Arus Kas Periode
  doc.setTextColor(30, 45, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Ringkasan Arus Kas Periode', 14, currentY);
  currentY += 3;

  autoTable(doc, {
    startY: currentY,
    head: [['Indikator Arus Kas', 'Jumlah Transaksi', 'Total Nominal']],
    body: [
      [
        'Total Pemasukan',
        `${transactions.filter((t) => t.type === 'Pemasukan').length} transaksi`,
        formatRupiah(totalIncome),
      ],
      [
        'Total Pengeluaran',
        `${transactions.filter((t) => t.type === 'Pengeluaran').length} transaksi`,
        formatRupiah(totalExpense),
      ],
      [
        'Selisih / Surplus Kas Periode',
        `${transactions.length} total aktivitas`,
        `${netCashflow >= 0 ? '+' : ''}${formatRupiah(netCashflow)}`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [42, 77, 62],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 45, 36],
    },
    columnStyles: {
      0: { cellWidth: 85, fontStyle: 'bold' },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Ringkasan Posisi Neraca & Kekayaan Bersih
  if (includeBalanceSheet) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. Posisi Neraca & Kekayaan Bersih Saat Ini', 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Komponen Neraca Keluarga', 'Keterangan', 'Nilai Saat Ini']],
      body: [
        ['Total Saldo Kas & Wallet', `${wallets.length} dompet aktif`, formatRupiah(totalWalletCash)],
        ['Total Nilai Aset & Investasi', `${assets.length} item aset`, formatRupiah(totalAssets)],
        ['Total Dana Goal & Tabungan', `${goals.length} target tabungan`, formatRupiah(totalGoals)],
        [
          'Sisa Kewajiban / Utang Belum Lunas',
          `${debts.filter((d) => d.type === 'Utang' && d.status !== 'Lunas').length} catatan utang`,
          `-${formatRupiah(totalRemainingPayables)}`,
        ],
        ['Estimasi Kekayaan Bersih (Net Worth)', 'Kas + Aset + Goal - Utang', formatRupiah(netWorth)],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [212, 163, 89], // #D4A359
        textColor: [30, 45, 36],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [30, 45, 36],
      },
      columnStyles: {
        0: { cellWidth: 85, fontStyle: 'bold' },
        1: { cellWidth: 45 },
        2: { cellWidth: 52, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 3: Rincian Pengeluaran per Kategori
  if (includeCategoryBreakdown) {
    const catMap = new Map<string, { name: string; count: number; amount: number }>();
    transactions
      .filter((t) => t.type === 'Pengeluaran')
      .forEach((t) => {
        const cat = transactionCategories.find((c) => c.id === t.category_id);
        const key = cat?.id || 'other';
        const prev = catMap.get(key) || {
          name: cat?.name || 'Lainnya',
          count: 0,
          amount: 0,
        };
        prev.count += 1;
        prev.amount += t.amount;
        catMap.set(key, prev);
      });

    const byCategory = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount);

    if (currentY > 240) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. Pengeluaran Berdasarkan Kategori', 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Kategori Pengeluaran', 'Frekuensi', 'Nominal', 'Porsi (%)']],
      body:
        byCategory.length > 0
          ? byCategory.map((c, idx) => {
              const pct =
                totalExpense > 0 ? ((c.amount / totalExpense) * 100).toFixed(1) : '0.0';
              return [
                String(idx + 1),
                c.name,
                `${c.count}x`,
                formatRupiah(c.amount),
                `${pct}%`,
              ];
            })
          : [['-', 'Belum ada pengeluaran pada periode ini', '0x', 'Rp 0', '0%']],
      theme: 'striped',
      headStyles: {
        fillColor: [42, 77, 62],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 45, 36],
      },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 78 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 4: Rincian Saldo & Pengeluaran per Wallet
  if (includeWalletBreakdown && wallets.length > 0) {
    if (currentY > 240) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. Rincian Dompet (Wallet) Keluarga', 14, currentY);
    currentY += 3;

    const walletRows = wallets.map((w, idx) => {
      const periodExp = transactions
        .filter((t) => t.type === 'Pengeluaran' && t.wallet_id === w.id)
        .reduce((s, t) => s + t.amount, 0);
      const periodInc = transactions
        .filter((t) => t.type === 'Pemasukan' && t.wallet_id === w.id)
        .reduce((s, t) => s + t.amount, 0);
      return [
        String(idx + 1),
        w.name,
        w.type,
        formatRupiah(periodInc),
        formatRupiah(periodExp),
        formatRupiah(w.balance),
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Nama Wallet', 'Tipe', 'Pemasukan Periode', 'Pengeluaran Periode', 'Saldo Saat Ini']],
      body: walletRows,
      theme: 'striped',
      headStyles: {
        fillColor: [54, 104, 138], // #36688A
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 45, 36],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 46, fontStyle: 'bold' },
        2: { cellWidth: 24 },
        3: { cellWidth: 34, halign: 'right' },
        4: { cellWidth: 34, halign: 'right' },
        5: { cellWidth: 34, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Section 5: Daftar Riwayat Transaksi Lengkap
  if (includeTransactionTable) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 18;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`5. Rincian Transaksi (${transactions.length} Transaksi)`, 14, currentY);
    currentY += 3;

    const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

    const txRows =
      sortedTx.length > 0
        ? sortedTx.map((t, idx) => {
            const catName =
              t.type === 'Transfer'
                ? 'Transfer Wallet'
                : transactionCategories.find((c) => c.id === t.category_id)?.name || 'Lainnya';
            const walletName = wallets.find((w) => w.id === t.wallet_id)?.name || '-';
            const sign = t.type === 'Pemasukan' ? '+' : t.type === 'Pengeluaran' ? '-' : '';
            return [
              String(idx + 1),
              formatDateId(t.date),
              t.type,
              catName,
              walletName,
              t.member_name || '-',
              t.notes || '-',
              `${sign}${formatRupiah(t.amount)}`,
            ];
          })
        : [['-', '-', '-', 'Belum ada transaksi pada periode ini', '-', '-', '-', 'Rp 0']];

    autoTable(doc, {
      startY: currentY,
      head: [['No', 'Tanggal', 'Tipe', 'Kategori', 'Wallet', 'Oleh', 'Catatan', 'Nominal']],
      body: txRows,
      theme: 'grid',
      headStyles: {
        fillColor: [42, 77, 62],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 45, 36],
      },
      columnStyles: {
        0: { cellWidth: 9, halign: 'center' },
        1: { cellWidth: 23 },
        2: { cellWidth: 20 },
        3: { cellWidth: 28 },
        4: { cellWidth: 24 },
        5: { cellWidth: 20 },
        6: { cellWidth: 30 },
        7: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Page Numbers Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 130, 125);
    doc.text(
      `RumahKita • Laporan Keuangan ${familyName} • Halaman ${i} dari ${pageCount}`,
      14,
      290
    );
  }

  const safePeriod = periodLabel.replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `Laporan_Keuangan_RumahKita_${safePeriod}.pdf`;
  doc.save(fileName);
  return fileName;
}
