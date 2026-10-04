import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { MealDayName, ShoppingCategory, ShoppingItem } from '../../types';
import { formatRupiah, formatRupiahInput, parseRupiahInput } from '../../utils/format';
import { createDefaultMealPlans } from '../../utils/defaults';
import { ConfirmDialog, ResponsiveModal } from '../../components/ui/ResponsiveModal';
import { CurrencyInput } from '../../components/ui/CurrencyInput';
import { EmptyState } from '../../components/ui/StateFeedback';

const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  'Dapur & Sayur',
  'Kebutuhan Rumah',
  'Anak & Kesehatan',
  'Lainnya',
];

export function ShoppingMealPage() {
  const family = useFamilyStore((s) => s.family);
  const wallets = useFamilyStore((s) => s.wallets);
  const shoppingItems = useFamilyStore((s) => s.shoppingItems);
  const mealPlans = useFamilyStore((s) => s.mealPlans);
  const syncStatus = useFamilyStore((s) => s.syncStatus || s.txSyncStatus);

  const addShoppingItem = useFamilyStore((s) => s.addShoppingItem);
  const updateShoppingItem = useFamilyStore((s) => s.updateShoppingItem);
  const toggleShoppingItemChecked = useFamilyStore((s) => s.toggleShoppingItemChecked);
  const deleteShoppingItem = useFamilyStore((s) => s.deleteShoppingItem);
  const clearCheckedShoppingItems = useFamilyStore((s) => s.clearCheckedShoppingItems);
  const checkoutShoppingToTransaction = useFamilyStore((s) => s.checkoutShoppingToTransaction);
  const updateMealPlanDay = useFamilyStore((s) => s.updateMealPlanDay);

  const [activeTab, setActiveTab] = useState<'shopping' | 'meal'>('shopping');
  const [catFilter, setCatFilter] = useState<'Semua' | 'Belum Dibeli' | ShoppingCategory>('Semua');

  // Add / Edit Shopping Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<ShoppingCategory>('Dapur & Sayur');
  const [itemQty, setItemQty] = useState('1');
  const [itemPrice, setItemPrice] = useState('');
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Checkout to Expense Modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutSuccessMsg, setCheckoutSuccessMsg] = useState('');

  // Meal Plan Edit Modal
  const [editingMealDay, setEditingMealDay] = useState<MealDayName | null>(null);
  const [mBreakfast, setMBreakfast] = useState('');
  const [mLunch, setMLunch] = useState('');
  const [mDinner, setMDinner] = useState('');
  const [mNotes, setMNotes] = useState('');

  // Form submitting feedback
  const [isSavingItem, setIsSavingItem] = useState(false);
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const fullMealPlans = useMemo(
    () => createDefaultMealPlans(family?.id || 'default', mealPlans),
    [family?.id, mealPlans]
  );

  const filteredShopping = useMemo(() => {
    if (catFilter === 'Semua') return shoppingItems;
    if (catFilter === 'Belum Dibeli') return shoppingItems.filter((i) => !i.is_checked);
    return shoppingItems.filter((i) => i.category === catFilter);
  }, [shoppingItems, catFilter]);

  const checkedItems = useMemo(
    () => shoppingItems.filter((i) => i.is_checked),
    [shoppingItems]
  );

  const totalEstimatedAll = useMemo(
    () => shoppingItems.reduce((sum, i) => sum + (Number(i.estimated_price) || 0), 0),
    [shoppingItems]
  );

  const totalEstimatedChecked = useMemo(
    () => checkedItems.reduce((sum, i) => sum + (Number(i.estimated_price) || 0), 0),
    [checkedItems]
  );

  const openCreateItem = (prefillName = '') => {
    setEditingItem(null);
    setItemName(prefillName);
    setItemCategory('Dapur & Sayur');
    setItemQty('1');
    setItemPrice('');
    setIsSavingItem(false);
    setIsItemModalOpen(true);
  };

  const openEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQty(item.quantity || '1');
    setItemPrice(item.estimated_price ? formatRupiahInput(item.estimated_price) : '');
    setIsSavingItem(false);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    try {
      setIsSavingItem(true);
      const payload = {
        name: itemName.trim(),
        category: itemCategory,
        quantity: itemQty.trim() || '1',
        estimated_price: parseRupiahInput(itemPrice) || 0,
        is_checked: editingItem ? editingItem.is_checked : false,
      };
      if (editingItem) {
        await updateShoppingItem(editingItem.id, payload);
      } else {
        await addShoppingItem(payload);
      }
      setIsSavingItem(false);
      setIsItemModalOpen(false);
    } catch {
      setIsSavingItem(false);
    }
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetWallet = selectedWalletId || wallets[0]?.id || '';
    try {
      setIsCheckingOut(true);
      const recordedAmount = await checkoutShoppingToTransaction(targetWallet, checkoutNotes);
      setIsCheckingOut(false);
      setIsCheckoutOpen(false);
      if (recordedAmount > 0) {
        setCheckoutSuccessMsg(
          `Belanja sebesar ${formatRupiah(recordedAmount)} berhasil dicatat ke Pengeluaran Keuangan.`
        );
        setTimeout(() => setCheckoutSuccessMsg(''), 4000);
      }
    } catch {
      setIsCheckingOut(false);
    }
  };

  const openEditMeal = (dayName: MealDayName) => {
    const found = fullMealPlans.find((d) => d.day_name === dayName);
    setEditingMealDay(dayName);
    setMBreakfast(found?.breakfast || '');
    setMLunch(found?.lunch || '');
    setMDinner(found?.dinner || '');
    setMNotes(found?.notes || '');
    setIsSavingMeal(false);
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealDay) return;
    try {
      setIsSavingMeal(true);
      await updateMealPlanDay(editingMealDay, {
        breakfast: mBreakfast.trim(),
        lunch: mLunch.trim(),
        dinner: mDinner.trim(),
        notes: mNotes.trim(),
      });
      setIsSavingMeal(false);
      setEditingMealDay(null);
    } catch {
      setIsSavingMeal(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#2A4D3E] via-[#234235] to-[#1A3328] text-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#F4D393]">
              <Link to="/kalender" className="inline-flex items-center gap-1 hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kalender & Rumah</span>
              </Link>
              <span>·</span>
              <span>Operasional Dapur Keluarga</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight mt-1">
                Daftar Belanja & Meal Planner
              </h1>
              {syncStatus === 'saving' && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-[#FAF7F2] text-xs font-semibold backdrop-blur-md border border-white/20 animate-pulse mt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </div>
              )}
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Rencanakan menu masakan mingguan dan catat daftar belanja langsung menjadi pengeluaran
              dompet
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateItem()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4A359] hover:bg-[#DFB36B] text-[#1E2D24] text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Belanjaan</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('shopping')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'shopping'
                ? 'bg-white text-[#1E2D24]'
                : 'text-white/85 hover:bg-white/10'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Daftar Belanja ({shoppingItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('meal')}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'meal' ? 'bg-white text-[#1E2D24]' : 'text-white/85 hover:bg-white/10'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Meal Planner (Senin–Minggu)</span>
          </button>
        </div>
      </section>

      {checkoutSuccessMsg && (
        <div className="p-4 rounded-2xl bg-[#EBF5EE] border border-[#B7DEC5] text-xs font-semibold text-[#1E2D24] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2A6F4E] shrink-0" />
          <span>{checkoutSuccessMsg}</span>
        </div>
      )}

      {activeTab === 'shopping' ? (
        <div className="space-y-4">
          {/* SUMMARY & CHECKOUT BAR */}
          <section className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="block text-xs text-[#5C6B62]">Total Estimasi Daftar</span>
                <span className="font-mono-num text-lg font-bold text-[#1E2D24]">
                  {formatRupiah(totalEstimatedAll)}
                </span>
              </div>
              <div className="h-8 w-px bg-[#E8E2D5]" />
              <div>
                <span className="block text-xs text-[#5C6B62]">
                  Sudah Dicentang ({checkedItems.length} item)
                </span>
                <span className="font-mono-num text-lg font-bold text-[#2A4D3E]">
                  {formatRupiah(totalEstimatedChecked)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {checkedItems.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => clearCheckedShoppingItems()}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E8E2D5] bg-[#FAF7F2] text-xs font-semibold text-[#5C6B62] hover:text-[#1E2D24]"
                  >
                    Bersihkan yang Dicentang
                  </button>

                  {totalEstimatedChecked > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWalletId(wallets[0]?.id || '');
                        setCheckoutNotes('');
                        setIsCheckoutOpen(true);
                      }}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-[#2A4D3E] hover:bg-[#213D31] text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Catat ke Pengeluaran ({formatRupiah(totalEstimatedChecked)})</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </section>

          {/* CATEGORY FILTER */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(['Semua', 'Belum Dibeli', ...SHOPPING_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCatFilter(cat)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  catFilter === cat
                    ? 'bg-[#2A4D3E] text-white'
                    : 'bg-white border border-[#E8E2D5] text-[#5C6B62]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* SHOPPING ITEMS LIST */}
          {filteredShopping.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Daftar belanja masih kosong"
              description="Catat bahan makanan, sayur, atau kebutuhan rumah tangga agar Suami & Istri tahu apa yang perlu dibeli."
              actionLabel="Tambah Barang Belanjaan"
              onAction={() => openCreateItem()}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-[#E8E2D5] divide-y divide-[#E8E2D5]">
              {filteredShopping.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-[#FAF7F2]/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleShoppingItemChecked(item.id)}
                      className={`min-h-[40px] min-w-[40px] rounded-xl border flex items-center justify-center shrink-0 transition-colors ${
                        item.is_checked
                          ? 'bg-[#2A4D3E] border-[#2A4D3E] text-white'
                          : 'bg-white border-[#C7BFA8] text-transparent hover:border-[#2A4D3E]'
                      }`}
                      aria-label="Centang belanjaan"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#5C6B62]">
                        <span>{item.category}</span>
                        <span>·</span>
                        <span className="font-mono-num">Jml: {item.quantity || '1'}</span>
                      </div>
                      <p
                        className={`text-sm font-bold truncate ${
                          item.is_checked ? 'line-through text-[#5C6B62]' : 'text-[#1E2D24]'
                        }`}
                      >
                        {item.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.estimated_price > 0 && (
                      <span className="font-mono-num text-sm font-bold text-[#1E2D24]">
                        {formatRupiah(item.estimated_price)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => openEditItem(item)}
                      className="min-h-[38px] min-w-[38px] rounded-xl text-[#5C6B62] hover:text-[#1E2D24] flex items-center justify-center"
                      aria-label="Edit barang"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingItemId(item.id)}
                      className="min-h-[38px] min-w-[38px] rounded-xl text-[#5C6B62] hover:text-[#C84B31] flex items-center justify-center"
                      aria-label="Hapus barang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* MEAL PLANNER MINGGUAN */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fullMealPlans.map((day) => {
            const hasMenu = Boolean(day.breakfast || day.lunch || day.dinner);
            return (
              <div
                key={day.day_name}
                className="bg-white rounded-3xl border border-[#E8E2D5] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2A4D3E]" />
                      <h3 className="text-base font-bold text-[#1E2D24]">{day.day_name}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditMeal(day.day_name)}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] text-xs font-semibold text-[#2A4D3E] flex items-center gap-1.5 hover:bg-[#F4EFE6]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Atur Menu</span>
                    </button>
                  </div>

                  {!hasMenu ? (
                    <p className="text-xs text-[#5C6B62] py-3">
                      Belum ada rencana menu makan untuk hari {day.day_name}.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex justify-between gap-2">
                        <span className="text-[#5C6B62] font-medium shrink-0">Pagi / Sarapan:</span>
                        <span className="font-semibold text-[#1E2D24] text-right">
                          {day.breakfast || '-'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex justify-between gap-2">
                        <span className="text-[#5C6B62] font-medium shrink-0">Makan Siang:</span>
                        <span className="font-semibold text-[#1E2D24] text-right">
                          {day.lunch || '-'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E2D5] flex justify-between gap-2">
                        <span className="text-[#5C6B62] font-medium shrink-0">Makan Malam:</span>
                        <span className="font-semibold text-[#1E2D24] text-right">
                          {day.dinner || '-'}
                        </span>
                      </div>
                    </div>
                  )}

                  {day.notes && (
                    <div className="flex items-center justify-between gap-2 pt-1 text-xs text-[#5C6B62]">
                      <span className="truncate">Bahan: {day.notes}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('shopping');
                          openCreateItem(day.notes || '');
                        }}
                        className="text-[#2A4D3E] font-semibold underline shrink-0"
                      >
                        + Ke Belanja
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT SHOPPING ITEM */}
      <ResponsiveModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? 'Edit Barang Belanjaan' : 'Tambah Barang Belanjaan'}
      >
        <form onSubmit={handleSaveItem} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Nama Barang</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Beras 5kg, Telur Ayam, Sabun Cuci"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">Kategori</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value as ShoppingCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              >
                {SHOPPING_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
                Jumlah / Satuan
              </label>
              <input
                type="text"
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
                placeholder="Contoh: 2 kg, 1 pack"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
              />
            </div>
          </div>
          <CurrencyInput
            label="Estimasi Harga (Opsional)"
            value={itemPrice}
            onChange={(val) => setItemPrice(val)}
            placeholder="0"
            showQuickButtons={true}
            showTerbilang={true}
            quickAmounts={[10_000, 25_000, 50_000, 100_000, 250_000]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingItem}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
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
        </form>
      </ResponsiveModal>

      {/* MODAL: CHECKOUT TO EXPENSE TRANSACTION */}
      <ResponsiveModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Catat Belanja ke Pengeluaran"
        subtitle="Otomatis memotong saldo dompet dan mencatat transaksi kategori Belanja Dapur & Makan"
      >
        <form onSubmit={handleConfirmCheckout} className="space-y-3.5">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5C6B62]">
              Total ({checkedItems.length} barang dicentang)
            </span>
            <span className="font-mono-num text-lg font-bold text-[#2A4D3E]">
              {formatRupiah(totalEstimatedChecked)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Pilih Sumber Dompet Pembayaran
            </label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
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
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={checkoutNotes}
              onChange={(e) => setCheckoutNotes(e.target.value)}
              placeholder="Kosongkan untuk otomatis mencantumkan daftar barang..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCheckingOut}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Konfirmasi & Catat Pengeluaran</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      {/* MODAL: EDIT MEAL PLAN DAY */}
      <ResponsiveModal
        isOpen={Boolean(editingMealDay)}
        onClose={() => setEditingMealDay(null)}
        title={`Menu Makan Hari ${editingMealDay || ''}`}
      >
        <form onSubmit={handleSaveMeal} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Menu Pagi / Sarapan
            </label>
            <input
              type="text"
              value={mBreakfast}
              onChange={(e) => setMBreakfast(e.target.value)}
              placeholder="Contoh: Nasi Goreng Telur & Teh Hangat"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Menu Makan Siang
            </label>
            <input
              type="text"
              value={mLunch}
              onChange={(e) => setMLunch(e.target.value)}
              placeholder="Contoh: Sayur Sop Ayam & Tempe Goreng"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Menu Makan Malam
            </label>
            <input
              type="text"
              value={mDinner}
              onChange={(e) => setMDinner(e.target.value)}
              placeholder="Contoh: Tumis Kangkung & Ikan Bakar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1E2D24] mb-1">
              Catatan Bahan yang Perlu Dibeli
            </label>
            <input
              type="text"
              value={mNotes}
              onChange={(e) => setMNotes(e.target.value)}
              placeholder="Contoh: Ayam 1 ekor, Wortel, Buncis"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E2D5] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingMealDay(null)}
              className="min-h-[44px] px-4 py-2 rounded-xl border border-[#E8E2D5] bg-white text-xs font-semibold text-[#5C6B62]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSavingMeal}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#2A4D3E] text-white text-xs font-semibold hover:bg-[#213D31] flex items-center justify-center gap-1.5 disabled:opacity-85"
            >
              {isSavingMeal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4D393]" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Menu</span>
              )}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        isOpen={Boolean(deletingItemId)}
        onClose={() => setDeletingItemId(null)}
        onConfirm={() => {
          if (deletingItemId) deleteShoppingItem(deletingItemId);
        }}
        title="Hapus Barang Belanjaan?"
        description="Item ini akan dihapus dari daftar belanja keluarga."
      />
    </div>
  );
}
