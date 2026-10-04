import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Edit3, Plus, Trash2 } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { formatDateId, formatRupiah, formatRupiahInput, parseRupiahInput, getTodayIso } from '../../utils/format';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { DateInput } from '../../components/ui/DateTimeInputs';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';
import { Asset, AssetCategory } from '../../types';

export function AssetPage() {
  const navigate = useNavigate();
  const assets = useFamilyStore((s) => s.assets);
  const hideNumbers = useFamilyStore((s) => s.hideNumbers);
  const addAsset = useFamilyStore((s) => s.addAsset);
  const updateAsset = useFamilyStore((s) => s.updateAsset);
  const deleteAsset = useFamilyStore((s) => s.deleteAsset);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<'ALL' | AssetCategory>('ALL');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('Rumah');
  const [value, setValue] = useState('');
  const [acquisitionDate, setAcquisitionDate] = useState(getTodayIso());
  const [notes, setNotes] = useState('');

  const totalAssetsValue = assets.reduce((s, a) => s + a.value, 0);
  const displayedAssets = assets.filter((a) => (filterCat === 'ALL' ? true : a.category === filterCat));

  const openCreateModal = () => {
    setEditingAsset(null);
    setName('');
    setCategory('Rumah');
    setValue('');
    setAcquisitionDate(getTodayIso());
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (a: Asset) => {
    setEditingAsset(a);
    setName(a.name);
    setCategory(a.category);
    setValue(formatRupiahInput(a.value));
    setAcquisitionDate(a.acquisition_date);
    setNotes(a.notes);
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseRupiahInput(value);
    if (!name.trim() || !num || num <= 0) return;
    if (editingAsset) {
      await updateAsset(editingAsset.id, {
        name: name.trim(),
        category,
        value: num,
        acquisition_date: acquisitionDate,
        notes: notes.trim(),
      });
    } else {
      await addAsset({
        name: name.trim(),
        category,
        value: num,
        acquisition_date: acquisitionDate,
        notes: notes.trim(),
      });
    }
    setIsFormOpen(false);
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
            <h1 className="text-lg font-bold text-[#1E2D24]">Aset & Investasi</h1>
            <p className="text-xs text-[#5C6B62]">
              Total Nilai Aset: {formatRupiah(totalAssetsValue, hideNumbers)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['ALL', 'Rumah', 'Kendaraan', 'Emas', 'Investasi', 'Aset lainnya'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCat === cat
                ? 'bg-[#2A4D3E] text-white'
                : 'bg-white border border-[#E8E2D5] text-[#5C6B62]'
            }`}
          >
            {cat === 'ALL' ? 'Semua Aset' : cat}
          </button>
        ))}
      </div>

      {displayedAssets.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="Belum ada aset tercatat"
          description="Catat kepemilikan rumah, kendaraan, emas, atau investasi untuk menghitung kekayaan bersih keluarga."
          actionLabel="Tambah Aset Pertama"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedAssets.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs text-[#5C6B62]">
                  <span className="font-semibold text-[#2A4D3E]">{a.category}</span>
                  <span>·</span>
                  <span>Perolehan {formatDateId(a.acquisition_date, 'MMM yyyy')}</span>
                </div>
                <h3 className="text-base font-bold text-[#1E2D24] truncate">{a.name}</h3>
                <p className="text-base font-mono-num font-bold text-[#2A4D3E]">
                  {formatRupiah(a.value, hideNumbers)}
                </p>
                {a.notes && <p className="text-xs text-[#5C6B62] pt-0.5">{a.notes}</p>}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(a)}
                  aria-label="Edit aset"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#1E2D24] hover:bg-[#F4EFE6]"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingAssetId(a.id)}
                  aria-label="Hapus aset"
                  className="p-2 rounded-xl text-[#5C6B62] hover:text-[#C84B31] hover:bg-[#FDECEC]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResponsiveModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingAsset ? 'Edit Aset & Investasi' : 'Tambah Aset & Investasi'}
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Aset</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Emas Antam 20g, Mobil Keluarga"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Jenis Aset</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                <option value="Rumah">Rumah</option>
                <option value="Kendaraan">Kendaraan</option>
                <option value="Emas">Emas</option>
                <option value="Investasi">Investasi</option>
                <option value="Aset lainnya">Aset lainnya</option>
              </select>
            </div>
            <CurrencyInput
              label="Nilai Estimasi Saat Ini"
              required
              value={value}
              onChange={(val) => setValue(val)}
              placeholder="0"
              showQuickButtons={true}
              showTerbilang={true}
              quickAmounts={[1_000_000, 10_000_000, 50_000_000, 100_000_000]}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Tanggal Perolehan (dd/mm/yyyy)
              </label>
              <DateInput value={acquisitionDate} onChange={setAcquisitionDate} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Catatan</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lokasi / nomor seri / keterangan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
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
              Simpan Aset
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingAssetId)}
        onClose={() => setDeletingAssetId(null)}
        onConfirm={() => {
          if (deletingAssetId) deleteAsset(deletingAssetId);
        }}
        title="Hapus Aset?"
        description="Nilai aset ini akan dikurangi dari perhitungan Kekayaan Bersih Neraca Keluarga."
      />
    </div>
  );
}
