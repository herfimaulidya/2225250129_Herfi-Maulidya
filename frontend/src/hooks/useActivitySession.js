import { useCallback, useState } from 'react';
import { api } from '../lib/api';
import { useReward } from '../context/RewardContext';

/** Mengelola satu sesi aktivitas di server: mulai, jawab, petunjuk, selesai. */
export default function useActivitySession() {
  const { celebrate } = useReward();
  const [session, setSession] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy(false);
    }
  }, []);

  const start = useCallback((kind, refId, opts) => run(async () => {
    setResult(null);
    const s = await api.startSession(kind, refId, opts);
    setSession(s);
    return s;
  }), [run]);

  /** Lanjutkan sesi yang sudah ada (mis. setelah halaman dimuat ulang). */
  const resume = useCallback((id) => run(async () => {
    const s = await api.getSession(id);
    setSession(s);
    if (s.result) setResult(s.result);
    return s;
  }), [run]);

  const answer = useCallback((index, value, reason) => run(() => api.answer(session.id, index, value, reason)), [run, session]);

  const hint = useCallback((index) => run(() => api.hint(session.id, index)), [run, session]);

  const finish = useCallback(() => run(async () => {
    const r = await api.finish(session.id);
    setResult(r);
    celebrate(r);
    return r;
  }), [run, session, celebrate]);

  const reset = useCallback(() => {
    setSession(null);
    setResult(null);
    setError(null);
  }, []);

  return { session, result, busy, error, setError, start, resume, answer, hint, finish, reset };
}
