'use client';

import { useCurrentSlot } from '@/components/radio/useCurrentSlot';

export default function CurrentProgramCard() {
  const now = useCurrentSlot();
  if (!now) return null;

  const pct = Math.round(now.progress * 100);

  return (
    <div className="program-card">
      <span className="program-card-kicker">
        <span className="now-dot" style={{ width: 7, height: 7 }} />
        Al aire ahora
      </span>
      <p className="program-card-title">{now.slot.name}</p>
      {now.slot.host && <p className="program-card-host">{now.slot.host}</p>}
      <div className="program-progress-bar">
        <div className="program-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="program-card-time">{now.slot.time}</p>
    </div>
  );
}
