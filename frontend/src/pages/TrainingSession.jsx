import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Play } from 'lucide-react';
import useActivitySession from '../hooks/useActivitySession';
import StepQuiz from '../components/quiz/StepQuiz';
import CompanionBubble from '../components/companion/CompanionBubble';
import { ErrorNote } from '../components/ui/Spinner';
import { TRAINING_LEVELS } from './Training';

export default function TrainingSession() {
  const { level } = useParams();
  const navigate = useNavigate();
  const lv = TRAINING_LEVELS.find((l) => l.id === level);
  const quiz = useActivitySession();
  useEffect(() => {
    quiz.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);
  if (!lv) return <ErrorNote>Level latihan tidak ditemukan.</ErrorNote>;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link to="/app/training" className="btn-ghost !px-2"><ArrowLeft size={16} /> Royal Training Zone</Link>
      <header>
        <p className="eyebrow">Royal Training · Level {TRAINING_LEVELS.indexOf(lv) + 1}</p>
        <h1 className="text-2xl sm:text-3xl">{lv.name}</h1>
      </header>
      {!quiz.session && (
        <div className="panel space-y-4">
          <CompanionBubble who={lv.who}>Siap berlatih? Kerjakan satu soal dalam satu waktu. Kalau ragu, tekan <b>Butuh petunjuk?</b></CompanionBubble>
          <ul className="grid gap-2 text-sm sm:grid-cols-3">
            <li className="rounded-2xl bg-royal-lavender/40 p-3"><b>8 soal</b> acak per sesi</li>
            <li className="rounded-2xl bg-royal-lavender/40 p-3"><b>2 kesempatan</b> menjawab tiap soal</li>
            <li className="rounded-2xl bg-royal-lavender/40 p-3"><b>Pembahasan</b> langkah demi langkah</li>
          </ul>
          <ErrorNote>{quiz.error}</ErrorNote>
          <button className="btn-primary w-full text-base" disabled={quiz.busy} onClick={() => quiz.start('training', level)}>
            {quiz.busy ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />} Mulai Latihan
          </button>
        </div>
      )}
      <StepQuiz ctl={quiz} who={lv.who} onRestart={() => quiz.start('training', level)} onFinished={() => navigate('/app/training')} />
    </div>
  );
}
