import { create } from 'zustand';
import {
  Asset,
  Budget,
  CalendarEvent,
  ConversationCard,
  CoupleBucketItem,
  CoupleMoment,
  Debt,
  DebtStatus,
  Family,
  FamilyDocument,
  FamilyMember,
  Goal,
  JournalEntry,
  MaintenanceItem,
  MealDayName,
  MealPlanDay,
  NotificationItem,
  Profile,
  RecurringTransaction,
  ShoppingItem,
  TaskCategory,
  TaskItem,
  Transaction,
  TransactionCategory,
  Wallet,
} from '../types';
import {
  authService,
  FamilyDatabaseBundle,
  fetchFamilyBundleFromSupabase,
  syncFullBundleToSupabase,
  syncTableRecordToSupabase,
} from '../services/familyService';
import {
  advanceDateByFrequency,
  calculateNextOccurrence,
  generateUuid,
  getTodayIso,
} from '../utils/format';
import { ParsedExcelPayload } from '../utils/excelSync';
import { generateAutomatedFamilyNotifications } from '../utils/notificationEngine';

export type QuickSheetType =
  | 'transaction'
  | 'transfer'
  | 'wallet'
  | 'goal'
  | 'asset'
  | 'agenda'
  | 'task'
  | 'moment'
  | 'date_night'
  | 'conversation_card'
  | null;

interface FamilyState {
  profile: Profile | null;
  family: Family | null;
  members: FamilyMember[];
  wallets: Wallet[];
  transactionCategories: TransactionCategory[];
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  goals: Goal[];
  assets: Asset[];
  recurringTransactions: RecurringTransaction[];
  taskCategories: TaskCategory[];
  tasks: TaskItem[];
  maintenanceItems: MaintenanceItem[];
  calendarEvents: CalendarEvent[];
  coupleMoments: CoupleMoment[];
  conversationCards: ConversationCard[];
  journalEntries: JournalEntry[];
  notifications: NotificationItem[];
  familyDocuments: FamilyDocument[];
  shoppingItems: ShoppingItem[];
  mealPlans: MealPlanDay[];
  coupleBucketItems: CoupleBucketItem[];

  isLoading: boolean;
  isLoginAnimating: boolean;
  error: string | null;
  hideNumbers: boolean;
  isTopBannerDismissed: boolean;
  activeQuickSheet: QuickSheetType;
  isSearchOpen: boolean;
  isNotificationsOpen: boolean;
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  syncMessage: string | null;
  txSyncStatus: 'idle' | 'saving' | 'saved' | 'error';
  txSyncMessage: string | null;

  // Lifecycle & UI Actions
  initializeSession: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearError: () => void;
  setLoginAnimating: (active: boolean) => void;
  toggleHideNumbers: () => void;
  dismissTopBanner: () => void;
  setActiveQuickSheet: (sheet: QuickSheetType) => void;
  setSearchOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setSyncStatus: (status: 'idle' | 'saving' | 'saved' | 'error', message?: string | null) => void;
  setTxSyncStatus: (status: 'idle' | 'saving' | 'saved' | 'error', message?: string | null) => void;

  // Auth Actions
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    fullName: string;
    email: string;
    password: string;
    familyMode: 'create' | 'join';
    familyName?: string;
    partnerName?: string;
    joinCode?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;

  // Profile & Family Actions
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateFamily: (updates: Partial<Family>) => Promise<void>;
  updateCustomShortcuts: (shortcutIds: string[]) => Promise<void>;
  joinFamilyByCode: (joinCode: string) => Promise<void>;
  addFamilyMember: (name: string, email: string, role: 'Admin' | 'Pasangan' | 'Anggota') => Promise<void>;
  removeFamilyMember: (id: string) => Promise<void>;

  // Wallet Actions
  addWallet: (data: Omit<Wallet, 'id' | 'family_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  transferBetweenWallets: (params: {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    notes: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Transaction Category Actions
  addTransactionCategory: (
    data: Omit<TransactionCategory, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateTransactionCategory: (id: string, data: Partial<TransactionCategory>) => Promise<void>;
  deleteTransactionCategory: (id: string) => Promise<{ reassignedCount: number }>;

  // Transaction Actions
  addTransaction: (
    data: Omit<Transaction, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Budget Actions
  upsertBudget: (data: {
    id?: string;
    category_id: string;
    amount: number;
    period_month: string;
    allocation_group?: 'Kebutuhan Pokok' | 'Tabungan & Investasi' | 'Gaya Hidup & Keluarga';
  }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  // Debt Actions
  addDebt: (
    data: Omit<Debt, 'id' | 'family_id' | 'status' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateDebt: (id: string, data: Partial<Debt>) => Promise<void>;
  recordDebtPayment: (id: string, paymentAmount: number, walletId?: string) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  // Goal Actions
  addGoal: (data: Omit<Goal, 'id' | 'family_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  adjustGoalFunds: (id: string, deltaAmount: number, walletId?: string) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  // Asset Actions
  addAsset: (data: Omit<Asset, 'id' | 'family_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateAsset: (id: string, data: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // Recurring Transaction Actions
  addRecurringTransaction: (
    data: Omit<RecurringTransaction, 'id' | 'family_id' | 'next_date' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => Promise<void>;
  executeRecurringTransactionNow: (id: string) => Promise<void>;
  deleteRecurringTransaction: (id: string) => Promise<void>;

  // Task Category & Task Actions
  addTaskCategory: (name: string, color: string) => Promise<void>;
  updateTaskCategory: (id: string, data: Partial<TaskCategory>) => Promise<void>;
  deleteTaskCategory: (id: string) => Promise<void>;
  reorderTaskCategories: (orderedIds: string[]) => Promise<void>;
  addTask: (data: Omit<TaskItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  // Maintenance Actions
  addMaintenance: (
    data: Omit<MaintenanceItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateMaintenance: (id: string, data: Partial<MaintenanceItem>) => Promise<void>;
  deleteMaintenance: (id: string) => Promise<void>;

  // Calendar Event & Agenda Actions
  addCalendarEvent: (
    data: Omit<CalendarEvent, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateCalendarEvent: (id: string, data: Partial<CalendarEvent>) => Promise<void>;
  toggleCalendarEventCompleted: (id: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;

  // Couple Moment, Conversation Card & Bucket List Actions
  addCoupleMoment: (
    data: Omit<CoupleMoment, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateCoupleMoment: (id: string, data: Partial<CoupleMoment>) => Promise<void>;
  deleteCoupleMoment: (id: string) => Promise<void>;
  toggleConversationDiscussed: (id: string, answerNotes?: string) => Promise<void>;
  saveConversationAnswerNotes: (id: string, answerNotes: string) => Promise<void>;
  toggleConversationFavorite: (id: string) => Promise<void>;
  addConversationCard: (category: ConversationCard['category'], question: string) => Promise<void>;
  addCoupleBucketItem: (
    data: Omit<CoupleBucketItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateCoupleBucketItem: (id: string, data: Partial<CoupleBucketItem>) => Promise<void>;
  toggleCoupleBucketAchieved: (id: string) => Promise<void>;
  deleteCoupleBucketItem: (id: string) => Promise<void>;

  // Family Document Vault Actions
  addFamilyDocument: (
    data: Omit<FamilyDocument, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateFamilyDocument: (id: string, data: Partial<FamilyDocument>) => Promise<void>;
  deleteFamilyDocument: (id: string) => Promise<void>;

  // Shopping List & Meal Planner Actions
  addShoppingItem: (
    data: Omit<ShoppingItem, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateShoppingItem: (id: string, data: Partial<ShoppingItem>) => Promise<void>;
  toggleShoppingItemChecked: (id: string) => Promise<void>;
  deleteShoppingItem: (id: string) => Promise<void>;
  clearCheckedShoppingItems: () => Promise<void>;
  checkoutShoppingToTransaction: (walletId: string, customNotes?: string) => Promise<number>;
  updateMealPlanDay: (
    dayName: MealDayName,
    updates: { breakfast?: string; lunch?: string; dinner?: string; notes?: string }
  ) => Promise<void>;

  // Journal Actions
  addJournalEntry: (
    data: Omit<JournalEntry, 'id' | 'family_id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  updateJournalEntry: (id: string, data: Partial<JournalEntry>) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;

  // Notification Actions
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  evaluateNotifications: () => void;

  // Reset & Excel Import/Export Helpers
  resetFamilyDataToZero: () => Promise<void>;
  getFamilyBundleSnapshot: () => FamilyDatabaseBundle | null;
  importExcelData: (payload: ParsedExcelPayload, mode: 'merge' | 'replace') => Promise<void>;
}

function computeDebtStatus(paid: number, total: number): DebtStatus {
  if (paid <= 0) return 'Belum lunas';
  if (paid >= total) return 'Lunas';
  return 'Sebagian';
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

function notifySyncProgress(
  set: (state: Partial<FamilyState> | ((state: FamilyState) => Partial<FamilyState>)) => void,
  get: () => FamilyState,
  status: 'idle' | 'saving' | 'saved' | 'error',
  message: string | null,
  autoDismissMs = 2800
) {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
  set({
    syncStatus: status,
    syncMessage: message,
    txSyncStatus: status,
    txSyncMessage: message,
  });
  if (status === 'saved' || status === 'error') {
    syncTimer = setTimeout(() => {
      const current = get().syncStatus;
      if (current === status) {
        set({
          syncStatus: 'idle',
          syncMessage: null,
          txSyncStatus: 'idle',
          txSyncMessage: null,
        });
      }
    }, autoDismissMs);
  }
}

async function runWithSync<T>(
  set: (state: Partial<FamilyState> | ((state: FamilyState) => Partial<FamilyState>)) => void,
  get: () => FamilyState,
  entityName: string,
  fn: () => Promise<T>
): Promise<T> {
  notifySyncProgress(set, get, 'saving', `Menyimpan ${entityName}...`);
  try {
    const result = await fn();
    notifySyncProgress(set, get, 'saved', `${entityName} tersimpan di Supabase.`);
    return result;
  } catch (err: any) {
    console.error(`Sync error for ${entityName}:`, err);
    notifySyncProgress(set, get, 'error', `Gagal menyimpan ${entityName}: ${err?.message || 'Error Supabase'}`);
    throw err;
  }
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  profile: null,
  family: null,
  members: [],
  wallets: [],
  transactionCategories: [],
  transactions: [],
  budgets: [],
  debts: [],
  goals: [],
  assets: [],
  recurringTransactions: [],
  taskCategories: [],
  tasks: [],
  maintenanceItems: [],
  calendarEvents: [],
  coupleMoments: [],
  conversationCards: [],
  journalEntries: [],
  notifications: [],
  familyDocuments: [],
  shoppingItems: [],
  mealPlans: [],
  coupleBucketItems: [],

  isLoading: true,
  isLoginAnimating: false,
  error: null,
  hideNumbers: false,
  isTopBannerDismissed: false,
  activeQuickSheet: null,
  isSearchOpen: false,
  isNotificationsOpen: false,
  syncStatus: 'idle',
  syncMessage: null,
  txSyncStatus: 'idle',
  txSyncMessage: null,
  setSyncStatus: (status, message = null) => notifySyncProgress(set, get, status, message),
  setTxSyncStatus: (status, message = null) => notifySyncProgress(set, get, status, message),

  initializeSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const currentProfile = await authService.getCurrentProfile();
      if (!currentProfile) {
        set({ isLoading: false, profile: null, family: null });
        return;
      }

      const bundle = await fetchFamilyBundleFromSupabase(currentProfile.family_id);
      if (!bundle) {
        set({
          isLoading: false,
          profile: currentProfile,
          family: null,
          error: null,
        });
        return;
      }

      set({
        profile: currentProfile,
        ...bundle,
        isLoading: false,
        error: null,
      });
      get().evaluateNotifications();
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || 'Gagal memuat sesi keluarga dari Supabase.',
      });
    }
  },

  refreshData: async () => {
    const { profile, family } = get();
    if (!profile) return;
    set({ isLoading: true, error: null });
    try {
      const bundle = await fetchFamilyBundleFromSupabase(
        profile.family_id,
        family?.invite_code
      );
      if (bundle) {
        set({
          ...bundle,
          isLoading: false,
          error: null,
        });
        get().evaluateNotifications();
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      set({ isLoading: false, error: err?.message || 'Gagal menyegarkan data dari Supabase.' });
    }
  },

  clearError: () => set({ error: null }),
  setLoginAnimating: (active) => set({ isLoginAnimating: active }),

  toggleHideNumbers: () => set((state) => ({ hideNumbers: !state.hideNumbers })),
  dismissTopBanner: () => set({ isTopBannerDismissed: true }),

  setActiveQuickSheet: (sheet) => set({ activeQuickSheet: sheet }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),
  setNotificationsOpen: (open) => set({ isNotificationsOpen: open }),

  login: async (email, password) => {
    set({ error: null });
    const { profile, bundle } = await authService.loginUser(email, password);
    set({
      profile,
      ...bundle,
      isLoading: false,
      error: null,
    });
    get().evaluateNotifications();
  },

  register: async (params) => {
    set({ error: null });
    const { profile, bundle } = await authService.registerUser(params);
    set({
      profile,
      ...bundle,
      isLoading: false,
      error: null,
    });
    get().evaluateNotifications();
  },

  logout: async () => {
    await authService.logoutUser();
    set({
      profile: null,
      family: null,
      members: [],
      wallets: [],
      transactionCategories: [],
      transactions: [],
      budgets: [],
      debts: [],
      goals: [],
      assets: [],
      recurringTransactions: [],
      taskCategories: [],
      tasks: [],
      maintenanceItems: [],
      calendarEvents: [],
      coupleMoments: [],
      conversationCards: [],
      journalEntries: [],
      notifications: [],
      familyDocuments: [],
      shoppingItems: [],
      mealPlans: [],
      coupleBucketItems: [],
      error: null,
      isLoading: false,
    });
  },

  updateProfile: async (updates) => {
    const { profile, members } = get();
    if (!profile) return;
    const now = new Date().toISOString();
    const updatedProfile: Profile = {
      ...profile,
      ...updates,
      updated_at: now,
    };
    const updatedMembers = members.map((m) =>
      m.user_id === profile.id
        ? {
            ...m,
            name: updatedProfile.full_name,
            email: updatedProfile.email,
            avatar_url: updatedProfile.avatar_url,
          }
        : m
    );
    set({ profile: updatedProfile, members: updatedMembers });
    await runWithSync(set, get, 'Profil', () =>
      syncTableRecordToSupabase('profiles', 'upsert', updatedProfile)
    );
  },

  updateFamily: async (updates) => {
    const { family } = get();
    if (!family) return;
    const updated: Family = {
      ...family,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    set({ family: updated });
    await runWithSync(set, get, 'Keluarga', () =>
      syncTableRecordToSupabase('families', 'upsert', updated)
    );
  },

  updateCustomShortcuts: async (shortcutIds: string[]) => {
    const { family } = get();
    const validIds = Array.isArray(shortcutIds) ? shortcutIds : [];
    if (family) {
      const updated: Family = {
        ...family,
        custom_shortcuts: validIds,
        updated_at: new Date().toISOString(),
      };
      set({ family: updated });
      await runWithSync(set, get, 'Pintasan Menu', () =>
        syncTableRecordToSupabase('families', 'upsert', updated)
      );
    }
  },

  joinFamilyByCode: async (joinCode) => {
    const { profile } = get();
    if (!profile) return;
    const { profile: updatedProfile, bundle } =
      await authService.joinFamilyByInviteCodeForCurrentUser(profile, joinCode);
    set({
      profile: updatedProfile,
      ...bundle,
      error: null,
    });
  },

  addFamilyMember: async (name, email, role) => {
    const { family, members } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const newMember: FamilyMember = {
      id: generateUuid(),
      family_id: family.id,
      user_id: generateUuid(),
      name: name.trim(),
      email: email.trim(),
      role,
      created_at: now,
    };
    const updatedFamily: Family =
      role === 'Pasangan'
        ? { ...family, partner_2_name: name.trim(), updated_at: now }
        : family;
    set({ family: updatedFamily, members: [...members, newMember] });
    await runWithSync(set, get, 'Anggota Keluarga', async () => {
      await syncTableRecordToSupabase('family_members', 'upsert', newMember);
      if (role === 'Pasangan') {
        await syncTableRecordToSupabase('families', 'upsert', updatedFamily);
      }
    });
  },

  removeFamilyMember: async (id) => {
    const { family, members } = get();
    if (members.length <= 1) return;
    const remainingMembers = members.filter((m) => m.id !== id);
    const remainingPartner = remainingMembers.find((m) => m.role === 'Pasangan');
    const updatedFamily: Family | null = family
      ? {
          ...family,
          partner_2_name: remainingPartner?.name || '',
          updated_at: new Date().toISOString(),
        }
      : null;
    set({
      family: updatedFamily,
      members: remainingMembers,
    });
    await runWithSync(set, get, 'Anggota Keluarga', async () => {
      await syncTableRecordToSupabase('family_members', 'delete', { id });
      if (updatedFamily) {
        await syncTableRecordToSupabase('families', 'upsert', updatedFamily);
      }
    });
  },

  addWallet: async (data) => {
    const { family, wallets } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const newWallet: Wallet = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      balance: Number(data.balance) || 0,
      created_at: now,
      updated_at: now,
    };
    set({ wallets: [...wallets, newWallet] });
    await runWithSync(set, get, 'Dompet', () =>
      syncTableRecordToSupabase('wallets', 'upsert', newWallet)
    );
  },

  updateWallet: async (id, data) => {
    const { wallets } = get();
    const now = new Date().toISOString();
    let updatedItem: Wallet | null = null;
    const nextWallets = wallets.map((w) => {
      if (w.id === id) {
        updatedItem = {
          ...w,
          ...data,
          balance: data.balance !== undefined ? Number(data.balance) : w.balance,
          updated_at: now,
        };
        return updatedItem;
      }
      return w;
    });
    if (!updatedItem) return;
    set({ wallets: nextWallets });
    await runWithSync(set, get, 'Dompet', () =>
      syncTableRecordToSupabase('wallets', 'upsert', updatedItem!)
    );
  },

  deleteWallet: async (id) => {
    set({ wallets: get().wallets.filter((w) => w.id !== id) });
    await runWithSync(set, get, 'Dompet', () =>
      syncTableRecordToSupabase('wallets', 'delete', { id })
    );
  },

  transferBetweenWallets: async ({ fromWalletId, toWalletId, amount, date, notes }) => {
    const { family, profile, wallets, transactions } = get();
    if (!family || !profile) return { success: false, message: 'Ruang keluarga belum aktif' };

    const fromW = wallets.find((w) => w.id === fromWalletId);
    const toW = wallets.find((w) => w.id === toWalletId);
    if (!fromW || !toW) return { success: false, message: 'Dompet tidak ditemukan' };
    if (fromW.balance < amount) return { success: false, message: 'Saldo dompet asal tidak mencukupi' };

    const now = new Date().toISOString();
    const updatedFrom = { ...fromW, balance: fromW.balance - amount, updated_at: now };
    const updatedTo = { ...toW, balance: toW.balance + amount, updated_at: now };

    const tx: Transaction = {
      id: generateUuid(),
      family_id: family.id,
      type: 'Transfer',
      amount,
      date,
      category_id: '',
      wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      member_id: profile.id,
      member_name: profile.full_name,
      notes: notes.trim() || `Transfer dari ${fromW.name} ke ${toW.name}`,
      created_at: now,
      updated_at: now,
    };

    set({
      wallets: wallets.map((w) =>
        w.id === fromWalletId ? updatedFrom : w.id === toWalletId ? updatedTo : w
      ),
      transactions: [tx, ...transactions],
    });

    await runWithSync(set, get, 'Transfer Antar Dompet', async () => {
      await Promise.all([
        syncTableRecordToSupabase('wallets', 'upsert', updatedFrom),
        syncTableRecordToSupabase('wallets', 'upsert', updatedTo),
        syncTableRecordToSupabase('transactions', 'upsert', tx),
      ]);
    });

    return { success: true, message: 'Transfer berhasil diproses' };
  },

  addTransactionCategory: async (data) => {
    const { family, transactionCategories } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const newCat: TransactionCategory = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      created_at: now,
      updated_at: now,
    };
    set({ transactionCategories: [...transactionCategories, newCat] });
    await runWithSync(set, get, 'Kategori Transaksi', () =>
      syncTableRecordToSupabase('transaction_categories', 'upsert', newCat)
    );
  },

  updateTransactionCategory: async (id, data) => {
    const { transactionCategories } = get();
    const now = new Date().toISOString();
    let updatedCat: TransactionCategory | null = null;
    const nextCats = transactionCategories.map((c) => {
      if (c.id === id) {
        updatedCat = { ...c, ...data, updated_at: now };
        return updatedCat;
      }
      return c;
    });
    if (!updatedCat) return;
    set({ transactionCategories: nextCats });
    await runWithSync(set, get, 'Kategori Transaksi', () =>
      syncTableRecordToSupabase('transaction_categories', 'upsert', updatedCat!)
    );
  },

  deleteTransactionCategory: async (id) => {
    const { transactionCategories, transactions } = get();
    const otherCat = transactionCategories.find((c) => c.name.toLowerCase() === 'lainnya');
    const fallbackId = otherCat?.id || '';

    const nextTxs = transactions.map((t) =>
      t.category_id === id ? { ...t, category_id: fallbackId, updated_at: new Date().toISOString() } : t
    );
    const reassignedCount = transactions.filter((t) => t.category_id === id).length;

    set({
      transactionCategories: transactionCategories.filter((c) => c.id !== id),
      transactions: nextTxs,
    });

    await runWithSync(set, get, 'Hapus Kategori', () =>
      syncTableRecordToSupabase('transaction_categories', 'delete', { id })
    );

    return { reassignedCount };
  },

  addTransaction: async (data) => {
    const { family, wallets, transactions } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      amount: Number(data.amount) || 0,
      created_at: now,
      updated_at: now,
    };

    // Calculate updated wallet balances
    let updatedWallet: Wallet | null = null;
    let updatedToWallet: Wallet | null = null;

    const nextWallets = wallets.map((w) => {
      if (w.id === data.wallet_id) {
        const delta = data.type === 'Pemasukan' ? newTx.amount : -newTx.amount;
        updatedWallet = { ...w, balance: w.balance + delta, updated_at: now };
        return updatedWallet;
      }
      if (data.type === 'Transfer' && data.to_wallet_id && w.id === data.to_wallet_id) {
        updatedToWallet = { ...w, balance: w.balance + newTx.amount, updated_at: now };
        return updatedToWallet;
      }
      return w;
    });

    set({
      transactions: [newTx, ...transactions],
      wallets: nextWallets,
    });

    await runWithSync(set, get, 'Transaksi', async () => {
      await syncTableRecordToSupabase('transactions', 'upsert', newTx);
      if (updatedWallet) await syncTableRecordToSupabase('wallets', 'upsert', updatedWallet);
      if (updatedToWallet) await syncTableRecordToSupabase('wallets', 'upsert', updatedToWallet);
    });
  },

  updateTransaction: async (id, data) => {
    const { transactions, wallets } = get();
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...oldTx,
      ...data,
      amount: data.amount !== undefined ? Number(data.amount) : oldTx.amount,
      updated_at: now,
    };

    // Revert old transaction effect on wallet, then apply new transaction effect
    const nextWallets = wallets.map((w) => {
      let b = w.balance;
      if (w.id === oldTx.wallet_id) {
        b -= oldTx.type === 'Pemasukan' ? oldTx.amount : -oldTx.amount;
      }
      if (w.id === newTx.wallet_id) {
        b += newTx.type === 'Pemasukan' ? newTx.amount : -newTx.amount;
      }
      return { ...w, balance: b, updated_at: now };
    });

    set({
      transactions: transactions.map((t) => (t.id === id ? newTx : t)),
      wallets: nextWallets,
    });

    await runWithSync(set, get, 'Transaksi', async () => {
      await syncTableRecordToSupabase('transactions', 'upsert', newTx);
      const affectedWallets = nextWallets.filter((w) => w.id === oldTx.wallet_id || w.id === newTx.wallet_id);
      for (const aw of affectedWallets) {
        await syncTableRecordToSupabase('wallets', 'upsert', aw);
      }
    });
  },

  deleteTransaction: async (id) => {
    const { transactions, wallets } = get();
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    const now = new Date().toISOString();
    let revertedWallet: Wallet | null = null;
    const nextWallets = wallets.map((w) => {
      if (w.id === tx.wallet_id) {
        const revertDelta = tx.type === 'Pemasukan' ? -tx.amount : tx.amount;
        revertedWallet = { ...w, balance: w.balance + revertDelta, updated_at: now };
        return revertedWallet;
      }
      return w;
    });

    set({
      transactions: transactions.filter((t) => t.id !== id),
      wallets: nextWallets,
    });

    await runWithSync(set, get, 'Hapus Transaksi', async () => {
      await syncTableRecordToSupabase('transactions', 'delete', { id });
      if (revertedWallet) {
        await syncTableRecordToSupabase('wallets', 'upsert', revertedWallet);
      }
    });
  },

  upsertBudget: async (data) => {
    const { family, budgets } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const existing = budgets.find(
      (b) => b.category_id === data.category_id && b.period_month === data.period_month
    );
    const item: Budget = {
      id: data.id || existing?.id || generateUuid(),
      family_id: family.id,
      category_id: data.category_id,
      amount: Number(data.amount) || 0,
      period_month: data.period_month,
      allocation_group: data.allocation_group || 'Kebutuhan Pokok',
      created_at: existing?.created_at || now,
      updated_at: now,
    };
    const nextBudgets = existing
      ? budgets.map((b) => (b.id === item.id ? item : b))
      : [...budgets, item];
    set({ budgets: nextBudgets });
    await runWithSync(set, get, 'Anggaran', () =>
      syncTableRecordToSupabase('budgets', 'upsert', item)
    );
  },

  deleteBudget: async (id) => {
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
    await runWithSync(set, get, 'Anggaran', () =>
      syncTableRecordToSupabase('budgets', 'delete', { id })
    );
  },

  addDebt: async (data) => {
    const { family, debts } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: Debt = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      total_amount: Number(data.total_amount) || 0,
      paid_amount: Number(data.paid_amount) || 0,
      status: computeDebtStatus(Number(data.paid_amount) || 0, Number(data.total_amount) || 0),
      created_at: now,
      updated_at: now,
    };
    set({ debts: [...debts, item] });
    await runWithSync(set, get, 'Utang / Piutang', () =>
      syncTableRecordToSupabase('debts', 'upsert', item)
    );
  },

  updateDebt: async (id, data) => {
    const { debts } = get();
    const now = new Date().toISOString();
    let updated: Debt | null = null;
    const nextDebts = debts.map((d) => {
      if (d.id === id) {
        const total = data.total_amount !== undefined ? Number(data.total_amount) : d.total_amount;
        const paid = data.paid_amount !== undefined ? Number(data.paid_amount) : d.paid_amount;
        updated = {
          ...d,
          ...data,
          total_amount: total,
          paid_amount: paid,
          status: computeDebtStatus(paid, total),
          updated_at: now,
        };
        return updated;
      }
      return d;
    });
    if (!updated) return;
    set({ debts: nextDebts });
    await runWithSync(set, get, 'Utang / Piutang', () =>
      syncTableRecordToSupabase('debts', 'upsert', updated!)
    );
  },

  recordDebtPayment: async (id, paymentAmount, walletId) => {
    const { debts, wallets, transactions, family, profile } = get();
    const debt = debts.find((d) => d.id === id);
    if (!debt || !family || !profile) return;

    const now = new Date().toISOString();
    const today = getTodayIso();
    const newPaid = debt.paid_amount + paymentAmount;
    const updatedDebt: Debt = {
      ...debt,
      paid_amount: newPaid,
      status: computeDebtStatus(newPaid, debt.total_amount),
      updated_at: now,
    };

    let updatedWallet: Wallet | null = null;
    let paymentTx: Transaction | null = null;

    if (walletId) {
      const w = wallets.find((item) => item.id === walletId);
      if (w) {
        const isExpense = debt.type === 'Utang';
        const delta = isExpense ? -paymentAmount : paymentAmount;
        updatedWallet = { ...w, balance: w.balance + delta, updated_at: now };

        paymentTx = {
          id: generateUuid(),
          family_id: family.id,
          type: isExpense ? 'Pengeluaran' : 'Pemasukan',
          amount: paymentAmount,
          date: today,
          category_id: '',
          wallet_id: walletId,
          member_id: profile.id,
          member_name: profile.full_name,
          notes: `Pembayaran ${debt.type} kepada/dari ${debt.person_name}`,
          created_at: now,
          updated_at: now,
        };
      }
    }

    set({
      debts: debts.map((d) => (d.id === id ? updatedDebt : d)),
      wallets: updatedWallet ? wallets.map((w) => (w.id === walletId ? updatedWallet! : w)) : wallets,
      transactions: paymentTx ? [paymentTx, ...transactions] : transactions,
    });

    await runWithSync(set, get, 'Pembayaran Utang', async () => {
      await syncTableRecordToSupabase('debts', 'upsert', updatedDebt);
      if (updatedWallet) await syncTableRecordToSupabase('wallets', 'upsert', updatedWallet);
      if (paymentTx) await syncTableRecordToSupabase('transactions', 'upsert', paymentTx);
    });
  },

  deleteDebt: async (id) => {
    set({ debts: get().debts.filter((d) => d.id !== id) });
    await runWithSync(set, get, 'Utang / Piutang', () =>
      syncTableRecordToSupabase('debts', 'delete', { id })
    );
  },

  addGoal: async (data) => {
    const { family, goals } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: Goal = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      target_amount: Number(data.target_amount) || 0,
      current_amount: Number(data.current_amount) || 0,
      created_at: now,
      updated_at: now,
    };
    set({ goals: [...goals, item] });
    await runWithSync(set, get, 'Target Impian', () =>
      syncTableRecordToSupabase('goals', 'upsert', item)
    );
  },

  updateGoal: async (id, data) => {
    const { goals } = get();
    const now = new Date().toISOString();
    let updated: Goal | null = null;
    const nextGoals = goals.map((g) => {
      if (g.id === id) {
        updated = {
          ...g,
          ...data,
          target_amount: data.target_amount !== undefined ? Number(data.target_amount) : g.target_amount,
          current_amount: data.current_amount !== undefined ? Number(data.current_amount) : g.current_amount,
          updated_at: now,
        };
        return updated;
      }
      return g;
    });
    if (!updated) return;
    set({ goals: nextGoals });
    await runWithSync(set, get, 'Target Impian', () =>
      syncTableRecordToSupabase('goals', 'upsert', updated!)
    );
  },

  adjustGoalFunds: async (id, deltaAmount, walletId) => {
    const { goals, wallets, transactions, family, profile } = get();
    const goal = goals.find((g) => g.id === id);
    if (!goal || !family || !profile) return;

    const now = new Date().toISOString();
    const today = getTodayIso();
    const newCurrent = Math.max(0, goal.current_amount + deltaAmount);
    const updatedGoal: Goal = {
      ...goal,
      current_amount: newCurrent,
      updated_at: now,
    };

    let updatedWallet: Wallet | null = null;
    let goalTx: Transaction | null = null;

    if (walletId) {
      const w = wallets.find((item) => item.id === walletId);
      if (w) {
        updatedWallet = { ...w, balance: w.balance - deltaAmount, updated_at: now };
        goalTx = {
          id: generateUuid(),
          family_id: family.id,
          type: deltaAmount > 0 ? 'Pengeluaran' : 'Pemasukan',
          amount: Math.abs(deltaAmount),
          date: today,
          category_id: '',
          wallet_id: walletId,
          member_id: profile.id,
          member_name: profile.full_name,
          notes: `${deltaAmount > 0 ? 'Setor tabungan' : 'Tarik tabungan'} untuk impian: ${goal.name}`,
          created_at: now,
          updated_at: now,
        };
      }
    }

    set({
      goals: goals.map((g) => (g.id === id ? updatedGoal : g)),
      wallets: updatedWallet ? wallets.map((w) => (w.id === walletId ? updatedWallet! : w)) : wallets,
      transactions: goalTx ? [goalTx, ...transactions] : transactions,
    });

    await runWithSync(set, get, 'Tabungan Impian', async () => {
      await syncTableRecordToSupabase('goals', 'upsert', updatedGoal);
      if (updatedWallet) await syncTableRecordToSupabase('wallets', 'upsert', updatedWallet);
      if (goalTx) await syncTableRecordToSupabase('transactions', 'upsert', goalTx);
    });
  },

  deleteGoal: async (id) => {
    set({ goals: get().goals.filter((g) => g.id !== id) });
    await runWithSync(set, get, 'Target Impian', () =>
      syncTableRecordToSupabase('goals', 'delete', { id })
    );
  },

  addAsset: async (data) => {
    const { family, assets } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: Asset = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      value: Number(data.value) || 0,
      created_at: now,
      updated_at: now,
    };
    set({ assets: [...assets, item] });
    await runWithSync(set, get, 'Aset', () =>
      syncTableRecordToSupabase('assets', 'upsert', item)
    );
  },

  updateAsset: async (id, data) => {
    const { assets } = get();
    const now = new Date().toISOString();
    let updated: Asset | null = null;
    const nextAssets = assets.map((a) => {
      if (a.id === id) {
        updated = {
          ...a,
          ...data,
          value: data.value !== undefined ? Number(data.value) : a.value,
          updated_at: now,
        };
        return updated;
      }
      return a;
    });
    if (!updated) return;
    set({ assets: nextAssets });
    await runWithSync(set, get, 'Aset', () =>
      syncTableRecordToSupabase('assets', 'upsert', updated!)
    );
  },

  deleteAsset: async (id) => {
    set({ assets: get().assets.filter((a) => a.id !== id) });
    await runWithSync(set, get, 'Aset', () =>
      syncTableRecordToSupabase('assets', 'delete', { id })
    );
  },

  addRecurringTransaction: async (data) => {
    const { family, recurringTransactions } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const nextDate = calculateNextOccurrence(data.start_date, data.frequency);
    const item: RecurringTransaction = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      amount: Number(data.amount) || 0,
      next_date: nextDate,
      is_active: data.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    set({ recurringTransactions: [...recurringTransactions, item] });
    await runWithSync(set, get, 'Transaksi Rutin', () =>
      syncTableRecordToSupabase('recurring_transactions', 'upsert', item)
    );
  },

  updateRecurringTransaction: async (id, data) => {
    const { recurringTransactions } = get();
    const now = new Date().toISOString();
    let updated: RecurringTransaction | null = null;
    const nextRec = recurringTransactions.map((r) => {
      if (r.id === id) {
        updated = {
          ...r,
          ...data,
          amount: data.amount !== undefined ? Number(data.amount) : r.amount,
          updated_at: now,
        };
        return updated;
      }
      return r;
    });
    if (!updated) return;
    set({ recurringTransactions: nextRec });
    await runWithSync(set, get, 'Transaksi Rutin', () =>
      syncTableRecordToSupabase('recurring_transactions', 'upsert', updated!)
    );
  },

  executeRecurringTransactionNow: async (id) => {
    const { recurringTransactions, wallets, transactions, family, profile } = get();
    const rec = recurringTransactions.find((r) => r.id === id);
    if (!rec || !family || !profile) return;

    const now = new Date().toISOString();
    const today = getTodayIso();
    const nextDate = advanceDateByFrequency(rec.next_date, rec.frequency);

    const tx: Transaction = {
      id: generateUuid(),
      family_id: family.id,
      type: rec.type,
      amount: rec.amount,
      date: today,
      category_id: rec.category_id,
      wallet_id: rec.wallet_id,
      member_id: profile.id,
      member_name: profile.full_name,
      notes: `Eksekusi otomatis rutin: ${rec.name}`,
      created_at: now,
      updated_at: now,
    };

    let updatedWallet: Wallet | null = null;
    const nextWallets = wallets.map((w) => {
      if (w.id === rec.wallet_id) {
        const delta = rec.type === 'Pemasukan' ? rec.amount : -rec.amount;
        updatedWallet = { ...w, balance: w.balance + delta, updated_at: now };
        return updatedWallet;
      }
      return w;
    });

    const updatedRec: RecurringTransaction = {
      ...rec,
      next_date: nextDate,
      updated_at: now,
    };

    set({
      recurringTransactions: recurringTransactions.map((r) => (r.id === id ? updatedRec : r)),
      wallets: nextWallets,
      transactions: [tx, ...transactions],
    });

    await runWithSync(set, get, 'Eksekusi Transaksi Rutin', async () => {
      await Promise.all([
        syncTableRecordToSupabase('recurring_transactions', 'upsert', updatedRec),
        syncTableRecordToSupabase('transactions', 'upsert', tx),
        updatedWallet ? syncTableRecordToSupabase('wallets', 'upsert', updatedWallet) : Promise.resolve(),
      ]);
    });
  },

  deleteRecurringTransaction: async (id) => {
    set({ recurringTransactions: get().recurringTransactions.filter((r) => r.id !== id) });
    await runWithSync(set, get, 'Transaksi Rutin', () =>
      syncTableRecordToSupabase('recurring_transactions', 'delete', { id })
    );
  },

  addTaskCategory: async (name, color) => {
    const { family, taskCategories } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: TaskCategory = {
      id: generateUuid(),
      family_id: family.id,
      name: name.trim(),
      color,
      sort_order: taskCategories.length,
      created_at: now,
      updated_at: now,
    };
    set({ taskCategories: [...taskCategories, item] });
    await runWithSync(set, get, 'Kategori Tugas', () =>
      syncTableRecordToSupabase('task_categories', 'upsert', item)
    );
  },

  updateTaskCategory: async (id, data) => {
    const { taskCategories } = get();
    const now = new Date().toISOString();
    let updated: TaskCategory | null = null;
    const nextCats = taskCategories.map((c) => {
      if (c.id === id) {
        updated = { ...c, ...data, updated_at: now };
        return updated;
      }
      return c;
    });
    if (!updated) return;
    set({ taskCategories: nextCats });
    await runWithSync(set, get, 'Kategori Tugas', () =>
      syncTableRecordToSupabase('task_categories', 'upsert', updated!)
    );
  },

  deleteTaskCategory: async (id) => {
    set({ taskCategories: get().taskCategories.filter((c) => c.id !== id) });
    await runWithSync(set, get, 'Kategori Tugas', () =>
      syncTableRecordToSupabase('task_categories', 'delete', { id })
    );
  },

  reorderTaskCategories: async (orderedIds) => {
    const { taskCategories } = get();
    const now = new Date().toISOString();
    const updatedCats = taskCategories.map((c) => {
      const idx = orderedIds.indexOf(c.id);
      return idx >= 0 ? { ...c, sort_order: idx, updated_at: now } : c;
    });
    set({ taskCategories: updatedCats });
    await runWithSync(set, get, 'Urutan Kategori', async () => {
      for (const cat of updatedCats) {
        await syncTableRecordToSupabase('task_categories', 'upsert', cat);
      }
    });
  },

  addTask: async (data) => {
    const { family, tasks } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: TaskItem = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      status: 'Belum selesai',
      created_at: now,
      updated_at: now,
    };
    set({ tasks: [item, ...tasks] });
    await runWithSync(set, get, 'Tugas Rumah', () =>
      syncTableRecordToSupabase('tasks', 'upsert', item)
    );
  },

  updateTask: async (id, data) => {
    const { tasks } = get();
    const now = new Date().toISOString();
    let updated: TaskItem | null = null;
    const nextTasks = tasks.map((t) => {
      if (t.id === id) {
        updated = { ...t, ...data, updated_at: now };
        return updated;
      }
      return t;
    });
    if (!updated) return;
    set({ tasks: nextTasks });
    await runWithSync(set, get, 'Tugas Rumah', () =>
      syncTableRecordToSupabase('tasks', 'upsert', updated!)
    );
  },

  toggleTaskStatus: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const now = new Date().toISOString();
    const updated: TaskItem = {
      ...task,
      status: task.status === 'Selesai' ? 'Belum selesai' : 'Selesai',
      updated_at: now,
    };
    set({ tasks: tasks.map((t) => (t.id === id ? updated : t)) });
    await runWithSync(set, get, 'Status Tugas', () =>
      syncTableRecordToSupabase('tasks', 'upsert', updated)
    );
  },

  deleteTask: async (id) => {
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
    await runWithSync(set, get, 'Tugas Rumah', () =>
      syncTableRecordToSupabase('tasks', 'delete', { id })
    );
  },

  addMaintenance: async (data) => {
    const { family, maintenanceItems } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: MaintenanceItem = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      estimated_cost: Number(data.estimated_cost) || 0,
      created_at: now,
      updated_at: now,
    };
    set({ maintenanceItems: [...maintenanceItems, item] });
    await runWithSync(set, get, 'Perawatan Rumah', () =>
      syncTableRecordToSupabase('maintenance_items', 'upsert', item)
    );
  },

  updateMaintenance: async (id, data) => {
    const { maintenanceItems } = get();
    const now = new Date().toISOString();
    let updated: MaintenanceItem | null = null;
    const nextItems = maintenanceItems.map((m) => {
      if (m.id === id) {
        updated = {
          ...m,
          ...data,
          estimated_cost: data.estimated_cost !== undefined ? Number(data.estimated_cost) : m.estimated_cost,
          updated_at: now,
        };
        return updated;
      }
      return m;
    });
    if (!updated) return;
    set({ maintenanceItems: nextItems });
    await runWithSync(set, get, 'Perawatan Rumah', () =>
      syncTableRecordToSupabase('maintenance_items', 'upsert', updated!)
    );
  },

  deleteMaintenance: async (id) => {
    set({ maintenanceItems: get().maintenanceItems.filter((m) => m.id !== id) });
    await runWithSync(set, get, 'Perawatan Rumah', () =>
      syncTableRecordToSupabase('maintenance_items', 'delete', { id })
    );
  },

  addCalendarEvent: async (data) => {
    const { family, calendarEvents } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: CalendarEvent = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      is_completed: false,
      created_at: now,
      updated_at: now,
    };
    set({ calendarEvents: [...calendarEvents, item] });
    await runWithSync(set, get, 'Agenda Kalender', () =>
      syncTableRecordToSupabase('calendar_events', 'upsert', item)
    );
  },

  updateCalendarEvent: async (id, data) => {
    const { calendarEvents } = get();
    const now = new Date().toISOString();
    let updated: CalendarEvent | null = null;
    const nextEvents = calendarEvents.map((e) => {
      if (e.id === id) {
        updated = { ...e, ...data, updated_at: now };
        return updated;
      }
      return e;
    });
    if (!updated) return;
    set({ calendarEvents: nextEvents });
    await runWithSync(set, get, 'Agenda Kalender', () =>
      syncTableRecordToSupabase('calendar_events', 'upsert', updated!)
    );
  },

  toggleCalendarEventCompleted: async (id) => {
    const { calendarEvents } = get();
    const event = calendarEvents.find((e) => e.id === id);
    if (!event) return;
    const now = new Date().toISOString();
    const updated: CalendarEvent = {
      ...event,
      is_completed: !event.is_completed,
      updated_at: now,
    };
    set({ calendarEvents: calendarEvents.map((e) => (e.id === id ? updated : e)) });
    await runWithSync(set, get, 'Agenda Kalender', () =>
      syncTableRecordToSupabase('calendar_events', 'upsert', updated)
    );
  },

  deleteCalendarEvent: async (id) => {
    set({ calendarEvents: get().calendarEvents.filter((e) => e.id !== id) });
    await runWithSync(set, get, 'Agenda Kalender', () =>
      syncTableRecordToSupabase('calendar_events', 'delete', { id })
    );
  },

  addCoupleMoment: async (data) => {
    const { family, coupleMoments } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: CoupleMoment = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      created_at: now,
      updated_at: now,
    };
    set({ coupleMoments: [item, ...coupleMoments] });
    await runWithSync(set, get, 'Momen Pasangan', () =>
      syncTableRecordToSupabase('couple_moments', 'upsert', item)
    );
  },

  updateCoupleMoment: async (id, data) => {
    const { coupleMoments } = get();
    const now = new Date().toISOString();
    let updated: CoupleMoment | null = null;
    const nextMoments = coupleMoments.map((m) => {
      if (m.id === id) {
        updated = { ...m, ...data, updated_at: now };
        return updated;
      }
      return m;
    });
    if (!updated) return;
    set({ coupleMoments: nextMoments });
    await runWithSync(set, get, 'Momen Pasangan', () =>
      syncTableRecordToSupabase('couple_moments', 'upsert', updated!)
    );
  },

  deleteCoupleMoment: async (id) => {
    set({ coupleMoments: get().coupleMoments.filter((m) => m.id !== id) });
    await runWithSync(set, get, 'Momen Pasangan', () =>
      syncTableRecordToSupabase('couple_moments', 'delete', { id })
    );
  },

  toggleConversationDiscussed: async (id, answerNotes) => {
    const { conversationCards } = get();
    const card = conversationCards.find((c) => c.id === id);
    if (!card) return;
    const updated: ConversationCard = {
      ...card,
      is_discussed: !card.is_discussed,
      discussed_at: !card.is_discussed ? new Date().toISOString() : undefined,
      answer_notes: answerNotes !== undefined ? answerNotes : card.answer_notes,
    };
    set({ conversationCards: conversationCards.map((c) => (c.id === id ? updated : c)) });
    await runWithSync(set, get, 'Kartu Bicara', () =>
      syncTableRecordToSupabase('conversation_cards', 'upsert', updated)
    );
  },

  saveConversationAnswerNotes: async (id, answerNotes) => {
    const { conversationCards } = get();
    const card = conversationCards.find((c) => c.id === id);
    if (!card) return;
    const updated: ConversationCard = {
      ...card,
      answer_notes: answerNotes,
    };
    set({ conversationCards: conversationCards.map((c) => (c.id === id ? updated : c)) });
    await runWithSync(set, get, 'Catatan Kartu Bicara', () =>
      syncTableRecordToSupabase('conversation_cards', 'upsert', updated)
    );
  },

  toggleConversationFavorite: async (id) => {
    const { conversationCards } = get();
    const card = conversationCards.find((c) => c.id === id);
    if (!card) return;
    const updated: ConversationCard = {
      ...card,
      is_favorite: !card.is_favorite,
    };
    set({ conversationCards: conversationCards.map((c) => (c.id === id ? updated : c)) });
    await runWithSync(set, get, 'Favorit Kartu Bicara', () =>
      syncTableRecordToSupabase('conversation_cards', 'upsert', updated)
    );
  },

  addConversationCard: async (category, question) => {
    const { family, conversationCards } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: ConversationCard = {
      id: generateUuid(),
      family_id: family.id,
      category,
      question: question.trim(),
      is_discussed: false,
      is_favorite: false,
      created_at: now,
    };
    set({ conversationCards: [item, ...conversationCards] });
    await runWithSync(set, get, 'Kartu Bicara', () =>
      syncTableRecordToSupabase('conversation_cards', 'upsert', item)
    );
  },

  addCoupleBucketItem: async (data) => {
    const { family, coupleBucketItems } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: CoupleBucketItem = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      is_achieved: false,
      created_at: now,
      updated_at: now,
    };
    set({ coupleBucketItems: [...coupleBucketItems, item] });
    await runWithSync(set, get, 'Impian Berdua', () =>
      syncTableRecordToSupabase('couple_bucket_items', 'upsert', item)
    );
  },

  updateCoupleBucketItem: async (id, data) => {
    const { coupleBucketItems } = get();
    const now = new Date().toISOString();
    let updated: CoupleBucketItem | null = null;
    const nextItems = coupleBucketItems.map((b) => {
      if (b.id === id) {
        updated = { ...b, ...data, updated_at: now };
        return updated;
      }
      return b;
    });
    if (!updated) return;
    set({ coupleBucketItems: nextItems });
    await runWithSync(set, get, 'Impian Berdua', () =>
      syncTableRecordToSupabase('couple_bucket_items', 'upsert', updated!)
    );
  },

  toggleCoupleBucketAchieved: async (id) => {
    const { coupleBucketItems } = get();
    const item = coupleBucketItems.find((b) => b.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    const today = getTodayIso();
    const nextAchieved = !item.is_achieved;
    const updated: CoupleBucketItem = {
      ...item,
      is_achieved: nextAchieved,
      achieved_date: nextAchieved ? today : undefined,
      updated_at: now,
    };
    set({ coupleBucketItems: coupleBucketItems.map((b) => (b.id === id ? updated : b)) });
    await runWithSync(set, get, 'Impian Berdua', () =>
      syncTableRecordToSupabase('couple_bucket_items', 'upsert', updated)
    );
  },

  deleteCoupleBucketItem: async (id) => {
    set({ coupleBucketItems: get().coupleBucketItems.filter((b) => b.id !== id) });
    await runWithSync(set, get, 'Impian Berdua', () =>
      syncTableRecordToSupabase('couple_bucket_items', 'delete', { id })
    );
  },

  addFamilyDocument: async (data) => {
    const { family, familyDocuments } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: FamilyDocument = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      created_at: now,
      updated_at: now,
    };
    set({ familyDocuments: [item, ...familyDocuments] });
    await runWithSync(set, get, 'Brankas Dokumen', () =>
      syncTableRecordToSupabase('family_documents', 'upsert', item)
    );
  },

  updateFamilyDocument: async (id, data) => {
    const { familyDocuments } = get();
    const now = new Date().toISOString();
    let updated: FamilyDocument | null = null;
    const nextDocs = familyDocuments.map((d) => {
      if (d.id === id) {
        updated = { ...d, ...data, updated_at: now };
        return updated;
      }
      return d;
    });
    if (!updated) return;
    set({ familyDocuments: nextDocs });
    await runWithSync(set, get, 'Brankas Dokumen', () =>
      syncTableRecordToSupabase('family_documents', 'upsert', updated!)
    );
  },

  deleteFamilyDocument: async (id) => {
    set({ familyDocuments: get().familyDocuments.filter((d) => d.id !== id) });
    await runWithSync(set, get, 'Brankas Dokumen', () =>
      syncTableRecordToSupabase('family_documents', 'delete', { id })
    );
  },

  addShoppingItem: async (data) => {
    const { family, shoppingItems } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: ShoppingItem = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      estimated_price: Number(data.estimated_price) || 0,
      created_at: now,
      updated_at: now,
    };
    set({ shoppingItems: [...shoppingItems, item] });
    await runWithSync(set, get, 'Daftar Belanja', () =>
      syncTableRecordToSupabase('shopping_items', 'upsert', item)
    );
  },

  updateShoppingItem: async (id, data) => {
    const { shoppingItems } = get();
    const now = new Date().toISOString();
    let updated: ShoppingItem | null = null;
    const nextItems = shoppingItems.map((s) => {
      if (s.id === id) {
        updated = {
          ...s,
          ...data,
          estimated_price: data.estimated_price !== undefined ? Number(data.estimated_price) : s.estimated_price,
          updated_at: now,
        };
        return updated;
      }
      return s;
    });
    if (!updated) return;
    set({ shoppingItems: nextItems });
    await runWithSync(set, get, 'Daftar Belanja', () =>
      syncTableRecordToSupabase('shopping_items', 'upsert', updated!)
    );
  },

  toggleShoppingItemChecked: async (id) => {
    const { shoppingItems } = get();
    const item = shoppingItems.find((s) => s.id === id);
    if (!item) return;
    const now = new Date().toISOString();
    const updated: ShoppingItem = {
      ...item,
      is_checked: !item.is_checked,
      updated_at: now,
    };
    set({ shoppingItems: shoppingItems.map((s) => (s.id === id ? updated : s)) });
    await runWithSync(set, get, 'Daftar Belanja', () =>
      syncTableRecordToSupabase('shopping_items', 'upsert', updated)
    );
  },

  deleteShoppingItem: async (id) => {
    set({ shoppingItems: get().shoppingItems.filter((s) => s.id !== id) });
    await runWithSync(set, get, 'Daftar Belanja', () =>
      syncTableRecordToSupabase('shopping_items', 'delete', { id })
    );
  },

  clearCheckedShoppingItems: async () => {
    const { shoppingItems } = get();
    const checked = shoppingItems.filter((s) => s.is_checked);
    set({ shoppingItems: shoppingItems.filter((s) => !s.is_checked) });
    await runWithSync(set, get, 'Bersihkan Belanja Selesai', async () => {
      for (const item of checked) {
        await syncTableRecordToSupabase('shopping_items', 'delete', { id: item.id });
      }
    });
  },

  checkoutShoppingToTransaction: async (walletId, customNotes) => {
    const { shoppingItems, wallets, transactions, family, profile, transactionCategories } = get();
    const checked = shoppingItems.filter((s) => s.is_checked);
    if (checked.length === 0 || !family || !profile) return 0;

    const totalAmount = checked.reduce((sum, item) => sum + (Number(item.estimated_price) || 0), 0);
    const now = new Date().toISOString();
    const today = getTodayIso();

    const kitchenCat = transactionCategories.find((c) => /dapur|makan|belanja/i.test(c.name));
    const catId = kitchenCat?.id || '';

    const tx: Transaction = {
      id: generateUuid(),
      family_id: family.id,
      type: 'Pengeluaran',
      amount: totalAmount,
      date: today,
      category_id: catId,
      wallet_id: walletId,
      member_id: profile.id,
      member_name: profile.full_name,
      notes: customNotes || `Belanja dapur (${checked.length} barang: ${checked.map((i) => i.name).join(', ')})`,
      created_at: now,
      updated_at: now,
    };

    let updatedWallet: Wallet | null = null;
    const nextWallets = wallets.map((w) => {
      if (w.id === walletId) {
        updatedWallet = { ...w, balance: w.balance - totalAmount, updated_at: now };
        return updatedWallet;
      }
      return w;
    });

    set({
      shoppingItems: shoppingItems.filter((s) => !s.is_checked),
      transactions: [tx, ...transactions],
      wallets: nextWallets,
    });

    await runWithSync(set, get, 'Checkout Belanja ke Pengeluaran', async () => {
      await syncTableRecordToSupabase('transactions', 'upsert', tx);
      if (updatedWallet) await syncTableRecordToSupabase('wallets', 'upsert', updatedWallet);
      for (const item of checked) {
        await syncTableRecordToSupabase('shopping_items', 'delete', { id: item.id });
      }
    });

    return totalAmount;
  },

  updateMealPlanDay: async (dayName, updates) => {
    const { family, mealPlans } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const existing = mealPlans.find((m) => m.day_name === dayName);
    const item: MealPlanDay = {
      id: existing?.id || generateUuid(),
      family_id: family.id,
      day_name: dayName,
      breakfast: updates.breakfast !== undefined ? updates.breakfast : existing?.breakfast || '',
      lunch: updates.lunch !== undefined ? updates.lunch : existing?.lunch || '',
      dinner: updates.dinner !== undefined ? updates.dinner : existing?.dinner || '',
      notes: updates.notes !== undefined ? updates.notes : existing?.notes || '',
      updated_at: now,
    };
    const nextPlans = existing
      ? mealPlans.map((m) => (m.day_name === dayName ? item : m))
      : [...mealPlans, item];
    set({ mealPlans: nextPlans });
    await runWithSync(set, get, 'Menu Makan', () =>
      syncTableRecordToSupabase('meal_plans', 'upsert', item)
    );
  },

  addJournalEntry: async (data) => {
    const { family, journalEntries } = get();
    if (!family) return;
    const now = new Date().toISOString();
    const item: JournalEntry = {
      ...data,
      id: generateUuid(),
      family_id: family.id,
      created_at: now,
      updated_at: now,
    };
    set({ journalEntries: [item, ...journalEntries] });
    await runWithSync(set, get, 'Jurnal Keluarga', () =>
      syncTableRecordToSupabase('journal_entries', 'upsert', item)
    );
  },

  updateJournalEntry: async (id, data) => {
    const { journalEntries } = get();
    const now = new Date().toISOString();
    let updated: JournalEntry | null = null;
    const nextEntries = journalEntries.map((j) => {
      if (j.id === id) {
        updated = { ...j, ...data, updated_at: now };
        return updated;
      }
      return j;
    });
    if (!updated) return;
    set({ journalEntries: nextEntries });
    await runWithSync(set, get, 'Jurnal Keluarga', () =>
      syncTableRecordToSupabase('journal_entries', 'upsert', updated!)
    );
  },

  deleteJournalEntry: async (id) => {
    set({ journalEntries: get().journalEntries.filter((j) => j.id !== id) });
    await runWithSync(set, get, 'Jurnal Keluarga', () =>
      syncTableRecordToSupabase('journal_entries', 'delete', { id })
    );
  },

  markNotificationRead: async (id) => {
    const { notifications } = get();
    const notif = notifications.find((n) => n.id === id);
    if (!notif) return;
    const updated = { ...notif, is_read: true };
    set({ notifications: notifications.map((n) => (n.id === id ? updated : n)) });
    await syncTableRecordToSupabase('notifications', 'upsert', updated);
  },

  markAllNotificationsRead: async () => {
    const { notifications } = get();
    const nextNotifs = notifications.map((n) => ({ ...n, is_read: true }));
    set({ notifications: nextNotifs });
    for (const notif of nextNotifs) {
      await syncTableRecordToSupabase('notifications', 'upsert', notif);
    }
  },

  deleteNotification: async (id) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
    await syncTableRecordToSupabase('notifications', 'delete', { id });
  },

  evaluateNotifications: () => {
    const {
      family,
      tasks,
      calendarEvents,
      maintenanceItems,
      budgets,
      transactions,
      transactionCategories,
      debts,
      notifications,
    } = get();
    if (!family) return;
    const nextNotifs = generateAutomatedFamilyNotifications({
      familyId: family.id,
      tasks,
      calendarEvents,
      maintenanceItems,
      budgets,
      transactions,
      transactionCategories,
      debts,
      existingNotifications: notifications,
    });
    set({ notifications: nextNotifs });
  },

  resetFamilyDataToZero: async () => {
    const { family } = get();
    if (!family) return;

    const now = new Date().toISOString();
    const starterWallet: Wallet = {
      id: generateUuid(),
      family_id: family.id,
      name: 'Dompet Utama',
      type: 'Tunai',
      balance: 0,
      color: '#2A4D3E',
      icon: 'Wallet',
      created_at: now,
      updated_at: now,
    };

    set({
      wallets: [starterWallet],
      transactions: [],
      budgets: [],
      debts: [],
      goals: [],
      assets: [],
      recurringTransactions: [],
      tasks: [],
      maintenanceItems: [],
      calendarEvents: [],
      coupleMoments: [],
      journalEntries: [],
      shoppingItems: [],
      coupleBucketItems: [],
    });

    await runWithSync(set, get, 'Reset Data', async () => {
      const tables = [
        'transactions',
        'wallets',
        'budgets',
        'debts',
        'goals',
        'assets',
        'recurring_transactions',
        'tasks',
        'maintenance_items',
        'calendar_events',
        'couple_moments',
        'journal_entries',
        'shopping_items',
        'couple_bucket_items',
      ];
      const supabase = (await import('../lib/supabase')).getSupabaseClient();
      if (supabase) {
        for (const t of tables) {
          await supabase.from(t).delete().eq('family_id', family.id);
        }
        await supabase.from('wallets').insert(starterWallet);
      }
    });
  },

  getFamilyBundleSnapshot: () => {
    const state = get();
    if (!state.family) return null;
    return {
      family: state.family,
      members: state.members,
      wallets: state.wallets,
      transactionCategories: state.transactionCategories,
      transactions: state.transactions,
      budgets: state.budgets,
      debts: state.debts,
      goals: state.goals,
      assets: state.assets,
      recurringTransactions: state.recurringTransactions,
      taskCategories: state.taskCategories,
      tasks: state.tasks,
      maintenanceItems: state.maintenanceItems,
      calendarEvents: state.calendarEvents,
      coupleMoments: state.coupleMoments,
      conversationCards: state.conversationCards,
      journalEntries: state.journalEntries,
      notifications: state.notifications,
      familyDocuments: state.familyDocuments,
      shoppingItems: state.shoppingItems,
      mealPlans: state.mealPlans,
      coupleBucketItems: state.coupleBucketItems,
    };
  },

  importExcelData: async (payload, mode) => {
    const { family } = get();
    if (!family) return;

    await runWithSync(set, get, 'Import Excel', async () => {
      const bundle = get().getFamilyBundleSnapshot();
      if (bundle) {
        if (mode === 'replace') {
          await syncFullBundleToSupabase({
            ...bundle,
            wallets: payload.wallets || [],
            transactions: payload.transactions || [],
            budgets: payload.budgets || [],
            debts: payload.debts || [],
            goals: payload.goals || [],
            assets: payload.assets || [],
            tasks: payload.tasks || [],
            maintenanceItems: payload.maintenanceItems || [],
            calendarEvents: payload.calendarEvents || [],
            journalEntries: payload.journalEntries || [],
          });
        } else {
          await syncFullBundleToSupabase({
            ...bundle,
            wallets: [...bundle.wallets, ...(payload.wallets || [])],
            transactions: [...bundle.transactions, ...(payload.transactions || [])],
            budgets: [...bundle.budgets, ...(payload.budgets || [])],
            debts: [...bundle.debts, ...(payload.debts || [])],
            goals: [...bundle.goals, ...(payload.goals || [])],
            assets: [...bundle.assets, ...(payload.assets || [])],
            tasks: [...bundle.tasks, ...(payload.tasks || [])],
            maintenanceItems: [...bundle.maintenanceItems, ...(payload.maintenanceItems || [])],
            calendarEvents: [...bundle.calendarEvents, ...(payload.calendarEvents || [])],
            journalEntries: [...bundle.journalEntries, ...(payload.journalEntries || [])],
          });
        }
      }
      await get().refreshData();
    });
  },
}));
