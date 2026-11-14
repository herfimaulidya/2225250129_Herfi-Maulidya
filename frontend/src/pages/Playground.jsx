import { Link } from 'react-router-dom';
import { ArrowRight, DoorOpen, Gamepad2, Gem, Grid3x3, Sparkles, Wand2 } from 'lucide-react';
import useStudentData from '../hooks/useStudentData';
import { GAME_INFO } from './games/gameInfo';
import { SectionTitle, Stars } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

const ICONS = {
  'princess-square-hunter': Grid3x3, 'complete-the-magic-pattern': Sparkles, 'find-the-royal-number': Gem,
  'magic-formula-challenge': Wand2, 'enchanted-kingdom-quest': DoorOpen,
};
const BG = ['bg-royal-blue/70', 'bg-royal-mint/80', 'bg-royal-rose', 'bg-royal-gold/40', 'bg-royal-lavender/70'];
const starsFor = (p) => (p >= 100 ? 3 : p >= 80 ? 2 : p >= 50 ? 1 : 0);

export default function Playground() {
  const { gameAttempts, loading, error, reload } = useStudentData(['gameAttempts']);
  if (loading && !gameAttempts) return <Spinner />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  const ids = Object.keys(GAME_INFO);
  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Magical Playground" title="Taman Bermain Ajaib" icon={Gamepad2}>
        Lima permainan dengan cara bermain berbeda. Setiap permainan bisa diulang dengan soal baru.
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id, i) => {
          const g = GAME_INFO[id];
          const Icon = ICONS[id];
          const plays = (gameAttempts || []).filter((a) => a.game_id === id);
          const best = plays.length ? Math.max(...plays.map((a) => +a.percent)) : null;
          return (
            <Link key={id} to={`/app/games/${id}`} className={`group flex flex-col rounded-3xl p-5 ring-1 ring-white/60 transition hover:-translate-y-1 hover:shadow-soft ${BG[i]} ${i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
              <span className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-royal-purple"><Icon /></span>
                <span className="eyebrow">Game {i + 1}</span>
              </span>
              <span className="mt-3 text-lg font-extrabold">{g.title}</span>
              <span className="mt-1 flex-1 text-sm">{g.tagline}</span>
              <span className="mt-4 flex items-center justify-between text-sm">
                {best !== null ? <span className="font-bold">Terbaik {Math.round(best)} <Stars value={starsFor(best)} size={14} /> · {plays.length}× main</span> : <span className="text-royal-plum/60">Belum dimainkan</span>}
                <ArrowRight className="transition group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
