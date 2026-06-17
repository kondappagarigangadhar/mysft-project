import { minutesBetween, nowIso } from '../utils/date';

export function computeSlaStatus(opts: { startedAt?: string; targetMinutes: number }) {
    if (!opts.startedAt) {
        return { elapsedMinutes: 0, remainingMinutes: opts.targetMinutes, breached: false, now: nowIso() };
    }
    const now = nowIso();
    const elapsedMinutes = minutesBetween(opts.startedAt, now);
    const remainingMinutes = Math.max(0, opts.targetMinutes - elapsedMinutes);
    const breached = elapsedMinutes > opts.targetMinutes;
    return { elapsedMinutes, remainingMinutes, breached, now };
}

