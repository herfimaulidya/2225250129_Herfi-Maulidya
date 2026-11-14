# ROYAL ADVENTURE — Panduan & Laporan Pengujian

## 1. Pengujian otomatis

### Backend (pytest)

```bash
cd backend
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)
python -m pytest -q
```

Test memakai `tests/memory_store.py` (penyimpanan in-memory **khusus pengujian**) sehingga bisa dijalankan tanpa Supabase.
Yang diuji:

| Area | Contoh yang diperiksa |
|---|---|
| Bank soal | setiap kunci jawaban dinilai benar oleh mesin penilai; soal rumpang benar-benar barisan persegi berurutan; setiap soal punya pembahasan & petunjuk |
| Validasi input | kosong, huruf, desimal (`4.5`, `4,5`), boolean, angka terlalu besar ditolak |
| Generator 5 permainan | 40 seed acak × 5 permainan × 3 tingkat: jawaban selalu benar secara matematis, opsi tidak ganda |
| Alur sesi | urutan buka level, latihan singkat wajib sebelum menyelesaikan misi, petunjuk lalu pembahasan |
| Keamanan | kunci jawaban tidak pernah ada di respons awal sesi; siswa lain tidak bisa membuka/menjawab sesi orang lain (404); endpoint privat tanpa token → 401 |
| Gamifikasi | XP tidak bertambah bila misi/latihan diulang atau `finish` dipanggil dua kali; lencana sesuai syarat; level naik sesuai ambang XP |
| Final Quest | terkunci sebelum 4 level selesai; tanpa umpan balik selama berlangsung; timer menolak jawaban setelah habis; mode tanpa timer |
| API | login kode valid (tidak peka huruf besar/kecil), kode tidak terdaftar, format salah, kolom kosong, pembatasan percobaan (429), admin key |

### Frontend (vitest)

```bash
cd frontend
npm test
```

Menguji fungsi matematika (barisan, selisih, Uₙ), **validasi Royal Formula Calculator** (kosong, negatif, desimal, huruf, 0, > 1000) dan perhitungan Royal Level.

### Build

```bash
cd frontend
npm run build
```

### End-to-end di browser (Playwright)

Uji E2E menjalankan **backend asli** dan **frontend asli** terhadap **server tiruan Supabase**
(`backend/tests/e2e/mock_supabase.py`, khusus pengujian). Server tiruan meniru Supabase Auth, REST API, dan kebijakan
RLS pada `0002_rls.sql`. Robot (`e2e/run-e2e.mjs`) memainkan seluruh alur siswa di Chromium, lalu menyimpan screenshot
laptop (1280 px) dan HP (390 px) ke `e2e/screens/`.

Jalankan di empat terminal:

```bash
# 1) Supabase tiruan
cd backend && .venv\Scripts\python -m uvicorn tests.e2e.mock_supabase:app --port 54321

# 2) Backend asli yang diarahkan ke Supabase tiruan (bash / Git Bash)
cd backend && SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=e2e-anon-key \
  SUPABASE_SERVICE_ROLE_KEY=e2e-service-role-key STUDENT_PASSWORD_SECRET=e2e-secret-0123456789abcdef0123456789abcdef \
  ADMIN_API_KEY=e2e-admin CORS_ORIGINS=http://localhost:5173 .venv/Scripts/python -m uvicorn app.main:app --port 8000

# 3) Frontend
cd frontend && VITE_SUPABASE_URL=http://127.0.0.1:54321 VITE_SUPABASE_ANON_KEY=e2e-anon-key \
  VITE_API_URL=http://127.0.0.1:8000 npx vite --port 5173

# 4) Robot
cd e2e && npm install && npx playwright install chromium && npm test
```

Alur yang dicek robot:
- halaman privat dialihkan ke login, serta validasi kode kosong dan kode tidak terdaftar
- Level 2 terkunci, dan "Selesaikan Misi" nonaktif sebelum latihan dikerjakan
- keempat misi, termasuk notifikasi lencana dan XP yang tepat (90 setelah misi 1)
- Math Lab: builder, tampilan 3D, explorer, serta kalkulator dengan semua validasinya
- Training Level 1 (jawaban salah → petunjuk) dan Level 3 (soal cerita + alasan)
- kelima permainan sampai skor akhir
- Final Quest: jawaban tetap tersimpan setelah reload, soal kosong, halaman periksa, kirim, skor 90
- 7/7 lencana, profil, dan riwayat
- logout lalu login ulang: XP tetap
- siswa B tidak melihat data siswa A
- halaman guru
- 13 halaman di ukuran HP tanpa scroll horizontal

## 2. Hasil yang sudah dijalankan saat pengembangan

| Pemeriksaan | Hasil |
|---|---|
| `pytest` backend | **88 lulus** |
| `vitest` frontend | **20 lulus** |
| `vite build` | **berhasil** |
| Parse SQL (`0001_schema.sql`, `0002_rls.sql`, `seed.sql`) dengan parser PostgreSQL (pglast) | **berhasil** |
| E2E Playwright (laptop + HP) terhadap Supabase tiruan | **semua langkah lulus, tanpa error konsol** |
| Build APK debug (`gradlew assembleDebug`, JDK 17 + Android SDK 34) | **berhasil**: `frontend/android/app/build/outputs/apk/debug/app-debug.apk` |
| Backend tanpa kredensial Supabase | menolak login dengan pesan konfigurasi (503) — tidak ada login palsu |

Bug yang ditemukan lewat E2E dan sudah diperbaiki:
- Berpindah antar-permainan atau antar-level latihan masih menampilkan hasil permainan/latihan sebelumnya.
- Di bagian Latihan pada materi tidak ada tombol menuju Rangkuman.
- Menu header terpotong menjadi dua baris pada layar 1280 px.
- Notifikasi XP/lencana menumpuk dan menutupi konten.
- Ubin emas 3D tampak gelap, dan ikon Final Quest di peta tertimpa garis jalur.

**Belum diuji** (membutuhkan kredensial/perangkat yang tidak tersedia saat pengembangan):

- Proyek Supabase **sungguhan**. Server tiruan meniru perilakunya, tetapi SQL RLS asli baru terbukti setelah
  dijalankan di Supabase. Kerjakan bagian "Keamanan" di daftar uji manual.
- Menjalankan APK di emulator atau HP Android fisik.

Gunakan daftar uji manual di bawah setelah Supabase dikonfigurasi.

## 3. Daftar uji manual (setelah Supabase aktif)

Centang setiap butir. Jangan menandai lulus sebelum benar-benar dicoba.

**Autentikasi**
- [ ] Login dengan kode valid → masuk dashboard dengan nama sendiri
- [ ] Login dengan kode tidak terdaftar → pesan "Kode siswa tidak terdaftar"
- [ ] Kolom kosong → pesan "Kode siswa belum diisi"
- [ ] Buka `#/app` tanpa login → diarahkan ke halaman login
- [ ] Logout → kembali ke login; tombol Back tidak membuka dashboard
- [ ] Login ulang → progres, XP, dan lencana masih ada

**Materi & peta**
- [ ] Hanya Level 1 terbuka di awal; Level 2 terbuka setelah misi Level 1 selesai
- [ ] Tombol "Selesaikan Misi" nonaktif sebelum latihan singkat dikerjakan
- [ ] Level yang sudah selesai bisa dibuka ulang; XP tidak bertambah lagi

**Royal Math Lab**
- [ ] Visualisasi: memilih suku 1–6 menampilkan n × n kotak
- [ ] Builder: slider/tombol mengubah baris, kolom, total, rumus; tampilan 3D bisa dinyalakan
- [ ] Explorer: tabel 1 × 1 … dan klik baris menampilkan susunan
- [ ] Kalkulator: 8 → 64; input kosong/negatif/desimal/huruf memunculkan pesan

**Latihan, permainan, evaluasi**
- [ ] Jawaban salah → petunjuk; salah kedua → kunci + pembahasan
- [ ] Kelima permainan bisa dimainkan sampai hasil akhir dan "Main Lagi"
- [ ] Final Quest: navigasi nomor, halaman periksa, kirim, pembahasan, riwayat tersimpan
- [ ] Muat ulang halaman saat Final Quest → jawaban yang sudah disimpan masih ada

**Keamanan (di Supabase SQL Editor / REST)**
- [ ] Dengan token siswa A, `select * from quiz_attempts` hanya mengembalikan baris siswa A
- [ ] Dengan token siswa, `select * from quiz_questions` mengembalikan 0 baris / ditolak
- [ ] Dengan token siswa, `insert into user_stats ...` ditolak

**Tampilan**
- [ ] Laptop (≥ 1280 px), tablet (768 px), ponsel (360 px): tidak ada elemen bertumpuk atau scroll horizontal
