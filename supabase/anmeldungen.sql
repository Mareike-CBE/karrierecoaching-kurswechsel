-- Kurswechsel: Anmeldungen zu Gruppenterminen.
-- Von außen (öffentlicher Schlüssel = Rolle anon) darf man nur Anmeldungen HINZUFÜGEN,
-- und nur für Termine ab heute. Lesen, Ändern, Löschen geht nur im Supabase-Dashboard.

create table public.anmeldungen (
  id bigint generated always as identity primary key,
  erstellt_am timestamptz not null default now(),
  termin_datum date not null,
  termin_titel text not null check (char_length(termin_titel) between 1 and 200),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  email text not null check (
    char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  ),
  nachricht text check (nachricht is null or char_length(nachricht) <= 1000)
);

comment on table public.anmeldungen is
  'Anmeldungen zu Gruppenterminen aus der Kurswechsel-App. Von außen nur INSERT.';

alter table public.anmeldungen enable row level security;

-- Supabase gibt neuen Tabellen standardmäßig viele Rechte. Erst alles weg, dann gezielt erlauben.
revoke all on table public.anmeldungen from anon, authenticated;
grant insert (termin_datum, termin_titel, name, email, nachricht)
  on table public.anmeldungen to anon;

create policy "Besucher melden sich fuer kommende Termine an"
  on public.anmeldungen for insert to anon
  with check (termin_datum >= current_date);

-- Übersicht für das Dashboard: gleiche E-Mail zählt pro Termin nur einmal.
create view public.anmeldungen_pro_termin
  with (security_invoker = true) as
  select termin_datum, termin_titel, count(distinct lower(email)) as anmeldungen
  from public.anmeldungen
  group by termin_datum, termin_titel
  order by termin_datum, termin_titel;

revoke all on table public.anmeldungen_pro_termin from anon, authenticated;
