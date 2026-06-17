let rtf: Intl.RelativeTimeFormat | null = null;
function getRtf(): Intl.RelativeTimeFormat | null {
    if (typeof Intl === 'undefined') return null;
    if (!rtf) {
        try {
            rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
        } catch {
            return null;
        }
    }
    return rtf;
}

function fallbackRelative(diffSec: number): string {
    const absS = Math.abs(diffSec);
    const ago = diffSec < 0;
    const suffix = ago ? 'ago' : 'from now';
    if (absS < 60) return `${Math.floor(absS)}s ${suffix}`;
    if (absS < 3600) return `${Math.floor(absS / 60)}m ${suffix}`;
    if (absS < 86400) return `${Math.floor(absS / 3600)}h ${suffix}`;
    return `${Math.floor(absS / 86400)}d ${suffix}`;
}

function safeRelativeFormat(
    r: Intl.RelativeTimeFormat,
    value: number,
    unit: Intl.RelativeTimeFormatUnit,
): string {
    if (!Number.isFinite(value)) return '—';
    let v = Math.round(value);
    if (v === 0 && unit !== 'second') {
        v = value < 0 ? -1 : 1;
    }
    const clamped = Math.max(-1000, Math.min(1000, v));
    try {
        return r.format(clamped, unit);
    } catch {
        return fallbackRelative(value);
    }
}

/** e.g. "2 hours ago" (locale-aware). */
export function formatHistoryRelative(iso: string, now: Date = new Date()): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';

    const diffSec = (d.getTime() - now.getTime()) / 1000;
    const r = getRtf();
    if (!r) {
        return fallbackRelative(diffSec);
    }

    const absS = Math.abs(diffSec);
    if (absS < 60) return safeRelativeFormat(r, diffSec, 'second');
    const m = diffSec / 60;
    if (absS < 3600) return safeRelativeFormat(r, m, 'minute');
    const h = m / 60;
    if (absS < 86400) return safeRelativeFormat(r, h, 'hour');
    const day = h / 24;
    if (Math.abs(day) < 7) return safeRelativeFormat(r, day, 'day');
    const w = day / 7;
    if (Math.abs(w) < 52) return safeRelativeFormat(r, w, 'week');
    const mo = day / 30.437;
    if (Math.abs(mo) < 12) return safeRelativeFormat(r, mo, 'month');
    return safeRelativeFormat(r, day / 365.25, 'year');
}

export function formatHistoryExactLong(iso: string): string {
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return iso || '—';
        return d.toLocaleString(undefined, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    } catch {
        return iso;
    }
}
