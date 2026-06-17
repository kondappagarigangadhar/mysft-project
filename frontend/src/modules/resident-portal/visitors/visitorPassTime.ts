function pad(n: number) {
    return String(n).padStart(2, '0');
}

/** Value for `<input type="datetime-local" />` */
export function toDateTimeLocalValue(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function defaultVisitDateTimeLocal(): string {
    const d = new Date();
    d.setSeconds(0, 0);
    if (d.getMinutes() > 0) {
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
    }
    return toDateTimeLocalValue(d);
}

export function formatVisitWhenFromDateTimeLocal(value: string): string {
    if (!value.trim()) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.trim();
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Best-effort parse of stored `when` text into datetime-local value */
export function visitWhenToDateTimeLocal(when: string | undefined): string {
    if (!when?.trim()) return defaultVisitDateTimeLocal();

    const iso = Date.parse(when);
    if (!Number.isNaN(iso)) return toDateTimeLocalValue(new Date(iso));

    const match = when.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
        let hours = parseInt(match[1]!, 10);
        const minutes = parseInt(match[2]!, 10);
        const isPm = match[3]!.toUpperCase() === 'PM';
        if (isPm && hours < 12) hours += 12;
        if (!isPm && hours === 12) hours = 0;

        const d = new Date();
        if (/tomorrow/i.test(when)) d.setDate(d.getDate() + 1);
        d.setHours(hours, minutes, 0, 0);
        return toDateTimeLocalValue(d);
    }

    return defaultVisitDateTimeLocal();
}
