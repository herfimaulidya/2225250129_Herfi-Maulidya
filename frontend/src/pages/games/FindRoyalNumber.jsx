import { Gem, Link2 } from 'lucide-react';
import useRounds from './useRounds';
import { RoundFeedback, RoundHeader } from './GameBits';

const GEM_COLORS = ['from-royal-pink to-royal-rose', 'from-royal-blue to-white', 'from-royal-gold to-royal-cream', 'from-royal-lavender to-white'];

/** GAME 3 — ketuk permata jawaban; jawaban benar beruntun membangun Rantai Kilau. */
export default function FindRoyalNumber({ ctl }) {
  const r = useRounds(ctl);
  const done = Object.entries(r.feedbacks).sort((a, b) => +a[0] - +b[0]).map(([, f]) => f.correct);
  let streak = 0;
  for (let i = done.length - 1; i >= 0 && done[i]; i -= 1) streak += 1;
  const answerId = r.fb?.correct_answer?.id;

  return (
    <section className="panel space-y-5">
      <RoundHeader r={r} extra={` · ${ctl.session.difficulty}`} />
      <div className="flex items-center gap-2 rounded-2xl bg-royal-gold/20 px-4 py-2 text-sm font-extrabold" aria-live="polite">
        <Link2 size={18} className="text-royal-gold" /> Rantai Kilau: {streak}
        <span className="ml-1 flex gap-0.5">{Array.from({ length: Math.min(streak, 8) }, (_, i) => <Gem key={i} size={14} className="fill-royal-gold text-royal-gold" />)}</span>
      </div>
      <h2 className="text-lg font-extrabold">{r.item.prompt}</h2>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {r.item.data.display.map((v, i) => <span key={i} className="math rounded-2xl bg-royal-blue/70 px-4 py-2 text-xl">{v}</span>)}
        <span className="math rounded-2xl border-2 border-dashed border-royal-purple px-4 py-2 text-xl text-royal-purple">?</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {r.item.data.options.map((o, i) => {
          let state = '';
          if (r.fb) {
            if (o.id === answerId) state = 'ring-4 ring-royal-leaf';
            else if (o.id === r.value) state = 'opacity-60 ring-4 ring-royal-coral';
            else state = 'opacity-50';
          }
          return (
            <button key={o.id} data-option={o.id} disabled={ctl.busy || Boolean(r.fb)} onClick={() => { r.setValue(o.id); r.submit(o.id); }}
              className={`math flex aspect-square flex-col items-center justify-center gap-1 rounded-[2rem] bg-gradient-to-br text-2xl shadow-soft transition hover:-translate-y-1 ${GEM_COLORS[i % 4]} ${state}`}>
              <Gem size={20} className="text-royal-purple" />{o.label}
            </button>
          );
        })}
      </div>
      <RoundFeedback r={r} ctl={ctl} />
    </section>
  );
}
