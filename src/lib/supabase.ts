import { createClient, SupabaseClient } from '@supabase/supabase-js';

const RUNTIME_SUPABASE_URL_KEY = 'rumahkita_custom_supabase_url';
const RUNTIME_SUPABASE_ANON_KEY = 'rumahkita_custom_supabase_anon_key';

export function getSupabaseConfig() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  const storedUrl =
    typeof window !== 'undefined' ? (localStorage.getItem(RUNTIME_SUPABASE_URL_KEY) || '').trim() : '';
  const storedKey =
    typeof window !== 'undefined' ? (localStorage.getItem(RUNTIME_SUPABASE_ANON_KEY) || '').trim() : '';

  const url = storedUrl || envUrl;
  const anonKey = storedKey || envKey;

  const isConfigured =
    Boolean(url && anonKey) &&
    !url.includes('your-project-id') &&
    !anonKey.includes('your-supabase-anon-key') &&
    url.startsWith('https://');

  return {
    url,
    anonKey,
    isConfigured,
    isCustomRuntime: Boolean(storedUrl && storedKey),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return supabaseInstance;
}

export function saveRuntimeSupabaseConfig(url: string, anonKey: string) {
  if (typeof window === 'undefined') return;
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl || !cleanKey) {
    localStorage.removeItem(RUNTIME_SUPABASE_URL_KEY);
    localStorage.removeItem(RUNTIME_SUPABASE_ANON_KEY);
  } else {
    localStorage.setItem(RUNTIME_SUPABASE_URL_KEY, cleanUrl);
    localStorage.setItem(RUNTIME_SUPABASE_ANON_KEY, cleanKey);
  }
  supabaseInstance = null;
  void fetch('/api/supabase-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
  }).catch(() => {});
}

export async function ensureSharedSupabaseConfig(): Promise<void> {
  if (typeof window === 'undefined') return;
  const current = getSupabaseConfig();
  try {
    if (current.isConfigured && current.isCustomRuntime) {
      await fetch('/api/supabase-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: current.url, anonKey: current.anonKey }),
      });
      return;
    }
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data?.url && data?.anonKey) {
        localStorage.setItem(RUNTIME_SUPABASE_URL_KEY, data.url);
        localStorage.setItem(RUNTIME_SUPABASE_ANON_KEY, data.anonKey);
        supabaseInstance = null;
      }
    }
  } catch {
    // ignore network errors
  }
}

export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string; latencyMs?: number }> {
  const cfg = getSupabaseConfig();
  const targetUrl = (customUrl !== undefined ? customUrl : cfg.url).trim();
  const targetKey = (customKey !== undefined ? customKey : cfg.anonKey).trim();

  if (!targetUrl || !targetKey) {
    return { success: false, message: 'URL atau Anon Key Supabase belum diisi.' };
  }
  if (!targetUrl.startsWith('https://')) {
    return { success: false, message: 'URL Supabase harus diawali dengan https://' };
  }

  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const testClient = createClient(targetUrl, targetKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await testClient.from('families').select('id').limit(1);
    const latencyMs = Math.round(
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) - start
    );

    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          latencyMs,
          message:
            'Koneksi tersambung, tetapi tabel database belum dibuat. Silakan salin & jalankan Skema SQL di SQL Editor Supabase Anda.',
        };
      }
      return {
        success: false,
        latencyMs,
        message: `Koneksi ditolak oleh Supabase: ${error.message} (${error.code || 'Unauthorized'}). Periksa kembali Anon Key Anda.`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Berhasil terhubung ke Supabase! (Latensi respons: ${latencyMs}ms). Database siap digunakan untuk sinkronisasi antar HP.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Supabase: ${err?.message || 'Periksa koneksi internet atau format URL.'}`,
    };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- RUMAHKITA — COMPLETE SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY (RLS)
-- Jalankan seluruh script ini di SQL Editor pada Dashboard Supabase Anda.
-- ============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. FAMILIES TABLE
create table if not exists public.families (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text not null unique,
  partner_1_name text not null default 'Kepala Keluarga',
  partner_2_name text not null default '',
  partner_1_avatar text,
  partner_2_avatar text,
  couple_motto text default 'Bertumbuh bersama dalam hangatnya keluarga',
  anniversary_date text,
  custom_shortcuts jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. PROFILES TABLE (Terkoneksi dengan auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  avatar_url text,
  family_id uuid references public.families(id) on delete cascade,
  role text not null default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. FAMILY MEMBERS TABLE
create table if not exists public.family_members (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid,
  name text not null,
  email text not null default '',
  role text not null default 'Anggota',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 5. WALLETS (DOMPET & REKENING)
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Tunai', 'Bank', 'Dompet Digital')),
  balance numeric not null default 0,
  color text not null default '#2A4D3E',
  icon text not null default 'Wallet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. TRANSACTION CATEGORIES (KATEGORI PEMASUKAN & PENGELUARAN)
create table if not exists public.transaction_categories (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Pemasukan', 'Pengeluaran')),
  icon text not null default 'Tag',
  color text not null default '#2A4D3E',
  is_default boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. TRANSACTIONS (CATATAN KEUANGAN)
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null check (type in ('Pemasukan', 'Pengeluaran', 'Transfer')),
  amount numeric not null,
  date text not null,
  category_id text,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  to_wallet_id uuid references public.wallets(id) on delete set null,
  member_id text not null,
  member_name text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. BUDGETS (ANGGARAN BULANAN)
create table if not exists public.budgets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  category_id uuid not null references public.transaction_categories(id) on delete cascade,
  amount numeric not null,
  period_month text not null,
  allocation_group text default 'Kebutuhan Pokok',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. DEBTS (CATATAN UTANG & PIUTANG)
create table if not exists public.debts (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  type text not null check (type in ('Utang', 'Piutang')),
  person_name text not null,
  total_amount numeric not null,
  paid_amount numeric not null default 0,
  start_date text not null,
  due_date text not null,
  notes text default '',
  status text not null default 'Belum lunas',
  wallet_id uuid references public.wallets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. GOALS (TARGET & IMPIAN KELUARGA)
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline text not null,
  icon text not null default 'Target',
  color text not null default '#D4A359',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. ASSETS (DAFTAR ASET KELUARGA)
create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null check (category in ('Kendaraan', 'Rumah', 'Emas', 'Investasi', 'Aset lainnya')),
  value numeric not null,
  acquisition_date text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. RECURRING TRANSACTIONS (TRANSAKSI RUTIN & LANGGANAN)
create table if not exists public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  type text not null check (type in ('Pemasukan', 'Pengeluaran')),
  amount numeric not null,
  category_id uuid references public.transaction_categories(id) on delete set null,
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  start_date text not null,
  frequency text not null check (frequency in ('Harian', 'Mingguan', 'Bulanan', 'Tahunan')),
  end_date text,
  next_date text not null,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 13. TASK CATEGORIES
create table if not exists public.task_categories (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  color text not null default '#2A4D3E',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 14. TASKS (TUGAS HARIAN RUMAH)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  description text default '',
  category_id uuid not null references public.task_categories(id) on delete cascade,
  due_date text not null,
  recurrence text default 'Tidak berulang',
  assignee_id text not null,
  assignee_name text not null,
  status text not null default 'Belum selesai',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. MAINTENANCE ITEMS (PERAWATAN RUMAH & KENDARAAN)
create table if not exists public.maintenance_items (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  sub_type text,
  icon text,
  color text,
  scheduled_date text not null,
  reminder_date text,
  assignee_name text not null,
  status text not null default 'Belum dikerjakan',
  estimated_cost numeric default 0,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 16. CALENDAR EVENTS (AGENDA & DATE NIGHT)
create table if not exists public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  date text not null,
  time text,
  location text,
  notes text default '',
  is_completed boolean default false,
  is_date_night boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 17. COUPLE MOMENTS (KENANGAN BERDUA)
create table if not exists public.couple_moments (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  date text not null,
  story text not null,
  photo_url text,
  mood_tag text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 18. CONVERSATION CARDS (KARTU BICARA BERDUA)
create table if not exists public.conversation_cards (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  category text not null,
  question text not null,
  is_discussed boolean default false,
  is_favorite boolean default false,
  answer_notes text,
  discussed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 19. JOURNAL ENTRIES (JURNAL KELUARGA)
create table if not exists public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  content text not null,
  date text not null,
  photo_url text,
  author_id text not null,
  author_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 20. NOTIFICATIONS (NOTIFIKASI PENGINGAT)
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  message text not null,
  source text not null,
  is_read boolean default false,
  link_path text,
  created_at timestamptz not null default now()
);

-- 21. FAMILY DOCUMENTS (BRANKAS DOKUMEN KELUARGA)
create table if not exists public.family_documents (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  document_number text default '',
  owner_name text not null default 'Keluarga',
  expiry_date text,
  file_data_url text,
  file_name text,
  file_mime_type text,
  gdrive_url text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 22. SHOPPING ITEMS (DAFTAR BELANJA)
create table if not exists public.shopping_items (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null,
  quantity text default '1',
  estimated_price numeric default 0,
  assignee_name text default 'Keluarga',
  is_checked boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 23. MEAL PLANS (MENU MAKAN 7 HARI)
create table if not exists public.meal_plans (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  day_name text not null,
  breakfast text default '',
  lunch text default '',
  dinner text default '',
  notes text default '',
  updated_at timestamptz not null default now()
);

-- 24. COUPLE BUCKET ITEMS (DAFTAR IMPIAN BERDUA)
create table if not exists public.couple_bucket_items (
  id uuid primary key default uuid_generate_v4(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  target_date text,
  estimated_budget numeric default 0,
  is_achieved boolean default false,
  achieved_date text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- INDEKS
create index if not exists idx_profiles_family_id on public.profiles(family_id);
create index if not exists idx_family_members_family_id on public.family_members(family_id);
create index if not exists idx_wallets_family_id on public.wallets(family_id);
create index if not exists idx_transactions_family_id on public.transactions(family_id);
create index if not exists idx_transactions_date on public.transactions(date desc);
create index if not exists idx_budgets_family_id on public.budgets(family_id);
create index if not exists idx_budgets_period on public.budgets(period_month);
create index if not exists idx_debts_family_id on public.debts(family_id);
create index if not exists idx_goals_family_id on public.goals(family_id);
create index if not exists idx_assets_family_id on public.assets(family_id);
create index if not exists idx_recurring_transactions_family_id on public.recurring_transactions(family_id);
create index if not exists idx_tasks_family_id on public.tasks(family_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);
create index if not exists idx_maintenance_items_family_id on public.maintenance_items(family_id);
create index if not exists idx_calendar_events_family_id on public.calendar_events(family_id);
create index if not exists idx_calendar_events_date on public.calendar_events(date);
create index if not exists idx_couple_moments_family_id on public.couple_moments(family_id);
create index if not exists idx_conversation_cards_family_id on public.conversation_cards(family_id);
create index if not exists idx_journal_entries_family_id on public.journal_entries(family_id);
create index if not exists idx_notifications_family_id on public.notifications(family_id);
create index if not exists idx_family_documents_family_id on public.family_documents(family_id);
create index if not exists idx_shopping_items_family_id on public.shopping_items(family_id);
create index if not exists idx_meal_plans_family_id on public.meal_plans(family_id);
create index if not exists idx_couple_bucket_items_family_id on public.couple_bucket_items(family_id);

-- RLS
alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;
alter table public.wallets enable row level security;
alter table public.transaction_categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.debts enable row level security;
alter table public.goals enable row level security;
alter table public.assets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.task_categories enable row level security;
alter table public.tasks enable row level security;
alter table public.maintenance_items enable row level security;
alter table public.calendar_events enable row level security;
alter table public.couple_moments enable row level security;
alter table public.conversation_cards enable row level security;
alter table public.journal_entries enable row level security;
alter table public.notifications enable row level security;
alter table public.family_documents enable row level security;
alter table public.shopping_items enable row level security;
alter table public.meal_plans enable row level security;
alter table public.couple_bucket_items enable row level security;

-- Policies
create policy "Authenticated users access families" on public.families for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access profiles" on public.profiles for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access family_members" on public.family_members for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access wallets" on public.wallets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access transaction_categories" on public.transaction_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access transactions" on public.transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access budgets" on public.budgets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access debts" on public.debts for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access goals" on public.goals for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access assets" on public.assets for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access recurring_transactions" on public.recurring_transactions for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access task_categories" on public.task_categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access tasks" on public.tasks for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access maintenance_items" on public.maintenance_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access calendar_events" on public.calendar_events for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access couple_moments" on public.couple_moments for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access conversation_cards" on public.conversation_cards for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access journal_entries" on public.journal_entries for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access notifications" on public.notifications for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access family_documents" on public.family_documents for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access shopping_items" on public.shopping_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access meal_plans" on public.meal_plans for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "Authenticated users access couple_bucket_items" on public.couple_bucket_items for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
`;
