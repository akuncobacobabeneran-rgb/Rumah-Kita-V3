import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  CheckCircle2,
  CloudUpload,
  Copy,
  Database,
  Download,
  Edit3,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  HelpCircle,
  LogOut,
  Plus,
  RefreshCw,
  Bell,
  BellRing,
  Settings,
  ShoppingCart,
  Trash2,
  Upload,
  Users,
  Volume2,
  Wrench,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import {
  getNativeNotificationPermission,
  requestNativeNotificationPermission,
  sendTestNotification,
  playNotificationChime,
} from '../../utils/nativeNotifications';
import {
  getSupabaseConfig,
  saveRuntimeSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
  testSupabaseConnection,
} from '../../lib/supabase';
import { PWAInstallButton } from '../../components/ui/PWAInstallButton';
import {
  restoreLocalUsersAndBundlesToServer,
  syncFullBundleToSupabase,
} from '../../services/familyService';
import {
  buildClipboardTsvForGoogleSheets,
  exportFamilyDataToExcel,
  GOOGLE_APPS_SCRIPT_TEMPLATE,
  ParsedExcelPayload,
  parseExcelFileForImport,
  syncToGoogleSheetsWebhook,
} from '../../utils/excelSync';
import { exportFinanceReportToPdf } from '../../utils/pdfReport';
import { formatDateTime24 } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';

const GSHEET_WEBHOOK_KEY = 'rumahkita_gsheet_webhook_url';
const GSHEET_LAST_SYNC_KEY = 'rumahkita_gsheet_last_sync';

export function MorePage() {
  const navigate = useNavigate();
  const profile = useFamilyStore((s) => s.profile);
  const family = useFamilyStore((s) => s.family);
  const members = useFamilyStore((s) => s.members);
  const wallets = useFamilyStore((s) => s.wallets);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const taskCategories = useFamilyStore((s) => s.taskCategories);

  const updateProfile = useFamilyStore((s) => s.updateProfile);
  const updateFamily = useFamilyStore((s) => s.updateFamily);
  const joinFamilyByCode = useFamilyStore((s) => s.joinFamilyByCode);
  const refreshData = useFamilyStore((s) => s.refreshData);
  const addFamilyMember = useFamilyStore((s) => s.addFamilyMember);
  const removeFamilyMember = useFamilyStore((s) => s.removeFamilyMember);
  const getFamilyBundleSnapshot = useFamilyStore((s) => s.getFamilyBundleSnapshot);
  const importExcelData = useFamilyStore((s) => s.importExcelData);
  const logout = useFamilyStore((s) => s.logout);
  const notifications = useFamilyStore((s) => s.notifications);
  const setNotificationsOpen = useFamilyStore((s) => s.setNotificationsOpen);

  const [notifPerm, setNotifPerm] = useState(getNativeNotificationPermission());
  const [isTestingPush, setIsTestingPush] = useState(false);

  // Profile Edit Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [familyName, setFamilyName] = useState(family?.name || '');

  // Add Member & Join Partner Code Modals
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memName, setMemName] = useState('');
  const [memEmail, setMemEmail] = useState('');
  const [memRole, setMemRole] = useState<'Admin' | 'Pasangan' | 'Anggota'>('Pasangan');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [partnerInviteCode, setPartnerInviteCode] = useState('');
  const [isJoiningFamily, setIsJoiningFamily] = useState(false);

  // Delete Member Email Confirmation Modal
  const [memberToDelete, setMemberToDelete] = useState<{
    id: string;
    name: string;
    email?: string;
    role: string;
  } | null>(null);
  const [confirmDeleteEmail, setConfirmDeleteEmail] = useState('');
  const [deleteMemberError, setDeleteMemberError] = useState('');

  // Supabase Config & SQL Schema Modal
  const sbConfig = getSupabaseConfig();
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [sbUrl, setSbUrl] = useState(sbConfig.url);
  const [sbKey, setSbKey] = useState(sbConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const handleTestConnection = async (testUrl?: string, testKey?: string) => {
    setIsTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(testUrl, testKey);
      setTestResult(res);
      showToast(res.message);
    } finally {
      setIsTestingSupabase(false);
    }
  };

  // Pengaturan: Google Sheets, Backup Excel & Import Excel States
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isGSheetModalOpen, setIsGSheetModalOpen] = useState(false);
  const [gsheetWebhookUrl, setGsheetWebhookUrl] = useState(
    () => localStorage.getItem(GSHEET_WEBHOOK_KEY) || ''
  );
  const [lastGSheetSync, setLastGSheetSync] = useState(
    () => localStorage.getItem(GSHEET_LAST_SYNC_KEY) || ''
  );
  const [isSyncingGSheet, setIsSyncingGSheet] = useState(false);
  const [copiedAppsScript, setCopiedAppsScript] = useState(false);
  const [copiedTsv, setCopiedTsv] = useState(false);

  // Import Excel Modal State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedExcelFileName, setSelectedExcelFileName] = useState('');
  const [parsedExcel, setParsedExcel] = useState<ParsedExcelPayload | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    await updateProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      avatar_url: avatarUrl.trim() || undefined,
    });
    if (familyName.trim()) {
      await updateFamily({ name: familyName.trim() });
    }
    setIsProfileModalOpen(false);
    showToast('Profil dan nama keluarga berhasil diperbarui.');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memName.trim() || !memEmail.trim()) return;
    await addFamilyMember(memName.trim(), memEmail.trim(), memRole);
    setMemName('');
    setMemEmail('');
    setIsMemberModalOpen(false);
    showToast(`Anggota keluarga "${memName.trim()}" berhasil ditambahkan.`);
  };

  const openDeleteMemberModal = (member: {
    id: string;
    name: string;
    email?: string;
    role: string;
  }) => {
    setMemberToDelete(member);
    setConfirmDeleteEmail('');
    setDeleteMemberError('');
  };

  const expectedMemberEmail = (
    memberToDelete?.email?.trim() ||
    profile?.email?.trim() ||
    ''
  ).toLowerCase();

  const isDeleteEmailMatched =
    Boolean(confirmDeleteEmail.trim()) &&
    (confirmDeleteEmail.trim().toLowerCase() === expectedMemberEmail ||
      (Boolean(profile?.email?.trim()) &&
        confirmDeleteEmail.trim().toLowerCase() === profile!.email.trim().toLowerCase()));

  const handleConfirmDeleteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToDelete) return;

    if (!isDeleteEmailMatched) {
      setDeleteMemberError(
        `Email konfirmasi tidak cocok. Harap ketik ${
          memberToDelete.email?.trim() || profile?.email || 'email yang sesuai'
        } dengan benar.`
      );
      return;
    }

    const removedName = memberToDelete.name;
    await removeFamilyMember(memberToDelete.id);
    setMemberToDelete(null);
    setConfirmDeleteEmail('');
    setDeleteMemberError('');
    showToast(`Anggota keluarga "${removedName}" telah dihapus setelah konfirmasi email.`);
  };

  const handleCopyInviteCode = async () => {
    if (!family?.invite_code) return;
    navigator.clipboard.writeText(family.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    await refreshData();
    showToast(
      `Kode undangan ${family.invite_code} disalin & disinkronkan! Pasangan Anda kini dapat mendaftar atau gabung dengan kode ini.`
    );
  };

  const handleJoinPartnerFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerInviteCode.trim()) return;
    setIsJoiningFamily(true);
    try {
      await joinFamilyByCode(partnerInviteCode.trim());
      setIsJoinModalOpen(false);
      setPartnerInviteCode('');
      showToast('Berhasil terhubung ke Ruang Keluarga pasangan Anda!');
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghubungkan kode keluarga.');
    } finally {
      setIsJoiningFamily(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    saveRuntimeSupabaseConfig(sbUrl, sbKey);
    setIsSupabaseModalOpen(false);
    await restoreLocalUsersAndBundlesToServer();
    const currentSnapshot = getFamilyBundleSnapshot();
    if (currentSnapshot) {
      await syncFullBundleToSupabase(currentSnapshot);
    }
    await refreshData();
    showToast('Pengaturan database Supabase berhasil disimpan & seluruh data keluarga disinkronkan.');
  };

  // 1. Handler Backup Data ke Excel (.xlsx)
  const handleBackupToExcel = () => {
    const bundle = getFamilyBundleSnapshot();
    if (!bundle) return;
    const fileName = exportFamilyDataToExcel(bundle);
    showToast(`Backup berhasil diunduh: ${fileName}`);
  };

  // 2. Handler Pilih & Parse File Excel untuk Import
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !family) return;
    setImportError('');
    setSelectedExcelFileName(file.name);
    try {
      const parsed = await parseExcelFileForImport(
        file,
        family.id,
        transactionCategories,
        taskCategories,
        wallets
      );
      setParsedExcel(parsed);
    } catch (err: any) {
      setParsedExcel(null);
      setImportError(
        err?.message || 'Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv.'
      );
    }
  };

  const handleConfirmExcelImport = async () => {
    if (!parsedExcel) return;
    setIsImporting(true);
    setImportError('');
    try {
      await importExcelData(parsedExcel, importMode);
      setIsImportModalOpen(false);
      setParsedExcel(null);
      setSelectedExcelFileName('');
      showToast(
        `Berhasil mengimpor ${parsedExcel.summary.transactionsCount} transaksi, ${parsedExcel.summary.walletsCount} wallet, dan data keluarga lainnya dari Excel!`
      );
    } catch (err: any) {
      setImportError(err?.message || 'Terjadi kesalahan saat menyimpan data impor Excel.');
    } finally {
      setIsImporting(false);
    }
  };

  // 3. Handler Sinkronisasi ke Google Sheets
  const handleSyncToGoogleSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    const bundle = getFamilyBundleSnapshot();
    if (!bundle) return;

    if (!gsheetWebhookUrl.trim()) {
      return;
    }

    setIsSyncingGSheet(true);
    try {
      localStorage.setItem(GSHEET_WEBHOOK_KEY, gsheetWebhookUrl.trim());
      await syncToGoogleSheetsWebhook(gsheetWebhookUrl.trim(), bundle);
      const nowFormatted = formatDateTime24(new Date());
      localStorage.setItem(GSHEET_LAST_SYNC_KEY, nowFormatted);
      setLastGSheetSync(nowFormatted);
      setIsGSheetModalOpen(false);
      showToast('Data keluarga berhasil dikirim & disinkronkan ke Google Sheets Anda!');
    } catch {
      showToast('Gagal menghubungi URL Google Apps Script. Periksa kembali URL Web App Anda.');
    } finally {
      setIsSyncingGSheet(false);
    }
  };

  const handleCopyTsvForSheets = () => {
    const bundle = getFamilyBundleSnapshot();
    if (!bundle) return;
    const tsv = buildClipboardTsvForGoogleSheets(bundle);
    navigator.clipboard.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2500);
  };

  const handleCopyAppsScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopiedAppsScript(true);
    setTimeout(() => setCopiedAppsScript(false), 2500);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-[#1E2D24]">Menu Lainnya & Pengaturan</h1>
        <p className="text-xs text-[#5C6B62]">
          Kelola profil pengguna, sistem anggota keluarga, pengaturan backup Excel & Google Sheets
        </p>
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A4D3E]/25 flex items-center gap-2.5 text-xs font-semibold text-[#2A4D3E]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* 1. PROFILE CARD */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl object-cover border border-[#E8E2D5]"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#2A4D3E] text-[#F4D393] flex items-center justify-center text-xl font-bold shrink-0">
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-[#2A4D3E]">
              {profile?.role || 'Admin'} · {family?.name || 'Keluarga'}
            </span>
            <h2 className="text-base font-bold text-[#1E2D24] mt-0.5">
              {profile?.full_name || 'Pengguna'}
            </h2>
            <p className="text-xs text-[#5C6B62]">{profile?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFullName(profile?.full_name || '');
            setEmail(profile?.email || '');
            setAvatarUrl(profile?.avatar_url || '');
            setFamilyName(family?.name || '');
            setIsProfileModalOpen(true);
          }}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold hover:bg-[#E8E2D5] flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>Ubah Profile</span>
        </button>
      </section>

      {/* 1A. PASANG APLIKASI DI HP (PWA) */}
      <PWAInstallButton variant="card" />

      {/* 1B. BRANKAS DOKUMEN & OPERASIONAL RUMAH TANGGA */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] text-[#2A4D3E] flex items-center justify-center shrink-0">
            <FolderKanban className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">
              Brankas Dokumen & Operasional Rumah Tangga
            </h2>
            <p className="text-xs text-[#5C6B62]">
              Penyimpanan berkas penting (KTP, KK, STNK/BPKB, Sertifikat) dan daftar belanja dapur
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/dokumen')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-start gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#2A4D3E] text-white flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">
                Brankas Dokumen Keluarga (Upload & Google Drive)
              </h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                Simpan foto/PDF KTP, KK, Buku Nikah, STNK/BPKB kendaraan, sertifikat rumah, atau
                tautan Google Drive
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/belanja')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-start gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-[#FDF3E1] text-[#9B6B21] flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">
                Daftar Belanja & Meal Planner Mingguan
              </h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                Susun menu masakan Senin–Minggu dan catat daftar belanja langsung ke Pengeluaran
                Dompet
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. MENU PENGATURAN (SINKRONISASI GOOGLE SHEETS, BACKUP EXCEL, IMPORT EXCEL) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#EAF4EE] text-[#2A4D3E] flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Pengaturan Data, Backup & Sinkronisasi</h2>
            <p className="text-xs text-[#5C6B62]">
              Sinkronisasi ke Google Sheets, ekspor backup ke Excel (.xlsx), dan impor data dari Excel
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Sinkronisasi ke Google Sheets */}
          <button
            type="button"
            onClick={() => setIsGSheetModalOpen(true)}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex flex-col justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#2A4D3E] flex items-center justify-center">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Sinkronisasi ke Google Sheets</h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                {lastGSheetSync
                  ? `Terakhir sinkron: ${lastGSheetSync}`
                  : 'Kirim otomatis seluruh tabel ke Google Sheets Anda'}
              </p>
            </div>
          </button>

          {/* Card 2: Ekspor PDF Laporan Keuangan */}
          <button
            type="button"
            onClick={() => {
              const bundle = getFamilyBundleSnapshot();
              if (!bundle) return;
              const fileName = exportFinanceReportToPdf({
                family: bundle.family,
                periodLabel: 'Semua Periode',
                transactions: bundle.transactions,
                transactionCategories: bundle.transactionCategories,
                wallets: bundle.wallets,
                assets: bundle.assets,
                goals: bundle.goals,
                debts: bundle.debts,
              });
              showToast(`Laporan PDF berhasil diunduh: ${fileName}`);
            }}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex flex-col justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FBECE8] text-[#C85A32] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Ekspor PDF Laporan Keuangan</h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                Unduh dokumen PDF laporan arus kas, neraca, kategori, wallet & riwayat transaksi
              </p>
            </div>
          </button>

          {/* Card 3: Backup Data ke Excel */}
          <button
            type="button"
            onClick={handleBackupToExcel}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex flex-col justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FDF6E7] text-[#B88228] flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Backup Data ke Excel</h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                Unduh file lengkap .xlsx (Transaksi, Wallet, Goal, Aset, Kalender)
              </p>
            </div>
          </button>

          {/* Card 4: Import Data dari Excel */}
          <button
            type="button"
            onClick={() => {
              setParsedExcel(null);
              setSelectedExcelFileName('');
              setImportError('');
              setIsImportModalOpen(true);
            }}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex flex-col justify-between gap-3 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF1F6] text-[#36688A] flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Import Data dari Excel</h3>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                Unggah file .xlsx / .csv untuk memuat transaksi & data keluarga
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 2.5 NOTIFIKASI & PENGINGAT SISTEM HP */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2A4D3E]/10 text-[#2A4D3E] flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1E2D24]">Pengingat & Notifikasi Ponsel</h2>
              <p className="text-xs text-[#5C6B62]">
                Peringatan tugas terlewat, agenda hari ini, batas anggaran (overbudget), dan tagihan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#213D31] transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Buka Panel Notifikasi</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1E2D24]">Status Notifikasi Sistem HP:</span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  notifPerm === 'granted'
                    ? 'bg-[#E8F2EC] text-[#2A4D3E] border border-[#2A4D3E]/20'
                    : notifPerm === 'denied'
                    ? 'bg-[#FDECEC] text-[#C84B31] border border-[#C84B31]/20'
                    : 'bg-[#FDF7EB] text-[#8B651B] border border-[#D4A359]/30'
                }`}
              >
                {notifPerm === 'granted'
                  ? 'Aktif (Diizinkan)'
                  : notifPerm === 'denied'
                  ? 'Diblokir di Browser'
                  : 'Belum Diizinkan'}
              </span>
            </div>
            <p className="text-xs text-[#5C6B62]">
              {notifPerm === 'granted'
                ? 'Pemberitahuan otomatis akan muncul di layar / bar notifikasi HP saat ada tugas terlewat atau overbudget.'
                : 'Izinkan notifikasi agar HP Anda berbunyi atau menampilkan pop-up saat ada agenda mendesak.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifPerm !== 'granted' && (
              <button
                type="button"
                onClick={async () => {
                  const perm = await requestNativeNotificationPermission();
                  setNotifPerm(perm);
                  if (perm === 'granted') {
                    sendTestNotification();
                    showToast('Izin notifikasi ponsel berhasil diaktifkan!');
                  }
                }}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#213D31]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aktifkan Notifikasi HP</span>
              </button>
            )}

            <button
              type="button"
              disabled={isTestingPush}
              onClick={async () => {
                setIsTestingPush(true);
                playNotificationChime();
                const sent = await sendTestNotification();
                setIsTestingPush(false);
                if (sent) {
                  showToast('Notifikasi uji coba dikirim ke bilah status ponsel!');
                } else {
                  showToast('Pengingat suara berbunyi.');
                }
              }}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#1E2D24] hover:bg-[#F4EFE6] flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5 text-[#2A4D3E]" />
              <span>{isTestingPush ? 'Mengirim...' : 'Tes Notifikasi & Bunyi'}</span>
            </button>
          </div>
        </div>

        {/* Quick summary of monitored triggers */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <p className="text-[11px] text-[#5C6B62]">Tugas Terlewat</p>
            <p className="text-xs font-bold text-[#C84B31] mt-0.5">Otomatis Terdeteksi</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <p className="text-[11px] text-[#5C6B62]">Agenda Hari Ini</p>
            <p className="text-xs font-bold text-[#2A4D3E] mt-0.5">Pengingat Jadwal</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <p className="text-[11px] text-[#5C6B62]">Batas Anggaran</p>
            <p className="text-xs font-bold text-[#D4A359] mt-0.5">Peringatan Overbudget</p>
          </div>
          <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5]">
            <p className="text-[11px] text-[#5C6B62]">Tagihan & Utang</p>
            <p className="text-xs font-bold text-[#1E2D24] mt-0.5">H-3 Jatuh Tempo</p>
          </div>
        </div>
      </section>

      {/* 3. FAMILY SYSTEM (MULTI-MEMBER & FAMILY ID) */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#1E2D24]">Sistem Keluarga (Multi-Member)</h2>
            <p className="text-xs text-[#5C6B62]">
              Data keluarga hanya dapat diakses oleh anggota yang tergabung dalam Family ID ini
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] border border-[#2A4D3E]/25 text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#E8E2D5]"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Gabung Kode Pasangan</span>
            </button>
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(true)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Anggota</span>
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] text-[#5C6B62]">
              Kode Undangan Keluarga (Bagikan ke Istri / Suami saat Daftar)
            </span>
            <p className="text-base font-mono-num font-bold text-[#2A4D3E] tracking-wider">
              {family?.invite_code || 'RK-HOME'}{' '}
              <span className="text-xs font-normal text-[#5C6B62]">
                (ID: {family?.id.slice(0, 8)})
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                void refreshData();
                showToast('Data & Kode Undangan keluarga berhasil disinkronkan ke server.');
              }}
              className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-xs font-semibold text-[#2A4D3E] flex items-center gap-1.5 cursor-pointer"
              title="Sinkronkan ulang ruang keluarga"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan</span>
            </button>
            <button
              type="button"
              onClick={handleCopyInviteCode}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Kode Tersalin!' : 'Salin Kode Undangan'}</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-[#F0EBE1]">
          {members.map((m) => (
            <div key={m.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] flex items-center justify-center font-bold text-xs shrink-0">
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#1E2D24] truncate">{m.name}</p>
                  <p className="text-[11px] text-[#5C6B62]">
                    Role: {m.role} {m.email ? `· ${m.email}` : ''}
                  </p>
                </div>
              </div>

              {members.length > 1 && m.user_id !== profile?.id && (
                <button
                  type="button"
                  onClick={() =>
                    openDeleteMemberModal({
                      id: m.id,
                      name: m.name,
                      email: m.email,
                      role: m.role,
                    })
                  }
                  aria-label="Hapus anggota"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. MENU FITUR LENGKAP */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-3">
        <h2 className="text-sm font-bold text-[#1E2D24]">Fitur Keluarga Lainnya</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/jurnal')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#EAF1F6] text-[#36688A] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Jurnal Keluarga</h3>
              <p className="text-xs text-[#5C6B62]">Catatan harian & dokumentasi foto keluarga</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/maintenance')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FBECE8] text-[#C85A32] flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Maintenance Rumah</h3>
              <p className="text-xs text-[#5C6B62]">Jadwal perawatan rutin & perbaikan rumah</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/keuangan/laporan')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#2A4D3E] flex items-center justify-center shrink-0">
              <FileBarChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Laporan Keuangan</h3>
              <p className="text-xs text-[#5C6B62]">Analisis pengeluaran & perbandingan periode</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/bantuan')}
            className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#2A4D3E] flex items-center gap-3.5 text-left transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-[#F3EDF4] text-[#7C5D68] flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1E2D24]">Bantuan & FAQ</h3>
              <p className="text-xs text-[#5C6B62]">Panduan penggunaan lengkap RumahKita</p>
            </div>
          </button>
        </div>
      </section>

      {/* 5. PENGATURAN DATABASE SUPABASE */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                sbConfig.isConfigured ? 'bg-[#E8F2EC] text-[#2A4D3E]' : 'bg-[#F4EFE6] text-[#8A7B68]'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[#1E2D24]">
                  Sinkronisasi Database Cloud Supabase
                </h2>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    sbConfig.isConfigured
                      ? 'bg-[#E8F2EC] text-[#2A4D3E] border border-[#2A4D3E]/20'
                      : 'bg-[#F4EFE6] text-[#8A7B68]'
                  }`}
                >
                  {sbConfig.isConfigured ? 'Cloud Terhubung' : 'Penyimpanan Lokal'}
                </span>
              </div>
              <p className="text-xs text-[#5C6B62] mt-0.5">
                {sbConfig.isConfigured
                  ? `Terhubung ke: ${sbConfig.url.slice(0, 35)}...`
                  : 'Data tersimpan di server lokal. Hubungkan akun Supabase untuk sinkronisasi otomatis antar HP.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTestingSupabase}
              onClick={() => handleTestConnection()}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-[#1E2D24] text-xs font-semibold hover:bg-[#F4EFE6] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-[#2A4D3E]' : ''}`} />
              <span>{isTestingSupabase ? 'Menguji...' : 'Tes Koneksi'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTestResult(null);
                setIsSupabaseModalOpen(true);
              }}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#213D31]"
            >
              <Database className="w-4 h-4" />
              <span>Atur Kredensial & SQL</span>
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-medium flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-[#E8F2EC] border-[#2A4D3E]/30 text-[#2A4D3E]'
                : 'bg-[#FBECE8] border-[#C84B31]/30 text-[#C84B31]'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {testResult.success ? 'Koneksi Berhasil!' : 'Peringatan Koneksi'}
              </p>
              <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
            </div>
          </div>
        )}
      </section>

      {/* 6. LOGOUT */}
      <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full min-h-[46px] rounded-2xl bg-[#C84B31] text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#B03E26] transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun (Logout)</span>
        </button>
      </section>

      {/* MODAL 1: SINKRONISASI KE GOOGLE SHEETS */}
      <ResponsiveModal
        isOpen={isGSheetModalOpen}
        onClose={() => setIsGSheetModalOpen(false)}
        title="Sinkronisasi ke Google Sheets"
        subtitle="Sinkronkan seluruh data keuangan & keluarga langsung ke Google Spreadsheet milik Anda"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          {/* Quick Clipboard Option */}
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#1E2D24]">
                  Cara Instan: Salin Tabel ke Google Sheets
                </h4>
                <p className="text-[11px] text-[#5C6B62]">
                  Salin seluruh baris transaksi & tempel (Ctrl+V) langsung di sel A1 Google Sheets
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyTsvForSheets}
                className="px-3.5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedTsv ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTsv ? 'Tabel Tersalin!' : 'Salin Tabel Sheets'}</span>
              </button>
            </div>
          </div>

          {/* Automated Webhook Sync via Google Apps Script */}
          <form onSubmit={handleSyncToGoogleSheets} className="space-y-3.5 pt-2 border-t border-[#E8E2D5]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#1E2D24]">
                Sinkronisasi Otomatis Multi-Sheet (via Google Apps Script)
              </label>
              <button
                type="button"
                onClick={handleCopyAppsScript}
                className="px-2.5 py-1 rounded-lg bg-[#F4EFE6] text-[#2A4D3E] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copiedAppsScript ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedAppsScript ? 'Kode Tersalin!' : 'Salin Kode Apps Script'}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#5C6B62] leading-relaxed">
              Buka Google Sheets Anda → klik <strong>Extensions → Apps Script</strong> → tempel kode
              di atas → klik <strong>Deploy → Web app (Access: Anyone)</strong>, lalu masukkan URL
              Web App di bawah ini:
            </p>

            <div>
              <input
                type="url"
                required
                value={gsheetWebhookUrl}
                onChange={(e) => setGsheetWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-xs font-mono-num"
              />
            </div>

            {lastGSheetSync && (
              <p className="text-[11px] text-[#2A4D3E] font-medium">
                Sinkronisasi terakhir: {lastGSheetSync}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsGSheetModalOpen(false)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isSyncingGSheet}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGSheet ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncingGSheet ? 'Menyinkronkan...' : 'Sinkronkan ke Google Sheets'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </ResponsiveModal>

      {/* MODAL 2: IMPORT DATA DARI EXCEL */}
      <ResponsiveModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Data dari Excel (.xlsx / .csv)"
        subtitle="Unggah file backup Excel RumahKita atau file tabel transaksi Excel Anda"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-dashed border-[#2A4D3E]/40 text-center space-y-2.5">
            <FileSpreadsheet className="w-8 h-8 text-[#2A4D3E] mx-auto" />
            <div>
              <p className="text-xs font-bold text-[#1E2D24]">
                {selectedExcelFileName || 'Pilih file Excel (.xlsx, .xls, .csv) dari perangkat Anda'}
              </p>
              <p className="text-[11px] text-[#5C6B62] mt-0.5">
                Mendukung seluruh sheet hasil Backup Excel RumahKita maupun sheet Transaksi tunggal
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold cursor-pointer"
              >
                Pilih File Excel
              </button>
              <button
                type="button"
                onClick={handleBackupToExcel}
                className="px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-xs font-semibold text-[#2A4D3E] cursor-pointer"
              >
                Unduh Template / Backup Saat Ini
              </button>
            </div>
          </div>

          {importError && (
            <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#C84B31]/20 text-xs text-[#C84B31] font-medium">
              {importError}
            </div>
          )}

          {parsedExcel && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A4D3E]/20 space-y-2">
                <p className="text-xs font-bold text-[#2A4D3E]">
                  Ringkasan Data yang Terdeteksi di File Excel:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[#1E2D24]">
                  <div>
                    Transaksi: <strong>{parsedExcel.summary.transactionsCount}</strong>
                  </div>
                  <div>
                    Wallet: <strong>{parsedExcel.summary.walletsCount}</strong>
                  </div>
                  <div>
                    Anggaran: <strong>{parsedExcel.summary.budgetsCount}</strong>
                  </div>
                  <div>
                    Goal Tabungan: <strong>{parsedExcel.summary.goalsCount}</strong>
                  </div>
                  <div>
                    Aset: <strong>{parsedExcel.summary.assetsCount}</strong>
                  </div>
                  <div>
                    Utang/Piutang: <strong>{parsedExcel.summary.debtsCount}</strong>
                  </div>
                  <div>
                    Tugas: <strong>{parsedExcel.summary.tasksCount}</strong>
                  </div>
                  <div>
                    Maintenance: <strong>{parsedExcel.summary.maintenanceCount}</strong>
                  </div>
                  <div>
                    Agenda/Jurnal:{' '}
                    <strong>
                      {parsedExcel.summary.eventsCount + parsedExcel.summary.journalsCount}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1E2D24]">Mode Import Data</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left cursor-pointer ${
                      importMode === 'merge'
                        ? 'bg-[#F4EFE6] border-[#2A4D3E] text-[#2A4D3E]'
                        : 'bg-white border-[#E8E2D5] text-[#5C6B62]'
                    }`}
                  >
                    Gabungkan (Merge)
                    <span className="block text-[10px] font-normal mt-0.5">
                      Tambahkan ke data yang sudah ada
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-left cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-[#FDECEC] border-[#C84B31] text-[#C84B31]'
                        : 'bg-white border-[#E8E2D5] text-[#5C6B62]'
                    }`}
                  >
                    Ganti Semua (Replace)
                    <span className="block text-[10px] font-normal mt-0.5">
                      Timpa seluruh data dengan isi file Excel
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={handleConfirmExcelImport}
                  className="min-h-[42px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
                >
                  {isImporting ? 'Mengimpor Data...' : 'Proses Import Data Excel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </ResponsiveModal>

      {/* MODAL: EDIT PROFILE */}
      <ResponsiveModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Ubah Profil & Nama Keluarga"
      >
        <form onSubmit={handleSaveProfile} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Keluarga</label>
            <input
              type="text"
              required
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              URL Foto Profil (Opsional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: ADD FAMILY MEMBER */}
      <ResponsiveModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        title="Tambah Anggota Keluarga"
      >
        <form onSubmit={handleAddMember} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Anggota</label>
            <input
              type="text"
              required
              value={memName}
              onChange={(e) => setMemName(e.target.value)}
              placeholder="Contoh: Sari"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Email Anggota
            </label>
            <input
              type="email"
              required
              value={memEmail}
              onChange={(e) => setMemEmail(e.target.value)}
              placeholder="pasangan@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Peran / Role</label>
            <select
              value={memRole}
              onChange={(e) => setMemRole(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            >
              <option value="Pasangan">Pasangan</option>
              <option value="Admin">Admin</option>
              <option value="Anggota">Anggota</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsMemberModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold"
            >
              Simpan Anggota
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: KONFIRMASI EMAIL UNTUK HAPUS ANGGOTA KELUARGA */}
      <ResponsiveModal
        isOpen={Boolean(memberToDelete)}
        onClose={() => {
          setMemberToDelete(null);
          setConfirmDeleteEmail('');
          setDeleteMemberError('');
        }}
        title="Konfirmasi Hapus Anggota Keluarga"
        subtitle="Verifikasi alamat email diperlukan sebelum menghapus anggota keluarga"
      >
        {memberToDelete && (
          <form onSubmit={handleConfirmDeleteMember} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#FDECEC]/70 border border-[#C84B31]/25 space-y-1.5">
              <p className="text-xs font-bold text-[#C84B31]">
                Anda akan menghapus anggota keluarga berikut:
              </p>
              <p className="text-sm font-bold text-[#1E2D24]">{memberToDelete.name}</p>
              <p className="text-xs text-[#5C6B62]">
                Role: {memberToDelete.role}
                {memberToDelete.email ? ` · Email: ${memberToDelete.email}` : ''}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#1E2D24]">
                Ketik email{' '}
                <span className="font-mono-num font-bold text-[#C84B31]">
                  {memberToDelete.email?.trim() || profile?.email}
                </span>{' '}
                untuk mengonfirmasi penghapusan:
              </label>
              <input
                type="email"
                required
                autoFocus
                value={confirmDeleteEmail}
                onChange={(e) => {
                  setConfirmDeleteEmail(e.target.value);
                  if (deleteMemberError) setDeleteMemberError('');
                }}
                placeholder={memberToDelete.email?.trim() || profile?.email || 'nama@email.com'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm text-[#1E2D24] focus:outline-none focus:border-[#C84B31]"
              />
              {memberToDelete.email?.trim() && profile?.email && (
                <p className="text-[11px] text-[#5C6B62]">
                  Anda dapat mengetik email anggota di atas atau email akun Anda ({profile.email}).
                </p>
              )}
            </div>

            {deleteMemberError && (
              <div className="p-3 rounded-xl bg-[#FDECEC] border border-[#C84B31]/20 text-xs text-[#C84B31] font-medium">
                {deleteMemberError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setMemberToDelete(null);
                  setConfirmDeleteEmail('');
                  setDeleteMemberError('');
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62] hover:bg-[#F4EFE6] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!isDeleteEmailMatched}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#C84B31] text-white text-xs font-semibold hover:bg-[#B03E26] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Konfirmasi & Hapus Anggota
              </button>
            </div>
          </form>
        )}
      </ResponsiveModal>

      {/* MODAL: JOIN PARTNER INVITE CODE */}
      <ResponsiveModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Gabung ke Kode Keluarga Pasangan"
        subtitle="Masukkan Kode Undangan (contoh: RK-8F2A) yang tertera di HP suami/istri Anda"
      >
        <form onSubmit={handleJoinPartnerFamily} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Kode Undangan / Family ID Pasangan
            </label>
            <input
              type="text"
              required
              value={partnerInviteCode}
              onChange={(e) => setPartnerInviteCode(e.target.value.toUpperCase())}
              placeholder="Contoh: RK-8F2A"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F2] border border-[#2A4D3E]/40 text-sm font-mono-num font-bold tracking-wider uppercase text-[#1E2D24]"
            />
          </div>
          <p className="text-[11px] text-[#5C6B62] leading-relaxed">
            Setelah terhubung, seluruh dompet, catatan transaksi, anggaran, tugas, dan agenda akan
            tersinkronisasi dalam satu ruang keluarga yang sama.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsJoinModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isJoiningFamily}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
            >
              {isJoiningFamily ? 'Menghubungkan...' : 'Hubungkan Sekarang'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: SUPABASE CONFIG & SQL SCHEMA */}
      <ResponsiveModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        title="Konfigurasi Supabase & Skema PostgreSQL"
        subtitle="Hubungkan kredensial proyek Supabase eksternal Anda"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <form onSubmit={handleSaveSupabase} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                VITE_SUPABASE_URL
              </label>
              <input
                type="url"
                value={sbUrl}
                onChange={(e) => setSbUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-xs font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                value={sbKey}
                onChange={(e) => setSbKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-xs font-mono-num"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                disabled={isTestingSupabase || !sbUrl.trim() || !sbKey.trim()}
                onClick={() => handleTestConnection(sbUrl, sbKey)}
                className="px-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-[#1E2D24] text-xs font-semibold hover:bg-[#F4EFE6] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingSupabase ? 'animate-spin text-[#2A4D3E]' : ''}`} />
                <span>{isTestingSupabase ? 'Menguji...' : 'Uji Koneksi Sekarang'}</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] cursor-pointer"
              >
                Simpan & Sinkronkan
              </button>
            </div>
          </form>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                testResult.success
                  ? 'bg-[#E8F2EC] border-[#2A4D3E]/30 text-[#2A4D3E]'
                  : 'bg-[#FBECE8] border-[#C84B31]/30 text-[#C84B31]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <p className="min-w-0 flex-1 leading-relaxed">{testResult.message}</p>
            </div>
          )}

          <div className="pt-3 border-t border-[#E8E2D5] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E2D24]">
                Skrip SQL Tabel PostgreSQL & Row Level Security (RLS)
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-xl bg-[#F4EFE6] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Tersalin' : 'Salin Skrip SQL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-2xl bg-[#1E2D24] text-[#FAF7F2] text-[11px] font-mono-num overflow-x-auto max-h-56">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      </ResponsiveModal>
    </div>
  );
}
