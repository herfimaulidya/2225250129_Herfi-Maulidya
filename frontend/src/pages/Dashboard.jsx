import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Crown, FlaskConical, Gamepad2, Map, Swords, Trophy } from 'lucide-react';
import useStudentData, { lessonState } from '../hooks/useStudentData';
import { useAuth } from '../context/AuthContext';
import { levelInfo, formatDate } from '../lib/levels';
import KingdomMapArt from '../components/art/KingdomMapArt';
import CompanionBubble from '../components/companion/CompanionBubble';
import { BadgeIcon, ProgressBar } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

const ACTIVITY_LABEL = {
  login: 'Masuk', lesson_check: 'Latihan materi', lesson_complete: 'Misi selesai', training: 'Royal Training',
  game: 'Permainan', final: 'Final Quest', badge: 'Lencana',
};

function recommend(lessons, stats) {
  const next = lessons.find((l) => l.unlocked && !l.completed);
  if (next) return { to: `/app/lessons/${next.id}`, title: `Level ${next.level_no}: ${next.region_name}`, text: next.title };
  if (!stats?.trainings_completed) return { to: '/app/training', title: 'Royal Training Zone', text: 'Uji pemahamanmu dengan latihan bertingkat.' };
  if (stats?.best_final_score == null) return { to: '/app/final', title: 'The Royal Final Quest', text: 'Semua wilayah terbuka — saatnya evaluasi akhir!' };
  return { to: '/app/games', title: 'Magical Playground', text: 'Tingkatkan skor permainanmu dan kumpulkan Royal Stars.' };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { stats, progress, lessons, earned, achievements, activity, loading, error, reload } =
    useStudentData(['stats', 'progress', 'lessons', 'earned', 'achievements', 'activity']);

  if (loading && !lessons) return <Spinner label="Menyiapkan Royal Dashboard..." />;
  if (error) return <ErrorNote onRetry={reload}>Gagal memuat data: {error}</ErrorNote>;

  const ls = lessonState(lessons || [], progress || []);
  const xp = stats?.total_xp || 0;
  const lv = levelInfo(xp);
  const completed = ls.filter((l) => l.completed).length;
  const pct = ls.length ? (completed / ls.length) * 100 : 0;
  const rec = recommend(ls, stats);
  const earnedIds = new Set((earned || []).map((e) => e.achievement_id));
  const recent = (activity || []).filter((a) => a.activity_type !== 'login').slice(0, 4);
  const firstName = profile.full_name.split(' ')[0];

  return (
    <div className="space-y-6">
      {/* Sapaan + level */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel bg-gradient-to-br from-white to-royal-rose/60">
          <p className="eyebrow">Royal Dashboard</p>
          <h1 className="mt-1 text-2xl sm:text-3xl">Halo, {firstName}! 👑</h1>
          <p className="mt-1 text-sm text-royal-plum/70">Kode siswa <b className="font-display">{profile.student_code}</b>{profile.class_name && <> · Kelas {profile.class_name}</>}</p>
          <div className="mt-4"><ProgressBar value={pct} label={`Progres belajar · ${completed}/${ls.length} wilayah`} /></div>
          <Link to={rec.to} className="mt-5 flex items-center gap-3 rounded-2xl bg-royal-purple p-4 text-white transition hover:bg-royal-deep">
            <span className="flex-1">
              <span className="block text-xs font-bold uppercase tracking-wider text-royal-gold">Continue Adventure · Misi berikutnya</span>
              <span className="block text-lg font-extrabold">{rec.title}</span>
              <span className="block text-sm text-white/80">{rec.text}</span>
            </span>
            <ArrowRight />
          </Link>
        </div>
        <div className="panel flex flex-col justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-display grid h-16 w-16 place-items-center rounded-2xl bg-royal-gold text-2xl text-royal-plum shadow-soft">{lv.level}</span>
            <div>
              <p className="eyebrow">Royal Level</p>
              <p className="text-lg font-extrabold">{lv.title}</p>
            </div>
          </div>
          <ProgressBar value={lv.progress} color="bg-royal-gold"
            label={lv.next ? `${xp} / ${lv.next.min_xp} XP menuju ${lv.next.title}` : `${xp} XP · level tertinggi!`} />
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[['Royal Points', xp], ['Misi selesai', stats?.missions_completed ?? 0], ['Permainan', stats?.games_played ?? 0]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-royal-lavender/40 py-2">
                <dd className="math text-xl text-royal-purple">{v}</dd>
                <dt className="text-[11px] font-bold">{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Peta */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="flex items-center gap-2 text-xl"><Map size={20} className="text-royal-purple" /> Perjalananmu di Enchanted Kingdom</h2>
          <Link to="/app/map" className="text-sm font-bold text-royal-purple underline-offset-2 hover:underline">Buka peta</Link>
        </div>
        <KingdomMapArt lessons={ls} finalUnlocked={completed === ls.length && ls.length > 0} />
      </section>

      {/* Navigasi cepat */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { to: rec.to, icon: ArrowRight, label: 'Continue Adventure' },
          { to: '/app/map', icon: BookOpen, label: 'Explore Lessons' },
          { to: '/app/games', icon: Gamepad2, label: 'Enter Princess Games' },
          { to: '/app/training', icon: Swords, label: 'Royal Training' },
          { to: '/app/final', icon: Crown, label: 'Final Royal Quest' },
          { to: '/app/achievements', icon: Trophy, label: 'My Achievements' },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={label} to={to} className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-4 text-center text-sm font-extrabold ring-1 ring-royal-lavender transition hover:-translate-y-0.5 hover:ring-royal-purple">
            <Icon className="text-royal-purple" /> {label}
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel">
          <h2 className="mb-3 text-lg">Princess Badges</h2>
          <div className="flex flex-wrap gap-3">
            {(achievements || []).map((a) => (
              <span key={a.id} title={`${a.title} — ${a.requirement}`} className="flex flex-col items-center gap-1">
                <BadgeIcon icon={a.icon} earned={earnedIds.has(a.id)} size={48} />
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm text-royal-plum/70">{earnedIds.size} dari {(achievements || []).length} lencana diperoleh. <Link to="/app/achievements" className="font-bold text-royal-purple">Lihat semua</Link></p>
        </div>
        <div className="panel">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Aktivitas terakhir</h2>
            <Link to="/app/history" className="text-sm font-bold text-royal-purple">Riwayat</Link>
          </div>
          {recent.length ? (
            <ul className="space-y-2">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
                  <span><b>{ACTIVITY_LABEL[a.activity_type]}</b> · {a.title}</span>
                  <span className="shrink-0 text-xs text-royal-plum/60">{a.score != null ? `${Math.round(a.score)} · ` : ''}{formatDate(a.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <CompanionBubble who="seraphina" size={52}>Belum ada aktivitas. Yuk mulai dari Princess Castle!</CompanionBubble>
          )}
        </div>
      </section>

      <Link to="/app/lab" className="flex items-center gap-4 rounded-3xl bg-royal-blue/60 p-5 ring-1 ring-royal-blue transition hover:ring-royal-purple">
        <FlaskConical className="text-royal-purple" size={32} />
        <span className="flex-1"><b className="block">Royal Math Lab</b><span className="text-sm">Bangun susunan persegimu sendiri dan coba Royal Formula Calculator.</span></span>
        <ArrowRight />
      </Link>
    </div>
  );
}
