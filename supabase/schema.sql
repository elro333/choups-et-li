-- =====================================================================
-- Choups & Li — la base de données
--
-- À coller UNE FOIS dans Supabase › SQL Editor › New query, puis « Run ».
-- Ce texte ne contient aucune donnée perso : il crée les « tiroirs » vides
-- et les règles de sécurité (qui a le droit de lire / écrire quoi).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Les profils : quel compte est Choups, quel compte est Li.
--    Deux lignes au maximum (« qui » est unique).
-- ---------------------------------------------------------------------
create table if not exists public.profils (
  user_id uuid primary key references auth.users(id) on delete cascade,
  qui     text not null unique check (qui in ('choups', 'li')),
  surnom  text not null,
  cycle   jsonb not null default '{"actif": false, "duree": 28, "regles": 5}'
);

-- ---------------------------------------------------------------------
-- 2. Tout le reste, dans une seule table : envies, mots, dates, coin,
--    humeurs, cycle, marvel, films. « tab » dit de quoi il s'agit,
--    « proprio » à qui c'est (pour le coin, le cycle et l'humeur).
-- ---------------------------------------------------------------------
create table if not exists public.elements (
  id      text primary key,
  tab     text not null check (tab in ('envies', 'mots', 'dates', 'coin', 'humeurs', 'cycle', 'marvel', 'films')),
  proprio text check (proprio in ('choups', 'li')),
  data    jsonb not null default '{}',
  cree_le timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Le texte des lettres « à ouvrir le… », rangé à part :
--    la base REFUSE de le donner au destinataire avant la date.
-- ---------------------------------------------------------------------
create table if not exists public.lettres (
  id        text primary key,
  de        text not null check (de in ('choups', 'li')),
  ouvrir_le date not null,
  texte     text not null
);

-- ---------------------------------------------------------------------
-- 4. Deux petites fonctions utilisées par les règles
-- ---------------------------------------------------------------------
-- Qui suis-je ? ('choups', 'li', ou rien si ce compte n'est pas relié)
create or replace function public.mon_qui() returns text
language sql stable security definer set search_path = public as $$
  select qui from public.profils where user_id = auth.uid()
$$;

-- Cette personne partage-t-elle son cycle ?
create or replace function public.cycle_partage(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (cycle->>'actif')::boolean from public.profils where qui = p), false)
$$;

-- ---------------------------------------------------------------------
-- 5. Les règles de sécurité (Row Level Security)
--    Personne d'autre que vous deux ne lit ni n'écrit quoi que ce soit.
-- ---------------------------------------------------------------------
alter table public.profils  enable row level security;
alter table public.elements enable row level security;
alter table public.lettres  enable row level security;

-- Profils : on voit les deux ; on ne modifie que le sien (surnom, cycle)
drop policy if exists "profils_lire" on public.profils;
create policy "profils_lire" on public.profils for select to authenticated
  using (public.mon_qui() is not null);
drop policy if exists "profils_modifier" on public.profils;
create policy "profils_modifier" on public.profils for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Éléments : le coin n'est visible que par son propriétaire ;
-- le cycle, par sa propriétaire, ou par l'autre si elle le partage.
drop policy if exists "elements_lire" on public.elements;
create policy "elements_lire" on public.elements for select to authenticated
  using (
    public.mon_qui() is not null
    and (tab <> 'coin'  or proprio = public.mon_qui())
    and (tab <> 'cycle' or proprio = public.mon_qui() or public.cycle_partage(proprio))
  );

-- On ne crée / modifie / supprime le coin, le cycle et l'humeur que pour soi.
drop policy if exists "elements_ajouter" on public.elements;
create policy "elements_ajouter" on public.elements for insert to authenticated
  with check (public.mon_qui() is not null and (tab not in ('coin', 'cycle', 'humeurs') or proprio = public.mon_qui()));
drop policy if exists "elements_modifier" on public.elements;
create policy "elements_modifier" on public.elements for update to authenticated
  using      (public.mon_qui() is not null and (tab not in ('coin', 'cycle', 'humeurs') or proprio = public.mon_qui()))
  with check (public.mon_qui() is not null and (tab not in ('coin', 'cycle', 'humeurs') or proprio = public.mon_qui()));
drop policy if exists "elements_supprimer" on public.elements;
create policy "elements_supprimer" on public.elements for delete to authenticated
  using (public.mon_qui() is not null and (tab not in ('coin', 'cycle', 'humeurs') or proprio = public.mon_qui()));

-- Lettres : l'auteur les voit toujours ; le destinataire seulement à partir de la date (heure de Paris).
drop policy if exists "lettres_lire" on public.lettres;
create policy "lettres_lire" on public.lettres for select to authenticated
  using (public.mon_qui() is not null and (de = public.mon_qui() or ouvrir_le <= (now() at time zone 'Europe/Paris')::date));
drop policy if exists "lettres_ajouter" on public.lettres;
create policy "lettres_ajouter" on public.lettres for insert to authenticated
  with check (de = public.mon_qui());
drop policy if exists "lettres_supprimer" on public.lettres;
create policy "lettres_supprimer" on public.lettres for delete to authenticated
  using (de = public.mon_qui());

-- ---------------------------------------------------------------------
-- 6. Les droits d'accès : rien pour les visiteurs non connectés.
--    Dans les profils, on ne peut changer que son surnom et son cycle
--    (pas devenir l'autre).
-- ---------------------------------------------------------------------
revoke all on public.profils, public.elements, public.lettres from anon;
grant select, insert, update, delete on public.elements, public.lettres to authenticated;
revoke all on public.profils from authenticated;
grant select on public.profils to authenticated;
grant update (surnom, cycle) on public.profils to authenticated;

-- ---------------------------------------------------------------------
-- 7. Le temps réel : ce que l'un écrit apparaît chez l'autre tout de suite
-- ---------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.elements, public.profils;
exception when duplicate_object then null;
end $$;
