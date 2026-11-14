import Princess from '../art/Princess';
import { COMPANIONS } from '../../content/companions';

/** Karakter pendamping yang berbicara: menyambut, menjelaskan, memberi petunjuk & motivasi. */
export default function CompanionBubble({ who = 'seraphina', children, mood = 'happy', size = 72, tone = 'default', className = '' }) {
  const c = COMPANIONS[who] || COMPANIONS.seraphina;
  const toneCls = {
    default: 'bg-white ring-royal-lavender',
    success: 'bg-royal-mint/70 ring-royal-leaf/30',
    retry: 'bg-royal-rose ring-royal-pink',
    info: 'bg-royal-blue/60 ring-royal-blue',
  }[tone];
  return (
    <div className={`flex items-end gap-3 ${className}`}>
      <Princess who={who} size={size} mood={mood} className="shrink-0 drop-shadow" />
      <div className={`relative flex-1 rounded-3xl rounded-bl-md p-4 ring-1 ${toneCls} animate-fadeup`}>
        <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-royal-purple">{c.name}</p>
        <div className="text-[15px] leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
