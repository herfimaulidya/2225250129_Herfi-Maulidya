/** Ilustrasi kastel Enchanted Kingdom (SVG orisinal). Jendela disusun 3×3 — persegi tersembunyi! */
export default function Castle({ className = '' }) {
  const tower = (x, h, roof) => (
    <g>
      <rect x={x} y={200 - h} width="40" height={h} fill="#F6D5E1" stroke="#C99BB0" strokeWidth="2" />
      <path d={`M${x - 6} ${200 - h} L${x + 20} ${200 - h - 46} L${x + 46} ${200 - h} Z`} fill={roof} stroke="#6E528F" strokeWidth="2" strokeLinejoin="round" />
      <path d={`M${x + 20} ${200 - h - 46} v-14`} stroke="#6E528F" strokeWidth="2" />
      <path d={`M${x + 20} ${200 - h - 60} l12 5 l-12 5 z`} fill="#E8C878" />
      <rect x={x + 13} y={200 - h + 18} width="14" height="20" rx="7" fill="#8064A2" />
    </g>
  );
  return (
    <svg viewBox="0 0 320 240" className={className} role="img" aria-label="Ilustrasi kastel Enchanted Kingdom">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#DCC6F2" />
          <stop offset="1" stopColor="#C7E5F8" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="28" fill="url(#sky)" />
      {[[40, 30], [270, 46], [210, 22], [90, 64], [292, 110]].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y - 6} L${x + 2} ${y - 2} L${x + 6} ${y} L${x + 2} ${y + 2} L${x} ${y + 6} L${x - 2} ${y + 2} L${x - 6} ${y} L${x - 2} ${y - 2} Z`}
          fill="#FFF9F3" className="animate-twinkle" style={{ animationDelay: `${i * 0.5}s` }} />
      ))}
      <ellipse cx="160" cy="232" rx="170" ry="34" fill="#BFE3CF" />
      {tower(52, 110, '#8064A2')}
      {tower(228, 110, '#8064A2')}
      <rect x="92" y="96" width="136" height="104" fill="#FFF9F3" stroke="#C99BB0" strokeWidth="2" />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={92 + i * 24} y="86" width="14" height="12" fill="#FFF9F3" stroke="#C99BB0" strokeWidth="2" />)}
      {tower(140, 150, '#EFAFC5')}
      {/* jendela 3 × 3 */}
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`${r}${c}`} x={98 + c * 12} y={112 + r * 12} width="9" height="9" rx="2" fill="#E8C878" />
      )))}
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => (
        <rect key={`b${r}${c}`} x={192 + c * 12} y={112 + r * 12} width="9" height="9" rx="2" fill="#C7E5F8" stroke="#8064A2" strokeWidth=".8" />
      )))}
      <path d="M140 200 v-34 a20 20 0 0 1 40 0 v34 z" fill="#8064A2" />
      <circle cx="172" cy="184" r="2.5" fill="#E8C878" />
    </svg>
  );
}
