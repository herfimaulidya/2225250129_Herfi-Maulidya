import { CheckCircle2, Lock, Trophy } from 'lucide-react';
import useStudentData from '../hooks/useStudentData';
import { levelInfo, LEVELS, formatDate } from '../lib/levels';
import { BadgeIcon, ProgressBar, SectionTitle, Stars } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

const starsFor = (p) => (p >= 100 ? 3 : p >= 80 ? 2 : p >= 50 ? 1 : 0);

export default function Achievements() {
  const { stats, achievements, earned, progress, gameAttempts, quizAttempts, loading, error, reload } =
    useStudentData(['stats', 'achievements', 'earned', 'progress', 'gameAttempts', 'quizAttempts']);
  if (loading && !achievements) return <Spinner />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const xp = stats?.total_xp || 0;
  const lv = levelInfo(xp);
  const earnedMap = Object.fromEntries((earned || []).map((e) => [e.achievement_id, e.earned_at]));
  const lessonStars = (progress || []).filter((p) => p.status === 'completed').reduce((s, p) => s + (p.stars || 0), 0);
  const bestBy = (rows, key) => Object.values((rows || []).reduce((m, r) => ({ ...m, [r[key]]: Math.max(m[r[key]] ?? 0, +r.percent) }), {}));
  const gameStars = bestBy(gameAttempts, 'game_id').reduce((s, p) => s + starsFor(p), 0);
  const trainingStars = bestBy((quizAttempts || []).filter((q) => q.quiz_id.startsWith('training')), 'quiz_id').reduce((s, p) => s + starsFor(p), 0);
  const totalStars = lessonStars + gameStars + trainingStars;

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="My Achievements" title="Koleksi Pencapaian" icon={Trophy} />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="panel md:col-span-2">
          <p className="eyebrow">Royal Level {lv.level}</p>
          <p className="text-xl font-extrabold">{lv.title}</p>
          <div className="mt-3"><ProgressBar value={lv.progress} color="bg-royal-gold" label={lv.next ? `${xp} / ${lv.next.min_xp} XP` : `${xp} XP`} /></div>
          <ol className="mt-4 flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <li key={l.level} className={`chip ${xp >= l.min_xp ? '!bg-royal-gold/60 !text-royal-plum' : 'opacity-60'}`}>Lv {l.level} · {l.title}</li>
            ))}
          </ol>
        </div>
        <div className="panel flex flex-col items-center justify-center text-center">
          <Stars value={1} max={1} size={36} />
          <p className="math mt-1 text-4xl text-royal-purple">{totalStars}</p>
          <p className="text-sm font-bold">Royal Stars terkumpul</p>
          <p className="mt-1 text-xs text-royal-plum/60">dari misi, latihan, dan permainan (maks. 3 per aktivitas)</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl">Princess Badges ({Object.keys(earnedMap).length}/{(achievements || []).length})</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {(achievements || []).map((a) => {
            const got = earnedMap[a.id];
            return (
              <li key={a.id} className={`flex items-center gap-4 rounded-3xl p-4 ring-1 ${got ? 'bg-white ring-royal-gold' : 'bg-white/50 ring-royal-lavender'}`}>
                <BadgeIcon icon={a.icon} earned={Boolean(got)} />
                <div className="flex-1">
                  <p className="font-extrabold">{a.title}</p>
                  <p className="text-sm text-royal-plum/75">{a.description}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-bold">
                    {got ? <><CheckCircle2 size={14} className="text-royal-leaf" /> Diperoleh {formatDate(got)}</> : <><Lock size={14} /> Syarat: {a.requirement}</>}
                  </p>
                </div>
                <span className="chip">+{a.xp_bonus} XP</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
