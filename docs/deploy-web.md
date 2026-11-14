# ROYAL ADVENTURE — Deploy web (Supabase + Vercel)

Hasil akhirnya satu link seperti `https://royal-adventure.vercel.app` yang berisi frontend dan backend FastAPI
sekaligus (`/api/*`). Vercel membangun aplikasi langsung dari repo GitHub, jadi setiap `git push` ke `main` otomatis
memperbarui website.

## 1. Supabase (database & login)

1. Buka <https://supabase.com/dashboard>, login (bisa dengan GitHub), lalu klik **New project**.
   - Nama bebas, misalnya `royal-adventure`. Region: **Southeast Asia (Singapore)**.
2. Setelah proyek siap, buka **SQL Editor → New query**. Tempel seluruh isi
   [`supabase/setup_all.sql`](../supabase/setup_all.sql), lalu klik **Run**. Hasilnya harus *Success*.
3. Buka **Project Settings → API** (atau **API Keys**) dan catat tiga nilai:
   - **Project URL**, contoh `https://abcd1234.supabase.co`
   - **anon public key**
   - **service_role key**. Ini **rahasia**; hanya dimasukkan ke Vercel.

## 2. Vercel (hosting web + backend)

1. Buka <https://vercel.com/new>, login dengan GitHub, lalu **Import** repo `2225250129_Herfi-Maulidya`.
2. Biarkan **Root Directory** di akar repo dan **Framework Preset**: *Other*. Perintah build sudah diatur oleh `vercel.json`.
3. Buka **Environment Variables** dan tambahkan:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_ANON_KEY` | anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
   | `VITE_SUPABASE_URL` | Project URL (sama) |
   | `VITE_SUPABASE_ANON_KEY` | anon public key (sama) |
   | `STUDENT_PASSWORD_SECRET` | teks acak ≥ 32 karakter |
   | `ADMIN_API_KEY` | kunci rahasia untuk halaman guru |

   > Jangan isi `VITE_API_URL` di Vercel. Bila kosong, frontend otomatis memanggil backend di domain yang sama.
4. Klik **Deploy**. Setelah selesai, Vercel memberi link, misalnya `https://xxxx.vercel.app`.

## 3. Cek & daftarkan siswa

1. Buka `https://<link-anda>/api/health`. Hasilnya harus berisi `"supabase_configured": true`.
2. Buka `https://<link-anda>/#/admin`, masukkan `ADMIN_API_KEY`, lalu tambahkan kode siswa (misalnya `RA-7A-01`).
3. Buka `https://<link-anda>/#/login` dan masuk dengan kode tersebut.

## Jika ada masalah

| Gejala | Penyebab umum |
|---|---|
| Login menampilkan "Supabase belum dikonfigurasi" | `VITE_SUPABASE_*` belum diisi saat build. Isi, lalu **Redeploy**. |
| `/api/health` menunjukkan `supabase_configured: false` | `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` belum diisi. Isi, lalu Redeploy. |
| Error "Konfigurasi belum lengkap … STUDENT_PASSWORD_SECRET" | Variabel kosong atau kurang dari 32 karakter. |
| Error database / tabel tidak ada | `setup_all.sql` belum dijalankan di Supabase. |

Setiap kali Environment Variables diubah, jalankan **Deployments → ⋯ → Redeploy** agar perubahannya terpakai.
