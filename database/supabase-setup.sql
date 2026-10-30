-- شغّله مرة واحدة في Supabase > SQL Editor

-- ===== البيانات (عمال، مصانع، ... + صور المستندات) =====
create table if not exists public.records (
  seq        bigint generated always as identity,
  tbl        text        not null,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  primary key (tbl, id)
);
create index if not exists records_seq_idx on public.records (seq);
create index if not exists records_upd_idx on public.records (updated_at desc);

create or replace function public.records_touch() returns trigger
language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
drop trigger if exists records_touch on public.records;
create trigger records_touch before insert or update on public.records
  for each row execute function public.records_touch();

-- ===== الشات =====
create table if not exists public.chat (
  id   bigint generated always as identity primary key,
  name text        not null,
  text text        not null,
  at   timestamptz not null default now()
);

-- ===== الصلاحيات: مفتوح للجميع (anon) — أي حد معاه الرابط يقدر يعمل أي حاجة =====
alter table public.records enable row level security;
alter table public.chat    enable row level security;
drop policy if exists "open access" on public.records;
drop policy if exists "open access" on public.chat;
create policy "open access" on public.records for all to anon, authenticated using (true) with check (true);
create policy "open access" on public.chat    for all to anon, authenticated using (true) with check (true);

-- لو عايز تقفلها بتسجيل دخول لاحقاً: غيّر "to anon, authenticated" لـ "to authenticated"
-- وخلّي login:true في config/config.js
