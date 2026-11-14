import { Check, X } from 'lucide-react';
import SquareGrid, { Illustration } from '../math/SquareGrid';

/** Nilai awal untuk setiap tipe soal. */
export function emptyValue(item) {
  switch (item.type) {
    case 'sequence': return item.data.display.filter((v) => v === null).map(() => '');
    case 'multi_select': return [];
    case 'steps': return Object.fromEntries(item.data.parts.map((p) => [p.id, p.type === 'number' ? '' : null]));
    case 'number': return '';
    default: return null;
  }
}

/** Apakah semua bagian sudah diisi (tombol periksa aktif). */
export function isComplete(item, v) {
  if (v === null || v === undefined) return false;
  switch (item.type) {
    case 'number': return String(v).trim() !== '';
    case 'sequence': return v.every((x) => String(x).trim() !== '');
    case 'multi_select': return v.length > 0;
    case 'steps': return item.data.parts.every((p) => v[p.id] !== null && String(v[p.id]).trim() !== '');
    default: return true;
  }
}

/** Ubah nilai form ke format yang dikirim ke server. */
export function toPayload(item, v) {
  if (item.type === 'number') return String(v).trim();
  if (item.type === 'sequence') return v.map((x) => String(x).trim());
  return v;
}

const sanitizeNum = (s) => s.replace(/[^\d-]/g, '').slice(0, 8);

function NumberBox({ value, onChange, disabled, label, state, autoFocus, testId }) {
  const ring = state === true ? 'border-royal-leaf bg-royal-mint/50' : state === false ? 'border-royal-coral bg-royal-rose animate-shake' : '';
  return (
    <input type="text" inputMode="numeric" autoComplete="off" value={value ?? ''} disabled={disabled} aria-label={label} data-input={testId}
      autoFocus={autoFocus}
      onChange={(e) => onChange(sanitizeNum(e.target.value))} className={`num-input ${ring}`} placeholder="?" />
  );
}

function OptionButton({ selected, onClick, disabled, children, state, testId }) {
  const base = 'flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-bold transition';
  let cls = selected ? 'border-royal-purple bg-royal-lavender/60' : 'border-royal-lavender bg-white hover:border-royal-purple/60';
  if (state === 'correct') cls = 'border-royal-leaf bg-royal-mint/60';
  if (state === 'wrong') cls = 'border-royal-coral bg-royal-rose';
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={selected} data-option={testId} className={`${base} ${cls}`}>
      {children}
      {state === 'correct' && <Check className="ml-auto text-royal-leaf" size={20} />}
      {state === 'wrong' && <X className="ml-auto text-royal-coral" size={20} />}
    </button>
  );
}

function ChoiceList({ options, value, onChange, disabled, reveal }) {
  const withPics = options.some((o) => o.illustration);
  return (
    <div className={withPics ? 'grid grid-cols-2 gap-3' : 'grid gap-2.5 sm:grid-cols-2'}>
      {options.map((o, i) => {
        let state;
        if (reveal) {
          if (o.id === reveal.correctId) state = 'correct';
          else if (o.id === value) state = 'wrong';
        }
        return (
          <OptionButton key={o.id} testId={o.id} selected={value === o.id} disabled={disabled} state={state} onClick={() => onChange(o.id)}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-royal-lavender text-xs text-royal-purple">{String.fromCharCode(65 + i)}</span>
            {o.illustration ? (
              <span className="flex flex-1 flex-col items-center gap-1">
                <SquareGrid rows={o.illustration.rows} cols={o.illustration.cols} maxSize={110} cell={16} />
                <span className="text-sm">{o.label}</span>
              </span>
            ) : <span className="flex-1">{o.label}</span>}
          </OptionButton>
        );
      })}
    </div>
  );
}

export default function QuestionInput({ item, value, onChange, disabled, feedback }) {
  const d = item.data || {};
  const reveal = feedback?.done && feedback.correct_answer?.id ? { correctId: feedback.correct_answer.id } : null;

  if (item.type === 'mc') {
    return (
      <div className="space-y-4">
        {d.illustration && <div className="flex justify-center"><Illustration spec={d.illustration} /></div>}
        {d.display && (
          <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Pola">
            {d.display.map((v, i) => (
              <span key={i} className="math rounded-2xl bg-royal-blue/70 px-4 py-2 text-xl text-royal-plum">{v}</span>
            ))}
            <span className="math rounded-2xl border-2 border-dashed border-royal-purple px-4 py-2 text-xl text-royal-purple">?</span>
          </div>
        )}
        <ChoiceList options={d.options} value={value} onChange={onChange} disabled={disabled} reveal={reveal} />
      </div>
    );
  }

  if (item.type === 'tf') {
    const correct = feedback?.done ? feedback.correct_answer : undefined;
    return (
      <div className="space-y-4">
        {d.illustration && <div className="flex justify-center"><Illustration spec={d.illustration} /></div>}
        <div className="grid grid-cols-2 gap-3">
          {[[true, 'Benar'], [false, 'Salah']].map(([v, label]) => (
            <OptionButton key={label} testId={String(v)} selected={value === v} disabled={disabled} onClick={() => onChange(v)}
              state={correct === undefined ? undefined : correct === v ? 'correct' : value === v ? 'wrong' : undefined}>
              <span className="flex-1 text-center text-lg">{label}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    );
  }

  if (item.type === 'number') {
    return (
      <div className="space-y-4">
        {d.illustration && <div className="flex justify-center"><Illustration spec={d.illustration} /></div>}
        <label className="flex items-center justify-center gap-3 font-bold">
          Jawaban:
          <NumberBox value={value} onChange={onChange} disabled={disabled} label="Jawaban angka" testId="answer"
            state={feedback ? feedback.correct : undefined} />
          {d.unit && <span>{d.unit}</span>}
        </label>
      </div>
    );
  }

  if (item.type === 'sequence') {
    let bi = -1;
    return (
      <div className="flex flex-wrap items-center justify-center gap-2" aria-label="Lengkapi pola">
        {d.display.map((v, i) => {
          if (v !== null) return <span key={i} className="math rounded-2xl bg-royal-blue/70 px-4 py-2 text-xl">{v}</span>;
          bi += 1;
          const idx = bi;
          return (
            <NumberBox key={i} value={value[idx]} disabled={disabled} label={`Kotak kosong ke-${idx + 1}`} testId={`blank-${idx}`}
              state={feedback?.parts ? feedback.parts[idx] : undefined}
              onChange={(nv) => onChange(value.map((x, j) => (j === idx ? nv : x)))} />
          );
        })}
      </div>
    );
  }

  if (item.type === 'multi_select') {
    const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
    const missed = feedback?.parts?.missed || [];
    const wrong = feedback?.parts?.wrong || [];
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {d.options.map((o) => {
          const sel = value.includes(o.id);
          let cls = sel ? 'border-royal-purple bg-royal-lavender/60 shadow-glow' : 'border-royal-lavender bg-white';
          if (feedback) {
            if (wrong.includes(o.id)) cls = 'border-royal-coral bg-royal-rose';
            else if (missed.includes(o.id)) cls = 'border-dashed border-royal-gold bg-royal-gold/20';
            else if (sel) cls = 'border-royal-leaf bg-royal-mint/60';
          }
          return (
            <button key={o.id} type="button" disabled={disabled} onClick={() => toggle(o.id)} aria-pressed={sel} data-option={o.id}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition ${cls}`}
              aria-label={`Susunan ${o.illustration.rows} baris ${o.illustration.cols} kolom`}>
              <SquareGrid rows={o.illustration.rows} cols={o.illustration.cols} maxSize={96} cell={14} color="#C7E5F8" />
              {(!d.hide_labels || feedback) && <span className="text-xs font-extrabold">{o.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  if (item.type === 'steps') {
    return (
      <div className="space-y-4">
        {d.context && <p className="rounded-2xl bg-royal-blue/40 p-4 leading-relaxed">{d.context}</p>}
        {d.illustration && <div className="flex justify-center"><Illustration spec={d.illustration} /></div>}
        <ol className="space-y-4">
          {d.parts.map((p, i) => {
            const st = feedback?.parts ? feedback.parts[p.id] : undefined;
            return (
              <li key={p.id} data-part={p.id} className="rounded-2xl bg-white p-4 ring-1 ring-royal-lavender">
                <p className="mb-3 font-bold">
                  <span className="chip mr-2">Langkah {i + 1}</span>{p.prompt}
                  {st === true && <Check className="ml-2 inline text-royal-leaf" size={18} />}
                  {st === false && <X className="ml-2 inline text-royal-coral" size={18} />}
                </p>
                {p.type === 'number' ? (
                  <span className="flex items-center gap-2">
                    <NumberBox value={value[p.id]} disabled={disabled} label={p.prompt} state={st} testId={`part-${p.id}`}
                      onChange={(nv) => onChange({ ...value, [p.id]: nv })} />
                    {p.unit && <span className="font-semibold">{p.unit}</span>}
                  </span>
                ) : (
                  <ChoiceList options={p.options} value={value[p.id]} disabled={disabled}
                    onChange={(nv) => onChange({ ...value, [p.id]: nv })} />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    );
  }
  return <p>Tipe soal belum didukung.</p>;
}
