function pad(n: number) {
    return String(n).padStart(2, '0');
}

export function defaultBookingDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toDateInputValue(d);
}

export function toDateInputValue(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatBookingDateDisplay(bookingDate: string): string {
    if (!bookingDate.trim()) return '';
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(bookingDate);
    const d = iso ? new Date(`${bookingDate}T12:00:00`) : new Date(bookingDate);
    if (Number.isNaN(d.getTime())) return bookingDate;
    return d.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function formatTime12h(time24: string): string {
    const [hStr, mStr] = time24.split(':');
    const hours = parseInt(hStr ?? '0', 10);
    const minutes = parseInt(mStr ?? '0', 10);
    const isPm = hours >= 12;
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${h12}:${pad(minutes)} ${isPm ? 'PM' : 'AM'}`;
}

export function buildSlotLabel(startTime: string, endTime: string): string {
    return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}

export function defaultStartTime(): string {
    return '18:00';
}

export function defaultEndTime(): string {
    return '19:00';
}

/** Parse stored slot like `6:00 PM – 7:00 PM` into 24h times */
export function parseSlotToTimes(slot: string): { start: string; end: string } {
    const match = slot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
        return { start: defaultStartTime(), end: defaultEndTime() };
    }
    const to24 = (h: string, m: string, ampm: string) => {
        let hours = parseInt(h, 10);
        const minutes = parseInt(m, 10);
        const pm = ampm.toUpperCase() === 'PM';
        if (pm && hours < 12) hours += 12;
        if (!pm && hours === 12) hours = 0;
        return `${pad(hours)}:${pad(minutes)}`;
    };
    return {
        start: to24(match[1]!, match[2]!, match[3]!),
        end: to24(match[4]!, match[5]!, match[6]!),
    };
}

export function bookingDateToInputValue(bookingDate: string | undefined): string {
    if (!bookingDate?.trim()) return defaultBookingDate();
    if (/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) return bookingDate;
    if (/tomorrow/i.test(bookingDate)) return defaultBookingDate();
    const parsed = Date.parse(bookingDate);
    if (!Number.isNaN(parsed)) return toDateInputValue(new Date(parsed));
    return defaultBookingDate();
}
