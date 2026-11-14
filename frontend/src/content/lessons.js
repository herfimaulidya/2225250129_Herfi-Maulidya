// Materi pembelajaran empat wilayah Enchanted Kingdom.
// Disusun bertahap (bentuk persegi -> hitung kotak -> urutan -> suku berikutnya -> rumus -> penerapan)
// dengan paragraf pendek agar beban kognitif tetap ringan.

export const LESSONS = {
  'princess-castle': {
    levelNo: 1,
    region: 'Princess Castle',
    title: 'Mengenal Pola Bilangan Persegi',
    companion: 'seraphina',
    greeting: 'Hai, Royal Adventurer! Yuk, kita amati bagaimana kotak-kotak di jendela kastel ini membentuk sebuah persegi.',
    objectives: [
      'Menjelaskan arti pola bilangan.',
      'Mengenali susunan kotak yang berbentuk persegi.',
      'Menghitung banyak kotak pada susunan persegi.',
      'Menyebutkan contoh bilangan persegi: 1, 4, 9, 16, 25, 36, ...',
    ],
    concept: [
      { title: 'Apa itu pola bilangan?', text: 'Pola bilangan adalah susunan bilangan yang mengikuti aturan tertentu. Jika aturannya ditemukan, kita bisa menebak bilangan berikutnya.' },
      { title: 'Apa itu bilangan persegi?', text: 'Bilangan persegi adalah hasil perkalian suatu bilangan dengan dirinya sendiri, misalnya 3 × 3 = 9.' },
      { title: 'Mengapa disebut "persegi"?', text: 'Karena banyak bendanya selalu bisa disusun menjadi persegi: banyak baris SAMA dengan banyak kolom.' },
    ],
    visual: { kind: 'pattern', terms: [1, 2, 3, 4], caption: 'Jendela kastel: 1 × 1, 2 × 2, 3 × 3, 4 × 4' },
    interactive: 'count',
    numbers: [1, 4, 9, 16, 25, 36],
    table: {
      head: ['Susunan', 'Baris × Kolom', 'Banyak kotak'],
      rows: [[1, '1 × 1', 1], [2, '2 × 2', 4], [3, '3 × 3', 9], [4, '4 × 4', 16], [5, '5 × 5', 25], [6, '6 × 6', 36]],
    },
    steps: [
      'Amati bentuk susunan: apakah baris dan kolomnya sama banyak?',
      'Hitung banyak kotak dalam satu baris.',
      'Hitung banyak baris.',
      'Kalikan: kotak per baris × banyak baris.',
    ],
    example: {
      question: 'Susunan ubin di lantai kastel terdiri dari 5 baris dan 5 kolom. Berapa banyak ubinnya? Apakah termasuk bilangan persegi?',
      solution: [
        'Baris = 5 dan kolom = 5, jadi susunannya berbentuk persegi.',
        'Banyak ubin = 5 × 5 = 25.',
        'Karena 25 = 5 × 5, maka 25 adalah bilangan persegi.',
      ],
    },
    summary: [
      'Pola bilangan = susunan bilangan dengan aturan tertentu.',
      'Bilangan persegi = bilangan × dirinya sendiri.',
      'Susunan persegi: banyak baris = banyak kolom.',
      'Contoh: 1, 4, 9, 16, 25, 36, ...',
    ],
    closing: 'Hebat! Sekarang kamu tahu bahwa bilangan persegi selalu bisa disusun menjadi persegi. Siap menjelajah Enchanted Garden?',
  },

  'enchanted-garden': {
    levelNo: 2,
    region: 'Enchanted Garden',
    title: 'Menentukan Suku Berikutnya',
    companion: 'rosalind',
    greeting: 'Selamat datang di taman ajaib! Bunga-bunga di sini tumbuh mengikuti pola. Yuk, kita temukan rahasianya!',
    objectives: [
      'Mengamati urutan bilangan persegi.',
      'Menghitung selisih antarbilangan persegi.',
      'Menemukan pola pertambahan (selisih).',
      'Menentukan suku berikutnya dari sebuah pola.',
    ],
    concept: [
      { title: 'Suku', text: 'Setiap bilangan dalam pola disebut suku. Pada 1, 4, 9, 16, ... suku ke-1 adalah 1, suku ke-2 adalah 4, dan seterusnya.' },
      { title: 'Selisih', text: 'Selisih adalah hasil pengurangan suku dengan suku sebelumnya. Contoh: 4 − 1 = 3.' },
      { title: 'Rahasia taman', text: 'Selisih bilangan persegi selalu bilangan ganjil berurutan: 3, 5, 7, 9, ... Pada gambar, kotak emas adalah kotak tambahannya.' },
    ],
    visual: { kind: 'pattern', terms: [1, 2, 3, 4, 5], highlight: true, caption: 'Kotak emas = tambahan dari susunan sebelumnya' },
    interactive: 'differences',
    numbers: [1, 4, 9, 16, 25, 36],
    table: {
      head: ['Dari', 'Ke', 'Selisih'],
      rows: [['1', '4', '+3'], ['4', '9', '+5'], ['9', '16', '+7'], ['16', '25', '+9'], ['25', '36', '+11']],
    },
    steps: [
      'Tuliskan urutan bilangannya.',
      'Hitung selisih setiap dua suku yang berdekatan.',
      'Amati pola selisihnya (3, 5, 7, 9, ...).',
      'Tentukan selisih berikutnya (tambah 2).',
      'Tambahkan selisih itu ke suku terakhir.',
    ],
    example: {
      question: 'Tentukan dua suku berikutnya dari pola 1, 4, 9, 16, 25, ...',
      solution: [
        'Selisihnya: 3, 5, 7, 9.',
        'Selisih berikutnya: 11, lalu 13.',
        'Suku ke-6 = 25 + 11 = 36.',
        'Suku ke-7 = 36 + 13 = 49.',
        'Cek: 36 = 6 × 6 dan 49 = 7 × 7. Cocok!',
      ],
    },
    summary: [
      'Selisih antarbilangan persegi: 3, 5, 7, 9, 11, ... (bilangan ganjil).',
      'Selisih bertambah 2 setiap langkah.',
      'Suku berikutnya = suku terakhir + selisih berikutnya.',
      'Selalu cek: apakah hasilnya n × n?',
    ],
    closing: 'Wonderful! Kamu sudah bisa menebak suku berikutnya. Tapi bagaimana jika ditanya suku ke-50? Rahasianya ada di Magic Library!',
  },

  'magic-library': {
    levelNo: 3,
    region: 'Magic Library',
    title: 'Rumus Pola Bilangan Persegi',
    companion: 'lumina',
    greeting: 'Psst... buku mantra di perpustakaan ini menyimpan rumus ajaib. Tapi kita tidak akan menghafalnya — kita akan MENEMUKANNYA bersama!',
    objectives: [
      'Menghubungkan nomor suku dengan panjang sisi persegi.',
      'Menjelaskan mengapa banyak kotak = n × n.',
      'Menemukan dan menuliskan rumus Uₙ = n².',
      'Menggunakan rumus untuk mencari suku ke-n.',
    ],
    concept: [
      { title: 'Amati nomor suku', text: 'Susunan ke-1 punya sisi 1 kotak, susunan ke-2 punya sisi 2 kotak, susunan ke-3 punya sisi 3 kotak. Panjang sisi = nomor suku!' },
      { title: 'Hitung kotaknya', text: 'Persegi dengan sisi n berisi n baris dan n kolom. Jadi banyak kotaknya n × n.' },
      { title: 'Tulis sebagai rumus', text: 'n × n ditulis n² (dibaca "n kuadrat"). Maka suku ke-n: Uₙ = n².' },
      { title: 'Arti simbol', text: 'Uₙ = suku ke-n (banyak kotak). n = nomor urutan suku (panjang sisi).' },
    ],
    visual: { kind: 'formula' },
    interactive: 'formula',
    numbers: [1, 4, 9, 16, 25, 36],
    table: {
      head: ['Nomor suku (n)', 'Sisi', 'Baris × Kolom', 'Uₙ'],
      rows: [[1, 1, '1 × 1', 1], [2, 2, '2 × 2', 4], [3, 3, '3 × 3', 9], [4, 4, '4 × 4', 16], ['n', 'n', 'n × n', 'n²']],
    },
    steps: [
      'Tentukan nomor suku yang ditanya (n).',
      'Ingat: suku ke-n adalah persegi dengan sisi n.',
      'Substitusi ke rumus Uₙ = n².',
      'Hitung n × n.',
      'Tulis kesimpulan.',
    ],
    example: {
      question: 'Tentukan suku ke-6 dari pola bilangan persegi.',
      solution: ['n = 6.', 'U₆ = 6².', 'U₆ = 6 × 6 = 36.', 'Jadi, suku ke-6 adalah 36.'],
    },
    summary: [
      'Panjang sisi persegi = nomor suku (n).',
      'Banyak kotak = n × n = n².',
      'Rumus pola bilangan persegi: Uₙ = n².',
      'Kebalikannya: jika Uₙ diketahui, cari n yang n × n = Uₙ.',
    ],
    closing: 'Luar biasa! Kamu tidak sekadar menghafal — kamu memahami asal rumus Uₙ = n². Saatnya menghadapi tantangan di Royal Challenge Palace!',
  },

  'royal-challenge-palace': {
    levelNo: 4,
    region: 'Royal Challenge Palace',
    title: 'Penerapan Pola Bilangan Persegi',
    companion: 'marina',
    greeting: 'Selamat datang di istana tantangan! Di sini, pola persegi muncul di kursi tamu, ubin, bunga, dan lampu hias. Ayo pecahkan masalah kerajaan!',
    objectives: [
      'Mengidentifikasi informasi penting dari soal cerita.',
      'Mengenali bahwa masalah tersebut berpola bilangan persegi.',
      'Menggunakan rumus Uₙ = n² untuk menyelesaikan masalah.',
      'Menafsirkan dan menjelaskan hasil perhitungan.',
    ],
    concept: [
      { title: 'Pola persegi di sekitar kita', text: 'Kursi yang ditata persegi, ubin lantai, kebun bunga, dan lampu hias sering membentuk susunan n × n.' },
      { title: 'Empat langkah literasi', text: 'Pahami soal → Temukan pola → Hitung dengan rumus → Tafsirkan jawaban dalam konteks soal.' },
      { title: 'Masalah terbalik', text: 'Kadang yang diketahui adalah banyak bendanya. Maka kita mencari n: bilangan yang jika dikalikan dirinya sendiri sama dengan banyak benda.' },
    ],
    visual: { kind: 'context' },
    interactive: 'literacy',
    numbers: [1, 4, 9, 16, 25, 36],
    table: {
      head: ['Konteks', 'Diketahui', 'Dihitung'],
      rows: [['Ubin lantai', 'sisi 12 ubin', '12² = 144 ubin'], ['Kursi tamu', '100 kursi', 'n = 10 per baris'], ['Bunga ke-8', 'pola 1, 4, 9', '8² = 64 bunga']],
    },
    steps: [
      'Pahami soal: tulis apa yang diketahui dan ditanya.',
      'Temukan pola: apakah 1, 4, 9, ... (persegi)?',
      'Pilih strategi: gunakan Uₙ = n² atau cari n dari Uₙ.',
      'Hitung dengan teliti.',
      'Tafsirkan: tulis jawaban lengkap dengan satuannya.',
    ],
    example: {
      question: 'Di taman kerajaan, tanaman disusun membentuk persegi. Susunan pertama 1 tanaman, kedua 4 tanaman, ketiga 9 tanaman. Tentukan banyak tanaman pada susunan ke-6.',
      solution: [
        'Diketahui: 1, 4, 9, ... Ditanya: susunan ke-6.',
        'Pola: 1 = 1², 4 = 2², 9 = 3² → pola bilangan persegi.',
        'Strategi: gunakan Uₙ = n² dengan n = 6.',
        'U₆ = 6² = 36.',
        'Jadi, banyak tanaman pada susunan ke-6 adalah 36 tanaman.',
      ],
    },
    summary: [
      'Baca soal dengan teliti: diketahui & ditanya.',
      'Kenali pola bilangan persegi.',
      'Gunakan Uₙ = n² (atau cari n dari Uₙ).',
      'Tulis kesimpulan beserta satuan dan alasannya.',
    ],
    closing: 'Congratulations! Kamu berhasil membuka seluruh gerbang kerajaan. The Royal Final Quest kini menantimu!',
  },
};

export const LESSON_ORDER = ['princess-castle', 'enchanted-garden', 'magic-library', 'royal-challenge-palace'];
