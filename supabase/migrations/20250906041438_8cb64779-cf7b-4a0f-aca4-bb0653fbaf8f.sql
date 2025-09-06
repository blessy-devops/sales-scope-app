
-- Create attendants table
create table if not exists public.attendants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  utm_identifier text not null unique,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.attendants enable row level security;
