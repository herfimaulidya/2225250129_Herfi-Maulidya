import useRounds from './useRounds';
import { RoundFeedback, RoundHeader } from './GameBits';
import { isComplete } from '../../components/quiz/QuestionInput';

/** GAME 2 — kalung permata: isi bilangan persegi yang hilang. */
export default function CompletePattern({ ctl }) {
  const r = useRounds(ctl);
  const display = r.item.data.display;
  let bi = -1;
  const locked = ctl.busy || r.fb?.done;
  const setBlank = (idx, v) => r.setValue(r.value.map((x, j) => (j === idx ? v.replace(/[^\d]/g, '').slice(0, 6) : x)));

  return (
    <section className="panel space-y-5">
      <RoundHeader r={r} />
      <h2 className="text-lg font-extrabold">{r.item.prompt}</h2>
      <div className="relative rounded-3xl bg-gradient-to-b from-royal-lavender/50 to-royal-rose/50 px-3 pb-6 pt-10">
        <svg className="absolute inset-x-0 top-2 h-10 w-full" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <path d="M2 2 Q50 14 98 2" stroke="#E8C878" strokeWidth="1.2" fill="none" />
        </svg>
        <div className="relative flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {display.map((v, i) => {
            if (v !== null) {
              return <span key={i} className="math grid h-14 w-14 place-items-center rounded-full bg-white text-lg shadow-soft ring-4 ring-royal-gold/60 sm:h-16 sm:w-16">{v}</span>;
            }
            bi += 1;
            const idx = bi;
            const st = r.fb?.parts?.[idx];
            const ring = st === true ? 'ring-royal-leaf bg-royal-mint' : st === false ? 'ring-royal-coral bg-royal-rose animate-shake' : 'ring-royal-purple bg-white/70';
            return (
              <input key={i} inputMode="numeric" data-input={`blank-${idx}`} aria-label={`Permata kosong ke-${idx + 1}`} value={r.value[idx]} disabled={locked}
                onChange={(e) => setBlank(idx, e.target.value)} placeholder="?"
                className={`math h-14 w-14 rounded-full text-center text-lg ring-4 focus:outline-none sm:h-16 sm:w-16 ${ring}`} />
            );
          })}
        </div>
      </div>
      {!r.fb?.done && (
        <button className="btn-primary w-full" disabled={ctl.busy || !isComplete(r.item, r.value)} onClick={() => r.submit()}>
          {r.fb ? 'Periksa lagi' : 'Pasang permata'}
        </button>
      )}
      <RoundFeedback r={r} ctl={ctl} />
    </section>
  );
}
