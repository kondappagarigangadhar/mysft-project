export function nowIso() {
    return new Date().toISOString();
}

export function todayIsoDate() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

export function formatShortDate(isoDateOrDateTime: string) {
    const d = new Date(isoDateOrDateTime);
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTime(isoDateTime: string) {
    const d = new Date(isoDateTime);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function minutesBetween(isoStart: string, isoEnd: string) {
    return Math.max(0, Math.floor((new Date(isoEnd).getTime() - new Date(isoStart).getTime()) / 60000));
}

