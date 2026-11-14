import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { supabase } from '../lib/supabase';

/**
 * Memuat data milik siswa yang sedang login langsung dari Supabase.
 * RLS di database memastikan setiap query hanya mengembalikan baris milik siswa ini.
 * @param {string[]} parts bagian data yang dibutuhkan
 */
export default function useStudentData(parts = ['stats', 'progress', 'lessons']) {
  const { profile } = useAuth();
  const { version } = useReward();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = parts.join(',');

  const load = useCallback(async () => {
    if (!profile || !supabase) return;
    setLoading(true);
    setError(null);
    const uid = profile.id;
    const want = new Set(key.split(','));
    const queries = {
      stats: () => supabase.from('user_stats').select('*').eq('user_id', uid).maybeSingle(),
      progress: () => supabase.from('lesson_progress').select('*').eq('user_id', uid),
      lessons: () => supabase.from('lessons').select('*').order('level_no'),
      achievements: () => supabase.from('achievements').select('*').order('sort_order'),
      earned: () => supabase.from('user_achievements').select('*').eq('user_id', uid),
      activity: () => supabase.from('activity_logs').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(200),
      quizAttempts: () => supabase.from('quiz_attempts').select('id, quiz_id, percent, correct_count, total_count, submitted_at, details').eq('user_id', uid).order('submitted_at', { ascending: false }),
      gameAttempts: () => supabase.from('game_attempts').select('id, game_id, percent, difficulty, played_at').eq('user_id', uid).order('played_at', { ascending: false }),
      games: () => supabase.from('games').select('*'),
    };
    try {
      const names = Object.keys(queries).filter((k) => want.has(k));
      const results = await Promise.all(names.map((k) => queries[k]()));
      const out = {};
      results.forEach((r, i) => {
        if (r.error) throw r.error;
        out[names[i]] = r.data;
      });
      setData(out);
    } catch (e) {
      setError(e.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [profile, key]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { ...data, loading, error, reload: load };
}

export function lessonState(lessons = [], progress = []) {
  const done = new Set(progress.filter((p) => p.status === 'completed').map((p) => p.lesson_id));
  return lessons.map((l, i) => ({
    ...l,
    completed: done.has(l.id),
    unlocked: i === 0 || done.has(lessons[i - 1].id),
    progress: progress.find((p) => p.lesson_id === l.id) || null,
  }));
}
