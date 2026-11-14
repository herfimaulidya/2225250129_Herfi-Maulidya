import { useState } from 'react';
import { emptyValue, toPayload } from '../../components/quiz/QuestionInput';

/** Status ronde permainan: jawaban, umpan balik server, dan perpindahan ronde. */
export default function useRounds(ctl) {
  const { session } = ctl;
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [hints, setHints] = useState({});

  const item = session.items[index];
  const value = values[index] ?? emptyValue(item);
  const fb = feedbacks[index];
  const last = index === session.items.length - 1;
  const points = Object.values(feedbacks).filter((f) => f.done).reduce((s, f) => s + (f.correct ? 1 : 0), 0);

  return {
    index, item, value, fb, last, points, hint: hints[index],
    total: session.items.length,
    feedbacks,
    setValue: (v) => setValues((s) => ({ ...s, [index]: v })),
    submit: async (override) => {
      const r = await ctl.answer(index, toPayload(item, override ?? value));
      if (r) setFeedbacks((f) => ({ ...f, [index]: r }));
      return r;
    },
    askHint: async () => {
      const r = await ctl.hint(index);
      if (r) setHints((h) => ({ ...h, [index]: r.hint }));
    },
    next: () => (last ? ctl.finish() : setIndex(index + 1)),
  };
}
