import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History as HistoryIcon, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useStudentData from '../hooks/useStudentData';
import { levelInfo } from '../lib/levels';
import Princess from '../components/art/Princess';
import { BadgeIcon, SectionTitle } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

export default function Profile() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { stats, achievements, earned, quizAttempts, loading, error, reload } =
    useStudentData(['stats', 'achievements', 'earned', 'quizAttempts']);
  if (loading && !stats && !achievements) return <Spinner />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const xp = stats?.total_xp || 0;
  const lv = levelInfo(xp);
  const earnedIds = new Set((earned || []).map((e) => e.achievement_id));
  const latestFinal = (quizAttempts || []).find((q) => q.quiz_id === 'final');
  const fmt = (v) => (v === null || v === undefined ? '-' : Math.round(v));

  const doLogout = async () => {
    setBusy(true);
    await logout();
    navigate('/login', { replace: true });
  };

  const rows = [
    ['Nama siswa', profile.full_name],
    ['Kode siswa', profile.student_code],
    ['Kelas', profile.class_name || '-'],
    ['Total Royal Points', xp],
    ['Royal Level', `${lv.level} · ${lv.title}`],
    ['Misi selesai', `${stats?.missions_completed ?? 0} dari 4`],
    ['Jumlah permainan', stats?.games_played ?? 0],
    ['Latihan dikerjakan', stats?.trainings_completed ?? 0],
    ['Nilai latihan terbaik', fmt(stats?.best_training_score)],
    ['Nilai evaluasi terbaik', fmt(stats?.best_final_score)],
    ['Nilai evaluasi terakhir', fmt(latestFinal?.percent)],
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <SectionTitle eyebrow="My Royal Profile" title="Profil Kerajaanku" icon={User} />
      <section className="panel flex flex-col items-center gap-4 sm:flex-row">
        <Princess who="seraphina" size={88} />
        <div className="flex-1 text-center sm:text-left">
          <p className="text-2xl font-extrabold">{profile.full_name}</p>
          <p className="font-display text-royal-purple">{profile.student_code}</p>
        </div>
        <button onClick={doLogout} disabled={busy} className="btn-primary"><LogOut size={16} /> {busy ? 'Keluar...' : 'Keluar (Logout)'}</button>
      </section>
      <section className="panel">
        <dl className="divide-y divide-royal-lavender/60">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="font-bold text-royal-plum/70">{k}</dt><dd className="text-right font-extrabold">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2 className="mb-3 text-lg">Princess Badges yang diperoleh</h2>
        {earnedIds.size ? (
          <ul className="flex flex-wrap gap-4">
            {(achievements || []).filter((a) => earnedIds.has(a.id)).map((a) => (
              <li key={a.id} className="flex w-24 flex-col items-center gap-1 text-center text-xs font-bold"><BadgeIcon icon={a.icon} size={52} />{a.title}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-royal-plum/60">Belum ada lencana. Selesaikan misi pertamamu untuk mendapatkannya!</p>}
      </section>
      <Link to="/app/history" className="btn-soft w-full"><HistoryIcon size={16} /> Lihat riwayat aktivitas lengkap</Link>
    </div>
  );
}
