import { Search } from 'lucide-react';
import useRounds from './useRounds';
import { RoundFeedback, RoundHeader } from './GameBits';
import QuestionInput from '../../components/quiz/QuestionInput';

/** GAME 1 — pilih SEMUA susunan persegi (multi-pilih, satu kesempatan). */
export default function SquareHunter({ ctl }) {
  const r = useRounds(ctl);
  return (
    <section className="panel space-y-4">
      <RoundHeader r={r} extra={` · ${r.points} ronde sempurna`} />
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Search className="text-royal-purple" size={20} /> {r.item.prompt}</h2>
      <QuestionInput item={r.item} value={r.value} onChange={r.setValue} disabled={ctl.busy || Boolean(r.fb)} feedback={r.fb} />
      {!r.fb && (
        <button className="btn-primary w-full" disabled={ctl.busy || !r.value.length} onClick={() => r.submit()}>
          Periksa ({r.value.length} dipilih)
        </button>
      )}
      {r.fb && (
        <p className="text-xs text-royal-plum/70">Hijau = pilihan tepat · Merah = bukan persegi · Garis putus emas = persegi yang terlewat</p>
      )}
      <RoundFeedback r={r} ctl={ctl} />
    </section>
  );
}
