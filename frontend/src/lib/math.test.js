import { describe, expect, it } from 'vitest';
import { differences, formulaSteps, isPerfectSquare, parseTermNumber, square, squareSequence, sub } from './math';
import { levelInfo } from './levels';

describe('pola bilangan persegi', () => {
  it('menghasilkan barisan 1, 4, 9, 16, 25, 36', () => {
    expect(squareSequence(6)).toEqual([1, 4, 9, 16, 25, 36]);
  });
  it('selisihnya bilangan ganjil berurutan', () => {
    expect(differences(squareSequence(6))).toEqual([3, 5, 7, 9, 11]);
  });
  it('U8 = 64 dan U25 = 625', () => {
    expect(square(8)).toBe(64);
    expect(square(25)).toBe(625);
  });
  it('mengenali bilangan persegi', () => {
    expect([1, 4, 9, 49, 144].every(isPerfectSquare)).toBe(true);
    expect([2, 8, 10, 50, 2.25].some(isPerfectSquare)).toBe(false);
  });
  it('subskrip', () => expect(sub(12)).toBe('₁₂'));
  it('langkah rumus', () => expect(formulaSteps(8).at(-1)).toBe('U₈ = 64'));
});

describe('validasi kalkulator', () => {
  it.each([['8', 8], [' 12 ', 12], ['1000', 1000]])('menerima %s', (raw, n) => {
    expect(parseTermNumber(raw)).toEqual({ ok: true, n });
  });
  it.each([
    ['', 'belum diisi'], ['   ', 'belum diisi'], ['-3', 'negatif'], ['2.5', 'desimal'], ['2,5', 'desimal'],
    ['abc', 'angka saja'], ['8a', 'angka saja'], ['0', 'ke-1'], ['1001', 'Maksimal'], [null, 'belum diisi'],
  ])('menolak %s', (raw, msg) => {
    const r = parseTermNumber(raw);
    expect(r.ok).toBe(false);
    expect(r.error).toContain(msg);
  });
});

describe('royal level', () => {
  it('menghitung level dan progres', () => {
    expect(levelInfo(0).level).toBe(1);
    expect(levelInfo(140)).toMatchObject({ level: 2, progress: 50 });
    expect(levelInfo(9999)).toMatchObject({ level: 6, next: null, progress: 100 });
  });
});
