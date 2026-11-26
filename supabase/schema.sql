-- ============================================================================
-- NOTTPAY Digital Wallet — Full Supabase PostgreSQL Schema
-- Paste and run this entire script inside Supabase Dashboard -> SQL Editor
-- ============================================================================

-- 1. Main wallet accounts table (matches Next.js server store columns)
create table if not exists public.nottpay_wallets (
  id text primary key,
  phone text not null unique,
  name text not null default 'NOTTPAY User',
  pin_salt text not null,
  pin_hash text not null,
  pin_enabled boolean not null default true,
  biometric_enabled boolean not null default false,
  balance numeric(12, 2) not null default 5000.00 check (balance >= 0),
  transactions jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Helpful indexes for fast phone lookup & ordering
create index if not exists idx_nottpay_wallets_phone
  on public.nottpay_wallets (phone);

create index if not exists idx_nottpay_wallets_created_at
  on public.nottpay_wallets (created_at desc);

-- 3. Automatic updated_at timestamp trigger
create or replace function public.set_nottpay_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_nottpay_wallets_updated_at on public.nottpay_wallets;
create trigger trg_nottpay_wallets_updated_at
  before update on public.nottpay_wallets
  for each row
  execute function public.set_nottpay_updated_at();

-- 4. Row Level Security (RLS)
-- Keep RLS enabled with no public/anon policies so pin_salt, pin_hash, and
-- user balances cannot be read directly from the browser.
-- Set SUPABASE_SECRET_KEY in your server environment variables so Next.js API
-- routes can read and write this table securely.
alter table public.nottpay_wallets enable row level security;

-- 5. Lock down direct table privileges from public client roles
revoke all on table public.nottpay_wallets from anon, authenticated;
grant all on table public.nottpay_wallets to service_role;
