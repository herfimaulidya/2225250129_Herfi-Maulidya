// Uji end-to-end ROYAL ADVENTURE (Playwright).
// Prasyarat: mock Supabase :54321, backend :8000, frontend :5173 sudah berjalan (lihat docs/testing.md).
import { chromium } from 'playwright';
import fs from 'node:fs';

const APP = process.env.APP_URL || 'http://localhost:5173';
const API = process.env.API_URL || 'http://127.0.0.1:8000';
const MOCK = process.env.MOCK_URL || 'http://127.0.0.1:54321';
const SERVICE = 'e2e-service-role-key';
const ADMIN = 'e2e-admin';
const SHOTS = new URL('./screens/', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
fs.mkdirSync(SHOTS, { recursive: true });

const problems = [];
const log = (...a) => console.log('•', ...a);
process.on('exit', () => {});

async function http(url, opts = {}) {
  const r = await fetch(url, opts);
  const t = await r.text();
  return { status: r.status, body: t ? JSON.parse(t) : null };
}
const sessionItems = async (sid) =>
  (await http(`${MOCK}/rest/v1/activity_sessions?id=eq.${sid}`, { headers: { Authorization: `Bearer ${SERVICE}` } })).body[0].items;

async function setup() {
  await http(`${MOCK}/__e2e/reset`, { method: 'POST' });
  for (const [code, name, cls] of [['RA-7A-01', 'Ayu Lestari', '7A'], ['RA-7A-02', 'Budi Santoso', '7A']]) {
    const r = await http(`${API}/api/admin/students`, {
      method: 'POST', headers: { 'X-Admin-Key': ADMIN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_code: code, full_name: name, class_name: cls }),
    });
    if (r.status !== 201) throw new Error(`gagal membuat siswa: ${JSON.stringify(r.body)}`);
  }
}

function watch(page, label) {
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`[${label}] console: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`[${label}] pageerror: ${e.message}`));
  page.on('dialog', (d) => d.accept());
}

const shot = (page, name) => page.screenshot({ path: `${SHOTS}${name}.png`, fullPage: true });

async function noHorizontalScroll(page, label) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  if (over > 1) problems.push(`[${label}] scroll horizontal ${over}px`);
}

/** Isi satu soal sesuai kuncinya. */
async function fillItem(page, item, answer, root = page) {
  const t = item.type;
  if (t === 'mc') return root.locator(`[data-option="${answer}"]`).first().click();
  if (t === 'tf') return root.locator(`[data-option="${answer ? 'true' : 'false'}"]`).first().click();
  if (t === 'number') return root.locator('[data-input="answer"]').fill(String(answer));
  if (t === 'sequence') {
    for (let i = 0; i < answer.length; i += 1) await root.locator(`[data-input="blank-${i}"]`).fill(String(answer[i]));
    return null;
  }
  if (t === 'multi_select') {
    for (const id of answer) await root.locator(`[data-option="${id}"]`).click();
    return null;
  }
  if (t === 'steps') {
    for (const part of item.data.parts) {
      const v = answer[part.id];
      if (part.type === 'number') await root.locator(`[data-input="part-${part.id}"]`).fill(String(v));
      else await root.locator(`[data-part="${part.id}"] [data-option="${v}"]`).click();
    }
    return null;
  }
  throw new Error(`tipe ${t}`);
}

async function startAndCapture(page, clickFn) {
  const [resp] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/sessions') && r.request().method() === 'POST'),
    clickFn(),
  ]);
  const s = await resp.json();
  if (!resp.ok()) throw new Error(`start gagal: ${JSON.stringify(s)}`);
  return { sid: s.id, items: await sessionItems(s.id) };
}

const btn = (page, name) => page.getByRole('button', { name, exact: false });

/** Kerjakan kuis StepQuiz sampai hasil muncul. wrongFirst: salah sekali di soal 1 untuk menguji petunjuk. */
async function playStepQuiz(page, items, { wrongFirst = false, finishName = /Lihat Hasil/ } = {}) {
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (wrongFirst && i === 0) {
      const wrong = it.type === 'number' ? it.answer + 1 : null;
      if (wrong !== null) {
        await fillItem(page, it, wrong);
        await btn(page, 'Periksa Jawaban').click();
        await page.getByText('Petunjuk:').first().waitFor();
        await shot(page, 'training-feedback-salah');
        log('umpan balik salah + petunjuk tampil');
      }
    }
    await fillItem(page, it, it.answer);
    if (it.ask_reason) await page.locator('textarea').fill('Polanya 1, 4, 9 jadi saya pakai rumus n kuadrat.');
    await page.locator('button:has-text("Periksa")').last().click();
    await page.getByText('Jawaban benar!').waitFor();
    if (i < items.length - 1) await btn(page, 'Soal Berikutnya').click();
    else await page.getByRole('button', { name: finishName }).click();
  }
}

async function login(page, code) {
  await page.goto(`${APP}/#/login`);
  await page.locator('input').first().fill(code);
  await btn(page, 'ENTER KINGDOM').click();
  await page.waitForURL(/#\/app$/);
  await page.getByText('Royal Dashboard').waitFor();
}

async function doLesson(page, id, { first = false } = {}) {
  await page.goto(`${APP}/#/app/lessons/${id}`);
  await btn(page, '1. Tujuan').click();
  await page.getByText('Tujuan pembelajaran').waitFor();
  for (let i = 0; i < 5; i += 1) await btn(page, 'Lanjut').click();
  const { items } = await startAndCapture(page, () => btn(page, 'Mulai Latihan Singkat').click());
  await playStepQuiz(page, items, { finishName: /Selesai & Lihat Hasil/ });
  await page.getByText(/dari 3 soal benar/).waitFor();
  await btn(page, 'Lanjutkan').click();
  await page.getByText('Rangkuman', { exact: true }).waitFor();
  if (first) await shot(page, 'lesson-rangkuman');
  await btn(page, 'Selesaikan Misi').click();
  await page.getByText(/Misi .* selesai!/).waitFor();
  log(`misi ${id} selesai`);
}

async function playGame(page, id) {
  await page.goto(`${APP}/#/app/games/${id}`);
  await page.getByText('Petunjuk permainan').waitFor();
  if (id === 'find-the-royal-number') await btn(page, 'sulit').click();
  const { items } = await startAndCapture(page, () => btn(page, 'Mulai Bermain').click());
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (id === 'find-the-royal-number') {
      await page.locator(`[data-option="${it.answer}"]`).click();
    } else if (id === 'enchanted-kingdom-quest') {
      if (i === 0) { await btn(page, 'Petunjuk Peri').click(); await page.waitForTimeout(150); }
      await page.locator('[data-input="answer"]').fill(String(it.answer));
      await btn(page, 'Buka gerbang').click();
      await page.getByText('Gerbang terbuka!').waitFor();
    } else {
      await fillItem(page, it, it.answer);
      const label = { 'princess-square-hunter': 'Periksa', 'complete-the-magic-pattern': 'Pasang permata', 'magic-formula-challenge': 'Ucapkan mantra' }[id];
      await btn(page, label).first().click();
    }
    if (i === 1) await shot(page, `game-${id}`);
    const nextBtn = page.locator('button:has-text("berikutnya"), button:has-text("Lihat hasil akhir"), button:has-text("Masuk ke Aula Mahkota")').last();
    await nextBtn.click();
  }
  await page.getByText('Hasil akhir').waitFor();
  const score = await page.locator('.math.text-5xl').innerText();
  if (score.trim() !== '100' && id !== 'enchanted-kingdom-quest') problems.push(`[game ${id}] skor ${score}, harapan 100`);
  if (id === 'enchanted-kingdom-quest' && score.trim() !== '95') problems.push(`[quest] skor ${score}, harapan 95 (1 petunjuk)`);
  log(`game ${id}: skor ${score}`);
}

async function run() {
  await setup();
  const browser = await chromium.launch();

  // ---------- Desktop ----------
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  globalThis.__page = page;
  page.setDefaultTimeout(15000);
  watch(page, 'desktop');

  await page.goto(APP);
  await page.getByText('Your Magical Journey Begins Here!').waitFor();
  await page.waitForTimeout(1200);
  await shot(page, 'd-01-landing');

  // halaman privat tanpa login
  await page.goto(`${APP}/#/app/profile`);
  await page.waitForURL(/#\/login/);
  log('halaman privat dialihkan ke login');

  // validasi login
  await btn(page, 'ENTER KINGDOM').click();
  await page.getByText('Kode siswa belum diisi.').waitFor();
  await page.locator('input').first().fill('RA-ZZ-99');
  await btn(page, 'ENTER KINGDOM').click();
  await page.getByText('Kode siswa tidak terdaftar').waitFor();
  await shot(page, 'd-02-login-error');
  log('validasi login: kosong & tidak terdaftar OK');

  await login(page, 'ra-7a-01');
  await shot(page, 'd-03-dashboard-awal');

  // level 2 terkunci
  await page.goto(`${APP}/#/app/lessons/enchanted-garden`);
  await page.getByText('masih terkunci').waitFor();
  log('level 2 terkunci sebelum level 1 selesai');

  // Lesson 1 dengan screenshot tiap bagian
  await page.goto(`${APP}/#/app/lessons/princess-castle`);
  await page.getByText('Tujuan pembelajaran').waitFor();
  await shot(page, 'd-04-lesson-tujuan');
  await btn(page, 'Lanjut').click();
  await btn(page, 'Lanjut').click();
  await shot(page, 'd-05-lesson-pola');
  await btn(page, 'Lanjut').click();
  await btn(page, 'Lanjut').click();
  await btn(page, 'Tampilkan langkah berikutnya').click();
  await shot(page, 'd-06-lesson-contoh');
  await btn(page, 'Lanjut').click();
  await btn(page, 'Lewati ke rangkuman').click();
  await page.getByText('Rangkuman', { exact: true }).waitFor();
  if (!(await btn(page, 'Selesaikan Misi').isDisabled())) problems.push('Selesaikan Misi aktif sebelum latihan');
  await doLesson(page, 'princess-castle', { first: true });
  await page.getByText(/Lencana baru/).first().waitFor();
  await shot(page, 'd-07-lesson-selesai-toast');
  log('toast lencana muncul');

  // Ulangi misi -> XP tetap
  await page.goto(`${APP}/#/app`);
  await page.getByText('Royal Dashboard').waitFor();
  await page.waitForTimeout(500);
  const xpText = await page.locator('dd.math').first().innerText();
  if (xpText.trim() !== '90') problems.push(`XP setelah misi 1 = ${xpText}, harapan 90`);
  log(`XP dashboard: ${xpText}`);

  // Math Lab
  await page.goto(`${APP}/#/app/lab`);
  await shot(page, 'd-08-lab-visual');
  await page.getByRole('tab', { name: /Pattern Builder/ }).click();
  await page.locator('input[type=range]').fill('7');
  await page.getByText('U₇ = 7 × 7 = 49').waitFor();
  await btn(page, 'Tampilan 3D').click();
  await page.waitForTimeout(1500);
  await shot(page, 'd-09-lab-builder-3d');
  await page.getByRole('tab', { name: /Number Explorer/ }).click();
  await page.getByRole('cell', { name: '5 × 5' }).click();
  await page.getByRole('tab', { name: /Formula Calculator/ }).click();
  for (const [inp, expect] of [['', 'belum diisi'], ['-3', 'negatif'], ['2.5', 'desimal'], ['abc', 'angka saja']]) {
    await page.locator('form input').fill(inp);
    await btn(page, 'Hitung').click();
    await page.getByText(expect, { exact: false }).waitFor();
  }
  await page.locator('form input').fill('8');
  await btn(page, 'Hitung').click();
  await page.getByText('U₈ = 64').waitFor();
  await shot(page, 'd-10-lab-kalkulator');
  log('Math Lab: builder, explorer, kalkulator + validasi OK');

  // Training level 1 dengan satu jawaban salah dulu
  await page.goto(`${APP}/#/app/training/level-1`);
  let { items } = await startAndCapture(page, () => btn(page, 'Mulai Latihan').click());
  const firstNum = items.findIndex((x) => x.type === 'number');
  log(`training: ${items.length} soal; soal angka pertama #${firstNum + 1}`);
  // pindahkan uji salah ke soal angka pertama
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (i === firstNum) {
      await fillItem(page, it, it.answer + 1);
      await btn(page, 'Periksa Jawaban').click();
      await page.getByText('Petunjuk:').first().waitFor();
      await shot(page, 'd-11-training-salah-petunjuk');
    }
    await fillItem(page, it, it.answer);
    await page.locator('button:has-text("Periksa")').last().click();
    await page.getByText('Jawaban benar!').waitFor();
    if (i < items.length - 1) await btn(page, 'Soal Berikutnya').click();
    else await page.getByRole('button', { name: /Lihat Hasil/ }).click();
  }
  await page.getByText(/dari 8 soal benar/).waitFor();
  await shot(page, 'd-12-training-hasil');
  log('training level 1 selesai');

  // Lesson 2-4
  await doLesson(page, 'enchanted-garden');
  await doLesson(page, 'magic-library');
  await doLesson(page, 'royal-challenge-palace');

  // Map
  await page.goto(`${APP}/#/app/map`);
  await page.getByText('Gerbang terakhir sudah terbuka!').waitFor();
  await shot(page, 'd-13-map-selesai');

  // Games
  for (const g of ['princess-square-hunter', 'complete-the-magic-pattern', 'find-the-royal-number', 'magic-formula-challenge', 'enchanted-kingdom-quest']) {
    await playGame(page, g);
  }

  // Training level 3 (soal cerita + alasan)
  await page.goto(`${APP}/#/app/training/level-3`);
  ({ items } = await startAndCapture(page, () => btn(page, 'Mulai Latihan').click()));
  await playStepQuiz(page, items);
  await page.getByText(/dari 8 soal benar/).waitFor();
  log('training level 3 selesai');

  // Final quest + resume
  await page.goto(`${APP}/#/app/final`);
  ({ items } = await startAndCapture(page, () => btn(page, 'Mulai Final Quest').click()));
  if (items.some((x) => x.hint === undefined)) { /* kunci memang ada di server */ }
  for (let i = 0; i < 3; i += 1) {
    await fillItem(page, items[i], items[i].answer);
    await btn(page, 'Simpan & Lanjut').click();
    await page.getByText(`Soal ${i + 2} dari`).waitFor();
  }
  await page.reload();
  await page.getByText(`Terjawab 3/${items.length}`).waitFor();
  log('Final Quest dilanjutkan setelah reload (3 jawaban tersimpan)');
  await page.locator('nav[aria-label="Navigasi nomor soal"] button').nth(3).click();
  for (let i = 3; i < items.length; i += 1) {
    await page.getByText(`Soal ${i + 1} dari`).waitFor();
    if (i !== items.length - 1) {
      await fillItem(page, items[i], items[i].answer);
      if (items[i].ask_reason) await page.locator('textarea').fill('Pola persegi, pakai Un = n².');
      await btn(page, 'Simpan & Lanjut').click();
    } else {
      // soal terakhir sengaja dikosongkan
      await btn(page, 'Simpan & Periksa').click();
    }
  }
  await page.getByText('Periksa kembali jawabanmu').waitFor();
  await page.getByText('Masih ada 1 soal kosong').waitFor();
  await shot(page, 'd-14-final-periksa');
  await btn(page, 'Kirim Jawaban').click();
  await page.getByText('Hasil The Royal Final Quest').waitFor();
  const finalScore = (await page.locator('.math.text-6xl').innerText()).trim();
  const expected = String(Math.round(100 * (items.length - 1) / items.length));
  if (finalScore !== expected) problems.push(`final skor ${finalScore}, harapan ${expected}`);
  await shot(page, 'd-15-final-hasil');
  log(`Final Quest: skor ${finalScore}`);

  // Achievements, profile, history
  await page.goto(`${APP}/#/app/achievements`);
  await page.getByText(/Princess Badges \(7\/7\)/).waitFor();
  await shot(page, 'd-16-achievements');
  log('semua 7 lencana diperoleh');
  await page.goto(`${APP}/#/app/profile`);
  await page.getByText('Nilai evaluasi terbaik').waitFor();
  await shot(page, 'd-17-profile');
  await page.goto(`${APP}/#/app/history`);
  await page.getByRole('cell', { name: 'Evaluasi' }).first().waitFor();
  await shot(page, 'd-18-history');
  await page.goto(`${APP}/#/app`);
  await page.getByText('Royal Dashboard').waitFor();
  await page.waitForTimeout(500);
  const xpEnd = await page.locator('dd.math').first().innerText();
  await shot(page, 'd-19-dashboard-akhir');

  // Logout & login ulang -> progres tetap
  await btn(page, 'Keluar').first().click();
  await page.waitForURL(/#\/login/);
  await page.goto(`${APP}/#/app`);
  await page.waitForURL(/#\/login/);
  await login(page, 'RA-7A-01');
  await page.waitForTimeout(500);
  const xpAgain = await page.locator('dd.math').first().innerText();
  if (xpAgain !== xpEnd) problems.push(`XP setelah login ulang ${xpAgain} != ${xpEnd}`);
  log(`logout/login ulang: XP tetap ${xpAgain}`);

  // Siswa B tidak melihat data A
  const ctxB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pb = await ctxB.newPage();
  watch(pb, 'siswaB');
  await login(pb, 'RA-7A-02');
  await pb.waitForTimeout(500);
  const xpB = await pb.locator('dd.math').first().innerText();
  if (xpB.trim() !== '0') problems.push(`siswa B melihat XP ${xpB}`);
  await pb.goto(`${APP}/#/app/history`);
  await pb.getByText('Belum ada aktivitas').waitFor();
  log('siswa B: data terpisah (XP 0, riwayat kosong)');
  await ctxB.close();

  // ---------- Mobile ----------
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const mp = await mctx.newPage();
  watch(mp, 'mobile');
  await mp.goto(APP);
  await mp.getByText('Your Magical Journey Begins Here!').waitFor();
  await mp.waitForTimeout(1000);
  await shot(mp, 'm-01-landing');
  await noHorizontalScroll(mp, 'm-landing');
  await login(mp, 'RA-7A-01');
  const mobilePages = [['', 'm-02-dashboard'], ['map', 'm-03-map'], ['lessons/magic-library', 'm-04-lesson'], ['lab', 'm-05-lab'],
    ['training', 'm-06-training'], ['games', 'm-07-games'], ['final', 'm-08-final'], ['achievements', 'm-09-achievements'],
    ['profile', 'm-10-profile'], ['history', 'm-11-history']];
  for (const [path, name] of mobilePages) {
    await mp.goto(`${APP}/#/app/${path}`);
    await mp.waitForLoadState('networkidle');
    await mp.waitForTimeout(400);
    await shot(mp, name);
    await noHorizontalScroll(mp, name);
  }
  await mp.goto(`${APP}/#/app/games/princess-square-hunter`);
  await btn(mp, 'Mulai Bermain').click();
  await mp.getByText('Ronde 1/5').waitFor();
  await shot(mp, 'm-12-game');
  await noHorizontalScroll(mp, 'm-game');
  await mp.goto(`${APP}/#/app/training/level-2`);
  await btn(mp, 'Mulai Latihan').click();
  await mp.getByText('Soal 1 dari 8').waitFor();
  await shot(mp, 'm-13-training');
  await noHorizontalScroll(mp, 'm-training');

  // Admin page
  await page.goto(`${APP}/#/admin`);
  await page.locator('input[type=password]').fill(ADMIN);
  await btn(page, 'Buka').click();
  await page.getByText('2 siswa terdaftar').waitFor();
  await shot(page, 'd-20-admin');
  log('halaman guru OK');

  await browser.close();
}

run()
  .then(() => {
    const real = problems.filter((p) => !/Failed to load resource.*(401|403|422|404)/.test(p));
    console.log('\n==== RINGKASAN ====');
    if (real.length) { real.forEach((p) => console.log('✗', p)); process.exitCode = 1; } else console.log('✓ Semua langkah E2E lulus tanpa error konsol.');
  })
  .catch(async (e) => {
    try { await globalThis.__page?.screenshot({ path: `${SHOTS}ERROR.png`, fullPage: true }); } catch {}
    console.error('\n✗ GAGAL:', e.message.split('\n').slice(0, 6).join('\n'));
    problems.forEach((p) => console.log('  ', p));
    process.exitCode = 1;
  })
  .finally(() => setTimeout(() => process.exit(), 100));
