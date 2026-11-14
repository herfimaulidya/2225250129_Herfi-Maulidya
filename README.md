# 👑 ROYAL ADVENTURE

**"A Magical Journey to Discover the World of Numbers!"**

ROYAL ADVENTURE adalah aplikasi pembelajaran matematika berbasis permainan untuk siswa SMP dengan materi
**Pola Bilangan Persegi**. Siswa berperan sebagai *Royal Adventurer* yang menjelajahi Enchanted Kingdom bersama
putri-putri pemandu, menyelesaikan misi, mengumpulkan Royal Points, dan meraih Princess Badges.

> Tema bernuansa dongeng putri kerajaan. Semua ilustrasi dan karakter pendamping (Putri Seraphina, Rosalind,
> Lumina, Marina) adalah **karya orisinal** — bukan aset atau karakter resmi Disney.

---

## Daftar isi

1. [Fitur utama](#fitur-utama)
2. [Teknologi](#teknologi)
3. [Arsitektur & keamanan](#arsitektur--keamanan)
4. [Struktur folder](#struktur-folder)
5. [Instalasi dependency](#instalasi-dependency)
6. [Membuat & mengonfigurasi Supabase](#membuat--mengonfigurasi-supabase)
7. [Menjalankan migrasi database & seed](#menjalankan-migrasi-database--seed)
8. [Mendaftarkan kode siswa](#mendaftarkan-kode-siswa)
9. [Menjalankan backend](#menjalankan-backend)
10. [Menjalankan frontend di laptop](#menjalankan-frontend-di-laptop)
11. [Build aplikasi Android](#build-aplikasi-android)
12. [Pengujian](#pengujian)
13. [Cognitive Load & Literasi Matematis](#cognitive-load--literasi-matematis)
14. [Konfigurasi](#konfigurasi)

---

## Fitur utama

| Fitur | Isi |
|---|---|
| **Landing page** | Hero, About, What Will You Discover?, Magical Features, How to Play |
| **Login kode siswa** | Kode divalidasi backend → sesi Supabase Auth asli; pesan kesalahan jelas, indikator loading, logout |
| **Royal Dashboard** | Sapaan, kode, progres, Royal Points, misi selesai, Royal Level, lencana, aktivitas terakhir, rekomendasi misi, peta |
| **Enchanted Kingdom Map** | 4 wilayah terbuka berurutan + Final Quest; wilayah terbuka bisa diulang |
| **4 level materi** | Princess Castle · Enchanted Garden · Magic Library · Royal Challenge Palace — tiap level: tujuan, konsep, ilustrasi, contoh bilangan, tabel, langkah, contoh soal bertahap, latihan singkat, rangkuman, pesan pendamping, tombol misi & materi berikutnya |
| **Royal Math Lab** | Magical Pattern Visualization · Interactive Pattern Builder (2D + 3D Three.js) · Number Pattern Explorer · Royal Formula Calculator (validasi lengkap) |
| **Royal Training Zone** | 3 tingkat (Princess Beginner, Royal Explorer, Royal Expert), 30 soal bank, 5 tipe soal (pilihan ganda, benar/salah, isian angka, melengkapi pola, soal cerita bertahap), petunjuk → kesempatan kedua → pembahasan |
| **Magical Playground** | 5 permainan dengan mekanisme berbeda: pilih-semua, isi kalung rumpang, pilih permata beruntun (3 tingkat), mantra rumus bertahap, petualangan 5 gerbang |
| **The Royal Final Quest** | Soal dari seluruh materi (jumlah dapat dikonfigurasi), timer opsional, navigasi nomor, periksa ulang, skor otomatis, pembahasan, riwayat |
| **Gamifikasi** | Royal Points (XP), 6 Royal Level, 7 Princess Badges, Royal Stars, notifikasi lencana; XP anti-ganda |
| **Profil & riwayat** | My Royal Profile + tabel riwayat aktivitas dengan filter |
| **Halaman guru** (`#/admin`) | Tambah/hapus kode siswa, dilindungi `ADMIN_API_KEY` |

## Teknologi

- **Frontend:** JavaScript, React 18, Vite 5, Tailwind CSS 3, Lucide React, React Router (HashRouter)
- **Visualisasi:** SVG (susunan persegi), Three.js (ubin kristal 3D, dimuat lazy), CSS Animation
- **Backend:** Python, FastAPI, httpx
- **Database & Auth:** Supabase (PostgreSQL + Supabase Auth + Row Level Security)
- **Android:** Capacitor 6

## Arsitektur & keamanan

```
 Siswa ─► React (Vite) ──► FastAPI ──(service role)──► Supabase PostgreSQL
              │                 │                         ▲
              │                 └──► Supabase Auth (GoTrue)│
              └──(anon key + JWT siswa, RLS: hanya SELECT data sendiri)┘
```

- **Login:** siswa memasukkan kode → FastAPI mencari kode di `profiles` → login ke Supabase Auth dengan akun milik
  siswa tersebut (password diturunkan di server dari kode + `STUDENT_PASSWORD_SECRET`) → token dikirim ke frontend
  → `supabase.auth.setSession`. Sesi diperbarui otomatis oleh supabase-js.
- **Penilaian di server:** soal dan ronde permainan disimpan di `activity_sessions` beserta kuncinya. Frontend hanya
  menerima soal tanpa kunci. Skor, XP, lencana, dan progres ditulis oleh backend → skor tidak bisa dimanipulasi dari browser.
- **XP anti-ganda:** setiap sumber XP punya kunci unik di `xp_ledger` (mis. `lesson:magic-library`, `game:find-the-royal-number:80`).
- **RLS:** siswa hanya bisa `SELECT` baris miliknya; tidak ada hak `INSERT/UPDATE/DELETE`. `quiz_questions` dan
  `activity_sessions` tertutup sepenuhnya untuk siswa.
- **Rahasia:** `SUPABASE_SERVICE_ROLE_KEY`, `STUDENT_PASSWORD_SECRET`, `ADMIN_API_KEY` hanya ada di `backend/.env`.
  Frontend hanya memakai anon key publik.
- Pembatasan percobaan login (10/menit per IP), validasi format kode, validasi setiap jawaban.

## Struktur folder

```
.
├── README.md
├── docs/
│   ├── cognitive-load.md        # penerapan Cognitive Load + template hasil wawancara
│   └── testing.md               # panduan & laporan pengujian
├── e2e/                         # robot uji end-to-end (Playwright)
├── supabase/
│   ├── migrations/
│   │   ├── 0001_schema.sql      # 12 tabel utama + xp_ledger + activity_sessions
│   │   └── 0002_rls.sql         # Row Level Security & hak akses
│   └── seed.sql                 # materi, kuis, 58 soal, 5 permainan, 7 lencana
├── backend/
│   ├── .env.example
│   ├── requirements.txt / requirements-dev.txt
│   ├── students.example.csv
│   ├── app/
│   │   ├── main.py              # aplikasi FastAPI
│   │   ├── config.py            # environment variable
│   │   ├── auth_gateway.py      # Supabase Auth (verifikasi token, login, akun siswa)
│   │   ├── store.py             # akses database via Supabase REST
│   │   ├── engine.py            # sesi latihan/permainan/evaluasi
│   │   ├── grading.py           # penilaian & validasi jawaban
│   │   ├── generators.py        # generator ronde 5 permainan
│   │   ├── gamification.py      # XP, level, lencana, statistik
│   │   ├── deps.py              # dependensi FastAPI, admin key, rate limit
│   │   ├── routers/             # auth, activities, admin
│   │   ├── content/             # catalog.py (level, kuis, game, lencana), questions.py (bank soal)
│   │   └── scripts/             # seed_content, export_seed_sql, create_students
│   └── tests/                   # pytest
└── frontend/
    ├── .env.example
    ├── capacitor.config.json
    ├── android/                 # proyek Android (Capacitor)
    └── src/
        ├── App.jsx / main.jsx / index.css
        ├── lib/                 # supabase, api, math, levels
        ├── context/             # AuthContext, RewardContext
        ├── hooks/               # useStudentData, useActivitySession
        ├── content/             # lessons.js (materi), companions.js
        ├── components/          # art, companion, layout, math, quiz, ui
        └── pages/               # Landing, Login, Admin, Dashboard, KingdomMap, Lesson, MathLab,
                                 # Training, TrainingSession, Playground, games/*, FinalQuest,
                                 # Achievements, Profile, History
```

## Instalasi dependency

Prasyarat: **Node.js 18+**, **Python 3.11+**, akun **Supabase** (gratis).

```bash
# Backend
cd backend
python -m venv .venv            # Windows: py -m venv .venv
.venv\Scripts\activate          # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt

# Frontend
cd ../frontend
npm install
```

## Membuat & mengonfigurasi Supabase

1. Buka <https://supabase.com> → **New project**. Catat password database.
2. **Project Settings → API**: salin **Project URL**, **anon public key**, dan **service_role key**.
3. **Authentication → Providers → Email**: pastikan *Email* aktif. Akun siswa dibuat backend dengan
   `email_confirm = true`, jadi tidak ada email yang dikirim.
4. Salin file konfigurasi:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
5. Isi `backend/.env`:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `STUDENT_PASSWORD_SECRET` → buat dengan `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ADMIN_API_KEY` → kunci acak untuk halaman guru
6. Isi `frontend/.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (default `http://localhost:8000`).

> ⚠️ Jangan pernah menaruh service role key di `frontend/.env` dan jangan commit file `.env`.

## Menjalankan migrasi database & seed

**Cara A — SQL Editor Supabase (paling mudah):** buka **SQL Editor**, lalu jalankan berurutan isi file:

1. `supabase/migrations/0001_schema.sql`
2. `supabase/migrations/0002_rls.sql`
3. `supabase/seed.sql`

**Cara B — Supabase CLI:**
```bash
supabase link --project-ref <project-ref>
supabase db push                       # menjalankan folder supabase/migrations
psql "<connection-string>" -f supabase/seed.sql
```

**Cara C — seed dari Python** (setelah migrasi): `cd backend && python -m app.scripts.seed_content`

Bila bank soal di `backend/app/content/questions.py` diubah, buat ulang seed SQL dengan
`python -m app.scripts.export_seed_sql`.

## Mendaftarkan kode siswa

Format kode: 4–20 karakter huruf/angka/tanda `-` (mis. `RA-7A-01`). Pilih salah satu:

- **Halaman guru:** jalankan backend + frontend, buka `http://localhost:5173/#/admin`, masukkan `ADMIN_API_KEY`.
- **Impor CSV:** `cd backend && python -m app.scripts.create_students students.example.csv`
  (kolom: `student_code,full_name,class_name`).

## Menjalankan backend

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Cek: <http://localhost:8000/api/health> (`supabase_configured: true`). Dokumentasi API: <http://localhost:8000/docs>.

> Supabase tidak meng-hosting aplikasi FastAPI. Untuk dipakai di luar jaringan lokal, deploy backend ke layanan
> Python (mis. Render, Railway, Fly.io, VPS) dengan HTTPS, lalu set `VITE_API_URL` dan `CORS_ORIGINS`.

## Menjalankan frontend di laptop

```bash
cd frontend
npm run dev          # http://localhost:5173
```

Build produksi: `npm run build` (hasil di `frontend/dist`, bisa di-hosting statis; rute memakai `#/`).
Pratinjau build: `npm run preview`.

## Build aplikasi Android

Prasyarat: **Android Studio** (termasuk Android SDK & JDK 17), atau JDK 17 + Android SDK command-line tools.

> ⚠️ Nilai `VITE_*` ditanam ke dalam APK saat build. Isi `frontend/.env` **sebelum** `npm run android:sync`; tanpa itu, halaman login di APK akan menampilkan pesan "Supabase belum dikonfigurasi".

1. Atur `VITE_API_URL` di `frontend/.env` agar bisa dijangkau dari ponsel:
   - Emulator Android: `http://10.0.2.2:8000`
   - HP fisik di Wi-Fi yang sama: `http://<IP-laptop>:8000` (jalankan uvicorn dengan `--host 0.0.0.0`)
   - Produksi: URL HTTPS backend yang sudah di-deploy
2. Tambahkan origin aplikasi Android ke `CORS_ORIGINS` backend: `https://localhost` (sudah ada di contoh).
3. Build & salin ke proyek Android:
   ```bash
   cd frontend
   npm run android:sync      # vite build + cap sync android
   npm run android:open      # membuka Android Studio
   ```
4. Di Android Studio: **Run ▶** ke emulator/HP, atau **Build → Build App Bundle(s)/APK(s) → Build APK(s)**.
   Tanpa Android Studio (cukup JDK 17 + Android SDK, `ANDROID_HOME` & `JAVA_HOME` terset):
   ```bash
   cd frontend/android
   ./gradlew assembleDebug        # Windows: gradlew.bat assembleDebug
   ```
   APK debug ada di `frontend/android/app/build/outputs/apk/debug/`.

Catatan: `android:usesCleartextTraffic="true"` diaktifkan agar bisa memakai backend HTTP lokal saat pengembangan.
Untuk rilis, gunakan backend HTTPS dan hapus atribut tersebut dari `AndroidManifest.xml`.

## Pengujian

```bash
cd backend && python -m pytest -q      # 88 test
cd frontend && npm test                # 20 test
cd frontend && npm run build
```

Uji **end-to-end** di browser (Playwright, laptop + HP) memakai backend & frontend asli terhadap server tiruan Supabase — cara menjalankannya ada di [docs/testing.md](docs/testing.md).

Rincian cakupan, hasil, bagian yang **belum** diuji, dan daftar uji manual ada di [docs/testing.md](docs/testing.md).

## Cognitive Load & Literasi Matematis

Dokumen wawancara siswa **tidak tersedia** di proyek saat aplikasi dibangun, sehingga tidak ada temuan wawancara yang
dicantumkan. Semua keputusan desain Cognitive Load ditandai sebagai **[Rekomendasi desain]** dan dipetakan ke kode di
[docs/cognitive-load.md](docs/cognitive-load.md), lengkap dengan template untuk mengisi hasil wawancara asli.

Literasi matematis didukung lewat soal bertipe *langkah* (identifikasi pola → tentukan n → hitung → tafsirkan),
soal strategi & interpretasi, serta kolom **"Jelaskan caramu"** yang alasannya tersimpan bersama jawaban.

## Konfigurasi

| Variabel | Lokasi | Keterangan |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | backend | URL & anon key proyek |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | **rahasia**, hanya server |
| `STUDENT_PASSWORD_SECRET` | backend | **rahasia**, ≥ 32 karakter |
| `STUDENT_EMAIL_DOMAIN` | backend | domain email internal akun siswa |
| `ADMIN_API_KEY` | backend | kunci halaman guru |
| `CORS_ORIGINS` | backend | origin frontend yang diizinkan |
| `FINAL_QUESTION_COUNT`, `FINAL_TIME_LIMIT_SECONDS` | backend | 0 = pakai nilai tabel `quizzes` (default 10 soal, 1200 detik) |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` | frontend | konfigurasi publik |

Jumlah soal per latihan dan Final Quest juga dapat diubah langsung di kolom `question_count` / `time_limit_seconds`
pada tabel `quizzes`.
