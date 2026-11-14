import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Flag, Loader2, Lock, Play, Target } from 'lucide-react';
import { LESSONS, LESSON_ORDER } from '../content/lessons';
import useStudentData, { lessonState } from '../hooks/useStudentData';
import useActivitySession from '../hooks/useActivitySession';
import { useReward } from '../context/RewardContext';
import { api } from '../lib/api';
import CompanionBubble from '../components/companion/CompanionBubble';
import { PatternRow } from '../components/math/SquareGrid';
import { WIDGETS } from '../components/math/LessonWidgets';
import StepQuiz from '../components/quiz/StepQuiz';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

const CHAPTERS = ['Tujuan', 'Konsep', 'Pola', 'Langkah', 'Contoh', 'Latihan', 'Rangkuman'];

function RevealSteps({ steps }) {
  const [shown, setShown] = useState(1);
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {steps.slice(0, shown).map((s, i) => (
          <li key={i} className="flex gap-3 animate-fadeup">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-royal-purple text-sm font-extrabold text-white">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
      {shown < steps.length
        ? <button className="btn-soft" onClick={() => setShown(shown + 1)}>Tampilkan langkah berikutnya ({shown}/{steps.length})</button>
        : <p className="text-sm font-bold text-royal-leaf">Penyelesaian lengkap ✓</p>}
    </div>
  );
}

export default function Lesson() {
  const { lessonId } = useParams();
  const lesson = LESSONS[lessonId];
  const navigate = useNavigate();
  const { celebrate } = useReward();
  const { progress, lessons, loading, error, reload } = useStudentData(['progress', 'lessons']);
  const quiz = useActivitySession();
  const [chapter, setChapter] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [completeErr, setCompleteErr] = useState('');
  const [completed, setCompleted] = useState(null);

  useEffect(() => {
    setChapter(0);
    setCompleted(null);
    setCompleteErr('');
    quiz.reset();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  if (!lesson) return <ErrorNote>Materi tidak ditemukan. <Link to="/app/map" className="underline">Kembali ke peta</Link></ErrorNote>;
  if (loading && !lessons) return <Spinner label="Membuka wilayah kerajaan..." />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const state = lessonState(lessons || [], progress || []).find((l) => l.id === lessonId);
  if (state && !state.unlocked) {
    return (
      <div className="panel mx-auto max-w-lg space-y-4 text-center">
        <Lock className="mx-auto text-royal-purple" size={40} />
        <h1 className="text-xl">{lesson.region} masih terkunci</h1>
        <p>Selesaikan wilayah sebelumnya terlebih dahulu, ya!</p>
        <Link to="/app/map" className="btn-primary">Kembali ke peta</Link>
      </div>
    );
  }

  const alreadyDone = state?.completed || completed;
  const nextId = LESSON_ORDER[LESSON_ORDER.indexOf(lessonId) + 1];
  const Widget = WIDGETS[lesson.interactive];
  const go = (i) => { setChapter(i); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const completeMission = async () => {
    setCompleting(true);
    setCompleteErr('');
    try {
      const r = await api.completeLesson(lessonId);
      setCompleted(r);
      celebrate(r);
    } catch (e) {
      setCompleteErr(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const practiceDone = Boolean(quiz.result);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/app/map" className="btn-ghost !px-2"><ArrowLeft size={16} /> Peta Kerajaan</Link>
      <header>
        <p className="eyebrow">Level 0{lesson.levelNo} · {lesson.region}</p>
        <h1 className="mt-1 text-2xl sm:text-3xl">{lesson.title}</h1>
        {alreadyDone && <p className="mt-1 flex items-center gap-1 text-sm font-bold text-royal-leaf"><CheckCircle2 size={16} /> Misi sudah selesai — kamu bisa mengulang kapan saja.</p>}
      </header>

      {/* Navigasi bagian materi */}
      <nav className="-mx-4 overflow-x-auto px-4" aria-label="Bagian materi">
        <ol className="flex min-w-max gap-1.5">
          {CHAPTERS.map((c, i) => (
            <li key={c}>
              <button onClick={() => go(i)} aria-current={chapter === i ? 'step' : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-extrabold transition ${chapter === i ? 'bg-royal-purple text-white' : i < chapter ? 'bg-royal-lavender text-royal-purple' : 'bg-white/70 text-royal-plum/60 ring-1 ring-royal-lavender'}`}>
                {i + 1}. {c}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <section className="animate-fadeup space-y-4" key={chapter}>
        {chapter === 0 && (
          <>
            <CompanionBubble who={lesson.companion}>{lesson.greeting}</CompanionBubble>
            <div className="panel">
              <h2 className="mb-3 flex items-center gap-2 text-lg"><Target size={20} className="text-royal-purple" /> Tujuan pembelajaran</h2>
              <ul className="space-y-2">
                {lesson.objectives.map((o) => <li key={o} className="flex gap-2"><CheckCircle2 className="mt-0.5 shrink-0 text-royal-leaf" size={18} />{o}</li>)}
              </ul>
            </div>
          </>
        )}

        {chapter === 1 && (
          <>
            {lesson.concept.map((c, i) => (
              <div key={c.title} className="panel">
                <p className="eyebrow">Konsep {i + 1}</p>
                <h2 className="mt-1 text-lg">{c.title}</h2>
                <p className="mt-2 leading-relaxed">{c.text}</p>
              </div>
            ))}
            {lesson.visual.kind === 'pattern' && (
              <figure className="panel">
                <PatternRow terms={lesson.visual.terms} cell={14} highlight={lesson.visual.highlight} />
                <figcaption className="mt-3 text-center text-sm font-bold text-royal-purple">{lesson.visual.caption}</figcaption>
              </figure>
            )}
          </>
        )}

        {chapter === 2 && (
          <>
            <div className="panel">
              <h2 className="text-lg">Contoh bilangan persegi</h2>
              <p className="math mt-2 text-2xl tracking-wide text-royal-purple">{lesson.numbers.join(', ')}, ...</p>
            </div>
            <div className="panel overflow-x-auto">
              <table className="w-full text-center">
                <thead><tr className="text-sm text-royal-purple">{lesson.table.head.map((h) => <th key={h} className="px-2 py-2">{h}</th>)}</tr></thead>
                <tbody>
                  {lesson.table.rows.map((r, i) => (
                    <tr key={i} className="border-t border-royal-lavender/60">{r.map((c, j) => <td key={j} className="math px-2 py-2">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {Widget && <div className="panel"><p className="eyebrow mb-3">Coba sendiri</p><Widget /></div>}
          </>
        )}

        {chapter === 3 && (
          <div className="panel">
            <h2 className="mb-3 text-lg">Langkah menemukan pola</h2>
            <ol className="space-y-3">
              {lesson.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-royal-gold text-royal-plum">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {chapter === 4 && (
          <div className="panel space-y-4">
            <p className="eyebrow">Contoh soal</p>
            <p className="rounded-2xl bg-royal-blue/40 p-4 font-bold leading-relaxed">{lesson.example.question}</p>
            <h2 className="text-lg">Penyelesaian bertahap</h2>
            <RevealSteps steps={lesson.example.solution} />
          </div>
        )}

        {chapter === 5 && (
          <>
            <CompanionBubble who={lesson.companion} tone="info">
              Saatnya latihan singkat! Jika belum tepat, kamu akan mendapat petunjuk dan boleh mencoba sekali lagi.
            </CompanionBubble>
            {!quiz.session && (
              <div className="panel text-center">
                <p className="mb-3">3 soal · petunjuk tersedia · pembahasan setelah menjawab</p>
                <button className="btn-primary" disabled={quiz.busy} onClick={() => quiz.start('lesson', lessonId)}>
                  {quiz.busy ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Mulai Latihan Singkat
                </button>
              </div>
            )}
            <ErrorNote>{!quiz.session && quiz.error}</ErrorNote>
            <StepQuiz ctl={quiz} who={lesson.companion} finishLabel="Selesai & Lihat Hasil"
              onFinished={() => go(6)} onRestart={() => quiz.start('lesson', lessonId)} />
          </>
        )}

        {chapter === 6 && (
          <>
            <div className="panel bg-gradient-to-br from-white to-royal-lavender/40">
              <h2 className="mb-3 text-lg">Rangkuman</h2>
              <ul className="space-y-2">{lesson.summary.map((s) => <li key={s} className="flex gap-2"><span className="text-royal-gold">✦</span>{s}</li>)}</ul>
            </div>
            <CompanionBubble who={lesson.companion} tone="success">{lesson.closing}</CompanionBubble>
            <div className="panel space-y-3 text-center">
              {alreadyDone ? (
                <p className="flex items-center justify-center gap-2 font-bold text-royal-leaf"><CheckCircle2 /> Misi {lesson.region} selesai!</p>
              ) : (
                <>
                  {!practiceDone && <p className="text-sm text-royal-plum/70">Kerjakan <button className="font-bold text-royal-purple underline" onClick={() => go(5)}>latihan singkat</button> dulu untuk menyelesaikan misi.</p>}
                  <button className="btn-gold text-base" onClick={completeMission} disabled={completing || !practiceDone}>
                    {completing ? <Loader2 className="animate-spin" size={18} /> : <Flag size={18} />} Selesaikan Misi
                  </button>
                </>
              )}
              <ErrorNote>{completeErr}</ErrorNote>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                {nextId ? (
                  <button className="btn-primary" disabled={!alreadyDone} onClick={() => navigate(`/app/lessons/${nextId}`)}>
                    Materi berikutnya: {LESSONS[nextId].region} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button className="btn-primary" disabled={!alreadyDone} onClick={() => navigate('/app/final')}>Menuju Final Royal Quest <ArrowRight size={16} /></button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {chapter !== 5 && (
        <div className="flex justify-between">
          <button className="btn-soft" disabled={chapter === 0} onClick={() => go(chapter - 1)}><ArrowLeft size={16} /> Sebelumnya</button>
          {chapter < CHAPTERS.length - 1 && <button className="btn-primary" onClick={() => go(chapter + 1)}>Lanjut <ArrowRight size={16} /></button>}
        </div>
      )}
      {chapter === 5 && !quiz.session && (
        <div className="flex justify-between">
          <button className="btn-soft" onClick={() => go(4)}><ArrowLeft size={16} /> Sebelumnya</button>
          <button className="btn-ghost" onClick={() => go(6)}>Lewati ke rangkuman <ArrowRight size={16} /></button>
        </div>
      )}
    </div>
  );
}
