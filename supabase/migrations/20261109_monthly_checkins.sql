-- Point mensuel : chaque mois, chacun donne sa météo et répond aux mêmes questions.

create table public.monthly_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1),
  weather text check (weather in ('soleil', 'eclaircies', 'nuageux', 'pluie', 'orage')),
  weather_note text not null default '',
  felt_loved text not null default '',
  connection_need text not null default '',
  unspoken text not null default '',
  next_goal text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (author_id, month)
);

create index monthly_checkins_couple_idx on public.monthly_checkins (couple_id, month);

alter table public.monthly_checkins enable row level security;

-- Je vois mes points et ceux de mon ou ma partenaire.
create policy "monthly_checkins_select" on public.monthly_checkins
  for select to authenticated
  using (
    author_id = auth.uid()
    or couple_id in (select cm.couple_id from public.couple_members cm where cm.user_id = auth.uid())
  );

create policy "monthly_checkins_insert" on public.monthly_checkins
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      couple_id is null
      or couple_id in (select cm.couple_id from public.couple_members cm where cm.user_id = auth.uid())
    )
  );

create policy "monthly_checkins_update" on public.monthly_checkins
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "monthly_checkins_delete" on public.monthly_checkins
  for delete to authenticated
  using (author_id = auth.uid());
