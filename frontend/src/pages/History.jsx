import { useState } from 'react';
import { History as HistoryIcon } from 'lucide-react';
import useStudentData from '../hooks/useStudentData';
import { formatDate } from '../lib/levels';
import { SectionTitle } from '../components/ui/Bits';
import Spinner, { ErrorNote } from '../components/ui/Spinner';

const TYPES = {
  lesson_check: 'Latihan materi', lesson_complete: 'Misi materi', training: 'Latihan', game: 'Permainan',
  final: 'Evaluasi', badge: 'Lencana', login: 'Masuk',
};
const FILTERS = [['all', 'Semua'], ['lesson', 'Materi'], ['training', 'Latihan'], ['game', 'Permainan'], ['final', 'Evaluasi']];

export default function History() {
  const { activity, loading, error, reload } = useStudentData(['activity']);
  const [filter, setFilter] = useState('all');
  if (loading && !activity) return <Spinner />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const rows = (activity || []).filter((a) => a.activity_type !== 'login')
    .filter((a) => filter === 'all' || a.activity_type.startsWith(filter));

  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Riwayat Belajar" title="Jejak Petualanganku" icon={HistoryIcon}>Semua aktivitas yang tersimpan di akunmu.</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id}
            className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${filter === id ? 'bg-royal-purple text-white' : 'bg-white/80 ring-1 ring-royal-lavender'}`}>{label}</button>
        ))}
      </div>
      <div className="panel overflow-x-auto !p-0">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-royal-lavender/40 text-royal-purple">
            <tr><th className="px-4 py-3">Tanggal</th><th>Jenis aktivitas</th><th>Materi / permainan</th><th className="text-center">Nilai</th><th className="pr-4">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-t border-royal-lavender/50">
                <td className="whitespace-nowrap px-4 py-2.5">{formatDate(a.created_at)}</td>
                <td>{TYPES[a.activity_type] || a.activity_type}</td>
                <td className="font-semibold">{a.title}</td>
                <td className="math text-center">{a.score != null ? Math.round(a.score) : '-'}</td>
                <td className="pr-4"><span className="chip">{a.status === 'earned' ? 'diperoleh' : 'selesai'}</span></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-royal-plum/60">Belum ada aktivitas di kategori ini.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
