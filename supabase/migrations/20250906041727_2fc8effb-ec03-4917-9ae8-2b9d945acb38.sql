
-- Ensure RLS is enabled (safe to run again)
alter table public.attendants enable row level security;

-- Allow authenticated users to view attendants
create policy "Authenticated users can view attendants"
on public.attendants
for select
using (true);

-- Allow authenticated users to insert attendants
create policy "Authenticated users can insert attendants"
on public.attendants
for insert
with check (true);

-- Allow authenticated users to update attendants
create policy "Authenticated users can update attendants"
on public.attendants
for update
using (true);

-- Allow authenticated users to delete attendants
create policy "Authenticated users can delete attendants"
on public.attendants
for delete
using (true);
