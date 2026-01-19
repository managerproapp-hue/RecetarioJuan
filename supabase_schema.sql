-- Create Store Table for JSON storage
create table if not exists public.store (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  is_approved boolean default false,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.store enable row level security;
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Perfiles públicos son visibles por todos."
  on profiles for select
  using ( true );

create policy "Usuarios pueden insertar su propio perfil."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Usuarios pueden actualizar su propio perfil."
  on profiles for update
  using ( auth.uid() = id );

-- Store Policies
create policy "Store es legible por todos"
  on store for select
  using ( true );

create policy "Store es escribible por usuarios autenticados"
  on store for insert
  with check ( auth.role() = 'authenticated' );

create policy "Store es actualizable por usuarios autenticados"
  on store for update
  using ( auth.role() = 'authenticated' );
