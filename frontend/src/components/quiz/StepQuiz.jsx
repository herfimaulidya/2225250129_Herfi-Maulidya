import { useEffect, useState } from 'react';
import { ArrowRight, Lightbulb, RotateCcw, Send } from 'lucide-react';
import QuestionInput, { emptyValue, isComplete, toPayload } from './QuestionInput';
import { FeedbackPanel, ResultReview } from './Feedback';
import { ProgressBar, Stars } from '../ui/Bits';
import { ErrorNote } from '../ui/Spinner';
import CompanionBubble from '../companion/CompanionBubble';

/**
 * Kuis satu-soal-per-layar (mengurangi beban kognitif ekstrinsik):
 * jawab -> umpan balik + petunjuk -> coba lagi -> pembahasan -> soal berikutnya.
 */
export default function StepQuiz({ ctl, who = 'seraphina', onFinished, onRestart, finishLabel = 'Lihat Hasil' }) {
  const { session, result, busy, error } = ctl;
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [reasons, setReasons] = useState({});
  const [hints, setHints] = useState({});

  useEffect(() => {
    setIndex(0);
    setValues({});
    setFeedbacks({});
    setReasons({});
    setHints({});
  }, [session?.id]);

  if (!session) return null;

  if (result) {
    return (
      <div className="space-y-5 animate-fadeup">
        <div className="panel text-center">
          <p className="eyebrow">Hasil {result.title}</p>
          <p className="math mt-2 text-5xl text-royal-purple">{Math.round(result.percent)}</p>
          <p className="text-sm font-semibold text-royal-plum/70">{result.correct_count} dari {result.total_count} soal benar</p>
          <div className="mt-2 flex justify-center"><Stars value={result.stars} size={26} /></div>
          {result.xp_awarded > 0 ? (
            <p className="mt-2 font-bold text-royal-leaf">+{result.xp_awarded} Royal Points</p>
          ) : (
            <p className="mt-2 text-sm text-royal-plum/60">Royal Points untuk tingkat skor ini sudah pernah kamu dapatkan. Tingkatkan skormu untuk XP berikutnya!</p>
          )}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {onRestart && <button className="btn-soft" onClick={onRestart}><RotateCcw size={16} /> Ulangi</button>}
            {onFinished && <button className="btn-primary" onClick={() => onFinished(result)}>Lanjutkan <ArrowRight size={16} /></button>}
          </div>
        </div>
        <CompanionBubble who={who} tone={result.percent >= 70 ? 'success' : 'info'}>
          {result.percent >= 70
            ? 'Wonderful! Pemahamanmu sudah kuat. Lihat pembahasan di bawah untuk memastikan semua langkahmu tepat.'
            : 'Tidak apa-apa! Pelajari pembahasan setiap soal di bawah ini, lalu coba lagi. Setiap percobaan membuatmu makin hebat.'}
        </CompanionBubble>
        <ResultReview result={result} />
      </div>
    );
  }

  const item = session.items[index];
  const value = values[index] ?? emptyValue(item);
  const fb = feedbacks[index];
  const done = fb?.done;
  const last = index === session.items.length - 1;
  const answeredCount = Object.values(feedbacks).filter((f) => f.done).length;

  const submit = async () => {
    const r = await ctl.answer(index, toPayload(item, value), reasons[index]);
    if (r) setFeedbacks((f) => ({ ...f, [index]: r }));
  };
  const askHint = async () => {
    const r = await ctl.hint(index);
    if (r) setHints((h) => ({ ...h, [index]: r.hint }));
  };

  return (
    <div className="space-y-4">
      <ProgressBar value={(answeredCount / session.items.length) * 100} label={`Soal ${index + 1} dari ${session.items.length}`} />
      <section className="panel space-y-5 animate-fadeup" key={index}>
        <div className="flex flex-wrap items-center gap-2">
          {item.literacy_focus && <span className="chip">Literasi: {item.literacy_focus}</span>}
          {item.difficulty && <span className="chip bg-royal-blue/60">Tingkat {item.difficulty}</span>}
        </div>
        <h2 className="text-lg font-extrabold sm:text-xl">{item.prompt}</h2>
        <QuestionInput item={item} value={value} disabled={busy || done} feedback={fb}
          onChange={(v) => {
            setValues((s) => ({ ...s, [index]: v }));
            if (fb && !fb.done) setFeedbacks((f) => ({ ...f, [index]: { ...fb, parts: undefined } }));
          }} />

        {item.ask_reason && (
          <label className="block">
            <span className="mb-1 block text-sm font-bold">Jelaskan caramu menemukan jawaban (dianjurkan)</span>
            <textarea className="field min-h-[80px] text-sm" maxLength={500} disabled={done} value={reasons[index] || ''}
              placeholder="Contoh: Saya melihat polanya 1, 4, 9 adalah bilangan persegi, jadi saya pakai rumus..."
              onChange={(e) => setReasons((r) => ({ ...r, [index]: e.target.value }))} />
          </label>
        )}

        {hints[index] && !done && (
          <p className="flex gap-2 rounded-2xl bg-royal-gold/20 p-3 text-sm"><Lightbulb className="shrink-0 text-royal-gold" size={18} /> {hints[index]}</p>
        )}

        {fb && <FeedbackPanel item={item} feedback={fb} who={who} />}
        <ErrorNote>{error}</ErrorNote>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-royal-lavender/60 pt-4">
          {!done && item.has_hint && !hints[index] && !fb?.hint ? (
            <button className="btn-ghost" onClick={askHint} disabled={busy}><Lightbulb size={16} /> Butuh petunjuk?</button>
          ) : <span />}
          {!done ? (
            <button className="btn-primary" onClick={submit} disabled={busy || !isComplete(item, value)}>
              <Send size={16} /> {busy ? 'Memeriksa...' : fb ? 'Periksa Lagi' : 'Periksa Jawaban'}
            </button>
          ) : last ? (
            <button className="btn-gold" onClick={ctl.finish} disabled={busy}>{busy ? 'Menghitung...' : finishLabel} <ArrowRight size={16} /></button>
          ) : (
            <button className="btn-primary" onClick={() => setIndex(index + 1)}>Soal Berikutnya <ArrowRight size={16} /></button>
          )}
        </div>
        {!done && item.has_hint && <p className="text-right text-xs text-royal-plum/50">Memakai petunjuk sedikit mengurangi skor soal ini.</p>}
      </section>
    </div>
  );
}
