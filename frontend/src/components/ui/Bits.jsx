import { Award, BookOpen, Castle as CastleIcon, Crown, Gem, Map, Search, Sparkles, Star, Wand2 } from 'lucide-react';

export function Stars({ value = 0, max = 3, size = 18 }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} dari ${max} Royal Stars`}>
      {Array.from({ length: max }, (_, i) => (
        <Star key={i} size={size} className={i < value ? 'fill-royal-gold text-royal-gold' : 'text-royal-lavender'} />
      ))}
    </span>
  );
}

export function ProgressBar({ value = 0, label, color = 'bg-royal-purple' }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {label && <div className="mb-1 flex justify-between text-xs font-bold"><span>{label}</span><span>{Math.round(v)}%</span></div>}
      <div className="h-3 overflow-hidden rounded-full bg-royal-lavender/50" role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

const BADGE_ICONS = { sparkles: Sparkles, castle: CastleIcon, search: Search, wand: Wand2, gem: Gem, map: Map, crown: Crown, book: BookOpen };

export function BadgeIcon({ icon, earned = true, size = 56 }) {
  const Icon = BADGE_ICONS[icon] || Award;
  return (
    <span className={`relative grid shrink-0 place-items-center rounded-full ${earned ? 'bg-gradient-to-br from-royal-gold to-royal-pink text-royal-plum shadow-glow' : 'bg-royal-lavender/40 text-royal-plum/30'}`}
      style={{ width: size, height: size }}>
      <Icon size={size * 0.45} />
    </span>
  );
}

export function SectionTitle({ eyebrow, title, children, icon: Icon }) {
  return (
    <header className="mb-5">
      {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
      <h1 className="flex items-center gap-2 text-2xl text-royal-plum sm:text-3xl">
        {Icon && <Icon className="text-royal-purple" size={28} />} {title}
      </h1>
      {children && <p className="mt-2 max-w-2xl text-royal-plum/75">{children}</p>}
    </header>
  );
}
