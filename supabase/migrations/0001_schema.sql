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
