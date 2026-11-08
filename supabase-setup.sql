-- Run this entire script once in Supabase → SQL Editor.
-- It creates the bus location table, user profiles, access policies and Realtime publication.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('driver','parent','management')),
  name text,
  bus_id text,
  bus_ids text[] not null default '{}',
  constraint valid_driver_bus check (role <> 'driver' or bus_id is null or bus_id = any(array[
    'Bus 01','Bus 02','Bus 03','Bus 04','Bus 05','Bus 06','Bus 07','Bus 08','Bus 09','Bus 10'
  ]))
);

create table if not exists public.bus_locations (
  bus_id text primary key check (bus_id = any(array[
    'Bus 01','Bus 02','Bus 03','Bus 04','Bus 05','Bus 06','Bus 07','Bus 08','Bus 09','Bus 10'
  ])),
  lat double precision not null,
  lng double precision not null,
  speed_mps double precision,
  heading double precision,
  accuracy double precision,
  updated_at timestamptz not null default now(),
  active boolean not null default false,
  driver_uid uuid references auth.users(id)
);

alter table public.profiles enable row level security;
alter table public.bus_locations enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "Authorized users read permitted buses" on public.bus_locations;
create policy "Authorized users read permitted buses" on public.bus_locations
for select to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'management'
        or (p.role = 'driver' and p.bus_id = bus_locations.bus_id)
        or (p.role = 'parent' and bus_locations.bus_id = any(p.bus_ids))
      )
  )
);

drop policy if exists "Assigned driver inserts own bus" on public.bus_locations;
create policy "Assigned driver inserts own bus" on public.bus_locations
for insert to authenticated with check (
  driver_uid = auth.uid()
  and exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'driver' and p.bus_id = bus_locations.bus_id)
);

drop policy if exists "Assigned driver updates own bus" on public.bus_locations;
create policy "Assigned driver updates own bus" on public.bus_locations
for update to authenticated using (
  exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'driver' and p.bus_id = bus_locations.bus_id)
) with check (
  driver_uid = auth.uid()
  and exists (select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'driver' and p.bus_id = bus_locations.bus_id)
);

-- Enable live database-change events for the app.
do $$
begin
  alter publication supabase_realtime add table public.bus_locations;
exception when duplicate_object then
  null;
end $$;
