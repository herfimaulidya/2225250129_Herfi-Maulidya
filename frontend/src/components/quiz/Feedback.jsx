import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import CompanionBubble from '../companion/CompanionBubble';

/** Format jawaban (milik siswa atau kunci) agar mudah dibaca. */
export function formatAnswer(item, ans) {
  if (ans === null || ans === undefined) return '— (tidak dijawab)';
  const opts = Object.fromEntries((item.data?.options || []).map((o) => [o.id, o.label]));
  switch (item.type) {
    case 'mc': return typeof ans === 'object' ? ans.label : opts[ans] ?? ans;
    case 'tf': return ans === true ? 'Benar' : ans === false ? 'Salah' : String(ans);
    case 'sequence': return Array.isArray(ans) ? ans.join(', ') : String(ans);
    case 'multi_select': return (Array.isArray(ans) ? ans : []).map((a) => (typeof a === 'object' ? a.label : opts[a] ?? a)).join(', ');
    case 'steps':
      return item.data.parts.map((p, i) => {
        const v = ans[p.id];
        const label = typeof v === 'object' && v !== null ? v.label
          : p.type === 'mc' ? (p.options.find((o) => o.id === v)?.label ?? v) : v;
        return `Langkah ${i + 1}: ${label ?? '-'}`;
      }).join(' · ');
    default: return String(ans);
  }
}

export function ExplanationSteps({ steps = [] }) {
  if (!steps.length) return null;
  return (
    <ol className="mt-2 space-y-1.5">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-royal-purple text-xs font-extrabold text-white">{i + 1}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

/** Umpan balik setelah menjawab: bukan sekadar benar/salah, tetapi petunjuk + pembahasan bertahap. */
export function FeedbackPanel({ item, feedback, who = 'seraphina' }) {
  if (!feedback) return null;
  const { correct, done } = feedback;
  const tone = correct ? 'success' : done ? 'info' : 'retry';
  return (
    <div className="space-y-3" aria-live="polite">
      <CompanionBubble who={who} tone={tone} mood={correct ? 'happy' : 'think'} size={60}>
        <p className="flex items-center gap-2 font-extrabold">
          {correct ? <CheckCircle2 className="text-royal-leaf" size={20} /> : <XCircle className="text-royal-coral" size={20} />}
          {correct ? 'Jawaban benar!' : done ? 'Belum tepat' : 'Belum tepat — coba lagi'}
        </p>
        <p className="mt-1">{feedback.message}</p>
        {feedback.fraction > 0 && feedback.fraction < 1 && (
          <p className="mt-1 text-sm">Sebagian jawabanmu sudah benar ({Math.round(feedback.fraction * 100)}%). Periksa bagian yang bertanda merah.</p>
        )}
        {feedback.hint && (
          <p className="mt-2 flex gap-2 rounded-xl bg-white/70 p-2 text-sm"><Lightbulb size={18} className="shrink-0 text-royal-gold" /> <span><b>Petunjuk:</b> {feedback.hint}</span></p>
        )}
      </CompanionBubble>
      {done && (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-royal-lavender">
          {!correct && <p className="font-bold">Jawaban yang tepat: <span className="text-royal-purple">{formatAnswer(item, feedback.correct_answer)}</span></p>}
          <p className="mt-2 text-sm font-extrabold uppercase tracking-wide text-royal-purple">Pembahasan langkah demi langkah</p>
          <ExplanationSteps steps={feedback.explanation} />
        </div>
      )}
    </div>
  );
}

/** Rangkuman hasil: benar/salah per soal + pembahasan. */
export function ResultReview({ result }) {
  return (
    <ol className="space-y-3">
      {result.review.map((r) => (
        <li key={r.index} className={`rounded-2xl p-4 ring-1 ${r.correct ? 'bg-royal-mint/40 ring-royal-leaf/30' : 'bg-royal-rose/60 ring-royal-pink'}`}>
          <p className="flex items-start gap-2 font-bold">
            {r.correct ? <CheckCircle2 className="mt-0.5 shrink-0 text-royal-leaf" size={18} /> : <XCircle className="mt-0.5 shrink-0 text-royal-coral" size={18} />}
            <span>{r.index + 1}. {r.prompt}</span>
          </p>
          {r.data?.context && <p className="ml-7 mt-1 text-sm">{r.data.context}</p>}
          <div className="ml-7 mt-2 space-y-1 text-sm">
            <p>Jawabanmu: <b>{r.answered ? formatAnswer(r, r.your_answer) : '— (tidak dijawab)'}</b></p>
            {!r.correct && <p>Jawaban tepat: <b className="text-royal-purple">{formatAnswer(r, r.correct_answer)}</b></p>}
            {r.reason && <p className="italic">Alasanmu: “{r.reason}”</p>}
            <details className="mt-1">
              <summary className="cursor-pointer font-bold text-royal-purple">Lihat pembahasan</summary>
              <ExplanationSteps steps={r.explanation} />
            </details>
          </div>
        </li>
      ))}
    </ol>
  );
}
