-- =====================================================================
-- Choups & Li — les notifications
-- À coller UNE FOIS dans Supabase › SQL Editor › New query, puis « Run ».
--
-- Chaque téléphone qui accepte les notifications laisse ici son
-- « abonnement » (une adresse où on peut lui envoyer une notif).
-- =====================================================================

create table if not exists public.abonnements_push (
  endpoint   text primary key,
  user_id    uuid not null references auth.users(id) on delete cascade default auth.uid(),
  qui        text not null check (qui in ('choups', 'li')),
  abonnement jsonb not null,
  cree_le    timestamptz not null default now()
);

alter table public.abonnements_push enable row level security;

-- Chacun ne gère que les abonnements de SES téléphones
drop policy if exists "abonnements_miens" on public.abonnements_push;
create policy "abonnements_miens" on public.abonnements_push for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and qui = public.mon_qui());

revoke all on public.abonnements_push from anon;
grant select, insert, update, delete on public.abonnements_push to authenticated;
