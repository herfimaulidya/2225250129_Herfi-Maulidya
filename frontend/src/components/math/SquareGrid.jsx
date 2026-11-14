/**
 * Visualisasi susunan kotak (SVG). rows × cols; bila sama -> persegi.
 * highlightLast: menyorot kotak "tambahan" (bentuk L) dibanding susunan sebelumnya.
 */
export default function SquareGrid({
  rows,
  cols = rows,
  cell = 22,
  gap = 3,
  maxSize,
  highlightLast = false,
  color = '#EFAFC5',
  accent = '#8064A2',
  showLabels = false,
  className = '',
  title,
}) {
  let c = cell;
  const span = Math.max(rows, cols);
  if (maxSize && span * (c + gap) > maxSize) c = Math.max(3, maxSize / span - gap);
  const w = cols * (c + gap) - gap;
  const h = rows * (c + gap) - gap;
  const pad = showLabels ? 18 : 0;
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let k = 0; k < cols; k += 1) {
      const isNew = highlightLast && (r === rows - 1 || k === cols - 1);
      cells.push(
        <rect key={`${r}-${k}`} x={pad + k * (c + gap)} y={pad + r * (c + gap)} width={c} height={c} rx={Math.min(5, c / 4)}
          fill={isNew ? '#E8C878' : color} stroke={accent} strokeOpacity=".35" strokeWidth={c > 8 ? 1 : 0.5} />,
      );
    }
  }
  return (
    <svg viewBox={`0 0 ${w + pad} ${h + pad}`} width={w + pad} height={h + pad} className={className} role="img"
      aria-label={title || `Susunan ${rows} baris × ${cols} kolom = ${rows * cols} kotak`} style={{ maxWidth: '100%', height: 'auto' }}>
      {showLabels && (
        <g fontSize="11" fontWeight="800" fill={accent}>
          <text x={pad + w / 2} y="12" textAnchor="middle">{cols} kolom</text>
          <text x="12" y={pad + h / 2} textAnchor="middle" transform={`rotate(-90 12 ${pad + h / 2})`}>{rows} baris</text>
        </g>
      )}
      {cells}
    </svg>
  );
}

/** Deretan susunan persegi 1×1, 2×2, ... untuk menunjukkan pola. */
export function PatternRow({ terms = [1, 2, 3], cell = 12, highlight = false, showValues = true }) {
  return (
    <div className="flex flex-wrap items-end justify-center gap-5">
      {terms.map((n, i) => (
        <figure key={n} className="flex flex-col items-center gap-1">
          <SquareGrid rows={n} cell={cell} gap={2} highlightLast={highlight && i > 0} />
          {showValues && (
            <figcaption className="text-center text-xs font-bold text-royal-plum/80">
              Suku ke-{n}
              <span className="block text-sm text-royal-purple">{n * n}</span>
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

/** Ilustrasi dari data soal backend: {kind:'grid'|'pattern'} */
export function Illustration({ spec, maxSize = 180 }) {
  if (!spec) return null;
  if (spec.kind === 'grid') return <SquareGrid rows={spec.rows} cols={spec.cols} maxSize={maxSize} />;
  if (spec.kind === 'pattern') return <PatternRow terms={spec.terms} cell={11} />;
  return null;
}
