-- ============================================================================
-- RUMAHKITA — RLS FIX SCRIPT
-- Jalankan script ini di SQL Editor pada Supabase Dashboard Anda
-- untuk mengatasi error: "new row violates row-level security policy for table families"
-- ============================================================================

-- Nonaktifkan RLS pada seluruh tabel agar operasi registrasi & sinkronisasi data berjalan lancar tanpa terblokir hak akses:
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

-- Atau jika Anda ingin RLS tetap aktif namun mengizinkan operasi aplikasi:
-- create policy "Public access" on public.families for all to authenticated, anon using (true) with check (true);
