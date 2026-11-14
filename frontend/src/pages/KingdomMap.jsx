import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Crown, Lock, Map } from 'lucide-react';
import useStudentData, { lessonState } from '../hooks/useStudentData';
import KingdomMapArt from '../components/art/KingdomMapArt';
import Princess from '../components/art/Princess';
import { LESSON_COMPANION } from '../content/companions';
import { SectionTitle, Stars } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

export default function KingdomMap() {
  const { progress, lessons, loading, error, reload } = useStudentData(['progress', 'lessons']);
  if (loading && !lessons) return <Spinner label="Membentangkan peta kerajaan..." />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  const ls = lessonState(lessons || [], progress || []);
  const allDone = ls.length > 0 && ls.every((l) => l.completed);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Enchanted Kingdom Map" title="Peta Petualangan" icon={Map}>
        Jelajahi empat wilayah secara berurutan. Wilayah berikutnya terbuka setelah misi sebelumnya selesai —
        dan kamu selalu bisa kembali mengulang wilayah yang sudah terbuka.
      </SectionTitle>
      <KingdomMapArt lessons={ls} finalUnlocked={allDone} />
      <ol className="space-y-3">
        {ls.map((l) => {
          const body = (
            <>
              <Princess who={LESSON_COMPANION[l.id]} size={56} className="shrink-0" />
              <span className="flex-1">
                <span className="eyebrow block">Level 0{l.level_no} · {l.region_name}</span>
                <span className="block text-lg font-extrabold">{l.title}</span>
                <span className="block text-sm text-royal-plum/70">{l.topic}</span>
              </span>
              {l.completed ? (
                <span className="flex flex-col items-end gap-1 text-xs font-bold text-royal-leaf">
                  <CheckCircle2 /> <Stars value={l.progress?.stars || 1} size={14} />
                </span>
              ) : l.unlocked ? <ArrowRight className="text-royal-purple" /> : <Lock className="text-royal-plum/40" />}
            </>
          );
          return (
            <li key={l.id}>
              {l.unlocked ? (
                <Link to={`/app/lessons/${l.id}`} className="flex items-center gap-4 rounded-3xl bg-white/85 p-4 ring-1 ring-royal-lavender transition hover:ring-royal-purple">{body}</Link>
              ) : (
                <div className="flex items-center gap-4 rounded-3xl bg-white/50 p-4 opacity-70 ring-1 ring-royal-lavender" aria-disabled="true">
                  {body}
                </div>
              )}
              {!l.unlocked && <p className="ml-4 mt-1 text-xs text-royal-plum/60">Terbuka setelah Level 0{l.level_no - 1} selesai.</p>}
            </li>
          );
        })}
      </ol>
      <Link to="/app/final" className={`flex items-center gap-4 rounded-3xl p-5 ${allDone ? 'bg-royal-purple text-white' : 'bg-royal-lavender/40'}`}>
        <Crown className={allDone ? 'text-royal-gold' : 'text-royal-plum/40'} size={32} />
        <span className="flex-1"><b className="block text-lg">The Royal Final Quest</b>
          <span className="text-sm">{allDone ? 'Gerbang terakhir sudah terbuka!' : 'Selesaikan keempat wilayah untuk membukanya.'}</span></span>
        {allDone ? <ArrowRight /> : <Lock />}
      </Link>
    </div>
  );
}
