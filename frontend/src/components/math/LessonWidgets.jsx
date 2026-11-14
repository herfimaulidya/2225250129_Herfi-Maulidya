import { useState } from 'react';
import { Eye } from 'lucide-react';
import SquareGrid from './SquareGrid';
import { square, sub } from '../../lib/math';

function SizeSlider({ n, setN, min = 1, max = 6, label = 'Ukuran susunan' }) {
  return (
    <label className="flex flex-wrap items-center gap-3 text-sm font-bold">
      {label}
      <input type="range" min={min} max={max} value={n} onChange={(e) => setN(+e.target.value)} className="w-40 accent-royal-purple" aria-valuetext={`${n}`} />
      <span className="math rounded-lg bg-royal-lavender px-2 py-0.5">{n}</span>
    </label>
  );
}

/** Level 1: hitung kotak pada susunan n × n */
export function CountWidget() {
  const [n, setN] = useState(3);
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-3">
      <SizeSlider n={n} setN={(v) => { setN(v); setShown(false); }} />
      <div className="flex justify-center"><SquareGrid rows={n} cell={26} showLabels maxSize={240} /></div>
      <p className="text-center">Ada <b>{n}</b> baris dan setiap baris berisi <b>{n}</b> kotak. Berapa banyak kotaknya?</p>
      <div className="text-center">
        {shown ? (
          <p className="math text-xl text-royal-purple animate-pop">{n} × {n} = {square(n)} kotak</p>
        ) : (
          <button className="btn-soft" onClick={() => setShown(true)}><Eye size={16} /> Tebak dulu, lalu cek</button>
        )}
      </div>
    </div>
  );
}

/** Level 2: selisih antarbilangan persegi */
export function DifferenceWidget() {
  const [count, setCount] = useState(4);
  const seq = Array.from({ length: count }, (_, i) => square(i + 1));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-center gap-1">
        {seq.map((v, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="rounded-full bg-royal-gold/40 px-2 py-0.5 text-xs font-extrabold text-royal-plum">+{v - seq[i - 1]}</span>}
            <span className="math rounded-xl bg-royal-blue/70 px-3 py-1.5 text-lg">{v}</span>
          </span>
        ))}
      </div>
      <div className="flex justify-center"><SquareGrid rows={count} cell={22} highlightLast /></div>
      <p className="text-center text-sm">Kotak emas = {2 * count - 1} kotak tambahan dari susunan {count - 1} × {count - 1}.</p>
      <div className="flex justify-center gap-2">
        <button className="btn-soft" disabled={count <= 2} onClick={() => setCount(count - 1)}>Kurangi</button>
        <button className="btn-primary" disabled={count >= 8} onClick={() => setCount(count + 1)}>Tambah suku</button>
      </div>
    </div>
  );
}

/** Level 3: hubungan nomor suku, panjang sisi, dan n² */
export function FormulaWidget() {
  const [n, setN] = useState(4);
  return (
    <div className="grid items-center gap-4 sm:grid-cols-2">
      <div className="flex justify-center"><SquareGrid rows={n} cell={24} showLabels maxSize={220} /></div>
      <div className="space-y-2">
        <SizeSlider n={n} setN={setN} max={8} label="Nomor suku (n)" />
        <ol className="space-y-1.5 rounded-2xl bg-royal-cream p-4 text-[15px]">
          <li>Suku ke-<b>{n}</b> → persegi dengan sisi <b>{n}</b> kotak</li>
          <li>Banyak baris = <b>{n}</b>, banyak kolom = <b>{n}</b></li>
          <li>Banyak kotak = {n} × {n} = <b>{n}²</b></li>
          <li className="math text-lg text-royal-purple">U{sub(n)} = {n}² = {square(n)}</li>
        </ol>
      </div>
    </div>
  );
}

/** Level 4: empat langkah literasi matematis pada soal kontekstual */
export function LiteracyWidget() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: '1. Pahami', text: 'Lampu hias aula: malam ke-1 menyala 1 lampu, malam ke-2 4 lampu, malam ke-3 9 lampu. Ditanya: malam ke-7.' },
    { title: '2. Temukan pola', text: '1 = 1², 4 = 2², 9 = 3² → ini pola bilangan persegi.' },
    { title: '3. Hitung', text: 'Gunakan Uₙ = n² dengan n = 7: U₇ = 7² = 49.' },
    { title: '4. Tafsirkan', text: 'Jadi pada malam ke-7 menyala 49 lampu, tersusun 7 baris × 7 kolom.' },
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <button key={s.title} onClick={() => setStep(i)}
            className={`rounded-2xl p-3 text-left text-sm transition ${i <= step ? 'bg-white ring-2 ring-royal-purple' : 'bg-royal-lavender/30'}`}>
            <b className="block">{s.title}</b>
            {i <= step ? <span className="animate-fadeup">{s.text}</span> : <span className="text-royal-plum/50">Ketuk untuk membuka</span>}
          </button>
        ))}
      </div>
      {step === 3 && <div className="flex justify-center"><SquareGrid rows={7} cell={14} color="#E8C878" /></div>}
      {step < 3 && <div className="text-center"><button className="btn-soft" onClick={() => setStep(step + 1)}>Langkah berikutnya</button></div>}
    </div>
  );
}

export const WIDGETS = { count: CountWidget, differences: DifferenceWidget, formula: FormulaWidget, literacy: LiteracyWidget };
