import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Crown, FlaskConical, Gamepad2, KeyRound, LogIn, Map, Sparkles, Swords, Trophy, Wand2 } from 'lucide-react';
import Logo from '../components/art/Logo';
import Castle from '../components/art/Castle';
import Princess from '../components/art/Princess';
import { PatternRow } from '../components/math/SquareGrid';
import { useAuth } from '../context/AuthContext';

const MagicTiles3D = lazy(() => import('../components/math/MagicTiles3D'));

const DISCOVER = [
  'Mengenal pola bilangan persegi',
  'Mengamati susunan bilangan persegi',
  'Menentukan suku berikutnya',
  'Menemukan hubungan antarbilangan',
  'Memahami rumus pola bilangan persegi',
  'Menerapkan pola dalam permasalahan kontekstual',
];

const FEATURES = [
  { icon: BookOpen, title: 'Interactive Lessons', text: 'Empat wilayah kerajaan dengan materi bertahap dan latihan singkat.' },
  { icon: Sparkles, title: 'Magical Pattern Visualization', text: 'Lihat susunan kotak membentuk persegi, dari 1 × 1 hingga n × n.' },
  { icon: Swords, title: 'Royal Training Zone', text: 'Latihan tiga tingkat dengan petunjuk dan pembahasan langkah demi langkah.' },
  { icon: Gamepad2, title: 'Princess Mini Games', text: 'Lima permainan dengan mekanisme berbeda.' },
  { icon: Wand2, title: 'Mathematical Challenges', text: 'Soal cerita kontekstual untuk melatih literasi matematis.' },
  { icon: Crown, title: 'Final Royal Quest', text: 'Evaluasi akhir dengan navigasi soal dan pembahasan.' },
  { icon: Trophy, title: 'Royal Points & Achievements', text: 'Kumpulkan XP, naik Royal Level, dan raih Princess Badges.' },
];

const HOW = ['Masukkan kode siswa', 'Masuk ke Enchanted Kingdom', 'Jelajahi materi pembelajaran', 'Selesaikan royal missions', 'Kumpulkan Royal Points', 'Ikuti final challenge'];

export default function Landing() {
  const { session } = useAuth();
  const startTo = session ? '/app' : '/login';
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Logo />
        <Link to={startTo} className="btn-soft"><LogIn size={16} /> {session ? 'Dashboard' : 'Masuk'}</Link>
      </header>

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-4 md:grid-cols-2 md:pt-10">
        <div className="animate-fadeup">
          <p className="eyebrow">A Magical Journey to Discover the World of Numbers!</p>
          <h1 className="mt-3 font-display text-4xl text-royal-plum sm:text-5xl">Your Magical Journey Begins Here!</h1>
          <p className="mt-4 max-w-lg text-lg text-royal-plum/80">
            Jelajahi Enchanted Kingdom bersama para putri pemandu, pecahkan misteri <b>pola bilangan persegi</b>,
            dan buka gerbang kerajaan satu per satu.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={startTo} className="btn-primary text-base"><Sparkles size={18} /> START YOUR ADVENTURE</Link>
            <Link to="/login" className="btn-soft text-base"><KeyRound size={18} /> Masuk dengan Kode Siswa</Link>
          </div>
        </div>
        <div className="relative">
          <Castle className="w-full drop-shadow-xl" />
          <Princess who="seraphina" size={92} className="absolute -bottom-4 left-2 animate-floaty drop-shadow-lg sm:left-6" />
        </div>
      </section>

      {/* ABOUT */}
      <section className="bg-white/60 py-12">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="eyebrow">About Royal Adventure</p>
            <h2 className="mt-2 text-3xl">Belajar matematika lewat petualangan kerajaan</h2>
            <p className="mt-3 text-royal-plum/80">
              ROYAL ADVENTURE adalah media pembelajaran matematika interaktif berbasis permainan untuk siswa SMP.
              Kamu akan memahami pola bilangan persegi dengan mengamati susunan kotak, menemukan polanya sendiri,
              lalu menggunakannya untuk memecahkan masalah sehari-hari.
            </p>
          </div>
          <div className="panel">
            <PatternRow terms={[1, 2, 3, 4]} cell={13} />
            <p className="mt-3 text-center text-sm font-bold text-royal-purple">1, 4, 9, 16, ... apa berikutnya?</p>
          </div>
        </div>
      </section>

      {/* DISCOVER */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">What Will You Discover?</p>
        <h2 className="mt-2 text-3xl">Enam rahasia yang akan kamu temukan</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DISCOVER.map((d, i) => (
            <li key={d} className="flex items-center gap-3 rounded-2xl bg-white/80 p-4 ring-1 ring-royal-lavender">
              <span className="math grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-royal-pink/60 text-royal-plum">{(i + 1) ** 2}</span>
              <span className="font-bold">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* FEATURES */}
      <section className="bg-gradient-to-b from-royal-lavender/40 to-transparent py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="eyebrow">Magical Features</p>
          <h2 className="mt-2 text-3xl">Fitur ajaib di kerajaan</h2>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-royal-purple text-white"><Icon size={20} /></span>
                  <span><b className="block">{title}</b><span className="text-sm text-royal-plum/75">{text}</span></span>
                </li>
              ))}
            </ul>
            <Suspense fallback={<div className="h-[300px] rounded-3xl bg-royal-lavender/40" />}>
              <MagicTiles3D n={4} height={300} label="4 × 4 = 16 ubin kristal" />
            </Suspense>
          </div>
        </div>
      </section>

      {/* HOW TO PLAY */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">How to Play</p>
        <h2 className="mt-2 text-3xl">Cara memulai petualangan</h2>
        <ol className="relative mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {HOW.map((h, i) => (
            <li key={h} className="flex flex-col items-center text-center">
              <span className="font-display grid h-12 w-12 place-items-center rounded-full bg-royal-gold text-lg text-royal-plum shadow-soft">{i + 1}</span>
              <span className="mt-2 text-sm font-bold">{h}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <Map className="text-royal-purple" />
          <Link to={startTo} className="btn-primary text-base"><Sparkles size={18} /> START YOUR ADVENTURE</Link>
        </div>
      </section>

      <footer className="border-t border-royal-lavender/60 py-6 text-center text-xs text-royal-plum/60">
        ROYAL ADVENTURE · Media pembelajaran pola bilangan persegi untuk SMP.<br />
        Ilustrasi dan karakter adalah karya orisinal bergaya dongeng; bukan aset resmi Disney.
        {' · '}<Link to="/admin" className="underline">Halaman guru</Link>
      </footer>
    </div>
  );
}
