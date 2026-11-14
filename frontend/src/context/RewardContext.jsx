import { createContext, useCallback, useContext, useState } from 'react';
import { Award, Sparkles, X } from 'lucide-react';

const RewardContext = createContext(null);
let counter = 0;
const nextId = () => `t${Date.now()}-${(counter += 1)}`;

/**
 * Menampilkan notifikasi Royal Points & lencana baru, dan memberi sinyal
 * agar data siswa (dashboard, profil) dimuat ulang dari database.
 */
export function RewardProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [version, setVersion] = useState(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const celebrate = useCallback((result) => {
    setVersion((v) => v + 1);
    if (!result) return;
    const items = [];
    if (result.xp_awarded > 0) {
      items.push({ id: nextId(), kind: 'xp', title: `+${result.xp_awarded} Royal Points`, text: 'Tersimpan di akunmu.' });
    }
    for (const b of result.new_badges || []) {
      items.push({ id: nextId(), kind: 'badge', title: `Lencana baru: ${b.title}`, text: b.description });
    }
    if (!items.length) return;
    setToasts((t) => [...t, ...items].slice(-3));
    items.forEach((it) => setTimeout(() => dismiss(it.id), 5000));
  }, [dismiss]);

  return (
    <RewardContext.Provider value={{ celebrate, version }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto flex w-full max-w-sm animate-pop items-start gap-3 rounded-2xl bg-royal-plum p-4 text-white shadow-soft">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.kind === 'badge' ? 'bg-royal-gold text-royal-plum' : 'bg-royal-pink text-royal-plum'}`}>
              {t.kind === 'badge' ? <Award size={20} /> : <Sparkles size={20} />}
            </span>
            <div className="flex-1">
              <p className="font-extrabold">{t.title}</p>
              <p className="text-sm text-white/80">{t.text}</p>
            </div>
            <button onClick={() => dismiss(t.id)} className="rounded-full p-1 hover:bg-white/10" aria-label="Tutup notifikasi">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </RewardContext.Provider>
  );
}

export const useReward = () => useContext(RewardContext);
