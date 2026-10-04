import { ensureSharedSupabaseConfig, getSupabaseClient } from '../lib/supabase';
import {
  Asset,
  Budget,
  CalendarEvent,
  ConversationCard,
  CoupleBucketItem,
  CoupleMoment,
  Debt,
  Family,
  FamilyDocument,
  FamilyMember,
  Goal,
  JournalEntry,
  MaintenanceItem,
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
  createDefaultMealPlans,
  createDefaultTaskCategories,
  createDefaultTransactionCategories,
  ensureFullConversationCardBank,
} from '../utils/defaults';
import { generateUuid } from '../utils/format';

export interface FamilyDatabaseBundle {
  family: Family;
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
  familyDocuments?: FamilyDocument[];
  shoppingItems?: ShoppingItem[];
  mealPlans?: MealPlanDay[];
  coupleBucketItems?: CoupleBucketItem[];
}

export function normalizeInviteCode(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim().toUpperCase();
  const rkMatch = trimmed.match(/RK[-\s]?([A-Z0-9]{3,10})/);
  if (rkMatch) {
    return `RK-${rkMatch[1]}`;
  }
  const clean = trimmed.replace(/[^A-Z0-9-]/g, '');
  if (/^[A-Z0-9]{4,6}$/.test(clean) && !clean.startsWith('RK')) {
    return `RK-${clean}`;
  }
  return clean;
}

export function isValidUuid(id: unknown): boolean {
  if (!id || typeof id !== 'string') return false;
  const clean = id.trim().toLowerCase();
  if (clean === 'null' || clean === 'undefined' || clean === '') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean);
}

export async function fetchFamilyBundleFromSupabase(
  familyId?: string | null,
  inviteCode?: string | null
): Promise<FamilyDatabaseBundle | null> {
  await ensureSharedSupabaseConfig();
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase belum terkonfigurasi. Harap periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }

  // 1. Fetch family record by ID if valid UUID
  let familyData: any = null;
  if (familyId && isValidUuid(familyId)) {
    const { data: directFam, error: famErr } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .maybeSingle();

    if (!famErr && directFam) {
      familyData = directFam;
    }
  }

  // 2. Fallback to invite_code if not resolved
  if (!familyData && inviteCode) {
    const code = normalizeInviteCode(inviteCode);
    if (code) {
      const { data: codeFam } = await supabase
        .from('families')
        .select('*')
        .ilike('invite_code', code)
        .maybeSingle();
      if (codeFam) {
        familyData = codeFam;
      }
    }
  }

  // 3. Fallback: check if current session user has family_members row
  if (!familyData) {
    const user = await authService.getCurrentSessionUser();
    if (user?.email) {
      const { data: memRow } = await supabase
        .from('family_members')
        .select('family_id')
        .ilike('email', user.email.trim())
        .maybeSingle();
      if (memRow?.family_id && isValidUuid(memRow.family_id)) {
        const { data: memFam } = await supabase
          .from('families')
          .select('*')
          .eq('id', memRow.family_id)
          .maybeSingle();
        if (memFam) {
          familyData = memFam;
        }
      }
    }
  }

  if (!familyData) {
    return null;
  }

  const resolvedFamId = familyData.id;

  // 2. Fetch all related tables directly from Supabase in parallel
  const [
    membersRes,
    walletsRes,
    txCatRes,
    txRes,
    budgetsRes,
    debtsRes,
    goalsRes,
    assetsRes,
    recRes,
    taskCatRes,
    tasksRes,
    maintRes,
    eventsRes,
    momentsRes,
    cardsRes,
    journalRes,
    notifRes,
    docsRes,
    shopRes,
    mealsRes,
    bucketRes,
  ] = await Promise.all([
    supabase.from('family_members').select('*').eq('family_id', resolvedFamId),
    supabase.from('wallets').select('*').eq('family_id', resolvedFamId),
    supabase.from('transaction_categories').select('*').eq('family_id', resolvedFamId),
    supabase
      .from('transactions')
      .select('*')
      .eq('family_id', resolvedFamId)
      .order('date', { ascending: false }),
    supabase.from('budgets').select('*').eq('family_id', resolvedFamId),
    supabase.from('debts').select('*').eq('family_id', resolvedFamId),
    supabase.from('goals').select('*').eq('family_id', resolvedFamId),
    supabase.from('assets').select('*').eq('family_id', resolvedFamId),
    supabase.from('recurring_transactions').select('*').eq('family_id', resolvedFamId),
    supabase
      .from('task_categories')
      .select('*')
      .eq('family_id', resolvedFamId)
      .order('sort_order', { ascending: true }),
    supabase.from('tasks').select('*').eq('family_id', resolvedFamId),
    supabase.from('maintenance_items').select('*').eq('family_id', resolvedFamId),
    supabase.from('calendar_events').select('*').eq('family_id', resolvedFamId),
    supabase
      .from('couple_moments')
      .select('*')
      .eq('family_id', resolvedFamId)
      .order('date', { ascending: false }),
    supabase.from('conversation_cards').select('*').eq('family_id', resolvedFamId),
    supabase
      .from('journal_entries')
      .select('*')
      .eq('family_id', resolvedFamId)
      .order('date', { ascending: false }),
    supabase
      .from('notifications')
      .select('*')
      .eq('family_id', resolvedFamId)
      .order('created_at', { ascending: false }),
    supabase.from('family_documents').select('*').eq('family_id', resolvedFamId),
    supabase.from('shopping_items').select('*').eq('family_id', resolvedFamId),
    supabase.from('meal_plans').select('*').eq('family_id', resolvedFamId),
    supabase.from('couple_bucket_items').select('*').eq('family_id', resolvedFamId),
  ]);

  const family: Family = {
    ...familyData,
    anniversary_date: familyData.anniversary_date || '',
  };

  const bundle: FamilyDatabaseBundle = {
    family,
    members: membersRes.data || [],
    wallets: (walletsRes.data || []).map((w: any) => ({ ...w, balance: Number(w.balance) || 0 })),
    transactionCategories: txCatRes.data || [],
    transactions: (txRes.data || []).map((t: any) => ({ ...t, amount: Number(t.amount) || 0 })),
    budgets: (budgetsRes.data || []).map((b: any) => ({ ...b, amount: Number(b.amount) || 0 })),
    debts: (debtsRes.data || []).map((d: any) => ({
      ...d,
      total_amount: Number(d.total_amount) || 0,
      paid_amount: Number(d.paid_amount) || 0,
    })),
    goals: (goalsRes.data || []).map((g: any) => ({
      ...g,
      target_amount: Number(g.target_amount) || 0,
      current_amount: Number(g.current_amount) || 0,
    })),
    assets: (assetsRes.data || []).map((a: any) => ({ ...a, value: Number(a.value) || 0 })),
    recurringTransactions: (recRes.data || []).map((r: any) => ({
      ...r,
      amount: Number(r.amount) || 0,
    })),
    taskCategories: taskCatRes.data || [],
    tasks: tasksRes.data || [],
    maintenanceItems: (maintRes.data || []).map((m: any) => ({
      ...m,
      estimated_cost: Number(m.estimated_cost) || 0,
    })),
    calendarEvents: eventsRes.data || [],
    coupleMoments: momentsRes.data || [],
    conversationCards: (() => {
      const cards = ensureFullConversationCardBank(resolvedFamId, cardsRes.data || []);
      if (!cardsRes.data || cardsRes.data.length < cards.length) {
        Promise.resolve(supabase.from('conversation_cards').upsert(cards)).catch(() => null);
      }
      return cards;
    })(),
    journalEntries: journalRes.data || [],
    notifications: notifRes.data || [],
    familyDocuments: docsRes.data || [],
    shoppingItems: (shopRes.data || []).map((s: any) => ({
      ...s,
      estimated_price: Number(s.estimated_price) || 0,
    })),
    mealPlans: (() => {
      const meals = createDefaultMealPlans(resolvedFamId, mealsRes.data || []);
      if (!mealsRes.data || mealsRes.data.length < meals.length) {
        Promise.resolve(supabase.from('meal_plans').upsert(meals)).catch(() => null);
      }
      return meals;
    })(),
    coupleBucketItems: (bucketRes.data || []).map((b: any) => ({
      ...b,
      estimated_budget: Number(b.estimated_budget) || 0,
    })),
  };

  return bundle;
}

export async function syncTableRecordToSupabase(
  table: string,
  action: 'upsert' | 'delete',
  payload: any
): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase belum terkonfigurasi. Harap periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.');
  }

  try {
    if (action === 'upsert') {
      const cleanPayload =
        table === 'families' && payload && !Array.isArray(payload)
          ? { ...payload, anniversary_date: payload.anniversary_date || null }
          : payload;

      const { error } = await supabase.from(table).upsert(cleanPayload);
      if (error) {
        // Fallback update if upsert has conflict on PK
        if (cleanPayload?.id && !Array.isArray(cleanPayload)) {
          const { error: updateErr } = await supabase
            .from(table)
            .update(cleanPayload)
            .eq('id', cleanPayload.id);
          if (updateErr) {
            console.error(`Supabase update error on ${table}:`, updateErr);
            throw new Error(`Gagal menyimpan ke tabel ${table}: ${updateErr.message}`);
          }
          return;
        }
        console.error(`Supabase upsert error on ${table}:`, error);
        throw new Error(`Gagal menyimpan ke tabel ${table}: ${error.message}`);
      }
    } else if (action === 'delete' && payload?.id) {
      const { error } = await supabase.from(table).delete().eq('id', payload.id);
      if (error) {
        console.error(`Supabase delete error on ${table}:`, error);
        throw new Error(`Gagal menghapus dari tabel ${table}: ${error.message}`);
      }
    }
  } catch (err: any) {
    console.error(`Error syncing ${table} with Supabase:`, err);
    throw err;
  }
}

export async function syncFullBundleToSupabase(bundle: FamilyDatabaseBundle): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !bundle?.family?.id) return;

  const famId = bundle.family.id;
  const cleanFam = {
    ...bundle.family,
    anniversary_date: bundle.family.anniversary_date || null,
  };

  await supabase.from('families').upsert(cleanFam);

  if (bundle.members?.length) {
    await supabase.from('family_members').upsert(bundle.members);
  }
  if (bundle.wallets?.length) {
    await supabase.from('wallets').upsert(bundle.wallets);
  }
  if (bundle.transactionCategories?.length) {
    await supabase.from('transaction_categories').upsert(bundle.transactionCategories);
  }
  if (bundle.transactions?.length) {
    await supabase.from('transactions').upsert(bundle.transactions);
  }
  if (bundle.budgets?.length) {
    await supabase.from('budgets').upsert(bundle.budgets);
  }
  if (bundle.debts?.length) {
    await supabase.from('debts').upsert(bundle.debts);
  }
  if (bundle.goals?.length) {
    await supabase.from('goals').upsert(bundle.goals);
  }
  if (bundle.assets?.length) {
    await supabase.from('assets').upsert(bundle.assets);
  }
  if (bundle.recurringTransactions?.length) {
    await supabase.from('recurring_transactions').upsert(bundle.recurringTransactions);
  }
  if (bundle.taskCategories?.length) {
    await supabase.from('task_categories').upsert(bundle.taskCategories);
  }
  if (bundle.tasks?.length) {
    await supabase.from('tasks').upsert(bundle.tasks);
  }
  if (bundle.maintenanceItems?.length) {
    await supabase.from('maintenance_items').upsert(bundle.maintenanceItems);
  }
  if (bundle.calendarEvents?.length) {
    await supabase.from('calendar_events').upsert(bundle.calendarEvents);
  }
  if (bundle.coupleMoments?.length) {
    await supabase.from('couple_moments').upsert(bundle.coupleMoments);
  }
  if (bundle.conversationCards?.length) {
    await supabase.from('conversation_cards').upsert(bundle.conversationCards);
  }
  if (bundle.journalEntries?.length) {
    await supabase.from('journal_entries').upsert(bundle.journalEntries);
  }
  if (bundle.notifications?.length) {
    await supabase.from('notifications').upsert(bundle.notifications);
  }
  if (bundle.familyDocuments?.length) {
    await supabase.from('family_documents').upsert(bundle.familyDocuments);
  }
  if (bundle.shoppingItems?.length) {
    await supabase.from('shopping_items').upsert(bundle.shoppingItems);
  }
  if (bundle.mealPlans?.length) {
    await supabase.from('meal_plans').upsert(bundle.mealPlans);
  }
  if (bundle.coupleBucketItems?.length) {
    await supabase.from('couple_bucket_items').upsert(bundle.coupleBucketItems);
  }
}

// Compatibility helper (no-op now that localStorage/server JSON db is removed)
export async function restoreLocalUsersAndBundlesToServer(): Promise<void> {
  // Pure Supabase mode: no background local server restore needed
}

export const authService = {
  async getCurrentSessionUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  },

  async getCurrentProfile(): Promise<Profile | null> {
    const user = await this.getCurrentSessionUser();
    if (!user) return null;
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return data as Profile;
  },

  async loginUser(email: string, password: string): Promise<{ profile: Profile; bundle: FamilyDatabaseBundle }> {
    await ensureSharedSupabaseConfig();
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Koneksi Supabase belum terkonfigurasi. Harap isi URL dan Anon Key Supabase.');
    }

    const emailClean = email.trim().toLowerCase();
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password,
    });

    if (authErr || !authData?.user) {
      const msg = authErr?.message === 'Invalid login credentials'
        ? 'Email atau kata sandi yang Anda masukkan salah.'
        : authErr?.message || 'Gagal masuk.';
      throw new Error(msg);
    }

    const userId = authData.user.id;

    // Fetch profile
    let { data: profileData, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!profileData) {
      // If profile doesn't exist, check if user is in family_members
      const { data: memberRows } = await supabase
        .from('family_members')
        .select('*')
        .ilike('email', emailClean)
        .maybeSingle();

      if (memberRows?.family_id) {
        const now = new Date().toISOString();
        const autoProfile: Profile = {
          id: userId,
          email: emailClean,
          full_name: memberRows.name || emailClean.split('@')[0],
          avatar_url: memberRows.avatar_url,
          family_id: memberRows.family_id,
          role: memberRows.role || 'Pasangan',
          created_at: now,
          updated_at: now,
        };
        await supabase.from('profiles').upsert(autoProfile);
        profileData = autoProfile;
      } else {
        throw new Error('Profil keluarga tidak ditemukan untuk akun ini.');
      }
    }

    const profile = profileData as Profile;
    const bundle = await fetchFamilyBundleFromSupabase(profile.family_id);
    if (!bundle) {
      throw new Error('Data ruang keluarga tidak ditemukan di database Supabase.');
    }

    return { profile, bundle };
  },

  async registerUser(params: {
    fullName: string;
    email: string;
    password: string;
    familyMode: 'create' | 'join';
    familyName?: string;
    partnerName?: string;
    joinCode?: string;
  }): Promise<{ profile: Profile; bundle: FamilyDatabaseBundle }> {
    await ensureSharedSupabaseConfig();
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw new Error('Koneksi Supabase belum terkonfigurasi. Harap isi URL dan Anon Key Supabase.');
    }

    const emailClean = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim() || emailClean.split('@')[0] || 'Anggota Keluarga';
    const now = new Date().toISOString();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: emailClean,
      password: params.password,
      options: {
        data: {
          full_name: cleanName,
          name: cleanName,
          email: emailClean,
        },
      },
    });

    if (authError || !authData?.user) {
      throw new Error(authError?.message || 'Gagal mendaftar akun di Supabase Auth.');
    }

    // Pastikan session aktif jika Supabase belum menyetelnya secara otomatis
    if (!authData.session) {
      await supabase.auth.signInWithPassword({
        email: emailClean,
        password: params.password,
      }).catch(() => null);
    }

    const userId = authData.user.id;

    if (params.familyMode === 'create') {
      const familyId = generateUuid();
      const inviteCode = `RK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const newFamily: Family = {
        id: familyId,
        name: params.familyName?.trim() || `Keluarga ${cleanName}`,
        invite_code: inviteCode,
        partner_1_name: cleanName,
        partner_2_name: params.partnerName?.trim() || '',
        couple_motto: 'Bertumbuh bersama dalam hangatnya keluarga',
        anniversary_date: '',
        created_at: now,
        updated_at: now,
      };

      const { error: famErr } = await supabase.from('families').insert(newFamily);
      if (famErr) {
        throw new Error(`Gagal membuat keluarga di Supabase: ${famErr.message}`);
      }

      const newProfile: Profile = {
        id: userId,
        email: emailClean,
        full_name: cleanName,
        family_id: familyId,
        role: 'Admin',
        created_at: now,
        updated_at: now,
      };

      const { error: profErr } = await supabase.from('profiles').upsert(newProfile);
      if (profErr) {
        throw new Error(`Gagal menyimpan profil di Supabase: ${profErr.message}`);
      }

      const member1: FamilyMember = {
        id: generateUuid(),
        family_id: familyId,
        user_id: userId,
        name: cleanName,
        email: emailClean,
        role: 'Admin',
        created_at: now,
      };
      await supabase.from('family_members').insert(member1);

      if (params.partnerName?.trim()) {
        const partnerMember: FamilyMember = {
          id: generateUuid(),
          family_id: familyId,
          user_id: generateUuid(),
          name: params.partnerName.trim(),
          email: '',
          role: 'Pasangan',
          created_at: now,
        };
        await supabase.from('family_members').insert(partnerMember);
      }

      // Populate default categories in Supabase for the brand new family
      const defaultTxCats = createDefaultTransactionCategories(familyId);
      const defaultTaskCats = createDefaultTaskCategories(familyId);
      await Promise.allSettled([
        supabase.from('transaction_categories').insert(defaultTxCats),
        supabase.from('task_categories').insert(defaultTaskCats),
      ]);

      const bundle = await fetchFamilyBundleFromSupabase(familyId);
      if (!bundle) throw new Error('Gagal memuat ruang keluarga yang baru dibuat.');
      return { profile: newProfile, bundle };
    } else {
      // join mode
      const rawJoinCode = (params.joinCode || '').trim();
      if (!rawJoinCode) {
        throw new Error('Masukkan Kode Undangan / Family ID pasangan Anda.');
      }
      const normalizedCode = normalizeInviteCode(rawJoinCode);

      const isUuid = isValidUuid(rawJoinCode);
      let query = supabase.from('families').select('*');
      if (isUuid) {
        query = query.or(`invite_code.ilike.${normalizedCode},id.eq.${rawJoinCode}`);
      } else {
        query = query.or(`invite_code.ilike.${normalizedCode},invite_code.ilike.${rawJoinCode}`);
      }
      const { data: famRows, error: searchErr } = await query;

      if (searchErr || !famRows || famRows.length === 0) {
        throw new Error('Kode undangan keluarga tidak ditemukan di database Supabase.');
      }

      const targetFamily = famRows[0];
      const newProfile: Profile = {
        id: userId,
        email: emailClean,
        full_name: cleanName,
        family_id: targetFamily.id,
        role: 'Pasangan',
        created_at: now,
        updated_at: now,
      };

      const { error: profErr } = await supabase.from('profiles').upsert(newProfile);
      if (profErr) {
        throw new Error(`Gagal menyimpan profil di Supabase: ${profErr.message}`);
      }

      const partnerMember: FamilyMember = {
        id: generateUuid(),
        family_id: targetFamily.id,
        user_id: userId,
        name: cleanName,
        email: emailClean,
        role: 'Pasangan',
        created_at: now,
      };
      await supabase.from('family_members').insert(partnerMember);

      if (!targetFamily.partner_2_name) {
        await supabase
          .from('families')
          .update({ partner_2_name: cleanName, updated_at: now })
          .eq('id', targetFamily.id);
      }

      const bundle = await fetchFamilyBundleFromSupabase(targetFamily.id);
      if (!bundle) throw new Error('Gagal memuat ruang keluarga yang digabung.');
      return { profile: newProfile, bundle };
    }
  },

  async joinFamilyByInviteCodeForCurrentUser(
    currentProfile: Profile,
    rawJoinCode: string
  ): Promise<{ profile: Profile; bundle: FamilyDatabaseBundle }> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');

    const cleanCode = normalizeInviteCode(rawJoinCode);
    if (!cleanCode) {
      throw new Error('Masukkan Kode Undangan Keluarga yang valid (contoh: RK-8F2A).');
    }

    const { data: famRows, error: searchErr } = await supabase
      .from('families')
      .select('*')
      .or(`invite_code.ilike.${cleanCode},invite_code.ilike.${rawJoinCode},id.eq.${rawJoinCode}`);

    if (searchErr || !famRows || famRows.length === 0) {
      throw new Error('Kode undangan keluarga tidak ditemukan di database Supabase.');
    }

    const targetFamily = famRows[0];
    const now = new Date().toISOString();

    await supabase
      .from('profiles')
      .update({ family_id: targetFamily.id, updated_at: now })
      .eq('id', currentProfile.id);

    const updatedProfile: Profile = {
      ...currentProfile,
      family_id: targetFamily.id,
      updated_at: now,
    };

    const partnerMember: FamilyMember = {
      id: generateUuid(),
      family_id: targetFamily.id,
      user_id: currentProfile.id,
      name: currentProfile.full_name,
      email: currentProfile.email,
      role: 'Pasangan',
      created_at: now,
    };
    await supabase.from('family_members').insert(partnerMember);

    if (!targetFamily.partner_2_name) {
      await supabase
        .from('families')
        .update({ partner_2_name: currentProfile.full_name, updated_at: now })
        .eq('id', targetFamily.id);
    }

    const bundle = await fetchFamilyBundleFromSupabase(targetFamily.id);
    if (!bundle) throw new Error('Gagal memuat ruang keluarga.');
    return { profile: updatedProfile, bundle };
  },

  async logoutUser(): Promise<void> {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  async resetPassword(email: string, _newPassword?: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client belum dikonfigurasi.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw new Error(error.message);
  },
};
