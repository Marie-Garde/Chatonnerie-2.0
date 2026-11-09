-- Sujets à aborder : chacun note les prochaines choses dont il veut parler,
-- et choisit si l'autre peut les voir.

create table public.discussion_topics (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  shared boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index discussion_topics_author_idx on public.discussion_topics (author_id);
create index discussion_topics_couple_idx on public.discussion_topics (couple_id);

alter table public.discussion_topics enable row level security;

-- Je vois les miens, et ceux de mon ou ma partenaire seulement s'ils sont partagés.
create policy "discussion_topics_select" on public.discussion_topics
  for select to authenticated
  using (
    author_id = auth.uid()
    or (
      shared
      and couple_id in (select cm.couple_id from public.couple_members cm where cm.user_id = auth.uid())
    )
  );

create policy "discussion_topics_insert" on public.discussion_topics
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      couple_id is null
      or couple_id in (select cm.couple_id from public.couple_members cm where cm.user_id = auth.uid())
    )
  );

-- Seul l'auteur ou l'autrice modifie ou supprime ses sujets.
create policy "discussion_topics_update" on public.discussion_topics
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "discussion_topics_delete" on public.discussion_topics
  for delete to authenticated
  using (author_id = auth.uid());
