import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpenCheck, Loader2, Play, RotateCcw, ScrollText } from 'lucide-react';
import useActivitySession from '../../hooks/useActivitySession';
import { GAME_INFO } from './gameInfo';
import CompanionBubble from '../../components/companion/CompanionBubble';
import { ResultReview } from '../../components/quiz/Feedback';
import { Stars } from '../../components/ui/Bits';
import { ErrorNote } from '../../components/ui/Spinner';
import SquareHunter from './SquareHunter';
import CompletePattern from './CompletePattern';
import FindRoyalNumber from './FindRoyalNumber';
import MagicFormula from './MagicFormula';
import KingdomQuest from './KingdomQuest';

const GAMES = {
  'princess-square-hunter': SquareHunter,
  'complete-the-magic-pattern': CompletePattern,
  'find-the-royal-number': FindRoyalNumber,
  'magic-formula-challenge': MagicFormula,
  'enchanted-kingdom-quest': KingdomQuest,
};

export default function GamePage() {
  const { gameId } = useParams();
  const info = GAME_INFO[gameId];
  const Game = GAMES[gameId];
  const ctl = useActivitySession();
  const [difficulty, setDifficulty] = useState('mudah');

  // Berpindah ke permainan lain: mulai dari layar petunjuk, bukan hasil permainan sebelumnya.
  useEffect(() => {
    ctl.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  if (!info) return <ErrorNote>Permainan tidak ditemukan. <Link to="/app/games" className="underline">Kembali</Link></ErrorNote>;
  const start = () => ctl.start('game', gameId, gameId === 'find-the-royal-number' ? { difficulty } : {});

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/app/games" className="btn-ghost !px-2"><ArrowLeft size={16} /> Magical Playground</Link>
      <header>
        <p className="eyebrow">Magical Playground</p>
        <h1 className="text-2xl sm:text-3xl">{info.title}</h1>
      </header>

      {!ctl.session && (
        <div className="space-y-4">
          <CompanionBubble who={info.who}>{info.tagline}</CompanionBubble>
          <div className="grid gap-4 sm:grid-cols-2">
            <section className="panel">
              <h2 className="mb-2 flex items-center gap-2 text-lg"><BookOpenCheck size={18} className="text-royal-purple" /> Petunjuk permainan</h2>
              <ol className="list-decimal space-y-1 pl-5 text-sm">{info.howTo.map((h) => <li key={h}>{h}</li>)}</ol>
            </section>
            <section className="panel">
              <h2 className="mb-2 flex items-center gap-2 text-lg"><ScrollText size={18} className="text-royal-purple" /> Aturan & skor</h2>
              <ul className="space-y-1 text-sm">{info.rules.map((r) => <li key={r}>• {r}</li>)}</ul>
            </section>
          </div>
          {gameId === 'find-the-royal-number' && (
            <fieldset className="panel">
              <legend className="mb-2 px-1 font-extrabold">Tingkat kesulitan</legend>
              <div className="grid grid-cols-3 gap-2">
                {['mudah', 'sedang', 'sulit'].map((d) => (
                  <button key={d} onClick={() => setDifficulty(d)} aria-pressed={difficulty === d}
                    className={`rounded-2xl py-3 font-extrabold capitalize ${difficulty === d ? 'bg-royal-purple text-white' : 'bg-royal-lavender/40'}`}>{d}</button>
                ))}
              </div>
            </fieldset>
          )}
          <ErrorNote>{ctl.error}</ErrorNote>
          <button className="btn-primary w-full text-base" onClick={start} disabled={ctl.busy}>
            {ctl.busy ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Mulai Bermain
          </button>
        </div>
      )}

      {ctl.session && !ctl.result && <Game key={ctl.session.id} ctl={ctl} who={info.who} />}

      {ctl.result && (
        <div className="space-y-5 animate-fadeup">
          <div className="panel text-center">
            <p className="eyebrow">Hasil akhir</p>
            <p className="math mt-2 text-5xl text-royal-purple">{Math.round(ctl.result.percent)}</p>
            <p className="text-sm">{ctl.result.correct_count} dari {ctl.result.total_count} ronde sempurna · skor {ctl.result.score}/{ctl.result.max_score}</p>
            <div className="mt-2 flex justify-center"><Stars value={ctl.result.stars} size={28} /></div>
            {ctl.result.xp_awarded > 0 && <p className="mt-2 font-bold text-royal-leaf">+{ctl.result.xp_awarded} Royal Points</p>}
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button className="btn-primary" onClick={start} disabled={ctl.busy}><RotateCcw size={16} /> Main Lagi</button>
              <Link to="/app/games" className="btn-soft">Pilih permainan lain</Link>
            </div>
          </div>
          <CompanionBubble who={info.who} tone={ctl.result.percent >= 70 ? 'success' : 'info'}>
            {ctl.result.percent >= 70 ? 'Wonderful! Kamu berhasil menyelesaikan royal mission!' : 'Bagus sudah mencoba! Pelajari pembahasan di bawah, lalu main lagi untuk meraih bintang lebih banyak.'}
          </CompanionBubble>
          <details className="panel">
            <summary className="cursor-pointer font-extrabold text-royal-purple">Lihat pembahasan setiap ronde</summary>
            <div className="mt-4"><ResultReview result={ctl.result} /></div>
          </details>
        </div>
      )}
    </div>
  );
}
