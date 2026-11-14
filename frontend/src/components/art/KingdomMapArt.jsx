import { Link } from 'react-router-dom';
import { BookOpen, Castle, Crown, Flower2, Lock, Swords } from 'lucide-react';

const NODES = {
  'princess-castle': { x: 14, y: 76, icon: Castle, color: '#9FCBEF' },
  'enchanted-garden': { x: 40, y: 44, icon: Flower2, color: '#BFE3CF' },
  'magic-library': { x: 64, y: 70, icon: BookOpen, color: '#E8C878' },
  'royal-challenge-palace': { x: 84, y: 36, icon: Swords, color: '#EFAFC5' },
};
const FINAL = { x: 90, y: 13 };

/** Peta kerajaan interaktif: setiap wilayah adalah tautan ke materinya. */
export default function KingdomMapArt({ lessons, finalUnlocked, compact = false }) {
  const pts = lessons.map((l) => NODES[l.id]).filter(Boolean);
  const path = [...pts, FINAL].map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  return (
    <div className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-royal-blue/80 via-royal-lavender/60 to-royal-rose ${compact ? 'aspect-[2/1]' : 'aspect-[4/3] sm:aspect-[2/1] lg:aspect-[5/2]'}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <ellipse cx="30" cy="95" rx="40" ry="14" fill="#CFEFDF" />
        <ellipse cx="80" cy="98" rx="35" ry="12" fill="#CFEFDF" />
        <path d={path} fill="none" stroke="#FFF9F3" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path} fill="none" stroke="#8064A2" strokeWidth=".8" strokeDasharray="2 2" strokeLinecap="round" />
      </svg>
      {lessons.map((l) => {
        const n = NODES[l.id];
        if (!n) return null;
        const Icon = l.unlocked ? n.icon : Lock;
        const content = (
          <>
            <span className={`grid place-items-center rounded-full border-4 border-white shadow-soft ${compact ? 'h-11 w-11' : 'h-14 w-14 sm:h-16 sm:w-16'} ${l.completed ? 'ring-4 ring-royal-gold' : ''}`}
              style={{ background: l.unlocked ? n.color : '#d9d3df' }}>
              <Icon size={compact ? 18 : 24} className="text-royal-plum" />
            </span>
            {!compact && (
              <span className="mt-1 max-w-[7.5rem] rounded-full bg-white/90 px-2 py-0.5 text-center text-[11px] font-extrabold leading-tight sm:text-xs">
                {l.level_no}. {l.region_name}
              </span>
            )}
          </>
        );
        const cls = 'absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition hover:scale-105';
        const style = { left: `${n.x}%`, top: `${n.y}%` };
        return l.unlocked ? (
          <Link key={l.id} to={`/app/lessons/${l.id}`} className={cls} style={style} aria-label={`Level ${l.level_no}: ${l.region_name}${l.completed ? ' (selesai)' : ''}`}>{content}</Link>
        ) : (
          <span key={l.id} className={`${cls} cursor-not-allowed opacity-80`} style={style} aria-label={`Level ${l.level_no}: ${l.region_name} (terkunci)`}>{content}</span>
        );
      })}
      <Link to="/app/final" className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition hover:scale-105"
        style={{ left: `${FINAL.x}%`, top: `${FINAL.y}%` }} aria-label={`Final Royal Quest${finalUnlocked ? '' : ' (terkunci)'}`}>
        <span className={`grid place-items-center rounded-full border-4 border-white bg-royal-purple shadow-soft ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
          {finalUnlocked ? <Crown className="text-royal-gold" size={20} /> : <Lock className="text-white" size={18} />}
        </span>
      </Link>
    </div>
  );
}
