// Utilitas pola bilangan persegi — semua hasil dihitung dinamis.

export const square = (n) => n * n;

const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const sub = (n) => String(n).split('').map((d) => (/\d/.test(d) ? SUB[+d] : d)).join('');

export const isPerfectSquare = (x) => Number.isInteger(x) && x >= 0 && Math.round(Math.sqrt(x)) ** 2 === x;

export const squareSequence = (count, start = 1) => Array.from({ length: count }, (_, i) => square(start + i));

export const differences = (seq) => seq.slice(1).map((v, i) => v - seq[i]);

export const CALC_MAX = 1000;

/**
 * Validasi input nomor suku untuk Royal Formula Calculator.
 * @returns {{ok: true, n: number} | {ok: false, error: string}}
 */
export function parseTermNumber(raw, max = CALC_MAX) {
  const s = String(raw ?? '').trim();
  if (s === '') return { ok: false, error: 'Nomor suku belum diisi. Masukkan bilangan bulat, misalnya 8.' };
  if (/^[-−]/.test(s) && /\d/.test(s)) return { ok: false, error: 'Nomor suku tidak boleh negatif. Suku dimulai dari ke-1.' };
  if (/^\d+[.,]\d+$/.test(s)) return { ok: false, error: 'Nomor suku harus bilangan bulat, bukan desimal (suku ke-2,5 tidak ada).' };
  if (!/^\d+$/.test(s)) return { ok: false, error: 'Masukkan angka saja, tanpa huruf atau simbol.' };
  const n = Number(s);
  if (n === 0) return { ok: false, error: 'Suku dimulai dari ke-1. Nomor suku 0 tidak ada.' };
  if (n > max) return { ok: false, error: `Maksimal suku ke-${max} agar perhitungan tetap mudah dibaca.` };
  return { ok: true, n };
}

/** Langkah perhitungan Un = n² untuk ditampilkan. */
export function formulaSteps(n) {
  return [
    'Rumus: Uₙ = n²',
    `Substitusi n = ${n}: U${sub(n)} = ${n}²`,
    `${n}² = ${n} × ${n}`,
    `U${sub(n)} = ${square(n).toLocaleString('id-ID')}`,
  ];
}
