import type { VisitorRequest } from './types';

export function getVisitorPassPageUrl(passId: string, origin?: string) {
    const base =
        origin?.replace(/\/$/, '') ??
        (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}/visitor-pass/${encodeURIComponent(passId)}`;
}

export function buildVisitorShareMessage(visitor: Pick<VisitorRequest, 'name' | 'when' | 'id'>, passUrl: string) {
    return [
        `Hi ${visitor.name}, your gate entry pass is ready.`,
        `Visit: ${visitor.when}`,
        `Pass ID: ${visitor.id}`,
        `Show this QR link at security:`,
        passUrl,
    ].join('\n');
}

export function normalizeSharePhone(mobile: string) {
    const digits = mobile.replace(/\D/g, '');
    if (digits.length < 10) return '';
    if (digits.length === 10) return `91${digits}`;
    return digits;
}

export function whatsAppShareUrl(text: string) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function smsShareUrl(phone: string, text: string) {
    const normalized = normalizeSharePhone(phone);
    if (!normalized) return '';
    return `sms:+${normalized}?body=${encodeURIComponent(text)}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // fall through
    }
    return false;
}

export async function shareVisitorPassNative(
    visitor: Pick<VisitorRequest, 'name' | 'when' | 'id'>,
    passUrl: string,
): Promise<'shared' | 'unsupported' | 'aborted'> {
    if (typeof navigator === 'undefined' || !navigator.share) return 'unsupported';
    const text = buildVisitorShareMessage(visitor, passUrl);
    try {
        await navigator.share({
            title: `Gate pass — ${visitor.name}`,
            text,
            url: passUrl,
        });
        return 'shared';
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return 'aborted';
        return 'unsupported';
    }
}
