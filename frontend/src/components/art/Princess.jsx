import { COMPANIONS } from '../../content/companions';

/** Avatar karakter pendamping (ilustrasi SVG orisinal). */
export default function Princess({ who = 'seraphina', size = 96, className = '', mood = 'happy' }) {
  const c = COMPANIONS[who] || COMPANIONS.seraphina;
  const { hair, gown, accent, skin } = c.colors;
  const style = c.hairStyle;
  return (
    <svg viewBox="0 0 120 140" width={size} height={size * (140 / 120)} className={className} role="img" aria-label={c.name}>
      {/* rambut belakang */}
      {style === 'long' && <path d="M30 52 Q28 112 44 118 L76 118 Q92 112 90 52 Z" fill={hair} />}
      {style === 'wave' && <path d="M28 50 Q20 90 32 104 Q26 118 44 122 L76 122 Q94 118 88 104 Q100 90 92 50 Z" fill={hair} />}
      {style === 'braid' && (
        <g fill={hair}>
          <path d="M32 52 Q30 80 40 88 L80 88 Q90 80 88 52 Z" />
          {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={86 + (i % 2) * 3} cy={92 + i * 9} rx="7" ry="6" />)}
        </g>
      )}
      {style === 'bun' && <circle cx="60" cy="22" r="13" fill={hair} />}
      {/* gaun */}
      <path d="M40 104 Q60 96 80 104 L96 140 L24 140 Z" fill={gown} />
      <path d="M48 102 Q60 110 72 102" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="60" cy="112" r="3.5" fill="#E8C878" />
      {/* leher & wajah */}
      <rect x="54" y="84" width="12" height="16" rx="5" fill={skin} />
      <ellipse cx="60" cy="62" rx="25" ry="27" fill={skin} />
      {/* poni */}
      <path d="M34 60 Q34 30 60 30 Q86 30 86 60 Q78 44 62 44 Q48 46 34 60 Z" fill={hair} />
      {/* mata */}
      {mood === 'think' ? (
        <g stroke="#49354F" strokeWidth="2.6" strokeLinecap="round">
          <path d="M47 64 h7" /><path d="M66 64 h7" />
        </g>
      ) : (
        <g fill="#49354F">
          <ellipse cx="50" cy="64" rx="3.4" ry="4.2" />
          <ellipse cx="70" cy="64" rx="3.4" ry="4.2" />
          <circle cx="51.2" cy="62.6" r="1.2" fill="#fff" />
          <circle cx="71.2" cy="62.6" r="1.2" fill="#fff" />
        </g>
      )}
      <ellipse cx="44" cy="73" rx="4.5" ry="2.6" fill="#EFAFC5" opacity=".8" />
      <ellipse cx="76" cy="73" rx="4.5" ry="2.6" fill="#EFAFC5" opacity=".8" />
      <path d={mood === 'think' ? 'M54 78 Q60 79 66 77' : 'M53 76 Q60 83 67 76'} stroke="#B24D6E" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      {/* mahkota */}
      <path d="M44 36 L47 22 L54 30 L60 17 L66 30 L73 22 L76 36 Z" fill="#E8C878" stroke="#C9A24E" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="60" cy="27" r="2.6" fill={accent} />
    </svg>
  );
}
