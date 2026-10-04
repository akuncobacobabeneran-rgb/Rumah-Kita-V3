import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, addYears, format } from 'date-fns';
import {
  Bike,
  Car,
  CheckCircle2,
  ChevronLeft,
  Edit3,
  Home,
  Loader2,
  Trash2,
  Tv,
  Wrench,
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
import { MaintenanceItem, MaintenanceStatus } from '../../types';

type MaintenanceTab = 'Kendaraan' | 'Rumah' | 'Elektronik';

const ITEM_COLORS = [
  { label: 'Terracotta', hex: '#9E582A' },
  { label: 'Muted Blue', hex: '#528599' },
  { label: 'Sage Green', hex: '#5A9E78' },
  { label: 'Deep Olive', hex: '#2A4D3E' },
  { label: 'Mustard Gold', hex: '#C48B28' },
  { label: 'Dusty Rose', hex: '#B56565' },
];

function mapCategoryToTab(category: string): MaintenanceTab {
  const lower = (category || '').toLowerCase();
  if (lower.includes('kendaraan') || lower.includes('mobil') || lower.includes('motor')) {
    return 'Kendaraan';
  }
  if (lower.includes('elektronik') || lower.includes('ac') || lower.includes('tv')) {
    return 'Elektronik';
  }
  if (category === 'Kendaraan' || category === 'Rumah' || category === 'Elektronik') {
    return category;
  }
  return 'Rumah';
}

export function MaintenancePage() {
  const navigate = useNavigate();
  const maintenanceItems = useFamilyStore((s) => s.maintenanceItems);
  const members = useFamilyStore((s) => s.members);
  const profile = useFamilyStore((s) => s.profile);
  const wallets = useFamilyStore((s) => s.wallets);
  const transactionCategories = useFamilyStore((s) => s.transactionCategories);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);

  const addMaintenance = useFamilyStore((s) => s.addMaintenance);
  const updateMaintenance = useFamilyStore((s) => s.updateMaintenance);
  const deleteMaintenance = useFamilyStore((s) => s.deleteMaintenance);
  const addTransaction = useFamilyStore((s) => s.addTransaction);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const [activeTab, setActiveTab] = useState<MaintenanceTab>('Kendaraan');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MaintenanceItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Form submitting feedback
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isRecordingService, setIsRecordingService] = useState(false);

  // "Catat Sekarang" (Record Service Now) Modal State
  const [recordingItem, setRecordingItem] = useState<MaintenanceItem | null>(null);
  const [serviceDate, setServiceDate] = useState(getTodayIso());
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [serviceNotes, setServiceNotes] = useState('');
  const [serviceCost, setServiceCost] = useState('');
  const [serviceWalletId, setServiceWalletId] = useState('');

  // Form states for Create/Edit
  const [title, setTitle] = useState('');
  const [subType, setSubType] = useState('Mobil');
  const [color, setColor] = useState(ITEM_COLORS[0].hex);
  const [scheduledDate, setScheduledDate] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [assigneeName, setAssigneeName] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus>('Belum dikerjakan');
  const [notes, setNotes] = useState('');

  const filteredItems = useMemo(
    () => maintenanceItems.filter((item) => mapCategoryToTab(item.category) === activeTab),
    [maintenanceItems, activeTab]
  );

  const addBtnLabel =
    activeTab === 'Kendaraan'
      ? '+ Tambah kendaraan'
      : activeTab === 'Rumah'
      ? '+ Tambah rumah'
      : '+ Tambah elektronik';

  const openCreate = () => {
    setEditingItem(null);
    setTitle('');
    setSubType(
      activeTab === 'Kendaraan' ? 'Mobil' : activeTab === 'Elektronik' ? 'Elektronik' : 'Rumah'
    );
    const nextColorIdx = filteredItems.length % ITEM_COLORS.length;
    setColor(ITEM_COLORS[nextColorIdx].hex);
    setScheduledDate('');
    setReminderDate('');
    setAssigneeName(profile?.full_name || members[0]?.name || 'Keluarga');
    setStatus('Belum dikerjakan');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (m: MaintenanceItem) => {
    setEditingItem(m);
    setTitle(m.title);
    setSubType(
      m.sub_type ||
        (mapCategoryToTab(m.category) === 'Kendaraan'
          ? m.title.toLowerCase().includes('motor')
            ? 'Motor'
            : 'Mobil'
          : mapCategoryToTab(m.category))
    );
    setColor(m.color || ITEM_COLORS[0].hex);
    setScheduledDate(m.scheduled_date || '');
    setReminderDate(m.reminder_date || '');
    setAssigneeName(m.assignee_name || profile?.full_name || 'Keluarga');
    setStatus(m.status || 'Belum dikerjakan');
    setNotes(m.notes || '');
    setIsModalOpen(true);
  };

  const openRecordServiceNow = (m: MaintenanceItem) => {
    setRecordingItem(m);
    setServiceDate(getTodayIso());
    const suggestedNext = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
    setNextServiceDate(suggestedNext);
    setServiceNotes(m.notes || '');
    setServiceCost('');
    setServiceWalletId(wallets[0]?.id || '');
    setIsRecordingService(false);
  };

  const applyQuickNextInterval = (monthsToAdd: number) => {
    const base = serviceDate ? new Date(serviceDate) : new Date();
    const target =
      monthsToAdd === 12 ? addYears(base, 1) : addMonths(base, monthsToAdd);
    setNextServiceDate(format(target, 'yyyy-MM-dd'));
  };

  const handleRecordServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingItem) return;

    try {
      setIsRecordingService(true);
      const updatedNotes = serviceNotes.trim()
        ? `${serviceNotes.trim()} (Diservis: ${formatDateId(serviceDate, 'd MMM yyyy')})`
        : `Servis tercatat pada ${formatDateId(serviceDate, 'd MMM yyyy')}`;

      await updateMaintenance(recordingItem.id, {
        scheduled_date: nextServiceDate.trim(),
        status: 'Selesai',
        notes: updatedNotes,
      });

      const costNum = parseRupiahInput(serviceCost);
      if (costNum > 0) {
        const expCats = transactionCategories.filter((c) => c.type === 'Pengeluaran');
        const matchedCat =
          expCats.find(
            (c) =>
              c.name.toLowerCase().includes('transport') ||
              c.name.toLowerCase().includes('rumah') ||
              c.name.toLowerCase().includes('tagihan')
          ) || expCats[0];

        await addTransaction({
          type: 'Pengeluaran',
          amount: costNum,
          date: serviceDate || getTodayIso(),
          category_id: matchedCat?.id || '',
          wallet_id: serviceWalletId || wallets[0]?.id || '',
          member_id: profile?.id || '',
          member_name: profile?.full_name || members[0]?.name || 'Keluarga',
          notes: `Servis ${recordingItem.title}${
            serviceNotes.trim() ? ` - ${serviceNotes.trim()}` : ''
          }`,
        });
      }

      const itemName = recordingItem.title;
      const nextLabel = nextServiceDate ? formatDateId(nextServiceDate, 'd MMM yyyy') : '-';
      setIsRecordingService(false);
      setRecordingItem(null);
      setStatusBanner(
        `Servis "${itemName}" berhasil dicatat! Jadwal servis berikutnya: ${nextLabel}${
          costNum > 0 ? ` · Biaya ${formatRupiah(costNum, hideNumbers)} tercatat di Keuangan.` : '.'
        }`
      );
      setTimeout(() => setStatusBanner(null), 5000);
    } catch {
      setIsRecordingService(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSavingItem(true);
      const payload = {
        title: title.trim(),
        category: activeTab,
        sub_type: subType,
        color,
        scheduled_date: scheduledDate.trim(),
        reminder_date: reminderDate.trim() || undefined,
        assignee_name: assigneeName || profile?.full_name || 'Keluarga',
        status,
        notes: notes.trim(),
      };

      if (editingItem) {
        await updateMaintenance(editingItem.id, payload);
      } else {
        await addMaintenance(payload);
      }
      setIsSavingItem(false);
      setIsModalOpen(false);
    } catch {
      setIsSavingItem(false);
    }
  };

  const renderItemIcon = (item: MaintenanceItem, index: number) => {
    const tab = mapCategoryToTab(item.category);
    const bgColor = item.color || ITEM_COLORS[index % ITEM_COLORS.length].hex;
    const isMotor =
      item.sub_type === 'Motor' || item.title.toLowerCase().includes('motor');

    return (
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
        style={{ backgroundColor: bgColor }}
      >
        {tab === 'Kendaraan' ? (
          isMotor ? (
            <Bike className="w-7 h-7 stroke-[1.75]" />
          ) : (
            <Car className="w-7 h-7 stroke-[1.75]" />
          )
        ) : tab === 'Rumah' ? (
          <Home className="w-7 h-7 stroke-[1.75]" />
        ) : (
          <Tv className="w-7 h-7 stroke-[1.75]" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 pb-6">
      {/* 1. Top Back Header "< Lainnya" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/lainnya')}
            className="inline-flex items-center gap-1.5 text-base font-bold text-[#1E2D24] hover:opacity-80 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Lainnya</span>
          </button>
          <span className="text-xs font-semibold text-[#5C6B62]">· Perawatan Rumah</span>
        </div>
        {syncStatus === 'saving' && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F2EC] text-[#2A4D3E] text-xs font-semibold border border-[#2A4D3E]/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Menyimpan...</span>
          </div>
        )}
      </div>

      {statusBanner && (
        <div className="p-3.5 rounded-2xl bg-[#EAF4EE] border border-[#2A4D3E]/25 flex items-center gap-2.5 text-xs font-semibold text-[#2A4D3E]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* 2. Segmented 3-Tab Pill Container: Kendaraan | Rumah | Elektronik */}
      <div className="p-1.5 rounded-2xl bg-[#FAF7F2] border border-[#DFD8C8] grid grid-cols-3 gap-1.5">
        {(
          [
            { id: 'Kendaraan', label: 'Kendaraan', Icon: Car },
            { id: 'Rumah', label: 'Rumah', Icon: Home },
            { id: 'Elektronik', label: 'Elektronik', Icon: Tv },
          ] as const
        ).map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#23201E] text-white shadow-xs'
                  : 'text-[#3A3530] hover:bg-[#EFE9DC]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Full-width Warm Sand Action Button "+ Tambah kendaraan / rumah / elektronik" */}
      <button
        type="button"
        onClick={openCreate}
        className="w-full py-3.5 px-4 rounded-2xl bg-[#E8DFCE] hover:bg-[#DFD4BF] text-[#4E4234] text-sm font-bold text-center transition-colors cursor-pointer"
      >
        {addBtnLabel}
      </button>

      {/* 4. Maintenance Item List */}
      {filteredItems.length === 0 ? (
        <div className="py-12 px-4 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F4EFE6] text-[#5C6B62] flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#1E2D24]">
            Belum ada data {activeTab.toLowerCase()}
          </p>
          <p className="text-xs text-[#5C6B62] max-w-xs mx-auto">
            Ketuk tombol <strong>{addBtnLabel}</strong> di atas untuk mulai mencatat jadwal servis
            dan perawatan berkala.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-2 px-1">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => openEdit(item)}
              className="flex items-center justify-between gap-3 group cursor-pointer rounded-2xl p-2.5 -mx-2 hover:bg-white/80 transition-colors"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {renderItemIcon(item, idx)}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[#1E2D24] truncate">{item.title}</h3>
                  <p className="text-xs font-medium text-[#6E6A64] mt-0.5 truncate">
                    Servis berikut:{' '}
                    {item.scheduled_date ? formatDateId(item.scheduled_date, 'd MMM yyyy') : '-'}
                  </p>
                  {item.notes && (
                    <p className="text-[11px] text-[#8A847C] mt-0.5 truncate">{item.notes}</p>
                  )}
                </div>
              </div>

              <div
                className="flex items-center gap-1.5 shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => openRecordServiceNow(item)}
                  className="px-3 py-1.5 rounded-xl bg-[#EAF4EE] hover:bg-[#DCECE2] text-[#2A4D3E] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="Catat servis dilakukan sekarang"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Catat Sekarang</span>
                  <span className="sm:hidden">Catat</span>
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(item)}
                  aria-label="Edit item"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#EFE9DC] cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingId(item.id)}
                  aria-label="Hapus item"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CATAT SERVIS SEKARANG */}
      <ResponsiveModal
        isOpen={Boolean(recordingItem)}
        onClose={() => setRecordingItem(null)}
        title={`Catat Servis: ${recordingItem?.title || ''}`}
        subtitle="Perbarui jadwal servis berikutnya & catat biaya ke keuangan (opsional)"
      >
        <form onSubmit={handleRecordServiceSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal Servis Dilakukan (dd/mm/yyyy)
              </label>
              <DateInput required value={serviceDate} onChange={setServiceDate} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Jadwal Servis Berikutnya (dd/mm/yyyy)
              </label>
              <DateInput value={nextServiceDate} onChange={setNextServiceDate} />
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-[#5C6B62] mb-1.5">
              Pilih Cepat Interval Servis Berikutnya:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '+1 Bulan', months: 1 },
                { label: '+2 Bulan', months: 2 },
                { label: '+3 Bulan', months: 3 },
                { label: '+6 Bulan', months: 6 },
                { label: '+1 Tahun', months: 12 },
              ].map((iv) => (
                <button
                  key={iv.label}
                  type="button"
                  onClick={() => applyQuickNextInterval(iv.months)}
                  className="px-2.5 py-1 rounded-lg bg-[#F4EFE6] hover:bg-[#E8DFCE] text-[#1E2D24] text-xs font-semibold cursor-pointer"
                >
                  {iv.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Keterangan Servis / Perawatan
            </label>
            <input
              type="text"
              value={serviceNotes}
              onChange={(e) => setServiceNotes(e.target.value)}
              placeholder="Contoh: Ganti oli mesin, tune up, cuci AC..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] space-y-3">
            <span className="block text-xs font-bold text-[#1E2D24]">
              Catat Biaya ke Riwayat Transaksi Keuangan (Opsional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CurrencyInput
                label="Biaya Servis"
                value={serviceCost}
                onChange={(val) => setServiceCost(val)}
                placeholder="Kosongkan jika Rp 0"
                showQuickButtons={true}
                showTerbilang={true}
                quickAmounts={[50_000, 100_000, 250_000, 500_000, 1_000_000]}
              />
              <div>
                <label className="block text-[11px] font-semibold text-[#5C6B62] mb-1">
                  Potong dari Wallet
                </label>
                <select
                  value={serviceWalletId}
                  onChange={(e) => setServiceWalletId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
                >
                  {wallets.length === 0 ? (
                    <option value="">Dompet Utama (Otomatis)</option>
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
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRecordingItem(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isRecordingService}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-85"
            >
              {isRecordingService ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Catatan Servis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: TAMBAH / EDIT MAINTENANCE */}
      <ResponsiveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingItem
            ? `Edit ${activeTab}`
            : `Tambah ${activeTab}`
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Nama {activeTab}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'Kendaraan'
                  ? 'Contoh: Mobil Keluarga / Motor'
                  : activeTab === 'Rumah'
                  ? 'Contoh: Atap & Talang Air / Pompa Air'
                  : 'Contoh: AC Kamar Utama / Kulkas'
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          {activeTab === 'Kendaraan' && (
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">
                Jenis Kendaraan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['Mobil', 'Motor'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSubType(t)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      subType === t
                        ? 'bg-[#23201E] text-white border-[#23201E]'
                        : 'bg-white text-[#5C6B62] border-[#E8E2D5]'
                    }`}
                  >
                    {t === 'Motor' ? <Bike className="w-4 h-4" /> : <Car className="w-4 h-4" />}
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1.5">
              Warna Ikon
            </label>
            <div className="flex items-center gap-2.5">
              {ITEM_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  aria-label={c.label}
                  className={`w-9 h-9 rounded-xl transition-transform cursor-pointer ${
                    color === c.hex ? 'scale-110 ring-2 ring-[#1E2D24] ring-offset-2' : ''
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Jadwal Servis Berikut (dd/mm/yyyy)
              </label>
              <DateInput value={scheduledDate} onChange={setScheduledDate} />
              <span className="text-[11px] text-[#5C6B62] mt-0.5 block">
                Kosongkan jika belum ada jadwal (&ldquo;Servis berikut: -&rdquo;)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Belum dikerjakan">Belum dikerjakan</option>
                <option value="Sedang dikerjakan">Sedang dikerjakan</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Catatan Servis / Bengkel (Opsional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Ganti oli berkala setiap 5.000 km, cek filter udara..."
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {editingItem ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setDeletingId(editingItem.id);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FDECEC] text-[#C84B31] text-xs font-semibold cursor-pointer"
                >
                  Hapus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const target = editingItem;
                    setIsModalOpen(false);
                    openRecordServiceNow(target);
                  }}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EAF4EE] text-[#2A4D3E] text-xs font-semibold cursor-pointer"
                >
                  Catat Sekarang
                </button>
              </div>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSavingItem}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-85"
              >
                {isSavingItem ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) deleteMaintenance(deletingId);
        }}
        title={`Hapus Data ${activeTab}?`}
        description="Data perawatan ini akan dihapus dari daftar keluarga Anda."
      />
    </div>
  );
}
