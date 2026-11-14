import { DoorClosed, DoorOpen, Lightbulb, Sparkles } from 'lucide-react';
import useRounds from './useRounds';
import { RoundFeedback } from './GameBits';
import { Illustration } from '../../components/math/SquareGrid';
import Princess from '../../components/art/Princess';

/** GAME 5 — petualangan lima gerbang dengan cerita, petunjuk peri, dan animasi gerbang terbuka. */
export default function KingdomQuest({ ctl, who }) {
  const r = useRounds(ctl);
  const it = r.item;
  const opened = Object.values(r.feedbacks).filter((f) => f.done).length;
  const left = r.fb ? r.fb.attempts_left : ctl.session.max_attempts;

  return (
    <section className="space-y-4">
      {/* Jalur gerbang */}
      <div className="panel">
        <div className="relative flex items-center justify-between">
          <div className="absolute inset-x-4 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-royal-lavender">
            <div className="h-full rounded-full bg-royal-gold transition-all duration-700" style={{ width: `${(opened / r.total) * 100}%` }} />
          </div>
          {ctl.session.items.map((g, i) => {
            const isOpen = r.feedbacks[i]?.done;
            const Icon = isOpen ? DoorOpen : DoorClosed;
            return (
              <span key={i} title={g.gate} className={`relative grid h-11 w-11 place-items-center rounded-full border-4 border-white shadow-soft transition ${isOpen ? 'bg-royal-gold' : i === r.index ? 'bg-royal-purple text-white' : 'bg-royal-lavender'}`}>
                <Icon size={18} />
              </span>
            );
          })}
        </div>
        <p className="mt-3 text-center text-sm font-bold">{opened} dari {r.total} gerbang terbuka</p>
      </div>

      <div className="panel space-y-4">
        <p className="eyebrow">Gerbang {r.index + 1} · {it.gate}</p>
        <div className="flex items-start gap-3">
          <Princess who={who} size={56} className="shrink-0" mood={r.fb && !r.fb.correct ? 'think' : 'happy'} />
          <p className="rounded-2xl bg-royal-blue/40 p-3 italic leading-relaxed">{it.story}</p>
        </div>
        <h2 className="text-lg font-extrabold">{it.prompt}</h2>
        {it.data?.illustration && <div className="flex justify-center"><Illustration spec={it.data.illustration} /></div>}

        {r.fb?.done && r.fb.correct ? (
          <div className="flex flex-col items-center gap-2 py-2 animate-pop">
            <DoorOpen size={56} className="text-royal-gold" />
            <p className="flex items-center gap-1 font-extrabold text-royal-leaf"><Sparkles size={18} /> Gerbang terbuka!</p>
          </div>
        ) : !r.fb?.done && (
          <form className="flex flex-wrap items-center justify-center gap-3" onSubmit={(e) => { e.preventDefault(); if (String(r.value).trim()) r.submit(); }}>
            <input inputMode="numeric" data-input="answer" aria-label="Jawaban kunci gerbang" className={`num-input !w-32 !text-2xl ${r.fb && !r.fb.correct ? 'animate-shake border-royal-coral' : ''}`}
              value={r.value} onChange={(e) => r.setValue(e.target.value.replace(/[^\d]/g, '').slice(0, 6))} placeholder="?" disabled={ctl.busy} />
            {it.data?.unit && <span className="font-bold">{it.data.unit}</span>}
            <button className="btn-primary" disabled={ctl.busy || !String(r.value).trim()}>Buka gerbang</button>
          </form>
        )}

        {!r.fb?.done && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold">Kesempatan tersisa: {left}</span>
            {it.has_hint && !r.hint && !r.fb?.hint && (
              <button className="btn-ghost" onClick={r.askHint} disabled={ctl.busy}><Lightbulb size={16} /> Petunjuk Peri</button>
            )}
          </div>
        )}
        {r.hint && !r.fb?.done && <p className="flex gap-2 rounded-2xl bg-royal-gold/20 p-3 text-sm"><Lightbulb className="shrink-0 text-royal-gold" size={18} /> {r.hint}</p>}
        {r.fb?.done && !r.fb.correct && <p className="text-center text-sm font-bold">Peri kerajaan membukakan gerbang untukmu — pelajari pembahasannya, ya!</p>}
        <RoundFeedback r={r} ctl={ctl} nextLabel="Menuju gerbang berikutnya" finishLabel="Masuk ke Aula Mahkota" />
      </div>
    </section>
  );
}
