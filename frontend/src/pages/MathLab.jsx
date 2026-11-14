import { lazy, Suspense, useState } from 'react';
import { Box, Calculator, FlaskConical, Grid3x3, Minus, Plus, Sparkles, Table } from 'lucide-react';
import SquareGrid from '../components/math/SquareGrid';
import CompanionBubble from '../components/companion/CompanionBubble';
import { SectionTitle } from '../components/ui/Bits';
import { formulaSteps, parseTermNumber, square, sub } from '../lib/math';

const MagicTiles3D = lazy(() => import('../components/math/MagicTiles3D'));

const TABS = [
  { id: 'viz', label: 'Pattern Visualization', icon: Sparkles },
  { id: 'builder', label: 'Pattern Builder', icon: Grid3x3 },
  { id: 'explorer', label: 'Number Explorer', icon: Table },
  { id: 'calc', label: 'Formula Calculator', icon: Calculator },
];

/** A. Magical Pattern Visualization */
function Visualization() {
  const [n, setN] = useState(3);
  return (
    <div className="space-y-4">
      <p className="text-sm font-bold">Pilih nomor suku:</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Nomor suku">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <button key={k} role="radio" aria-checked={n === k} onClick={() => setN(k)}
            className={`math h-12 w-12 rounded-2xl text-lg transition ${n === k ? 'bg-royal-purple text-white shadow-soft' : 'bg-white ring-1 ring-royal-lavender hover:ring-royal-purple'}`}>{k}</button>
        ))}
      </div>
      <div className="grid items-center gap-5 md:grid-cols-2">
        <div className="flex justify-center rounded-3xl bg-royal-cream p-4"><SquareGrid rows={n} cell={30} showLabels maxSize={260} /></div>
        <dl className="grid grid-cols-2 gap-3">
          {[['Nomor suku', n], ['Panjang sisi', `${n} kotak`], ['Jumlah kotak', square(n)], ['Perhitungan', `${n} × ${n} = ${square(n)}`]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-white p-3 ring-1 ring-royal-lavender">
              <dt className="text-xs font-bold text-royal-plum/60">{k}</dt>
              <dd className="math text-lg text-royal-purple">{v}</dd>
            </div>
          ))}
          <p className="col-span-2 rounded-2xl bg-royal-blue/40 p-3 text-sm leading-relaxed">
            Suku ke-{n} berbentuk persegi dengan sisi {n} kotak. Karena ada {n} baris dan masing-masing berisi {n} kotak,
            jumlah kotaknya {n} × {n} = {square(n)}. Jadi U{sub(n)} = {n}² = {square(n)}.
          </p>
        </dl>
      </div>
    </div>
  );
}

/** B. Interactive Pattern Builder */
function Builder() {
  const [n, setN] = useState(4);
  const [show3d, setShow3d] = useState(false);
  const clamp = (v) => Math.max(1, Math.min(12, v));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-soft !px-3" onClick={() => setN(clamp(n - 1))} disabled={n <= 1} aria-label="Kurangi ukuran"><Minus size={18} /></button>
        <input type="range" min={1} max={12} value={n} onChange={(e) => setN(+e.target.value)} className="w-48 accent-royal-purple" aria-label="Ukuran persegi" />
        <button className="btn-soft !px-3" onClick={() => setN(clamp(n + 1))} disabled={n >= 12} aria-label="Tambah ukuran"><Plus size={18} /></button>
        <button className={show3d ? 'btn-primary' : 'btn-soft'} onClick={() => setShow3d(!show3d)}><Box size={16} /> Tampilan 3D</button>
      </div>
      <div className="grid gap-5 md:grid-cols-[1.2fr_1fr]">
        <div className="flex min-h-[260px] items-center justify-center rounded-3xl bg-royal-cream p-4">
          {show3d ? (
            <Suspense fallback={<p>Memuat 3D...</p>}><MagicTiles3D n={n} height={280} className="w-full" /></Suspense>
          ) : <SquareGrid rows={n} cell={24} showLabels maxSize={300} />}
        </div>
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-white p-3 ring-1 ring-royal-lavender"><dt className="text-xs font-bold">Baris</dt><dd className="math text-2xl text-royal-purple">{n}</dd></div>
            <div className="rounded-2xl bg-white p-3 ring-1 ring-royal-lavender"><dt className="text-xs font-bold">Kolom</dt><dd className="math text-2xl text-royal-purple">{n}</dd></div>
          </dl>
          <div className="rounded-2xl bg-royal-purple p-4 text-white">
            <p className="text-sm text-white/80">Rumus</p>
            <p className="math text-xl">Uₙ = n × n = n²</p>
            <p className="math mt-2 text-2xl text-royal-gold" aria-live="polite">U{sub(n)} = {n} × {n} = {square(n)}</p>
          </div>
          <p className="text-sm text-royal-plum/70">Jumlah seluruh kotak: <b>{square(n)}</b></p>
        </div>
      </div>
    </div>
  );
}

/** C. Number Pattern Explorer */
function Explorer() {
  const [rows, setRows] = useState(6);
  const [sel, setSel] = useState(3);
  const data = Array.from({ length: rows }, (_, i) => i + 1);
  return (
    <div className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead><tr className="text-sm text-royal-purple"><th className="py-2">Nomor Suku</th><th>Bentuk Perkalian</th><th>Bilangan Persegi</th><th>Selisih</th></tr></thead>
          <tbody>
            {data.map((k) => (
              <tr key={k} onClick={() => setSel(k)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setSel(k)}
                className={`cursor-pointer border-t border-royal-lavender/60 transition ${sel === k ? 'bg-royal-gold/30' : 'hover:bg-royal-lavender/30'}`}>
                <td className="math py-2">{k}</td><td className="math">{k} × {k}</td><td className="math text-royal-purple">{square(k)}</td>
                <td className="text-sm">{k > 1 ? `+${square(k) - square(k - 1)}` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex gap-2">
          <button className="btn-soft" disabled={rows >= 15} onClick={() => setRows(rows + 1)}><Plus size={16} /> Tambah baris</button>
          <button className="btn-ghost" disabled={rows <= 6} onClick={() => { setRows(6); setSel(Math.min(sel, 6)); }}>Atur ulang</button>
        </div>
      </div>
      <div className="space-y-3 rounded-3xl bg-royal-cream p-4">
        <p className="eyebrow">Suku ke-{sel}</p>
        <div className="flex justify-center"><SquareGrid rows={sel} cell={18} maxSize={200} /></div>
        <p className="text-sm leading-relaxed">
          Nomor suku <b>{sel}</b> dikalikan dengan dirinya sendiri: {sel} × {sel} = <b>{square(sel)}</b>.
          {sel > 1 && <> Dibanding suku sebelumnya bertambah <b>{2 * sel - 1}</b> (bilangan ganjil).</>}
        </p>
      </div>
    </div>
  );
}

/** D. Royal Formula Calculator */
function FormulaCalculator() {
  const [raw, setRaw] = useState('');
  const [res, setRes] = useState(null);
  const calc = (e) => {
    e.preventDefault();
    setRes(parseTermNumber(raw));
  };
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <form onSubmit={calc} className="space-y-3" noValidate>
        <label className="block">
          <span className="mb-1 block text-sm font-extrabold">Nomor suku (n)</span>
          <input className="field math text-xl" inputMode="numeric" value={raw} placeholder="contoh: 8" maxLength={12}
            onChange={(e) => { setRaw(e.target.value); setRes(null); }} aria-invalid={res?.ok === false} aria-describedby="calc-msg" />
        </label>
        <button className="btn-primary w-full"><Calculator size={18} /> Hitung</button>
        {res?.ok === false && <p id="calc-msg" className="rounded-xl bg-royal-rose px-3 py-2 text-sm font-bold text-royal-coral" role="alert">{res.error}</p>}
        <p className="text-xs text-royal-plum/60">Rumus yang digunakan: Uₙ = n². Nomor suku harus bilangan bulat 1–1000.</p>
      </form>
      <div className="rounded-3xl bg-royal-cream p-5" aria-live="polite">
        {res?.ok ? (
          <div className="space-y-3 animate-fadeup">
            <p className="eyebrow">Hasil</p>
            <p className="math text-4xl text-royal-purple">{square(res.n).toLocaleString('id-ID')}</p>
            <ol className="space-y-1">
              {formulaSteps(res.n).map((s, i) => <li key={s} className="math text-[15px]"><span className="mr-2 text-royal-gold">{i + 1}.</span>{s}</li>)}
            </ol>
            <p className="text-sm leading-relaxed">Artinya, susunan persegi ke-{res.n} memiliki {res.n} baris dan {res.n} kolom, sehingga terdapat {square(res.n).toLocaleString('id-ID')} kotak.</p>
            {res.n <= 15 && <div className="flex justify-center"><SquareGrid rows={res.n} cell={12} maxSize={180} /></div>}
          </div>
        ) : <p className="text-royal-plum/60">Masukkan nomor suku, lalu tekan <b>Hitung</b>.</p>}
      </div>
    </div>
  );
}

const PANELS = { viz: Visualization, builder: Builder, explorer: Explorer, calc: FormulaCalculator };

export default function MathLab() {
  const [tab, setTab] = useState('viz');
  const Panel = PANELS[tab];
  return (
    <div className="space-y-5">
      <SectionTitle eyebrow="Royal Math Lab" title="Laboratorium Pola Ajaib" icon={FlaskConical}>
        Eksplorasi pola bilangan persegi dengan tanganmu sendiri. Pilih satu alat di bawah ini.
      </SectionTitle>
      <CompanionBubble who="lumina" size={56}>Coba ubah ukurannya dan perhatikan: berapa baris, berapa kolom, dan berapa kotak seluruhnya?</CompanionBubble>
      <div className="-mx-4 overflow-x-auto px-4">
        <div role="tablist" className="flex min-w-max gap-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-extrabold transition ${tab === id ? 'bg-royal-purple text-white' : 'bg-white/80 ring-1 ring-royal-lavender'}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </div>
      <section className="panel animate-fadeup" key={tab} role="tabpanel"><Panel /></section>
    </div>
  );
}
