// Sama dengan backend/app/content/catalog.py (LEVELS) — hanya untuk tampilan.
export const LEVELS = [
  { level: 1, title: 'Royal Newcomer', min_xp: 0 },
  { level: 2, title: 'Castle Apprentice', min_xp: 80 },
  { level: 3, title: 'Garden Explorer', min_xp: 200 },
  { level: 4, title: 'Library Scholar', min_xp: 350 },
  { level: 5, title: 'Palace Knight', min_xp: 500 },
  { level: 6, title: 'Royal Number Champion', min_xp: 650 },
];

export function levelInfo(xp = 0) {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.min_xp) current = l;
  const next = LEVELS.find((l) => l.min_xp > xp) || null;
  const span = next ? next.min_xp - current.min_xp : 1;
  const progress = next ? Math.round(((xp - current.min_xp) / span) * 100) : 100;
  return { ...current, next, progress };
}

export const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-';
