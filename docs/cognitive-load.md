# ROYAL ADVENTURE — Penerapan Cognitive Load

## Status data wawancara

> **Penting:** Saat aplikasi ini dibangun, **dokumen hasil wawancara siswa tentang Cognitive Load tidak ada di folder proyek.**
> Oleh karena itu dokumen ini **tidak memuat temuan wawancara apa pun**. Semua keputusan di bawah ditandai sebagai
> **[Rekomendasi desain]**, yaitu keputusan yang bersumber dari prinsip Cognitive Load Theory (beban intrinsik,
> ekstrinsik, dan germane) dan dari ketentuan pada spesifikasi proyek — **bukan** dari hasil wawancara.

Setelah dokumen wawancara tersedia, isi bagian **"Template pemetaan hasil wawancara"** di akhir file ini, lalu
tandai setiap keputusan desain sebagai *didukung*, *perlu diubah*, atau *belum dibahas* oleh hasil wawancara.

---

## A. Intrinsic Cognitive Load — urutan materi

| Keputusan | Lokasi di aplikasi | Sumber |
|---|---|---|
| Urutan: bentuk persegi → menghitung kotak → urutan bilangan → suku berikutnya → rumus → penerapan | `frontend/src/content/lessons.js`, empat level di peta | [Rekomendasi desain] sesuai spesifikasi |
| Level dibuka berurutan; level yang sudah terbuka bisa diulang | `backend/app/engine.py` (`_is_unlocked`), `KingdomMap.jsx` | [Rekomendasi desain] |
| Rumus Uₙ = n² baru diperkenalkan di Level 3 setelah siswa melihat hubungan sisi ↔ nomor suku | Level 3 *Magic Library*, `FormulaWidget` | [Rekomendasi desain] |
| Soal latihan & Final Quest diurutkan dari tingkat kesulitan 1 → 3 | `engine.py` (`_stratified`, pengurutan `difficulty`) | [Rekomendasi desain] |
| Magic Formula Challenge bertahap: n → Uₙ, lalu Uₙ → n, lalu soal cerita | `generators.py` (`magic_formula`) | [Rekomendasi desain] |

## B. Extraneous Cognitive Load — mengurangi beban yang tidak perlu

| Keputusan | Lokasi | Sumber |
|---|---|---|
| Materi dipecah menjadi 7 bagian pendek (Tujuan, Konsep, Pola, Langkah, Contoh, Latihan, Rangkuman); hanya satu bagian tampil sekaligus | `Lesson.jsx` | [Rekomendasi desain] |
| Satu soal per layar pada latihan dan evaluasi | `StepQuiz.jsx`, `FinalQuest.jsx` | [Rekomendasi desain] |
| Penyelesaian contoh soal dibuka satu langkah demi satu langkah | `RevealSteps` di `Lesson.jsx` | [Rekomendasi desain] |
| Math Lab memakai tab: hanya satu alat yang tampil | `MathLab.jsx` | [Rekomendasi desain] |
| Navigasi ponsel dibatasi 5 tujuan utama | `AppLayout.jsx` | [Rekomendasi desain] |
| Dekorasi princess hanya di sapaan/header; area soal berlatar polos | seluruh halaman soal | [Rekomendasi desain] sesuai spesifikasi |
| Animasi lembut dan otomatis dimatikan bila perangkat meminta *reduced motion*; visual 3D bersifat opsional | `index.css`, `MagicTiles3D.jsx` | [Rekomendasi desain] |
| Tanpa batas waktu pada permainan; timer Final Quest bisa dimatikan | `gameInfo.js`, `FinalQuest.jsx` | [Rekomendasi desain] |

## C. Germane Cognitive Load — membangun pemahaman

| Keputusan | Lokasi | Sumber |
|---|---|---|
| Visualisasi susunan persegi di setiap tahap (SVG, kotak tambahan disorot emas untuk menunjukkan selisih ganjil) | `SquareGrid.jsx`, `LessonWidgets.jsx` | [Rekomendasi desain] |
| Jawaban salah → petunjuk + kesempatan kedua → pembahasan langkah demi langkah (bukan sekadar "salah") | `engine.py` (`answer`), `Feedback.jsx` | Spesifikasi proyek |
| Kolom "Jelaskan caramu" pada soal cerita; alasan disimpan bersama jawaban | `ask_reason` di bank soal, `StepQuiz.jsx` | Spesifikasi proyek (literasi matematis) |
| Soal kontekstual dengan langkah: identifikasi pola → nilai n → hasil | soal bertipe `steps` | Spesifikasi proyek |
| Latihan singkat langsung setelah penjelasan di setiap level | `Lesson.jsx` bagian 6 | Spesifikasi proyek |

---

## Template pemetaan hasil wawancara

Isi tabel ini **hanya** dengan kutipan/temuan yang benar-benar ada di dokumen wawancara.

| No | Temuan wawancara (kutipan/ringkasan + kode responden) | Aspek CL (intrinsik/ekstrinsik/germane) | Keputusan desain terkait | Status (didukung / perlu diubah / belum dibahas) |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

Keputusan desain yang **tidak** didukung oleh hasil wawancara tetap berlabel **[Rekomendasi desain]**.
