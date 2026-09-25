create table if not exists public.finance_transactions (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('Income', 'Expense')),
  description text not null,
  category text not null default 'Other',
  amount numeric(14, 2) not null check (amount >= 0),
  transaction_date date not null default current_date,
  payment_method text not null default 'Bank' check (payment_method in ('Cash', 'Bank', 'Mobile Money', 'Card', 'Other')),
  reference text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key default gen_random_uuid()::text,
  user_id uuid not null references auth.users(id) on delete cascade,
  invoice_number text not null,
  customer_id text,
  customer_name text not null,
  description text not null default '',
  amount numeric(14, 2) not null check (amount >= 0),
  issue_date date not null default current_date,
  due_date date not null default current_date,
  status text not null default 'Draft' check (status in ('Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, invoice_number)
);

alter table public.finance_transactions enable row level security;
alter table public.invoices enable row level security;
drop policy if exists "finance transactions are user-owned" on public.finance_transactions;
create policy "finance transactions are user-owned" on public.finance_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "invoices are user-owned" on public.invoices;
create policy "invoices are user-owned" on public.invoices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
