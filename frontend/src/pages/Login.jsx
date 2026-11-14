import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2, Sparkles } from 'lucide-react';
import Logo from '../components/art/Logo';
import Castle from '../components/art/Castle';
import CompanionBubble from '../components/companion/CompanionBubble';
import { useAuth } from '../context/AuthContext';

const CODE_RE = /^[A-Z0-9-]{4,20}$/;

export function validateCode(raw) {
  const code = (raw || '').trim().toUpperCase();
  if (!code) return { error: 'Kode siswa belum diisi.' };
  if (!CODE_RE.test(code)) return { error: 'Kode hanya boleh berisi 4–20 huruf, angka, atau tanda - (contoh: RA-7A-01).' };
  return { code };
}

export default function Login() {
  const { login, session, profile, configured } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (session && profile) return <Navigate to="/app" replace />;

  const submit = async (e) => {
    e.preventDefault();
    const v = validateCode(code);
    if (v.error) {
      setError(v.error);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await login(v.code);
      navigate(location.state?.from || '/app', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl items-center gap-8 px-4 py-8 md:grid-cols-2">
      <div className="hidden md:block">
        <Castle className="w-full drop-shadow-xl" />
      </div>
      <div className="space-y-5">
        <Link to="/" className="btn-ghost !px-2"><ArrowLeft size={16} /> Beranda</Link>
        <Logo size="lg" />
        <div>
          <h1 className="font-display text-3xl">Welcome to Enchanted Kingdom!</h1>
          <p className="mt-1 text-royal-plum/75">Your magical learning adventure begins here.</p>
        </div>
        <CompanionBubble who="seraphina" size={64}>
          Halo, Royal Adventurer! Masukkan <b>kode siswa</b> dari gurumu untuk membuka gerbang kerajaan.
        </CompanionBubble>

        {!configured && (
          <div className="rounded-2xl bg-royal-gold/25 p-4 text-sm ring-1 ring-royal-gold" role="alert">
            <b>Supabase belum dikonfigurasi.</b> Isi <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> di
            <code> frontend/.env</code> (lihat README), lalu jalankan ulang aplikasi. Login dinonaktifkan sampai konfigurasi lengkap.
          </div>
        )}

        <form onSubmit={submit} className="panel space-y-4" noValidate>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-extrabold"><KeyRound size={16} /> Kode Siswa</span>
            <input className="field font-display uppercase tracking-widest" value={code} autoComplete="off" autoCapitalize="characters"
              placeholder="contoh: RA-7A-01" maxLength={20} aria-invalid={Boolean(error)} aria-describedby="login-error"
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }} disabled={busy || !configured} />
          </label>
          {error && <p id="login-error" className="rounded-xl bg-royal-rose px-3 py-2 text-sm font-bold text-royal-coral" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full text-base" disabled={busy || !configured}>
            {busy ? <><Loader2 className="animate-spin" size={18} /> Membuka gerbang...</> : <><Sparkles size={18} /> ENTER KINGDOM</>}
          </button>
          <p className="text-center text-xs text-royal-plum/60">Belum punya kode? Minta kepada guru matematikamu.</p>
        </form>
      </div>
    </div>
  );
}
