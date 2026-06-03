-- Agents table
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text,
  license_number text,
  license_expiry date not null,
  phone text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table agents enable row level security;
create policy "own_agents" on agents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Documents table
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  sender_name text not null,
  received_date date not null,
  department text not null,
  sent_to_hq_date date,
  cost numeric,
  note text,
  image_url text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table documents enable row level security;
create policy "own_documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Expenses table
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text not null,
  description text not null,
  employee_name text,
  amount numeric not null,
  note text,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table expenses enable row level security;
create policy "own_expenses" on expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
