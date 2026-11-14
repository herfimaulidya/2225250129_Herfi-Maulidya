-- ROYAL ADVENTURE — setup lengkap (skema + RLS + data awal) untuk satu kali tempel di Supabase SQL Editor.
-- Isi file ini = 0001_schema.sql + 0002_rls.sql + seed.sql. Aman dijalankan ulang.

-- =====================================================================
-- ROYAL ADVENTURE — Skema database (Supabase / PostgreSQL)
-- Jalankan file ini terlebih dahulu, lalu 0002_rls.sql, lalu seed.sql.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. profiles — identitas siswa, terhubung 1:1 dengan auth.users
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  student_code  text not null unique
                check (student_code ~ '^[A-Z0-9-]{4,20}$'),
  full_name     text not null check (char_length(full_name) between 1 and 80),
  class_name    text check (char_length(class_name) <= 30),
  role          text not null default 'student' check (role in ('student')),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. lessons — empat wilayah kerajaan (konten materi ada di frontend)
-- ---------------------------------------------------------------------
create table if not exists public.lessons (
  id           text primary key,              -- slug, mis. 'princess-castle'
  level_no     int  not null unique check (level_no between 1 and 20),
  region_name  text not null,
  title        text not null,
  topic        text not null,
  xp_reward    int  not null default 50 check (xp_reward >= 0),
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. lesson_progress
-- ---------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  lesson_id     text not null references public.lessons (id) on delete cascade,
  status        text not null default 'in_progress'
                check (status in ('in_progress', 'completed')),
  best_score    numeric(5,1) not null default 0 check (best_score between 0 and 100),
  stars         int not null default 0 check (stars between 0 and 3),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ---------------------------------------------------------------------
-- 4. quizzes — latihan singkat materi, Royal Training Zone, Final Quest
-- ---------------------------------------------------------------------
create table if not exists public.quizzes (
  id                  text primary key,       -- 'lesson-princess-castle', 'training-level-1', 'final'
  kind                text not null check (kind in ('lesson', 'training', 'final')),
  title               text not null,
  lesson_id           text references public.lessons (id) on delete set null,
  level_no            int,
  question_count      int  not null default 8 check (question_count between 1 and 50),
  time_limit_seconds  int  check (time_limit_seconds is null or time_limit_seconds between 60 and 7200),
  pass_score          int  not null default 70 check (pass_score between 0 and 100),
  created_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. quiz_questions — bank soal (kunci jawaban hanya dibaca backend)
-- ---------------------------------------------------------------------
create table if not exists public.quiz_questions (
  id              text primary key,
  quiz_id         text not null references public.quizzes (id) on delete cascade,
  position        int  not null default 0,
  qtype           text not null check (qtype in ('mc', 'tf', 'number', 'sequence', 'multi_select', 'steps')),
  difficulty      int  not null default 1 check (difficulty between 1 and 3),
  prompt          text not null,
  data            jsonb not null default '{}'::jsonb,   -- opsi, ilustrasi, bagian soal
  answer          jsonb not null,                       -- kunci jawaban
  hint            text,
  explanation     jsonb not null default '[]'::jsonb,   -- langkah pembahasan
  ask_reason      boolean not null default false,
  literacy_focus  text,
  points          int not null default 10 check (points > 0),
  created_at      timestamptz not null default now()
);
create index if not exists quiz_questions_quiz_idx on public.quiz_questions (quiz_id, position);

-- ---------------------------------------------------------------------
-- 6. quiz_attempts
-- ---------------------------------------------------------------------
create table if not exists public.quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  quiz_id        text not null references public.quizzes (id) on delete cascade,
  session_id     uuid not null unique,
  score          numeric(7,1) not null,
  max_score      numeric(7,1) not null,
  percent        numeric(5,1) not null check (percent between 0 and 100),
  correct_count  int not null,
  total_count    int not null,
  details        jsonb not null default '[]'::jsonb,
  started_at     timestamptz not null,
  submitted_at   timestamptz not null default now()
);
create index if not exists quiz_attempts_user_idx on public.quiz_attempts (user_id, submitted_at desc);

-- ---------------------------------------------------------------------
-- 7. games — lima permainan Magical Playground
-- ---------------------------------------------------------------------
create table if not exists public.games (
  id           text primary key,
  title        text not null,
  mechanic     text not null,
  description  text not null,
  rounds       int  not null check (rounds between 1 and 30),
  xp_max       int  not null default 40,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. game_attempts
-- ---------------------------------------------------------------------
create table if not exists public.game_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  game_id       text not null references public.games (id) on delete cascade,
  session_id    uuid not null unique,
  difficulty    text,
  score         numeric(7,1) not null,
  max_score     numeric(7,1) not null,
  percent       numeric(5,1) not null check (percent between 0 and 100),
  correct_count int not null,
  total_count   int not null,
  details       jsonb not null default '[]'::jsonb,
  played_at     timestamptz not null default now()
);
create index if not exists game_attempts_user_idx on public.game_attempts (user_id, played_at desc);

-- ---------------------------------------------------------------------
-- 9. user_stats — ringkasan progres (ditulis backend)
-- ---------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id              uuid primary key references public.profiles (id) on delete cascade,
  total_xp             int not null default 0,
  royal_level          int not null default 1,
  lessons_completed    int not null default 0,
  missions_completed   int not null default 0,
  games_played         int not null default 0,
  trainings_completed  int not null default 0,
  best_training_score  numeric(5,1),
  best_final_score     numeric(5,1),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. achievements & 11. user_achievements
-- ---------------------------------------------------------------------
create table if not exists public.achievements (
  id           text primary key,
  title        text not null,
  description  text not null,
  requirement  text not null,
  icon         text not null default 'award',
  xp_bonus     int  not null default 20,
  sort_order   int  not null default 0
);

create table if not exists public.user_achievements (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  achievement_id  text not null references public.achievements (id) on delete cascade,
  earned_at       timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- ---------------------------------------------------------------------
-- 12. activity_logs — riwayat belajar
-- ---------------------------------------------------------------------
create table if not exists public.activity_logs (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references public.profiles (id) on delete cascade,
  activity_type  text not null check (activity_type in
                   ('login', 'lesson_check', 'lesson_complete', 'training', 'game', 'final', 'badge')),
  ref_id         text,
  title          text not null,
  score          numeric(5,1),
  status         text not null default 'completed',
  created_at     timestamptz not null default now()
);
create index if not exists activity_logs_user_idx on public.activity_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Tabel pendukung (khusus backend)
-- xp_ledger: mencegah XP ganda — setiap sumber XP hanya bisa dicatat sekali.
-- activity_sessions: sesi soal/permainan aktif beserta kunci jawabannya.
-- ---------------------------------------------------------------------
create table if not exists public.xp_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  source_key  text not null,
  amount      int  not null check (amount >= 0),
  created_at  timestamptz not null default now(),
  unique (user_id, source_key)
);

create table if not exists public.activity_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  kind         text not null check (kind in ('lesson', 'training', 'game', 'final')),
  ref_id       text not null,
  options      jsonb not null default '{}'::jsonb,
  items        jsonb not null,
  responses    jsonb not null default '{}'::jsonb,
  status       text not null default 'active' check (status in ('active', 'finished')),
  result       jsonb,
  started_at   timestamptz not null default now(),
  expires_at   timestamptz,
  finished_at  timestamptz
);
create index if not exists activity_sessions_user_idx on public.activity_sessions (user_id, kind, ref_id, status);

-- =====================================================================
-- ROYAL ADVENTURE — Row Level Security
-- Prinsip:
--   * Siswa (role authenticated) hanya bisa MEMBACA baris miliknya sendiri.
--   * Semua penulisan skor/XP/progres dilakukan backend FastAPI dengan
--     service role key (melewati RLS), sehingga skor tidak bisa dimanipulasi
--     dari frontend.
--   * Kunci jawaban (quiz_questions) dan sesi aktif (activity_sessions)
--     tidak memiliki policy sama sekali -> tidak bisa dibaca dari frontend.
-- =====================================================================

alter table public.profiles          enable row level security;
alter table public.lessons           enable row level security;
alter table public.lesson_progress   enable row level security;
alter table public.quizzes           enable row level security;
alter table public.quiz_questions    enable row level security;
alter table public.quiz_attempts     enable row level security;
alter table public.games             enable row level security;
alter table public.game_attempts     enable row level security;
alter table public.user_stats        enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.xp_ledger         enable row level security;
alter table public.activity_sessions enable row level security;

-- Tamu (anon) tidak boleh menyentuh tabel apa pun.
revoke all on all tables in schema public from anon;

-- Pengguna login hanya mendapat hak SELECT; tidak ada INSERT/UPDATE/DELETE.
revoke insert, update, delete, truncate on all tables in schema public from authenticated;
grant select on
  public.profiles, public.lessons, public.lesson_progress, public.quizzes,
  public.quiz_attempts, public.games, public.game_attempts, public.user_stats,
  public.achievements, public.user_achievements, public.activity_logs, public.xp_ledger
to authenticated;
revoke all on public.quiz_questions, public.activity_sessions from authenticated;

-- ---------- Data milik sendiri ----------
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "lesson_progress: read own" on public.lesson_progress;
create policy "lesson_progress: read own" on public.lesson_progress
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "quiz_attempts: read own" on public.quiz_attempts;
create policy "quiz_attempts: read own" on public.quiz_attempts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "game_attempts: read own" on public.game_attempts;
create policy "game_attempts: read own" on public.game_attempts
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "user_stats: read own" on public.user_stats;
create policy "user_stats: read own" on public.user_stats
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "user_achievements: read own" on public.user_achievements;
create policy "user_achievements: read own" on public.user_achievements
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "activity_logs: read own" on public.activity_logs;
create policy "activity_logs: read own" on public.activity_logs
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "xp_ledger: read own" on public.xp_ledger;
create policy "xp_ledger: read own" on public.xp_ledger
  for select to authenticated using (user_id = (select auth.uid()));

-- ---------- Katalog konten (boleh dibaca semua siswa login) ----------
drop policy if exists "lessons: read" on public.lessons;
create policy "lessons: read" on public.lessons for select to authenticated using (true);

drop policy if exists "quizzes: read" on public.quizzes;
create policy "quizzes: read" on public.quizzes for select to authenticated using (true);

drop policy if exists "games: read" on public.games;
create policy "games: read" on public.games for select to authenticated using (true);

drop policy if exists "achievements: read" on public.achievements;
create policy "achievements: read" on public.achievements for select to authenticated using (true);

-- quiz_questions & activity_sessions: RLS aktif TANPA policy = tertutup untuk siswa.

-- ROYAL ADVENTURE seed data (dihasilkan otomatis oleh app/scripts/export_seed_sql.py)

-- Jalankan setelah 0001_schema.sql dan 0002_rls.sql.


insert into public.lessons (id, level_no, region_name, title, topic, xp_reward) values
  ('princess-castle', 1, 'Princess Castle', 'Mengenal Pola Bilangan Persegi', 'Pengertian pola bilangan persegi dan susunan kotak', 50),
  ('enchanted-garden', 2, 'Enchanted Garden', 'Menentukan Suku Berikutnya', 'Selisih antarbilangan persegi dan suku berikutnya', 50),
  ('magic-library', 3, 'Magic Library', 'Rumus Pola Bilangan Persegi', 'Menemukan rumus Uₙ = n²', 50),
  ('royal-challenge-palace', 4, 'Royal Challenge Palace', 'Penerapan Pola Bilangan Persegi', 'Soal kontekstual pola bilangan persegi', 50)
on conflict (id) do update set level_no = excluded.level_no, region_name = excluded.region_name, title = excluded.title, topic = excluded.topic, xp_reward = excluded.xp_reward;

insert into public.quizzes (id, kind, title, lesson_id, level_no, question_count, time_limit_seconds, pass_score) values
  ('lesson-princess-castle', 'lesson', 'Latihan Singkat: Princess Castle', 'princess-castle', 1, 3, null, 0),
  ('lesson-enchanted-garden', 'lesson', 'Latihan Singkat: Enchanted Garden', 'enchanted-garden', 2, 3, null, 0),
  ('lesson-magic-library', 'lesson', 'Latihan Singkat: Magic Library', 'magic-library', 3, 3, null, 0),
  ('lesson-royal-challenge-palace', 'lesson', 'Latihan Singkat: Royal Challenge Palace', 'royal-challenge-palace', 4, 3, null, 0),
  ('training-level-1', 'training', 'Princess Beginner', null, 1, 8, null, 70),
  ('training-level-2', 'training', 'Royal Explorer', null, 2, 8, null, 70),
  ('training-level-3', 'training', 'Royal Expert', null, 3, 8, null, 70),
  ('final', 'final', 'The Royal Final Quest', null, null, 10, 1200, 70)
on conflict (id) do update set kind = excluded.kind, title = excluded.title, lesson_id = excluded.lesson_id, level_no = excluded.level_no, question_count = excluded.question_count, time_limit_seconds = excluded.time_limit_seconds, pass_score = excluded.pass_score;

insert into public.quiz_questions (id, quiz_id, position, qtype, difficulty, prompt, data, answer, hint, explanation, ask_reason, literacy_focus, points) values
  ('lc-1', 'lesson-princess-castle', 1, 'mc', 1, 'Perhatikan susunan kotak. Ada berapa kotak seluruhnya?', '{"illustration": {"kind": "grid", "rows": 3, "cols": 3}, "options": [{"id": "a", "label": "6"}, {"id": "b", "label": "9"}, {"id": "c", "label": "12"}, {"id": "d", "label": "3"}]}'::jsonb, '"b"'::jsonb, 'Hitung banyak baris, lalu banyak kotak di setiap baris.', '["Ada 3 baris.", "Setiap baris berisi 3 kotak.", "Banyak kotak = 3 × 3 = 9."]'::jsonb, false, 'Memahami hubungan susunan persegi dan bilangan', 10),
  ('lc-2', 'lesson-princess-castle', 2, 'mc', 1, 'Manakah susunan kotak yang membentuk persegi?', '{"options": [{"id": "a", "label": "2 × 3", "illustration": {"kind": "grid", "rows": 2, "cols": 3}}, {"id": "b", "label": "4 × 4", "illustration": {"kind": "grid", "rows": 4, "cols": 4}}, {"id": "c", "label": "3 × 5", "illustration": {"kind": "grid", "rows": 3, "cols": 5}}, {"id": "d", "label": "1 × 4", "illustration": {"kind": "grid", "rows": 1, "cols": 4}}]}'::jsonb, '"b"'::jsonb, 'Susunan persegi memiliki banyak baris yang SAMA dengan banyak kolom.', '["Persegi: banyak baris = banyak kolom.", "Hanya 4 × 4 yang barisnya (4) sama dengan kolomnya (4).", "Yang lain berbentuk persegi panjang."]'::jsonb, false, null, 10),
  ('lc-3', 'lesson-princess-castle', 3, 'tf', 1, 'Bilangan 16 termasuk bilangan persegi.', '{}'::jsonb, 'true'::jsonb, 'Adakah bilangan yang jika dikalikan dengan dirinya sendiri hasilnya 16?', '["4 × 4 = 16.", "16 dapat disusun menjadi persegi 4 baris dan 4 kolom.", "Jadi pernyataan BENAR."]'::jsonb, false, null, 10),
  ('lg-1', 'lesson-enchanted-garden', 1, 'number', 1, '1, 4, 9, 16, 25, ...  Bilangan berikutnya adalah?', '{}'::jsonb, '36'::jsonb, 'Selisihnya 3, 5, 7, 9, ... Selisih berikutnya 11.', '["Selisih antarbilangan: 3, 5, 7, 9.", "Selisih berikutnya: 11.", "25 + 11 = 36 (juga 6 × 6 = 36)."]'::jsonb, false, null, 10),
  ('lg-2', 'lesson-enchanted-garden', 2, 'mc', 1, 'Berapa selisih antara 25 dan 36?', '{"options": [{"id": "a", "label": "9"}, {"id": "b", "label": "10"}, {"id": "c", "label": "11"}, {"id": "d", "label": "13"}]}'::jsonb, '"c"'::jsonb, 'Kurangkan bilangan yang lebih besar dengan yang lebih kecil.', '["36 − 25 = 11.", "11 adalah bilangan ganjil berikutnya setelah 9 — sesuai pola selisih."]'::jsonb, false, null, 10),
  ('lg-3', 'lesson-enchanted-garden', 3, 'sequence', 1, 'Lengkapi pola bilangan persegi berikut.', '{"display": [9, 16, null, 36, null]}'::jsonb, '[25, 49]'::jsonb, '9 = 3 × 3, 16 = 4 × 4. Lanjutkan dengan 5 × 5 dan seterusnya.', '["9 = 3², 16 = 4², maka berikutnya 5² = 25.", "Setelah 36 = 6², berikutnya 7² = 49."]'::jsonb, false, null, 10),
  ('ll-1', 'lesson-magic-library', 1, 'number', 1, 'Gunakan rumus Uₙ = n². Berapakah U₇?', '{}'::jsonb, '49'::jsonb, 'U₇ artinya n = 7. Hitung 7 × 7.', '["Rumus: Uₙ = n².", "U₇ = 7² = 7 × 7.", "U₇ = 49."]'::jsonb, false, null, 10),
  ('ll-2', 'lesson-magic-library', 2, 'mc', 1, 'Mengapa rumus pola bilangan persegi adalah Uₙ = n²?', '{"options": [{"id": "a", "label": "Karena susunan ke-n memiliki n baris dan n kolom, sehingga banyak kotaknya n × n"}, {"id": "b", "label": "Karena setiap suku selalu bertambah 2"}, {"id": "c", "label": "Karena suku ke-n sama dengan 2 × n"}, {"id": "d", "label": "Karena bilangan persegi selalu genap"}]}'::jsonb, '"a"'::jsonb, 'Bayangkan susunan ke-3: ada berapa baris dan berapa kolom?', '["Susunan ke-3 memiliki 3 baris dan 3 kolom → 3 × 3 kotak.", "Susunan ke-n memiliki n baris dan n kolom → n × n = n² kotak.", "Selisih antarsuku tidak tetap (3, 5, 7, ...) dan bilangan persegi bisa ganjil (1, 9, 25)."]'::jsonb, false, 'Menjelaskan alasan', 10),
  ('ll-3', 'lesson-magic-library', 3, 'number', 1, 'Jika Uₙ = 81, berapakah nilai n?', '{}'::jsonb, '9'::jsonb, 'Cari bilangan yang jika dikalikan dengan dirinya sendiri hasilnya 81.', '["Kita cari n sehingga n × n = 81.", "9 × 9 = 81.", "Jadi n = 9."]'::jsonb, false, null, 10),
  ('lp-1', 'lesson-royal-challenge-palace', 1, 'steps', 1, 'Bunga di taman kerajaan disusun membentuk persegi.', '{"context": "Susunan ke-1 berisi 1 bunga, susunan ke-2 berisi 4 bunga, susunan ke-3 berisi 9 bunga. Berapa banyak bunga pada susunan ke-8?", "illustration": {"kind": "pattern", "terms": [1, 2, 3]}, "parts": [{"id": "a", "type": "mc", "prompt": "Pola apa yang terbentuk dari banyak benda tersebut?", "options": [{"id": "persegi", "label": "Pola bilangan persegi (1, 4, 9, ...)"}, {"id": "ganjil", "label": "Pola bilangan ganjil (1, 3, 5, ...)"}, {"id": "genap", "label": "Pola bilangan genap (2, 4, 6, ...)"}]}, {"id": "b", "type": "number", "prompt": "Susunan ke berapa yang ditanyakan? (nilai n)"}, {"id": "c", "type": "number", "prompt": "Banyak bunga pada susunan tersebut", "unit": "bunga"}]}'::jsonb, '{"a": "persegi", "b": 8, "c": 64}'::jsonb, '1 = 1², 4 = 2², 9 = 3². Maka susunan ke-8 = 8².', '["Diketahui: 1, 4, 9, ... → pola bilangan persegi.", "Ditanya: susunan ke-8, jadi n = 8.", "U₈ = 8² = 64.", "Jadi ada 64 bunga pada susunan ke-8."]'::jsonb, true, 'Mengidentifikasi informasi, memilih strategi, menafsirkan hasil', 10),
  ('lp-2', 'lesson-royal-challenge-palace', 2, 'number', 1, 'Lantai aula istana dipasang ubin membentuk persegi dengan 12 ubin pada setiap sisi. Berapa banyak ubin seluruhnya?', '{"unit": "ubin"}'::jsonb, '144'::jsonb, 'Persegi dengan sisi 12 ubin berarti 12 baris dan 12 kolom.', '["Sisi = 12 ubin → 12 baris × 12 kolom.", "Banyak ubin = 12² = 144.", "Jadi ada 144 ubin."]'::jsonb, false, null, 10),
  ('lp-3', 'lesson-royal-challenge-palace', 3, 'mc', 1, 'Sebanyak 100 kursi tamu kerajaan disusun membentuk persegi. Berapa kursi pada setiap baris?', '{"options": [{"id": "a", "label": "50"}, {"id": "b", "label": "10"}, {"id": "c", "label": "25"}, {"id": "d", "label": "20"}]}'::jsonb, '"b"'::jsonb, 'Bilangan berapa jika dikalikan dirinya sendiri hasilnya 100?', '["Susunan persegi: baris = kolom = n, dan n × n = 100.", "10 × 10 = 100.", "Jadi setiap baris berisi 10 kursi."]'::jsonb, false, null, 10),
  ('t1-1', 'training-level-1', 1, 'mc', 1, 'Berapa banyak kotak pada susunan ini?', '{"illustration": {"kind": "grid", "rows": 2, "cols": 2}, "options": [{"id": "a", "label": "4"}, {"id": "b", "label": "2"}, {"id": "c", "label": "6"}, {"id": "d", "label": "8"}]}'::jsonb, '"a"'::jsonb, 'Ada 2 baris, setiap baris berisi 2 kotak.', '["2 baris × 2 kotak = 4 kotak."]'::jsonb, false, null, 10),
  ('t1-2', 'training-level-1', 2, 'number', 1, 'Berapa banyak kotak pada susunan ini?', '{"illustration": {"kind": "grid", "rows": 5, "cols": 5}, "unit": "kotak"}'::jsonb, '25'::jsonb, 'Hitung kotak pada satu baris, lalu kalikan dengan banyak baris.', '["Ada 5 baris dan 5 kolom.", "5 × 5 = 25 kotak."]'::jsonb, false, null, 10),
  ('t1-3', 'training-level-1', 3, 'tf', 1, 'Susunan 2 baris × 4 kolom membentuk persegi.', '{"illustration": {"kind": "grid", "rows": 2, "cols": 4}}'::jsonb, 'false'::jsonb, 'Bandingkan banyak baris dan banyak kolomnya.', '["Banyak baris (2) tidak sama dengan banyak kolom (4).", "Susunan itu berbentuk persegi panjang, bukan persegi.", "Jadi pernyataan SALAH."]'::jsonb, false, null, 10),
  ('t1-4', 'training-level-1', 4, 'mc', 1, 'Manakah susunan yang membentuk persegi?', '{"options": [{"id": "a", "label": "3 × 3", "illustration": {"kind": "grid", "rows": 3, "cols": 3}}, {"id": "b", "label": "2 × 4", "illustration": {"kind": "grid", "rows": 2, "cols": 4}}, {"id": "c", "label": "3 × 4", "illustration": {"kind": "grid", "rows": 3, "cols": 4}}, {"id": "d", "label": "1 × 5", "illustration": {"kind": "grid", "rows": 1, "cols": 5}}]}'::jsonb, '"a"'::jsonb, 'Cari susunan yang banyak baris dan kolomnya sama.', '["Hanya 3 × 3 yang baris dan kolomnya sama (3).", "Susunan lain adalah persegi panjang."]'::jsonb, false, null, 10),
  ('t1-5', 'training-level-1', 5, 'tf', 1, 'Bilangan 10 adalah bilangan persegi.', '{}'::jsonb, 'false'::jsonb, 'Coba hitung 3 × 3 dan 4 × 4.', '["3 × 3 = 9 dan 4 × 4 = 16.", "Tidak ada bilangan bulat yang dikalikan dirinya sendiri menghasilkan 10.", "Jadi 10 BUKAN bilangan persegi."]'::jsonb, false, null, 10),
  ('t1-6', 'training-level-1', 6, 'mc', 1, 'Bilangan persegi adalah bilangan yang ...', '{"options": [{"id": "a", "label": "merupakan hasil perkalian suatu bilangan dengan dirinya sendiri"}, {"id": "b", "label": "merupakan hasil penjumlahan dua bilangan sama"}, {"id": "c", "label": "selalu bilangan genap"}, {"id": "d", "label": "selalu kelipatan 4"}]}'::jsonb, '"a"'::jsonb, 'Ingat: 9 = 3 × 3, 16 = 4 × 4.', '["Bilangan persegi = n × n.", "Contoh: 1 = 1 × 1, 4 = 2 × 2, 9 = 3 × 3.", "9 dan 25 ganjil, jadi tidak selalu genap; 9 juga bukan kelipatan 4."]'::jsonb, false, null, 10),
  ('t1-7', 'training-level-1', 7, 'number', 1, 'Susunan bunga berbentuk persegi memiliki 6 baris dan 6 kolom. Berapa banyak bunganya?', '{"unit": "bunga"}'::jsonb, '36'::jsonb, 'Kalikan banyak baris dengan banyak kolom.', '["6 × 6 = 36.", "Jadi ada 36 bunga."]'::jsonb, false, null, 10),
  ('t1-8', 'training-level-1', 8, 'mc', 1, 'Manakah yang BUKAN bilangan persegi?', '{"options": [{"id": "a", "label": "1"}, {"id": "b", "label": "4"}, {"id": "c", "label": "8"}, {"id": "d", "label": "9"}]}'::jsonb, '"c"'::jsonb, 'Periksa: 1 × 1, 2 × 2, 3 × 3.', '["1 = 1², 4 = 2², 9 = 3².", "8 terletak di antara 4 dan 9, tidak bisa disusun menjadi persegi.", "Jadi 8 bukan bilangan persegi."]'::jsonb, false, null, 10),
  ('t1-9', 'training-level-1', 9, 'tf', 1, 'Susunan 4 × 4 berisi 16 kotak.', '{"illustration": {"kind": "grid", "rows": 4, "cols": 4}}'::jsonb, 'true'::jsonb, 'Hitung 4 × 4.', '["4 × 4 = 16.", "Jadi pernyataan BENAR."]'::jsonb, false, null, 10),
  ('t1-10', 'training-level-1', 10, 'number', 1, 'Sebuah susunan persegi memiliki sisi 7 kotak. Berapa banyak kotaknya?', '{"unit": "kotak"}'::jsonb, '49'::jsonb, 'Sisi 7 kotak artinya 7 baris dan 7 kolom.', '["7 × 7 = 49.", "Jadi ada 49 kotak."]'::jsonb, false, null, 10),
  ('t2-1', 'training-level-2', 1, 'sequence', 2, 'Lengkapi pola berikut.', '{"display": [1, 4, null, 16, null]}'::jsonb, '[9, 25]'::jsonb, '1 = 1², 4 = 2², ... lanjutkan.', '["Suku ke-3 = 3² = 9.", "Suku ke-5 = 5² = 25."]'::jsonb, false, null, 10),
  ('t2-2', 'training-level-2', 2, 'number', 2, 'Berapa selisih antara 16 dan 25?', '{}'::jsonb, '9'::jsonb, 'Hitung 25 − 16.', '["25 − 16 = 9."]'::jsonb, false, null, 10),
  ('t2-3', 'training-level-2', 3, 'number', 2, '36, 49, 64, ...  Bilangan berikutnya adalah?', '{}'::jsonb, '81'::jsonb, '36 = 6², 49 = 7², 64 = 8². Berikutnya?', '["36 = 6², 49 = 7², 64 = 8².", "Berikutnya 9² = 81.", "Cek selisih: 13, 15, lalu 17 → 64 + 17 = 81."]'::jsonb, false, null, 10),
  ('t2-4', 'training-level-2', 4, 'mc', 2, 'Selisih antarbilangan pada pola 1, 4, 9, 16, 25 membentuk pola ...', '{"options": [{"id": "a", "label": "bilangan ganjil berurutan: 3, 5, 7, 9"}, {"id": "b", "label": "bilangan genap: 2, 4, 6, 8"}, {"id": "c", "label": "selalu 3"}, {"id": "d", "label": "kelipatan 3: 3, 6, 9, 12"}]}'::jsonb, '"a"'::jsonb, 'Hitung 4 − 1, 9 − 4, 16 − 9, 25 − 16.', '["4 − 1 = 3, 9 − 4 = 5, 16 − 9 = 7, 25 − 16 = 9.", "Selisihnya 3, 5, 7, 9 → bilangan ganjil berurutan."]'::jsonb, false, null, 10),
  ('t2-5', 'training-level-2', 5, 'sequence', 2, 'Lengkapi pola berikut.', '{"display": [25, null, 49, null, 81]}'::jsonb, '[36, 64]'::jsonb, '25 = 5², 49 = 7², 81 = 9².', '["Di antara 5² dan 7² ada 6² = 36.", "Di antara 7² dan 9² ada 8² = 64."]'::jsonb, false, null, 10),
  ('t2-6', 'training-level-2', 6, 'number', 2, 'Pada pola 1, 4, 9, 16, selisih berikutnya adalah 9. Berapakah bilangan berikutnya?', '{}'::jsonb, '25'::jsonb, 'Tambahkan selisih ke bilangan terakhir.', '["16 + 9 = 25.", "Cocok dengan 5² = 25."]'::jsonb, false, null, 10),
  ('t2-7', 'training-level-2', 7, 'tf', 2, 'Selisih dua bilangan persegi yang berurutan selalu bilangan ganjil.', '{}'::jsonb, 'true'::jsonb, 'Coba beberapa: 4 − 1, 9 − 4, 16 − 9.', '["Selisihnya 3, 5, 7, 9, 11, ...", "Semuanya bilangan ganjil.", "Jadi pernyataan BENAR."]'::jsonb, false, null, 10),
  ('t2-8', 'training-level-2', 8, 'number', 2, '81, 100, 121, ...  Bilangan berikutnya adalah?', '{}'::jsonb, '144'::jsonb, '81 = 9², 100 = 10², 121 = 11².', '["Berikutnya 12² = 144.", "Cek selisih: 19, 21, lalu 23 → 121 + 23 = 144."]'::jsonb, false, null, 10),
  ('t2-9', 'training-level-2', 9, 'mc', 2, 'Berapa selisih antara 49 dan 64?', '{"options": [{"id": "a", "label": "13"}, {"id": "b", "label": "15"}, {"id": "c", "label": "17"}, {"id": "d", "label": "11"}]}'::jsonb, '"b"'::jsonb, 'Hitung 64 − 49.', '["64 − 49 = 15."]'::jsonb, false, null, 10),
  ('t2-10', 'training-level-2', 10, 'sequence', 2, 'Lengkapi pola berikut.', '{"display": [4, 9, null, 25, null, 49]}'::jsonb, '[16, 36]'::jsonb, '4 = 2², 9 = 3², ...', '["Setelah 3² = 9 adalah 4² = 16.", "Setelah 5² = 25 adalah 6² = 36."]'::jsonb, false, null, 10),
  ('t3-1', 'training-level-3', 1, 'number', 3, 'Tentukan U₉ dari pola bilangan persegi.', '{}'::jsonb, '81'::jsonb, 'U₉ = 9².', '["Uₙ = n².", "U₉ = 9 × 9 = 81."]'::jsonb, false, null, 10),
  ('t3-2', 'training-level-3', 2, 'number', 3, 'Tentukan U₁₅ dari pola bilangan persegi.', '{}'::jsonb, '225'::jsonb, '15 × 15 = 15 × 10 + 15 × 5.', '["U₁₅ = 15².", "15 × 15 = 150 + 75 = 225."]'::jsonb, false, null, 10),
  ('t3-3', 'training-level-3', 3, 'number', 3, 'Jika Uₙ = 196, berapakah n?', '{}'::jsonb, '14'::jsonb, '13² = 169 dan 15² = 225. Coba bilangan di antaranya.', '["Cari n sehingga n × n = 196.", "14 × 14 = 196.", "Jadi n = 14."]'::jsonb, false, null, 10),
  ('t3-4', 'training-level-3', 4, 'steps', 3, 'Lampu hias istana dinyalakan membentuk persegi.', '{"context": "Pada hari ke-1 menyala 1 lampu, hari ke-2 menyala 4 lampu, hari ke-3 menyala 9 lampu. Pola ini berlanjut. Berapa lampu yang menyala pada hari ke-10?", "illustration": {"kind": "pattern", "terms": [1, 2, 3]}, "parts": [{"id": "a", "type": "mc", "prompt": "Pola apa yang terbentuk dari banyak benda tersebut?", "options": [{"id": "persegi", "label": "Pola bilangan persegi (1, 4, 9, ...)"}, {"id": "ganjil", "label": "Pola bilangan ganjil (1, 3, 5, ...)"}, {"id": "genap", "label": "Pola bilangan genap (2, 4, 6, ...)"}]}, {"id": "b", "type": "number", "prompt": "Banyak lampu pada hari ke-10", "unit": "lampu"}]}'::jsonb, '{"a": "persegi", "b": 100}'::jsonb, 'Hari ke-n menyala n² lampu.', '["1, 4, 9, ... adalah pola bilangan persegi.", "Hari ke-10 → n = 10.", "U₁₀ = 10² = 100 lampu."]'::jsonb, true, 'Mengidentifikasi informasi dan menggunakan rumus', 10),
  ('t3-5', 'training-level-3', 5, 'mc', 3, 'Rina ingin mengetahui suku ke-20 pola bilangan persegi. Strategi mana yang paling efisien?', '{"options": [{"id": "a", "label": "Menulis semua suku dari ke-1 sampai ke-20"}, {"id": "b", "label": "Menggunakan rumus Uₙ = n², sehingga U₂₀ = 20² = 400"}, {"id": "c", "label": "Menghitung 20 + 20 = 40"}, {"id": "d", "label": "Menghitung 20 × 2 = 40"}]}'::jsonb, '"b"'::jsonb, 'Strategi mana yang langsung, tanpa menulis banyak suku?', '["Menulis 20 suku bisa benar, tetapi lama.", "Rumus Uₙ = n² langsung: U₂₀ = 20 × 20 = 400.", "20 + 20 dan 20 × 2 bukan rumus bilangan persegi."]'::jsonb, false, 'Menentukan strategi', 10),
  ('t3-6', 'training-level-3', 6, 'tf', 3, 'U₁₂ = 24', '{}'::jsonb, 'false'::jsonb, 'n² artinya n × n, bukan n × 2.', '["U₁₂ = 12² = 12 × 12 = 144.", "24 adalah 12 × 2 — kesalahan umum!", "Jadi pernyataan SALAH."]'::jsonb, false, null, 10),
  ('t3-7', 'training-level-3', 7, 'steps', 3, 'Kursi pesta dansa kerajaan ditata membentuk persegi.', '{"context": "Ada 13 baris kursi, dan susunannya berbentuk persegi.", "parts": [{"id": "a", "type": "number", "prompt": "Berapa kursi pada setiap baris?", "unit": "kursi"}, {"id": "b", "type": "number", "prompt": "Berapa banyak kursi seluruhnya?", "unit": "kursi"}]}'::jsonb, '{"a": 13, "b": 169}'::jsonb, 'Pada persegi, banyak kursi per baris = banyak baris.', '["Persegi → baris = kolom, jadi tiap baris 13 kursi.", "Total = 13 × 13 = 169 kursi."]'::jsonb, true, 'Memahami hubungan susunan dan bilangan', 10),
  ('t3-8', 'training-level-3', 8, 'number', 3, 'Berapakah selisih U₁₁ dan U₁₀?', '{}'::jsonb, '21'::jsonb, 'Hitung dulu U₁₁ dan U₁₀.', '["U₁₁ = 121, U₁₀ = 100.", "121 − 100 = 21."]'::jsonb, false, null, 10),
  ('t3-9', 'training-level-3', 9, 'mc', 3, 'Sebuah taman memiliki 50 tanaman. Bisakah SEMUA tanaman disusun membentuk persegi tanpa sisa?', '{"options": [{"id": "a", "label": "Tidak, karena 7² = 49 dan 8² = 64, sehingga 50 bukan bilangan persegi"}, {"id": "b", "label": "Ya, disusun 5 × 10"}, {"id": "c", "label": "Ya, disusun 25 × 2"}, {"id": "d", "label": "Ya, karena 50 bilangan genap"}]}'::jsonb, '"a"'::jsonb, 'Persegi harus n × n dengan baris = kolom.', '["5 × 10 dan 25 × 2 adalah persegi panjang.", "7² = 49 dan 8² = 64; tidak ada n dengan n² = 50.", "Jadi tidak bisa — akan bersisa 1 tanaman jika memakai 7 × 7."]'::jsonb, false, 'Menafsirkan hasil', 10),
  ('t3-10', 'training-level-3', 10, 'number', 3, 'Lantai persegi tersusun dari ubin dengan 20 ubin pada satu sisi. Berapa ubin seluruhnya?', '{"unit": "ubin"}'::jsonb, '400'::jsonb, '20 × 20.', '["Sisi 20 → 20 baris × 20 kolom.", "20² = 400 ubin."]'::jsonb, false, null, 10),
  ('f-1', 'final', 1, 'mc', 1, 'Berapa banyak kotak pada susunan ini?', '{"illustration": {"kind": "grid", "rows": 4, "cols": 4}, "options": [{"id": "a", "label": "8"}, {"id": "b", "label": "12"}, {"id": "c", "label": "16"}, {"id": "d", "label": "20"}]}'::jsonb, '"c"'::jsonb, null, '["4 baris × 4 kolom = 16 kotak."]'::jsonb, false, null, 10),
  ('f-2', 'final', 2, 'tf', 1, 'Bilangan 36 adalah bilangan persegi.', '{}'::jsonb, 'true'::jsonb, null, '["6 × 6 = 36, jadi 36 bilangan persegi."]'::jsonb, false, null, 10),
  ('f-3', 'final', 3, 'sequence', 2, 'Lengkapi pola bilangan persegi berikut.', '{"display": [1, 4, 9, null, 25, null]}'::jsonb, '[16, 36]'::jsonb, null, '["Suku ke-4 = 4² = 16.", "Suku ke-6 = 6² = 36."]'::jsonb, false, null, 10),
  ('f-4', 'final', 4, 'number', 2, 'Berapa selisih antara 36 dan 49?', '{}'::jsonb, '13'::jsonb, null, '["49 − 36 = 13."]'::jsonb, false, null, 10),
  ('f-5', 'final', 5, 'number', 2, '49, 64, ...  Bilangan berikutnya adalah?', '{}'::jsonb, '81'::jsonb, null, '["49 = 7², 64 = 8², berikutnya 9² = 81."]'::jsonb, false, null, 10),
  ('f-6', 'final', 6, 'number', 2, 'Tentukan U₁₁.', '{}'::jsonb, '121'::jsonb, null, '["U₁₁ = 11² = 121."]'::jsonb, false, null, 10),
  ('f-7', 'final', 7, 'number', 3, 'Jika Uₙ = 225, berapakah n?', '{}'::jsonb, '15'::jsonb, null, '["15 × 15 = 225, jadi n = 15."]'::jsonb, false, null, 10),
  ('f-8', 'final', 8, 'mc', 1, 'Manakah susunan yang membentuk persegi?', '{"options": [{"id": "a", "label": "4 × 5", "illustration": {"kind": "grid", "rows": 4, "cols": 5}}, {"id": "b", "label": "2 × 5", "illustration": {"kind": "grid", "rows": 2, "cols": 5}}, {"id": "c", "label": "3 × 6", "illustration": {"kind": "grid", "rows": 3, "cols": 6}}, {"id": "d", "label": "5 × 5", "illustration": {"kind": "grid", "rows": 5, "cols": 5}}]}'::jsonb, '"d"'::jsonb, null, '["Hanya 5 × 5 yang baris dan kolomnya sama."]'::jsonb, false, null, 10),
  ('f-9', 'final', 9, 'steps', 3, 'Tanaman di taman kerajaan disusun membentuk persegi.', '{"context": "Pada susunan pertama terdapat 1 tanaman, susunan kedua 4 tanaman, dan susunan ketiga 9 tanaman. Tentukan banyak tanaman pada susunan ke-6.", "illustration": {"kind": "pattern", "terms": [1, 2, 3]}, "parts": [{"id": "a", "type": "mc", "prompt": "Pola apa yang terbentuk dari banyak benda tersebut?", "options": [{"id": "persegi", "label": "Pola bilangan persegi (1, 4, 9, ...)"}, {"id": "ganjil", "label": "Pola bilangan ganjil (1, 3, 5, ...)"}, {"id": "genap", "label": "Pola bilangan genap (2, 4, 6, ...)"}]}, {"id": "b", "type": "number", "prompt": "Nilai n yang digunakan"}, {"id": "c", "type": "number", "prompt": "Banyak tanaman pada susunan ke-6", "unit": "tanaman"}]}'::jsonb, '{"a": "persegi", "b": 6, "c": 36}'::jsonb, null, '["1, 4, 9 → pola bilangan persegi.", "Susunan ke-6 → n = 6.", "U₆ = 6² = 36.", "Jadi banyak tanaman pada susunan ke-6 adalah 36 tanaman."]'::jsonb, true, 'Mengidentifikasi informasi, menggunakan rumus, menafsirkan hasil', 10),
  ('f-10', 'final', 10, 'mc', 1, 'Rumus suku ke-n pola bilangan persegi adalah ...', '{"options": [{"id": "a", "label": "Uₙ = n²"}, {"id": "b", "label": "Uₙ = 2n"}, {"id": "c", "label": "Uₙ = n + 2"}, {"id": "d", "label": "Uₙ = n² + 1"}]}'::jsonb, '"a"'::jsonb, null, '["Susunan ke-n memiliki n baris dan n kolom → n × n = n²."]'::jsonb, false, null, 10),
  ('f-11', 'final', 11, 'tf', 2, 'Selisih U₅ dan U₄ adalah 9.', '{}'::jsonb, 'true'::jsonb, null, '["U₅ = 25, U₄ = 16.", "25 − 16 = 9, jadi BENAR."]'::jsonb, false, null, 10),
  ('f-12', 'final', 12, 'number', 3, 'Lantai istana berbentuk persegi dengan 18 ubin pada setiap sisi. Berapa banyak ubinnya?', '{"unit": "ubin"}'::jsonb, '324'::jsonb, null, '["18² = 18 × 18 = 324 ubin."]'::jsonb, false, null, 10),
  ('f-13', 'final', 13, 'mc', 3, 'Sebanyak 144 kursi disusun membentuk persegi. Ada berapa kursi pada setiap baris?', '{"options": [{"id": "a", "label": "72"}, {"id": "b", "label": "14"}, {"id": "c", "label": "12"}, {"id": "d", "label": "24"}]}'::jsonb, '"c"'::jsonb, null, '["Cari n dengan n × n = 144.", "12 × 12 = 144, jadi tiap baris 12 kursi."]'::jsonb, false, null, 10),
  ('f-14', 'final', 14, 'steps', 3, 'Lampu taman menyala membentuk persegi.', '{"context": "Malam ke-1 menyala 1 lampu, malam ke-2 menyala 4 lampu, malam ke-3 menyala 9 lampu. Berapa lampu yang menyala pada malam ke-12?", "parts": [{"id": "a", "type": "mc", "prompt": "Pola apa yang terbentuk dari banyak benda tersebut?", "options": [{"id": "persegi", "label": "Pola bilangan persegi (1, 4, 9, ...)"}, {"id": "ganjil", "label": "Pola bilangan ganjil (1, 3, 5, ...)"}, {"id": "genap", "label": "Pola bilangan genap (2, 4, 6, ...)"}]}, {"id": "b", "type": "number", "prompt": "Banyak lampu pada malam ke-12", "unit": "lampu"}]}'::jsonb, '{"a": "persegi", "b": 144}'::jsonb, null, '["Pola 1, 4, 9 → bilangan persegi.", "U₁₂ = 12² = 144 lampu."]'::jsonb, true, null, 10),
  ('f-15', 'final', 15, 'mc', 2, 'Bilangan persegi manakah yang terletak di antara 50 dan 100?', '{"options": [{"id": "a", "label": "64 dan 81"}, {"id": "b", "label": "60 dan 80"}, {"id": "c", "label": "49 dan 100"}, {"id": "d", "label": "56 dan 72"}]}'::jsonb, '"a"'::jsonb, null, '["8² = 64 dan 9² = 81 berada di antara 50 dan 100.", "49 dan 100 tidak berada DI ANTARA 50 dan 100."]'::jsonb, false, null, 10),
  ('f-16', 'final', 16, 'number', 3, 'Tentukan U₂₅.', '{}'::jsonb, '625'::jsonb, null, '["U₂₅ = 25² = 25 × 25 = 625."]'::jsonb, false, null, 10)
on conflict (id) do update set quiz_id = excluded.quiz_id, position = excluded.position, qtype = excluded.qtype, difficulty = excluded.difficulty, prompt = excluded.prompt, data = excluded.data, answer = excluded.answer, hint = excluded.hint, explanation = excluded.explanation, ask_reason = excluded.ask_reason, literacy_focus = excluded.literacy_focus, points = excluded.points;

insert into public.games (id, title, mechanic, description, rounds, xp_max) values
  ('princess-square-hunter', 'Princess Square Hunter', 'pilih-semua', 'Temukan semua susunan permata yang membentuk persegi.', 5, 40),
  ('complete-the-magic-pattern', 'Complete the Magic Pattern', 'isi-rumpang', 'Lengkapi kalung bilangan persegi yang hilang.', 6, 40),
  ('find-the-royal-number', 'Find the Royal Number', 'pilih-cepat-beruntun', 'Pilih permata bilangan berikutnya dan jaga rantai kemenanganmu.', 8, 40),
  ('magic-formula-challenge', 'Magic Formula Challenge', 'langkah-rumus', 'Gunakan rumus Uₙ = n² langkah demi langkah, dari mudah ke sulit.', 6, 40),
  ('enchanted-kingdom-quest', 'Enchanted Kingdom Quest', 'petualangan-gerbang', 'Buka lima gerbang kerajaan dengan memecahkan teka-teki pola persegi.', 5, 40)
on conflict (id) do update set title = excluded.title, mechanic = excluded.mechanic, description = excluded.description, rounds = excluded.rounds, xp_max = excluded.xp_max;

insert into public.achievements (id, title, description, requirement, icon, xp_bonus, sort_order) values
  ('first-royal-adventure', 'First Royal Adventure', 'Petualangan pertamamu dimulai!', 'Menyelesaikan misi pertama', 'sparkles', 20, 1),
  ('princess-explorer', 'Princess Explorer', 'Kamu sudah mengenal pola bilangan persegi.', 'Menyelesaikan materi Princess Castle', 'castle', 20, 2),
  ('pattern-detective', 'Pattern Detective', 'Mata jeli penemu pola!', 'Skor minimal 70 pada Complete the Magic Pattern', 'search', 20, 3),
  ('magic-formula-master', 'Magic Formula Master', 'Kamu memahami asal-usul rumus Uₙ = n².', 'Menyelesaikan Magic Library dan skor minimal 70 pada Magic Formula Challenge', 'wand', 20, 4),
  ('royal-math-expert', 'Royal Math Expert', 'Latihan tingkat lanjut berhasil ditaklukkan.', 'Skor minimal 70 pada Royal Training Level 3', 'gem', 20, 5),
  ('kingdom-adventurer', 'Kingdom Adventurer', 'Kelima gerbang kerajaan telah kamu lewati.', 'Menyelesaikan Enchanted Kingdom Quest', 'map', 20, 6),
  ('royal-champion', 'Royal Champion', 'Juara sejati Enchanted Kingdom!', 'Menyelesaikan The Royal Final Quest', 'crown', 30, 7)
on conflict (id) do update set title = excluded.title, description = excluded.description, requirement = excluded.requirement, icon = excluded.icon, xp_bonus = excluded.xp_bonus, sort_order = excluded.sort_order;
