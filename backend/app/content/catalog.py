"""Katalog konten ROYAL ADVENTURE: wilayah (lessons), kuis, permainan, lencana.

File ini adalah sumber data seed. Jalankan `python -m app.scripts.seed_content`
untuk menyalinnya ke Supabase, atau `python -m app.scripts.export_seed_sql`
untuk menghasilkan supabase/seed.sql.
"""

LESSONS = [
    {
        "id": "princess-castle",
        "level_no": 1,
        "region_name": "Princess Castle",
        "title": "Mengenal Pola Bilangan Persegi",
        "topic": "Pengertian pola bilangan persegi dan susunan kotak",
        "xp_reward": 50,
    },
    {
        "id": "enchanted-garden",
        "level_no": 2,
        "region_name": "Enchanted Garden",
        "title": "Menentukan Suku Berikutnya",
        "topic": "Selisih antarbilangan persegi dan suku berikutnya",
        "xp_reward": 50,
    },
    {
        "id": "magic-library",
        "level_no": 3,
        "region_name": "Magic Library",
        "title": "Rumus Pola Bilangan Persegi",
        "topic": "Menemukan rumus Uₙ = n²",
        "xp_reward": 50,
    },
    {
        "id": "royal-challenge-palace",
        "level_no": 4,
        "region_name": "Royal Challenge Palace",
        "title": "Penerapan Pola Bilangan Persegi",
        "topic": "Soal kontekstual pola bilangan persegi",
        "xp_reward": 50,
    },
]

QUIZZES = [
    {"id": "lesson-princess-castle", "kind": "lesson", "title": "Latihan Singkat: Princess Castle",
     "lesson_id": "princess-castle", "level_no": 1, "question_count": 3, "time_limit_seconds": None, "pass_score": 0},
    {"id": "lesson-enchanted-garden", "kind": "lesson", "title": "Latihan Singkat: Enchanted Garden",
     "lesson_id": "enchanted-garden", "level_no": 2, "question_count": 3, "time_limit_seconds": None, "pass_score": 0},
    {"id": "lesson-magic-library", "kind": "lesson", "title": "Latihan Singkat: Magic Library",
     "lesson_id": "magic-library", "level_no": 3, "question_count": 3, "time_limit_seconds": None, "pass_score": 0},
    {"id": "lesson-royal-challenge-palace", "kind": "lesson", "title": "Latihan Singkat: Royal Challenge Palace",
     "lesson_id": "royal-challenge-palace", "level_no": 4, "question_count": 3, "time_limit_seconds": None, "pass_score": 0},
    {"id": "training-level-1", "kind": "training", "title": "Princess Beginner",
     "lesson_id": None, "level_no": 1, "question_count": 8, "time_limit_seconds": None, "pass_score": 70},
    {"id": "training-level-2", "kind": "training", "title": "Royal Explorer",
     "lesson_id": None, "level_no": 2, "question_count": 8, "time_limit_seconds": None, "pass_score": 70},
    {"id": "training-level-3", "kind": "training", "title": "Royal Expert",
     "lesson_id": None, "level_no": 3, "question_count": 8, "time_limit_seconds": None, "pass_score": 70},
    {"id": "final", "kind": "final", "title": "The Royal Final Quest",
     "lesson_id": None, "level_no": None, "question_count": 10, "time_limit_seconds": 1200, "pass_score": 70},
]

GAMES = [
    {"id": "princess-square-hunter", "title": "Princess Square Hunter", "mechanic": "pilih-semua",
     "description": "Temukan semua susunan permata yang membentuk persegi.", "rounds": 5, "xp_max": 40},
    {"id": "complete-the-magic-pattern", "title": "Complete the Magic Pattern", "mechanic": "isi-rumpang",
     "description": "Lengkapi kalung bilangan persegi yang hilang.", "rounds": 6, "xp_max": 40},
    {"id": "find-the-royal-number", "title": "Find the Royal Number", "mechanic": "pilih-cepat-beruntun",
     "description": "Pilih permata bilangan berikutnya dan jaga rantai kemenanganmu.", "rounds": 8, "xp_max": 40},
    {"id": "magic-formula-challenge", "title": "Magic Formula Challenge", "mechanic": "langkah-rumus",
     "description": "Gunakan rumus Uₙ = n² langkah demi langkah, dari mudah ke sulit.", "rounds": 6, "xp_max": 40},
    {"id": "enchanted-kingdom-quest", "title": "Enchanted Kingdom Quest", "mechanic": "petualangan-gerbang",
     "description": "Buka lima gerbang kerajaan dengan memecahkan teka-teki pola persegi.", "rounds": 5, "xp_max": 40},
]

ACHIEVEMENTS = [
    {"id": "first-royal-adventure", "title": "First Royal Adventure", "icon": "sparkles", "sort_order": 1,
     "description": "Petualangan pertamamu dimulai!", "requirement": "Menyelesaikan misi pertama", "xp_bonus": 20},
    {"id": "princess-explorer", "title": "Princess Explorer", "icon": "castle", "sort_order": 2,
     "description": "Kamu sudah mengenal pola bilangan persegi.", "requirement": "Menyelesaikan materi Princess Castle", "xp_bonus": 20},
    {"id": "pattern-detective", "title": "Pattern Detective", "icon": "search", "sort_order": 3,
     "description": "Mata jeli penemu pola!", "requirement": "Skor minimal 70 pada Complete the Magic Pattern", "xp_bonus": 20},
    {"id": "magic-formula-master", "title": "Magic Formula Master", "icon": "wand", "sort_order": 4,
     "description": "Kamu memahami asal-usul rumus Uₙ = n².",
     "requirement": "Menyelesaikan Magic Library dan skor minimal 70 pada Magic Formula Challenge", "xp_bonus": 20},
    {"id": "royal-math-expert", "title": "Royal Math Expert", "icon": "gem", "sort_order": 5,
     "description": "Latihan tingkat lanjut berhasil ditaklukkan.", "requirement": "Skor minimal 70 pada Royal Training Level 3", "xp_bonus": 20},
    {"id": "kingdom-adventurer", "title": "Kingdom Adventurer", "icon": "map", "sort_order": 6,
     "description": "Kelima gerbang kerajaan telah kamu lewati.", "requirement": "Menyelesaikan Enchanted Kingdom Quest", "xp_bonus": 20},
    {"id": "royal-champion", "title": "Royal Champion", "icon": "crown", "sort_order": 7,
     "description": "Juara sejati Enchanted Kingdom!", "requirement": "Menyelesaikan The Royal Final Quest", "xp_bonus": 30},
]

# Ambang XP untuk Royal Level (indeks 0 = level 1).
LEVELS = [
    {"level": 1, "title": "Royal Newcomer", "min_xp": 0},
    {"level": 2, "title": "Castle Apprentice", "min_xp": 80},
    {"level": 3, "title": "Garden Explorer", "min_xp": 200},
    {"level": 4, "title": "Library Scholar", "min_xp": 350},
    {"level": 5, "title": "Palace Knight", "min_xp": 500},
    {"level": 6, "title": "Royal Number Champion", "min_xp": 650},
]
