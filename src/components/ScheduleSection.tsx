'use client';

import { radioConfig } from '@/lib/radio-config';
import { useCurrentSlot } from '@/components/radio/useCurrentSlot';

/** Programación tipo timeline. Resalta la franja al aire ahora. */
export default function ScheduleSection() {
  const { schedule } = radioConfig;
  const now = useCurrentSlot();
  if (!schedule.length) return null;

  return (
    <ul className="flex flex-col gap-2.5">
      {schedule.map((slot, i) => {
        const live = now?.index === i;
        return (
          <li
            key={`${slot.name}-${slot.time}`}
            className={`schedule-row ${live ? 'schedule-row--live' : ''}`}
          >
            <span className="schedule-time">{slot.time}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{slot.name}</p>
                {live && <span className="schedule-onair">AL AIRE</span>}
              </div>
              {slot.host && <p className="truncate text-xs text-muted">{slot.host}</p>}
              {live && now && (
                <div className="schedule-progress">
                  <span style={{ width: `${Math.round(now.progress * 100)}%` }} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
