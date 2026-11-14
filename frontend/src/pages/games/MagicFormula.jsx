import { Wand2 } from 'lucide-react';
import useRounds from './useRounds';
import { RoundFeedback, RoundHeader } from './GameBits';
import QuestionInput, { isComplete } from '../../components/quiz/QuestionInput';

const STAGES = { 1: 'Tahap 1 · n → Uₙ', 2: 'Tahap 2 · Uₙ → n', 3: 'Tahap 3 · Royal Story' };

/** GAME 4 — tantangan rumus bertahap, setiap tantangan diisi langkah demi langkah. */
export default function MagicFormula({ ctl }) {
  const r = useRounds(ctl);
  const stage = r.item.stage || 1;
  return (
    <section className="panel space-y-5">
      <RoundHeader r={r} label="Tantangan" />
      <div className="flex gap-2">
        {[1, 2, 3].map((s) => (
          <span key={s} className={`flex-1 rounded-full py-1.5 text-center text-xs font-extrabold ${s === stage ? 'bg-royal-purple text-white' : s < stage ? 'bg-royal-lavender text-royal-purple' : 'bg-royal-lavender/30 text-royal-plum/50'}`}>
            {STAGES[s]}
          </span>
        ))}
      </div>
      <div className="rounded-2xl bg-royal-plum p-4 text-center text-white">
        <p className="text-xs uppercase tracking-widest text-royal-gold">Mantra ajaib</p>
        <p className="math text-2xl">Uₙ = n × n = n²</p>
      </div>
      <h2 className="flex items-center gap-2 text-lg font-extrabold"><Wand2 className="text-royal-purple" size={20} /> {r.item.prompt}</h2>
      <QuestionInput item={r.item} value={r.value} onChange={r.setValue} disabled={ctl.busy || r.fb?.done} feedback={r.fb} />
      {!r.fb?.done && (
        <button className="btn-primary w-full" disabled={ctl.busy || !isComplete(r.item, r.value)} onClick={() => r.submit()}>
          {r.fb ? 'Ucapkan mantra lagi' : 'Ucapkan mantra'}
        </button>
      )}
      <RoundFeedback r={r} ctl={ctl} nextLabel="Tantangan berikutnya" />
    </section>
  );
}
