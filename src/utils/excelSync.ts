import * as XLSX from 'xlsx';
import {
  Asset,
  Budget,
  CalendarEvent,
  Debt,
  Goal,
  JournalEntry,
  MaintenanceItem,
  TaskCategory,
  TaskItem,
  Transaction,
  TransactionCategory,
  Wallet,
} from '../types';
import { FamilyDatabaseBundle } from '../services/familyService';
import {
  formatDateId,
  formatTime24,
  generateUuid,
  getCurrentMonthIso,
  getTodayIso,
} from './format';

export function parseNumericAmount(val: any): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : 0;
  }
  if (!val) return 0;
  let str = String(val).trim().replace(/^(Rp\.?|IDR)\s*/i, '');
  if (str.includes('.') && str.includes(',')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    if (/^\d{1,3}(\.\d{3})+$/.test(str)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    if (/^\d{1,3}(,\d{3})+$/.test(str)) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(',', '.');
    }
  }
  str = str.replace(/[^0-9.-]/g, '');
  const num = parseFloat(str);
  return Number.isFinite(num) ? num : 0;
}

export function normalizeIsoDate(rawVal: any, fallbackIso: string): string {
  if (rawVal instanceof Date && !isNaN(rawVal.getTime())) {
    const yyyy = rawVal.getFullYear();
    const mm = String(rawVal.getMonth() + 1).padStart(2, '0');
    const dd = String(rawVal.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof rawVal === 'number' && rawVal > 10000 && rawVal < 90000) {
    const dateObj = new Date(Math.round((rawVal - 25569) * 86400 * 1000));
    if (!isNaN(dateObj.getTime())) {
      const yyyy = dateObj.getUTCFullYear();
      const mm = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  const s = String(rawVal ?? '').trim();
  if (!s) return fallbackIso;
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmy) {
    const dd = dmy[1].padStart(2, '0');
    const mm = dmy[2].padStart(2, '0');
    const yyyy = dmy[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymd) {
    const yyyy = ymd[1];
    const mm = ymd[2].padStart(2, '0');
    const dd = ymd[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return s.slice(0, 10) || fallbackIso;
}

export function downloadExcelWorkbook(wb: XLSX.WorkBook, fileName: string) {
  try {
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    }, 500);
  } catch (err) {
    console.warn('Fallback to XLSX.writeFile:', err);
    XLSX.writeFile(wb, fileName);
  }
}

export interface ExcelImportSummary {
  walletsCount: number;
  transactionsCount: number;
  budgetsCount: number;
  debtsCount: number;
  goalsCount: number;
  assetsCount: number;
  tasksCount: number;
  maintenanceCount: number;
  eventsCount: number;
  journalsCount: number;
}

export interface ParsedExcelPayload {
  summary: ExcelImportSummary;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  assets: Asset[];
  tasks: TaskItem[];
  maintenanceItems: MaintenanceItem[];
  calendarEvents: CalendarEvent[];
  journalEntries: JournalEntry[];
}

export function exportFamilyDataToExcel(bundle: FamilyDatabaseBundle) {
  const wb = XLSX.utils.book_new();
  const catMap = new Map(bundle.transactionCategories.map((c) => [c.id, c.name]));
  const walletMap = new Map(bundle.wallets.map((w) => [w.id, w.name]));
  const taskCatMap = new Map(bundle.taskCategories.map((c) => [c.id, c.name]));

  // 1. Sheet Transaksi
  const txRows = bundle.transactions.map((t) => ({
    Tanggal: formatDateId(t.date, 'dd/MM/yyyy'),
    Jenis: t.type,
    Kategori: catMap.get(t.category_id) || 'Lainnya',
    Dompet: walletMap.get(t.wallet_id) || 'Dompet Utama',
    Dompet_Tujuan: t.to_wallet_id ? walletMap.get(t.to_wallet_id) || '' : '',
    Nominal: t.amount,
    Catatan: t.notes || '',
    ID: t.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      txRows.length
        ? txRows
        : [
            {
              Tanggal: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Jenis: 'Pengeluaran',
              Kategori: 'Dapur & Masak',
              Dompet: 'Dompet Utama',
              Dompet_Tujuan: '',
              Nominal: 0,
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Transaksi'
  );

  // 2. Sheet Wallet
  const walletRows = bundle.wallets.map((w) => ({
    Nama_Dompet: w.name,
    Jenis: w.type,
    Saldo: w.balance,
    Warna: w.color,
    Icon: w.icon,
    ID: w.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      walletRows.length
        ? walletRows
        : [{ Nama_Dompet: 'Rekening Keluarga', Jenis: 'Bank', Saldo: 0, Warna: '#2A4D3E', Icon: 'Landmark', ID: '' }]
    ),
    'Wallet'
  );

  // 3. Sheet Anggaran
  const budgetRows = bundle.budgets.map((b) => ({
    Bulan: b.period_month,
    Kategori: catMap.get(b.category_id) || 'Lainnya',
    Nominal_Anggaran: b.amount,
    ID: b.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      budgetRows.length
        ? budgetRows
        : [{ Bulan: getCurrentMonthIso(), Kategori: 'Dapur & Masak', Nominal_Anggaran: 0, ID: '' }]
    ),
    'Anggaran'
  );

  // 4. Sheet Utang_Piutang
  const debtRows = bundle.debts.map((d) => ({
    Jenis: d.type,
    Nama_Pihak: d.person_name,
    Total_Nominal: d.total_amount,
    Sudah_Dibayar: d.paid_amount,
    Status: d.status,
    Tanggal_Mulai: formatDateId(d.start_date, 'dd/MM/yyyy'),
    Jatuh_Tempo: formatDateId(d.due_date, 'dd/MM/yyyy'),
    Catatan: d.notes || '',
    ID: d.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      debtRows.length
        ? debtRows
        : [
            {
              Jenis: 'Utang',
              Nama_Pihak: '',
              Total_Nominal: 0,
              Sudah_Dibayar: 0,
              Status: 'Belum lunas',
              Tanggal_Mulai: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Jatuh_Tempo: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Utang_Piutang'
  );

  // 5. Sheet Goal_Tabungan
  const goalRows = bundle.goals.map((g) => ({
    Nama_Goal: g.name,
    Target_Nominal: g.target_amount,
    Saldo_Terkumpul: g.current_amount,
    Deadline: formatDateId(g.deadline, 'dd/MM/yyyy'),
    Catatan: g.notes || '',
    ID: g.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      goalRows.length
        ? goalRows
        : [
            {
              Nama_Goal: 'Dana Darurat',
              Target_Nominal: 0,
              Saldo_Terkumpul: 0,
              Deadline: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Goal_Tabungan'
  );

  // 6. Sheet Aset
  const assetRows = bundle.assets.map((a) => ({
    Nama_Aset: a.name,
    Kategori: a.category,
    Nilai_Aset: a.value,
    Tanggal_Perolehan: formatDateId(a.acquisition_date, 'dd/MM/yyyy'),
    Catatan: a.notes || '',
    ID: a.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      assetRows.length
        ? assetRows
        : [
            {
              Nama_Aset: '',
              Kategori: 'Lainnya',
              Nilai_Aset: 0,
              Tanggal_Perolehan: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Aset'
  );

  // 7. Sheet Tugas
  const taskRows = bundle.tasks.map((t) => ({
    Judul_Tugas: t.title,
    Deskripsi: t.description || '',
    Kategori: taskCatMap.get(t.category_id) || 'Pekerjaan Rumah',
    Tenggat_Waktu: formatDateId(t.due_date, 'dd/MM/yyyy'),
    Frekuensi: t.recurrence,
    Penanggung_Jawab: t.assignee_name || '',
    Status: t.status,
    ID: t.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      taskRows.length
        ? taskRows
        : [
            {
              Judul_Tugas: '',
              Deskripsi: '',
              Kategori: 'Pekerjaan Rumah',
              Tenggat_Waktu: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Frekuensi: 'Sekali',
              Penanggung_Jawab: '',
              Status: 'Belum selesai',
              ID: '',
            },
          ]
    ),
    'Tugas'
  );

  // 8. Sheet Maintenance
  const maintRows = bundle.maintenanceItems.map((m) => ({
    Nama_Item: m.title,
    Kategori: m.category,
    Sub_Tipe: m.sub_type || '',
    Servis_Berikutnya: m.scheduled_date ? formatDateId(m.scheduled_date, 'dd/MM/yyyy') : '',
    Tanggal_Pengingat: m.reminder_date ? formatDateId(m.reminder_date, 'dd/MM/yyyy') : '',
    Penanggung_Jawab: m.assignee_name || '',
    Estimasi_Biaya: m.estimated_cost || 0,
    Status: m.status,
    Warna: m.color || '',
    Catatan: m.notes || '',
    ID: m.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      maintRows.length
        ? maintRows
        : [
            {
              Nama_Item: '',
              Kategori: 'Kendaraan',
              Sub_Tipe: 'Mobil',
              Servis_Berikutnya: '',
              Tanggal_Pengingat: '',
              Penanggung_Jawab: '',
              Estimasi_Biaya: 0,
              Status: 'Belum dikerjakan',
              Warna: '#A35C2E',
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Maintenance'
  );

  // 9. Sheet Kalender_Agenda
  const eventRows = bundle.calendarEvents.map((e) => ({
    Judul_Agenda: e.title,
    Kategori: e.category,
    Tanggal: formatDateId(e.date, 'dd/MM/yyyy'),
    Jam: formatTime24(e.time),
    Lokasi: e.location || '',
    Status_Selesai: e.is_completed ? 'Selesai' : 'Belum',
    Catatan: e.notes || '',
    ID: e.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      eventRows.length
        ? eventRows
        : [
            {
              Judul_Agenda: '',
              Kategori: 'Agenda',
              Tanggal: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Jam: '09:00',
              Lokasi: '',
              Status_Selesai: 'Belum',
              Catatan: '',
              ID: '',
            },
          ]
    ),
    'Kalender_Agenda'
  );

  // 10. Sheet Jurnal_Keluarga
  const journalRows = bundle.journalEntries.map((j) => ({
    Tanggal: formatDateId(j.date, 'dd/MM/yyyy'),
    Judul: j.title,
    Penulis: j.author_name,
    Cerita: j.content,
    ID: j.id,
  }));
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      journalRows.length
        ? journalRows
        : [
            {
              Tanggal: formatDateId(getTodayIso(), 'dd/MM/yyyy'),
              Judul: '',
              Penulis: '',
              Cerita: '',
              ID: '',
            },
          ]
    ),
    'Jurnal_Keluarga'
  );

  const safeFamilyName = (bundle.family.name || 'Keluarga')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/__+/g, '_');
  const fileName = `RumahKita_Backup_${safeFamilyName}_${getTodayIso()}.xlsx`;
  downloadExcelWorkbook(wb, fileName);
  return fileName;
}

export async function parseExcelFileForImport(
  file: File,
  familyId: string,
  existingTransactionCategories: TransactionCategory[],
  existingTaskCategories: TaskCategory[],
  existingWallets: Wallet[]
): Promise<ParsedExcelPayload> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const now = new Date().toISOString();
  const today = getTodayIso();

  const getSheetRows = (sheetName: string): Record<string, any>[] => {
    const actualName = wb.SheetNames.find(
      (s) => s.toLowerCase().trim() === sheetName.toLowerCase().trim()
    );
    if (!actualName) return [];
    const ws = wb.Sheets[actualName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });
  };

  // 1. Parse Wallets
  const rawWallets = getSheetRows('Wallet');
  const wallets: Wallet[] = [];
  const walletNameMap = new Map<string, string>();
  existingWallets.forEach((w) => walletNameMap.set(w.name.toLowerCase().trim(), w.id));

  rawWallets.forEach((row) => {
    const name = String(row.Nama_Dompet || row.Nama || row.Wallet || '').trim();
    const saldo = parseNumericAmount(row.Saldo ?? row.Balance ?? 0);
    if (!name && saldo === 0) return;
    const finalName = name || 'Dompet Impor';
    const id = String(row.ID || '').trim() || generateUuid();
    const rawType = String(row.Jenis || row.Type || 'Bank').trim();
    const type: Wallet['type'] =
      rawType === 'Tunai' || rawType === 'Dompet Digital' ? rawType : 'Bank';

    const walletObj: Wallet = {
      id,
      family_id: familyId,
      name: finalName,
      type,
      balance: Number.isFinite(saldo) ? saldo : 0,
      color: String(row.Warna || '#2A4D3E'),
      icon: String(row.Icon || 'Wallet'),
      created_at: now,
      updated_at: now,
    };
    wallets.push(walletObj);
    walletNameMap.set(finalName.toLowerCase(), id);
  });

  // Ensure at least one fallback wallet if transactions exist
  let fallbackWalletId =
    wallets[0]?.id || existingWallets[0]?.id || '';

  // 2. Parse Transactions (from 'Transaksi' sheet, or first sheet if custom single-sheet Excel)
  let rawTxs = getSheetRows('Transaksi');
  if (rawTxs.length === 0 && wb.SheetNames.length === 1) {
    rawTxs = getSheetRows(wb.SheetNames[0]);
  }

  const transactions: Transaction[] = [];
  rawTxs.forEach((row) => {
    const amount = parseNumericAmount(row.Nominal ?? row.Jumlah ?? row.Amount ?? row.Nilai ?? 0);
    const notes = String(row.Catatan ?? row.Deskripsi ?? row.Notes ?? row.Keterangan ?? '').trim();
    if (!amount || amount <= 0) return;

    const rawType = String(row.Jenis ?? row.Tipe ?? row.Type ?? 'Pengeluaran').trim();
    const type: Transaction['type'] =
      rawType.toLowerCase() === 'pemasukan' || rawType.toLowerCase() === 'income'
        ? 'Pemasukan'
        : rawType.toLowerCase() === 'transfer'
        ? 'Transfer'
        : 'Pengeluaran';

    const catName = String(row.Kategori ?? row.Category ?? row.Kategori_Transaksi ?? '').trim().toLowerCase();
    const matchedCat =
      existingTransactionCategories.find((c) => c.name.toLowerCase() === catName) ||
      existingTransactionCategories.find((c) => c.type === (type === 'Pemasukan' ? 'Pemasukan' : 'Pengeluaran')) ||
      existingTransactionCategories[0];

    const dompetName = String(row.Dompet ?? row.Wallet ?? row.Nama_Dompet ?? 'Dompet Utama').trim();
    let walletId = walletNameMap.get(dompetName.toLowerCase());
    if (!walletId) {
      if (!fallbackWalletId) {
        const autoWallet: Wallet = {
          id: generateUuid(),
          family_id: familyId,
          name: dompetName || 'Dompet Utama',
          type: 'Bank',
          balance: 0,
          color: '#2A4D3E',
          icon: 'Wallet',
          created_at: now,
          updated_at: now,
        };
        wallets.push(autoWallet);
        walletNameMap.set(autoWallet.name.toLowerCase(), autoWallet.id);
        fallbackWalletId = autoWallet.id;
      }
      walletId = walletNameMap.get(dompetName.toLowerCase()) || fallbackWalletId;
    }

    const toDompetName = String(row.Dompet_Tujuan ?? row.To_Wallet ?? '').trim().toLowerCase();
    const toWalletId = toDompetName ? walletNameMap.get(toDompetName) : undefined;

    transactions.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      wallet_id: walletId,
      to_wallet_id: toWalletId,
      category_id: matchedCat?.id || '',
      type,
      amount,
      date: normalizeIsoDate(row.Tanggal ?? row.Date ?? row.Tgl, today),
      member_id: '',
      member_name: String(row.Anggota ?? row.Member ?? 'Keluarga'),
      notes,
      created_at: now,
      updated_at: now,
    });
  });

  // 3. Parse Budgets
  const budgets: Budget[] = [];
  getSheetRows('Anggaran').forEach((row) => {
    const amount = parseNumericAmount(row.Nominal_Anggaran ?? row.Nominal ?? row.Anggaran ?? 0);
    if (!amount || amount <= 0) return;
    const catName = String(row.Kategori || '').trim().toLowerCase();
    const matchedCat =
      existingTransactionCategories.find((c) => c.name.toLowerCase() === catName) ||
      existingTransactionCategories.find((c) => c.type === 'Pengeluaran');
    if (!matchedCat) return;

    budgets.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      category_id: matchedCat.id,
      period_month: String(row.Bulan || getCurrentMonthIso()).slice(0, 7),
      amount,
      created_at: now,
      updated_at: now,
    });
  });

  // 4. Parse Debts
  const debts: Debt[] = [];
  getSheetRows('Utang_Piutang').forEach((row) => {
    const personName = String(row.Nama_Pihak || row.Nama || '').trim();
    const totalAmount = parseNumericAmount(row.Total_Nominal ?? row.Nominal ?? row.Total ?? 0);
    if (!personName || totalAmount <= 0) return;
    const paidAmount = parseNumericAmount(row.Sudah_Dibayar ?? row.Terbayar ?? 0);
    const type: Debt['type'] = String(row.Jenis || '').trim() === 'Piutang' ? 'Piutang' : 'Utang';
    const status: Debt['status'] =
      paidAmount <= 0 ? 'Belum lunas' : paidAmount >= totalAmount ? 'Lunas' : 'Sebagian';

    debts.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      type,
      person_name: personName,
      total_amount: totalAmount,
      paid_amount: paidAmount,
      start_date: normalizeIsoDate(row.Tanggal_Mulai, today),
      due_date: normalizeIsoDate(row.Jatuh_Tempo, today),
      notes: String(row.Catatan || ''),
      status,
      created_at: now,
      updated_at: now,
    });
  });

  // 5. Parse Goals
  const goals: Goal[] = [];
  getSheetRows('Goal_Tabungan').forEach((row) => {
    const name = String(row.Nama_Goal || row.Nama || '').trim();
    const target = parseNumericAmount(row.Target_Nominal ?? row.Target ?? 0);
    if (!name || target <= 0) return;
    goals.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      name,
      target_amount: target,
      current_amount: parseNumericAmount(row.Saldo_Terkumpul ?? row.Terkumpul ?? 0),
      deadline: normalizeIsoDate(row.Deadline, today),
      icon: 'Target',
      color: '#2A4D3E',
      notes: String(row.Catatan || ''),
      created_at: now,
      updated_at: now,
    });
  });

  // 6. Parse Assets
  const assets: Asset[] = [];
  getSheetRows('Aset').forEach((row) => {
    const name = String(row.Nama_Aset || row.Nama || '').trim();
    const value = parseNumericAmount(row.Nilai_Aset ?? row.Nilai ?? 0);
    if (!name || value <= 0) return;
    assets.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      name,
      category: (row.Kategori as Asset['category']) || 'Lainnya',
      value,
      acquisition_date: normalizeIsoDate(row.Tanggal_Perolehan, today),
      notes: String(row.Catatan || ''),
      created_at: now,
      updated_at: now,
    });
  });

  // 7. Parse Tasks
  const tasks: TaskItem[] = [];
  getSheetRows('Tugas').forEach((row) => {
    const title = String(row.Judul_Tugas || row.Judul || '').trim();
    if (!title) return;
    const catName = String(row.Kategori || '').trim().toLowerCase();
    const matchedCat =
      existingTaskCategories.find((c) => c.name.toLowerCase() === catName) ||
      existingTaskCategories[0];
    tasks.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      title,
      description: String(row.Deskripsi || ''),
      category_id: matchedCat?.id || '',
      due_date: normalizeIsoDate(row.Tenggat_Waktu, today),
      recurrence: (row.Frekuensi as TaskItem['recurrence']) || 'Tidak berulang',
      assignee_id: '',
      assignee_name: String(row.Penanggung_Jawab || 'Keluarga'),
      status: String(row.Status || '').trim() === 'Selesai' ? 'Selesai' : 'Belum selesai',
      created_at: now,
      updated_at: now,
    });
  });

  // 8. Parse Maintenance
  const maintenanceItems: MaintenanceItem[] = [];
  getSheetRows('Maintenance').forEach((row) => {
    const title = String(row.Nama_Item || row.Judul || '').trim();
    if (!title) return;
    maintenanceItems.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      title,
      category: String(row.Kategori || 'Kendaraan'),
      sub_type: String(row.Sub_Tipe || ''),
      scheduled_date: normalizeIsoDate(row.Servis_Berikutnya || row.Jadwal_Berikutnya, ''),
      reminder_date: normalizeIsoDate(row.Tanggal_Pengingat, ''),
      assignee_name: String(row.Penanggung_Jawab || 'Keluarga'),
      estimated_cost: parseNumericAmount(row.Estimasi_Biaya ?? 0),
      status: (row.Status as MaintenanceItem['status']) || 'Belum dikerjakan',
      color: String(row.Warna || ''),
      notes: String(row.Catatan || ''),
      created_at: now,
      updated_at: now,
    });
  });

  // 9. Parse Calendar Events
  const calendarEvents: CalendarEvent[] = [];
  getSheetRows('Kalender_Agenda').forEach((row) => {
    const title = String(row.Judul_Agenda || row.Judul || '').trim();
    if (!title) return;
    const cat = (row.Kategori as CalendarEvent['category']) || 'Agenda';
    calendarEvents.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      title,
      category: cat,
      date: normalizeIsoDate(row.Tanggal, today),
      time: formatTime24(String(row.Jam || '09:00')),
      location: String(row.Lokasi || ''),
      notes: String(row.Catatan || ''),
      is_completed: String(row.Status_Selesai || '').toLowerCase() === 'selesai',
      is_date_night: cat === 'Date Night',
      created_at: now,
      updated_at: now,
    });
  });

  // 10. Parse Journal Entries
  const journalEntries: JournalEntry[] = [];
  getSheetRows('Jurnal_Keluarga').forEach((row) => {
    const title = String(row.Judul || '').trim();
    const content = String(row.Cerita ?? row.Isi ?? '').trim();
    if (!title && !content) return;
    journalEntries.push({
      id: String(row.ID || '').trim() || generateUuid(),
      family_id: familyId,
      date: normalizeIsoDate(row.Tanggal, today),
      title: title || 'Catatan Keluarga',
      author_id: '',
      author_name: String(row.Penulis || 'Keluarga'),
      content,
      created_at: now,
      updated_at: now,
    });
  });

  return {
    summary: {
      walletsCount: wallets.length,
      transactionsCount: transactions.length,
      budgetsCount: budgets.length,
      debtsCount: debts.length,
      goalsCount: goals.length,
      assetsCount: assets.length,
      tasksCount: tasks.length,
      maintenanceCount: maintenanceItems.length,
      eventsCount: calendarEvents.length,
      journalsCount: journalEntries.length,
    },
    wallets,
    transactions,
    budgets,
    debts,
    goals,
    assets,
    tasks,
    maintenanceItems,
    calendarEvents,
    journalEntries,
  };
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// ============================================================================
// GOOGLE APPS SCRIPT UNTUK SINKRONISASI OTOMATIS RUMAHKITA -> GOOGLE SHEETS
// Cara Pakai:
// 1. Buka Google Sheets baru di browser Anda
// 2. Klik menu Extensions (Ekstensi) -> Apps Script
// 3. Hapus kode yang ada, tempel (Paste) kode ini, lalu klik Save
// 4. Klik Deploy -> New deployment -> Pilih type: "Web app"
// 5. Set "Who has access" menjadi "Anyone", klik Deploy, lalu salin Web App URL
// ============================================================================

function doPost(e) {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var payload = JSON.parse(e.postData.contents);
  var sheets = payload.sheets || {};

  Object.keys(sheets).forEach(function(sheetName) {
    var rows = sheets[sheetName];
    var sheet = doc.getSheetByName(sheetName) || doc.insertSheet(sheetName);
    sheet.clearContents();
    if (rows && rows.length > 0) {
      var headers = Object.keys(rows[0]);
      var values = [headers];
      rows.forEach(function(r) {
        values.push(headers.map(function(h) { return r[h] !== undefined ? r[h] : ""; }));
      });
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export async function syncToGoogleSheetsWebhook(
  webhookUrl: string,
  bundle: FamilyDatabaseBundle
): Promise<void> {
  const catMap = new Map(bundle.transactionCategories.map((c) => [c.id, c.name]));
  const walletMap = new Map(bundle.wallets.map((w) => [w.id, w.name]));

  const payload = {
    familyName: bundle.family.name,
    syncedAt: new Date().toISOString(),
    sheets: {
      Transaksi: bundle.transactions.map((t) => ({
        Tanggal: formatDateId(t.date, 'dd/MM/yyyy'),
        Jenis: t.type,
        Kategori: catMap.get(t.category_id) || 'Lainnya',
        Dompet: walletMap.get(t.wallet_id) || '',
        Nominal: t.amount,
        Catatan: t.notes || '',
      })),
      Wallet: bundle.wallets.map((w) => ({
        Nama_Dompet: w.name,
        Jenis: w.type,
        Saldo: w.balance,
      })),
      Goal_Tabungan: bundle.goals.map((g) => ({
        Nama_Goal: g.name,
        Target: g.target_amount,
        Terkumpul: g.current_amount,
        Deadline: formatDateId(g.deadline, 'dd/MM/yyyy'),
      })),
      Aset: bundle.assets.map((a) => ({
        Nama_Aset: a.name,
        Kategori: a.category,
        Nilai: a.value,
        Tanggal: formatDateId(a.acquisition_date, 'dd/MM/yyyy'),
      })),
      Utang_Piutang: bundle.debts.map((d) => ({
        Jenis: d.type,
        Pihak: d.person_name,
        Total: d.total_amount,
        Terbayar: d.paid_amount,
        Status: d.status,
        Jatuh_Tempo: formatDateId(d.due_date, 'dd/MM/yyyy'),
      })),
    },
  };

  await fetch(webhookUrl.trim(), {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify(payload),
  });
}

export function buildClipboardTsvForGoogleSheets(bundle: FamilyDatabaseBundle): string {
  const catMap = new Map(bundle.transactionCategories.map((c) => [c.id, c.name]));
  const walletMap = new Map(bundle.wallets.map((w) => [w.id, w.name]));

  const headers = ['Tanggal', 'Jenis', 'Kategori', 'Dompet', 'Nominal', 'Catatan'];
  const rows = bundle.transactions.map((t) => [
    formatDateId(t.date, 'dd/MM/yyyy'),
    t.type,
    catMap.get(t.category_id) || 'Lainnya',
    walletMap.get(t.wallet_id) || 'Dompet Utama',
    String(t.amount),
    (t.notes || '').replace(/\t|\n/g, ' '),
  ]);

  return [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
}
