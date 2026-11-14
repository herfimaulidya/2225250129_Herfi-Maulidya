import { Link } from 'react-router-dom';
import { ArrowRight, Swords } from 'lucide-react';
import useStudentData from '../hooks/useStudentData';
import { SectionTitle, Stars } from '../components/ui/Bits';
import CompanionBubble from '../components/companion/CompanionBubble';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

export const TRAINING_LEVELS = [
  { id: 'level-1', name: 'Princess Beginner', who: 'seraphina', color: 'from-royal-blue to-white',
    skills: ['Mengenal pola bilangan persegi', 'Mengidentifikasi susunan kotak', 'Menentukan jumlah kotak'] },
  { id: 'level-2', name: 'Royal Explorer', who: 'rosalind', color: 'from-royal-mint to-white',
    skills: ['Melengkapi urutan bilangan', 'Menentukan selisih antarbilangan', 'Menentukan suku berikutnya'] },
  { id: 'level-3', name: 'Royal Expert', who: 'lumina', color: 'from-royal-gold/60 to-white',
    skills: ['Menggunakan rumus Uₙ = n²', 'Menentukan suku ke-n', 'Soal cerita & menjelaskan strategi'] },
];

const starsFor = (p) => (p >= 100 ? 3 : p >= 80 ? 2 : p >= 50 ? 1 : 0);

export default function Training() {
  const { quizAttempts, loading, error, reload } = useStudentData(['quizAttempts']);
  if (loading && !quizAttempts) return <Spinner />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  const best = (id) => Math.max(-1, ...(quizAttempts || []).filter((a) => a.quiz_id === `training-${id}`).map((a) => +a.percent));

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Royal Training Zone" title="Arena Latihan Kerajaan" icon={Swords}>
        Setiap sesi berisi 8 soal acak dari bank soal. Salah? Tidak apa-apa — kamu akan mendapat petunjuk, kesempatan kedua, dan pembahasan.
      </SectionTitle>
      <CompanionBubble who="marina" size={56}>Saran: mulai dari Princess Beginner, lalu naik tingkat setelah skormu minimal 70.</CompanionBubble>
      <div className="grid gap-4 md:grid-cols-3">
        {TRAINING_LEVELS.map((lv, i) => {
          const b = best(lv.id);
          return (
            <Link key={lv.id} to={`/app/training/${lv.id}`}
              className={`flex flex-col rounded-3xl bg-gradient-to-b ${lv.color} p-5 ring-1 ring-royal-lavender transition hover:-translate-y-1 hover:ring-royal-purple`}>
              <span className="eyebrow">Level {i + 1}</span>
              <span className="mt-1 text-xl font-extrabold">{lv.name}</span>
              <ul className="mt-3 flex-1 space-y-1 text-sm">{lv.skills.map((s) => <li key={s}>• {s}</li>)}</ul>
              <span className="mt-4 flex items-center justify-between">
                {b >= 0 ? <span className="text-sm font-bold">Skor terbaik {Math.round(b)} <Stars value={starsFor(b)} size={14} /></span> : <span className="text-sm text-royal-plum/60">Belum dicoba</span>}
                <ArrowRight className="text-royal-purple" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
