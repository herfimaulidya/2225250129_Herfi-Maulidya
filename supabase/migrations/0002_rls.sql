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
