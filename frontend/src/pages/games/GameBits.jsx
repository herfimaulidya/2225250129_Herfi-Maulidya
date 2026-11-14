import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { ExplanationSteps, formatAnswer } from '../../components/quiz/Feedback';
import { ErrorNote } from '../../components/ui/Spinner';

export function RoundHeader({ r, label = 'Ronde', extra }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex gap-1.5" aria-label={`${label} ${r.index + 1} dari ${r.total}`}>
        {Array.from({ length: r.total }, (_, i) => {
          const f = r.feedbacks[i];
          const cls = f?.done ? (f.correct ? 'bg-royal-leaf' : 'bg-royal-coral') : i === r.index ? 'bg-royal-purple' : 'bg-royal-lavender';
          return <span key={i} className={`h-2.5 w-6 rounded-full ${cls}`} />;
        })}
      </div>
      <span className="text-sm font-extrabold">{label} {r.index + 1}/{r.total}{extra}</span>
    </div>
  );
}

/** Umpan balik ringkas khas permainan + tombol lanjut. */
export function RoundFeedback({ r, ctl, nextLabel = 'Ronde berikutnya', finishLabel = 'Lihat hasil akhir' }) {
  const { fb, item } = r;
  return (
    <div className="space-y-3">
      <ErrorNote>{ctl.error}</ErrorNote>
      {fb && (
        <div className={`rounded-2xl p-4 ${fb.correct ? 'bg-royal-mint/70' : fb.done ? 'bg-royal-blue/50' : 'bg-royal-rose'} animate-pop`} aria-live="polite">
          <p className="flex items-center gap-2 font-extrabold">
            {fb.correct ? <CheckCircle2 className="text-royal-leaf" /> : <XCircle className="text-royal-coral" />} {fb.message}
          </p>
          {fb.hint && !fb.done && <p className="mt-1 text-sm"><b>Petunjuk:</b> {fb.hint}</p>}
          {fb.done && (
            <>
              {!fb.correct && <p className="mt-1 text-sm">Jawaban tepat: <b>{formatAnswer(item, fb.correct_answer)}</b></p>}
              <div className="text-sm"><ExplanationSteps steps={fb.explanation} /></div>
            </>
          )}
        </div>
      )}
      {fb?.done && (
        <button className={r.last ? 'btn-gold w-full' : 'btn-primary w-full'} onClick={r.next} disabled={ctl.busy}>
          {r.last ? finishLabel : nextLabel} <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}
