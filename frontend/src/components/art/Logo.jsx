export function CrownIcon({ size = 28, className = '' }) {
  return (
    <svg viewBox="0 0 64 48" width={size} height={size * 0.75} className={className} aria-hidden="true">
      <path d="M6 38 L10 10 L22 24 L32 4 L42 24 L54 10 L58 38 Z" fill="#E8C878" stroke="#C9A24E" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="6" y="38" width="52" height="8" rx="2.5" fill="#E8C878" stroke="#C9A24E" strokeWidth="2" />
      <circle cx="32" cy="8" r="3" fill="#EFAFC5" />
      <circle cx="20" cy="42" r="2" fill="#8064A2" />
      <circle cx="32" cy="42" r="2" fill="#EFAFC5" />
      <circle cx="44" cy="42" r="2" fill="#8064A2" />
    </svg>
  );
}

export default function Logo({ size = 'md', light = false }) {
  const big = size === 'lg';
  return (
    <span className="inline-flex items-center gap-2">
      <CrownIcon size={big ? 44 : 30} />
      <span className={`font-display font-bold leading-none ${big ? 'text-2xl sm:text-3xl' : 'text-lg'} ${light ? 'text-white' : 'text-royal-purple'}`}>
        ROYAL<span className={light ? 'text-royal-gold' : 'text-royal-coral'}> ADVENTURE</span>
      </span>
    </span>
  );
}
