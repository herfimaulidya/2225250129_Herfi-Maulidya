import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, ArrowRight, ClipboardCheck, Crown, Flag, Loader2, Lock, Play, Timer } from 'lucide-react';
import useActivitySession from '../hooks/useActivitySession';
import useStudentData, { lessonState } from '../hooks/useStudentData';
import QuestionInput, { emptyValue, isComplete, toPayload } from '../components/quiz/QuestionInput';
import { formatAnswer, ResultReview } from '../components/quiz/Feedback';
import CompanionBubble from '../components/companion/CompanionBubble';
import { SectionTitle, Stars } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';
import { formatDate } from '../lib/levels';

const STORE_KEY = 'royal-final-session';
const store = {
  get: () => { try { return localStorage.getItem(STORE_KEY); } catch { return null; } },
  set: (v) => { try { localStorage.setItem(STORE_KEY, v); } catch { /* abaikan */ } },
  clear: () => { try { localStorage.removeItem(STORE_KEY); } catch { /* abaikan */ } },
};

function useCountdown(expiresAt, onExpire) {
  const [left, setLeft] = useState(null);
  const fired = useRef(false);
  const cb = useRef(onExpire);
  cb.current = onExpire;
  useEffect(() => {
    fired.current = false;
    if (!expiresAt) { setLeft(null); return undefined; }
    const tick = () => {
      const s = Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000));
      setLeft(s);
      if (s === 0 && !fired.current) { fired.current = true; cb.current(); }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return left;
}

export default function FinalQuest() {
  const ctl = useActivitySession();
  const { progress, lessons, quizAttempts, loading, reload } = useStudentData(['progress', 'lessons', 'quizAttempts']);
  const [timed, setTimed] = useState(true);
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState({});
  const [saved, setSaved] = useState({});
  const [reasons, setReasons] = useState({});
  const [reviewing, setReviewing] = useState(false);
  const [resuming, setResuming] = useState(true);

  const loadFromSession = (s) => {
    const v = {};
    const sv = {};
    const rs = {};
    Object.entries(s.responses || {}).forEach(([k, r]) => {
      const item = s.items[+k];
      v[k] = item.type === 'number' ? String(r.answer) : item.type === 'sequence' ? r.answer.map(String) : r.answer;
      sv[k] = true;
      if (r.reason) rs[k] = r.reason;
    });
    setValues(v);
    setSaved(sv);
    setReasons(rs);
    setIndex(0);
    setReviewing(false);
  };

  useEffect(() => {
    const id = store.get();
    if (!id) { setResuming(false); return; }
    ctl.resume(id).then((s) => {
      if (s?.status === 'active') loadFromSession(s);
      else { store.clear(); ctl.reset(); }
      setResuming(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitAll = useCallback(async () => {
    const r = await ctl.finish();
    if (r) { store.clear(); reload(); }
  }, [ctl, reload]);

  const left = useCountdown(ctl.result ? null : ctl.session?.expires_at, submitAll);

  if (loading && !lessons) return <Spinner />;
  if (resuming) return <Spinner label="Memeriksa evaluasi yang sedang berjalan..." />;

  const ls = lessonState(lessons || [], progress || []);
  const unlocked = ls.length > 0 && ls.every((l) => l.completed);
  const history = (quizAttempts || []).filter((a) => a.quiz_id === 'final');

  // ---------- HASIL ----------
  if (ctl.result) {
    const r = ctl.result;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="panel bg-gradient-to-b from-royal-lavender/50 to-white text-center">
          <Crown className="mx-auto text-royal-gold" size={44} />
          <p className="eyebrow mt-2">Hasil The Royal Final Quest</p>
          <p className="math text-6xl text-royal-purple">{Math.round(r.percent)}</p>
          <div className="flex justify-center"><Stars value={r.stars} size={28} /></div>
          <div className="mt-3 flex justify-center gap-6 text-sm font-bold">
            <span className="text-royal-leaf">✓ {r.correct_count} benar</span>
            <span className="text-royal-coral">✗ {r.total_count - r.correct_count} salah/kosong</span>
          </div>
          {r.xp_awarded > 0 && <p className="mt-2 font-bold text-royal-leaf">+{r.xp_awarded} Royal Points</p>}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button className="btn-soft" onClick={() => { ctl.reset(); }}>Kembali ke halaman Final Quest</button>
            <Link to="/app/profile" className="btn-primary">Lihat profil</Link>
          </div>
        </div>
        <CompanionBubble who="marina" tone={r.percent >= 70 ? 'success' : 'info'}>
          {r.percent >= 70 ? 'Congratulations, Royal Champion! Kamu menguasai pola bilangan persegi.' : 'Perjalananmu belum berakhir! Pelajari pembahasannya, ulangi materi yang masih sulit, lalu coba lagi.'}
        </CompanionBubble>
        <h2 className="text-xl">Pembahasan</h2>
        <ResultReview result={r} />
      </div>
    );
  }

  // ---------- SEDANG MENGERJAKAN ----------
  if (ctl.session && ctl.session.kind === 'final') {
    const items = ctl.session.items;
    const item = items[index];
    const value = values[index] ?? emptyValue(item);
    const answeredCount = Object.keys(saved).length;
    const mm = left !== null ? `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` : null;

    const save = async (goTo) => {
      if (isComplete(item, value)) {
        const res = await ctl.answer(index, toPayload(item, value), reasons[index]);
        if (!res) return;
        setSaved((s) => ({ ...s, [index]: true }));
      }
      if (goTo === 'review') setReviewing(true);
      else if (goTo !== undefined) setIndex(goTo);
    };

    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="sticky top-[60px] z-20 flex items-center justify-between gap-2 rounded-2xl bg-white/95 px-4 py-2 shadow-soft">
          <span className="text-sm font-extrabold">Terjawab {answeredCount}/{items.length}</span>
          {mm && <span className={`math flex items-center gap-1 rounded-full px-3 py-1 ${left < 60 ? 'bg-royal-rose text-royal-coral' : 'bg-royal-lavender/60'}`}><Timer size={16} /> {mm}</span>}
        </div>

        <nav aria-label="Navigasi nomor soal" className="flex flex-wrap gap-2">
          {items.map((_, i) => (
            <button key={i} onClick={() => save(i)} disabled={ctl.busy} aria-current={i === index && !reviewing ? 'true' : undefined}
              className={`math h-10 w-10 rounded-xl text-sm transition ${i === index && !reviewing ? 'bg-royal-purple text-white' : saved[i] ? 'bg-royal-gold/60' : 'bg-white ring-1 ring-royal-lavender'}`}>{i + 1}</button>
          ))}
          <button onClick={() => save('review')} disabled={ctl.busy} className={`flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-extrabold ${reviewing ? 'bg-royal-purple text-white' : 'bg-royal-lavender/60'}`}>
            <ClipboardCheck size={16} /> Periksa
          </button>
        </nav>

        {reviewing ? (
          <section className="panel space-y-4">
            <h2 className="text-lg">Periksa kembali jawabanmu</h2>
            <p className="text-sm text-royal-plum/70">Kunci jawaban baru ditampilkan setelah kamu mengirim. Ketuk nomor untuk mengubah jawaban.</p>
            <ol className="space-y-2">
              {items.map((it, i) => {
                const raw = ctl.session.responses?.[i]?.answer;
                const shown = saved[i] ? formatAnswer(it, toPayload(it, values[i] ?? raw)) : null;
                return (
                  <li key={i}>
                    <button onClick={() => { setReviewing(false); setIndex(i); }} className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left ring-1 ring-royal-lavender hover:ring-royal-purple">
                      <span className="math grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-royal-lavender">{i + 1}</span>
                      <span className="flex-1 text-sm"><span className="line-clamp-1 font-bold">{it.prompt}</span>
                        {shown ? <span className="text-royal-purple">Jawabanmu: {shown}</span> : <span className="flex items-center gap-1 font-bold text-royal-coral"><AlertTriangle size={14} /> Belum dijawab</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            {answeredCount < items.length && <p className="rounded-xl bg-royal-gold/25 p-3 text-sm font-bold">Masih ada {items.length - answeredCount} soal kosong. Soal kosong dinilai 0.</p>}
            <ErrorNote>{ctl.error}</ErrorNote>
            <button className="btn-gold w-full text-base" disabled={ctl.busy}
              onClick={() => { if (window.confirm('Kirim semua jawaban sekarang? Setelah dikirim, jawaban tidak bisa diubah.')) submitAll(); }}>
              {ctl.busy ? <Loader2 className="animate-spin" size={18} /> : <Flag size={18} />} Kirim Jawaban
            </button>
          </section>
        ) : (
          <section className="panel space-y-5 animate-fadeup" key={index}>
            <p className="eyebrow">Soal {index + 1} dari {items.length}</p>
            <h2 className="text-lg font-extrabold">{item.prompt}</h2>
            <QuestionInput item={item} value={value} disabled={ctl.busy}
              onChange={(v) => { setValues((s) => ({ ...s, [index]: v })); }} />
            {item.ask_reason && (
              <label className="block">
                <span className="mb-1 block text-sm font-bold">Jelaskan caramu (dianjurkan)</span>
                <textarea className="field min-h-[72px] text-sm" maxLength={500} value={reasons[index] || ''}
                  onChange={(e) => setReasons((r) => ({ ...r, [index]: e.target.value }))} />
              </label>
            )}
            <ErrorNote>{ctl.error}</ErrorNote>
            <div className="flex justify-between gap-2 border-t border-royal-lavender/60 pt-4">
              <button className="btn-soft" disabled={index === 0 || ctl.busy} onClick={() => save(index - 1)}><ArrowLeft size={16} /> Sebelumnya</button>
              {index < items.length - 1
                ? <button className="btn-primary" disabled={ctl.busy} onClick={() => save(index + 1)}>Simpan & Lanjut <ArrowRight size={16} /></button>
                : <button className="btn-gold" disabled={ctl.busy} onClick={() => save('review')}>Simpan & Periksa <ClipboardCheck size={16} /></button>}
            </div>
          </section>
        )}
      </div>
    );
  }

  // ---------- HALAMAN AWAL ----------
  const begin = async () => {
    const s = await ctl.start('final', 'final', { timed });
    if (s) { store.set(s.id); loadFromSession(s); }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionTitle eyebrow="Evaluasi Akhir" title="The Royal Final Quest" icon={Crown}>
        Soal diambil dari seluruh materi pola bilangan persegi, berurutan dari mudah ke sulit.
      </SectionTitle>
      {!unlocked ? (
        <div className="panel space-y-3 text-center">
          <Lock className="mx-auto text-royal-purple" size={36} />
          <p className="font-bold">Final Quest terbuka setelah keempat wilayah kerajaan diselesaikan.</p>
          <p className="text-sm">{ls.filter((l) => l.completed).length} dari {ls.length} wilayah selesai.</p>
          <Link to="/app/map" className="btn-primary">Lanjutkan petualangan</Link>
        </div>
      ) : (
        <div className="panel space-y-4">
          <CompanionBubble who="marina">Ini tantangan terakhirmu, Royal Adventurer! Kerjakan dengan tenang. Kamu bisa memeriksa ulang jawaban sebelum mengirim.</CompanionBubble>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            <li className="rounded-2xl bg-royal-lavender/40 p-3">Pilihan ganda, benar/salah, isian, pola, dan soal cerita</li>
            <li className="rounded-2xl bg-royal-lavender/40 p-3">Navigasi nomor soal & halaman periksa ulang</li>
            <li className="rounded-2xl bg-royal-lavender/40 p-3">Kunci dan pembahasan muncul setelah dikirim</li>
            <li className="rounded-2xl bg-royal-lavender/40 p-3">Jawaban tersimpan otomatis bila halaman dimuat ulang</li>
          </ul>
          <label className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-royal-lavender">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} className="h-5 w-5 accent-royal-purple" />
            <span className="text-sm"><b>Gunakan timer</b> (opsional). Jawaban terkirim otomatis saat waktu habis.</span>
          </label>
          <ErrorNote>{ctl.error}</ErrorNote>
          <button className="btn-primary w-full text-base" onClick={begin} disabled={ctl.busy}>
            {ctl.busy ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Mulai Final Quest
          </button>
        </div>
      )}
      {history.length > 0 && (
        <section className="panel">
          <h2 className="mb-3 text-lg">Riwayat evaluasi</h2>
          <ul className="divide-y divide-royal-lavender/60">
            {history.map((h) => (
              <li key={h.id} className="flex items-center justify-between py-2 text-sm">
                <span>{formatDate(h.submitted_at)}</span>
                <span className="font-bold">{h.correct_count}/{h.total_count} benar · <span className="math text-royal-purple">{Math.round(h.percent)}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
