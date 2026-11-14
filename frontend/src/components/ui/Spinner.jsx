import { CrownIcon } from '../art/Logo';

export default function Spinner({ label = 'Memuat...', full = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${full ? 'min-h-[60vh]' : 'py-10'}`} role="status">
      <span className="animate-floaty"><CrownIcon size={44} /></span>
      <p className="text-sm font-bold text-royal-purple">{label}</p>
    </div>
  );
}

export function ErrorNote({ children, onRetry }) {
  if (!children) return null;
  return (
    <div className="rounded-2xl bg-royal-rose px-4 py-3 text-sm font-semibold text-royal-coral ring-1 ring-royal-pink" role="alert">
      {children}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 underline underline-offset-2">Coba lagi</button>
      )}
    </div>
  );
}
