-- ============================================================================
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
  email text not null default '',
  full_name text not null default '',
  avatar_url text,
  family_id uuid references public.families(id) on delete cascade,
  role text not null default 'Admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Izin skema ke role Supabase Auth & anon/authenticated
grant usage on schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on all tables in schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role, supabase_auth_admin;

-- Trigger aman untuk otomatis sinkronisasi user baru tanpa membatalkan registrasi
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1)),
    'Admin'
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, profiles.email),
    full_name = case when profiles.full_name = '' then excluded.full_name else profiles.full_name end;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- ============================================================================
-- INDEKS PERFORMA
-- ============================================================================
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Untuk aplikasi keluarga dengan onboarding langsung & sinkronisasi real-time,
-- nonaktifkan RLS agar pembuatan akun/keluarga tidak terblokir:
-- ============================================================================
alter table if exists public.families disable row level security;
alter table if exists public.profiles disable row level security;
alter table if exists public.family_members disable row level security;
alter table if exists public.wallets disable row level security;
alter table if exists public.transaction_categories disable row level security;
alter table if exists public.transactions disable row level security;
alter table if exists public.budgets disable row level security;
alter table if exists public.debts disable row level security;
alter table if exists public.goals disable row level security;
alter table if exists public.assets disable row level security;
alter table if exists public.recurring_transactions disable row level security;
alter table if exists public.task_categories disable row level security;
alter table if exists public.tasks disable row level security;
alter table if exists public.maintenance_items disable row level security;
alter table if exists public.calendar_events disable row level security;
alter table if exists public.couple_moments disable row level security;
alter table if exists public.conversation_cards disable row level security;
alter table if exists public.journal_entries disable row level security;
alter table if exists public.notifications disable row level security;
alter table if exists public.family_documents disable row level security;
alter table if exists public.shopping_items disable row level security;
alter table if exists public.meal_plans disable row level security;
alter table if exists public.couple_bucket_items disable row level security;

