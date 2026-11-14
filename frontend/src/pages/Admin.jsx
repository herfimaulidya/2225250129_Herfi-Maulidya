import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import Logo from '../components/art/Logo';
import { api } from '../lib/api';
import { ErrorNote } from '../components/ui/Spinner';

/**
 * Halaman guru untuk mendaftarkan kode siswa.
 * Kunci admin hanya disimpan di sessionStorage (hilang saat tab ditutup)
 * dan diverifikasi oleh backend — tidak ada rahasia di kode frontend.
 */
const KEY = 'royal-admin-key';
const readKey = () => {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
};

export default function Admin() {
  const [adminKey, setAdminKey] = useState(readKey);
  const [keyInput, setKeyInput] = useState('');
  const [students, setStudents] = useState(null);
  const [form, setForm] = useState({ student_code: '', full_name: '', class_name: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async (k = adminKey) => {
    setBusy(true);
    setError('');
    try {
      setStudents(await api.admin.list(k));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const unlock = async (e) => {
    e.preventDefault();
    if (!keyInput.trim()) return setError('Kunci admin belum diisi.');
    if (await load(keyInput.trim())) {
      setAdminKey(keyInput.trim());
      try { sessionStorage.setItem(KEY, keyInput.trim()); } catch { /* abaikan */ }
    }
  };

  const lock = () => {
    try { sessionStorage.removeItem(KEY); } catch { /* abaikan */ }
    setAdminKey('');
    setStudents(null);
  };

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const p = await api.admin.create(adminKey, { ...form, class_name: form.class_name || null });
      setNotice(`Kode ${p.student_code} untuk ${p.full_name} berhasil didaftarkan.`);
      setForm({ student_code: '', full_name: '', class_name: form.class_name });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`Hapus ${s.full_name} (${s.student_code})? Seluruh progres siswa ini akan ikut terhapus.`)) return;
    setBusy(true);
    try {
      await api.admin.remove(adminKey, s.id);
      await load();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  useEffect(() => {
    if (adminKey) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <Logo />
        <Link to="/" className="btn-ghost"><ArrowLeft size={16} /> Beranda</Link>
      </div>
      <h1 className="flex items-center gap-2 text-2xl"><ShieldCheck className="text-royal-purple" /> Pengelolaan Kode Siswa</h1>

      {!adminKey || students === null ? (
        <form onSubmit={unlock} className="panel max-w-md space-y-3">
          <p className="text-sm text-royal-plum/75">Halaman khusus guru. Masukkan <b>ADMIN_API_KEY</b> yang diatur di server backend.</p>
          <input type="password" className="field" placeholder="Kunci admin" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
          <ErrorNote>{error}</ErrorNote>
          <button className="btn-primary w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" size={18} /> : 'Buka'}</button>
        </form>
      ) : (
        <>
          <form onSubmit={add} className="panel grid gap-3 sm:grid-cols-[1fr_1.4fr_.8fr_auto] sm:items-end">
            <label className="text-sm font-bold">Kode siswa
              <input className="field mt-1 uppercase" required maxLength={20} placeholder="RA-7A-01" value={form.student_code}
                onChange={(e) => setForm({ ...form, student_code: e.target.value.toUpperCase() })} />
            </label>
            <label className="text-sm font-bold">Nama lengkap
              <input className="field mt-1" required maxLength={80} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </label>
            <label className="text-sm font-bold">Kelas
              <input className="field mt-1" maxLength={30} placeholder="7A" value={form.class_name} onChange={(e) => setForm({ ...form, class_name: e.target.value })} />
            </label>
            <button className="btn-primary" disabled={busy}><Plus size={16} /> Tambah</button>
          </form>
          {notice && <p className="rounded-2xl bg-royal-mint/60 px-4 py-3 text-sm font-bold">{notice}</p>}
          <ErrorNote>{error}</ErrorNote>
          <section className="panel">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg"><Users size={18} /> {students.length} siswa terdaftar</h2>
              <button className="btn-ghost" onClick={lock}><LogOut size={16} /> Kunci</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-royal-purple"><tr><th className="py-2">Kode</th><th>Nama</th><th>Kelas</th><th /></tr></thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t border-royal-lavender/60">
                      <td className="py-2 font-display font-bold">{s.student_code}</td>
                      <td>{s.full_name}</td>
                      <td>{s.class_name || '-'}</td>
                      <td className="text-right">
                        <button className="btn-ghost !min-h-[36px] !px-2 text-royal-coral" onClick={() => remove(s)} aria-label={`Hapus ${s.full_name}`}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                  {!students.length && <tr><td colSpan={4} className="py-6 text-center text-royal-plum/60">Belum ada siswa. Tambahkan kode pertama di atas.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
