import type { PaymentMode, PaymentRecordStatus } from '@/lib/bookingPaymentMockStore';
import { buildPaymentPlanFromBooking, getBookingBySlug } from '@/lib/bookingPaymentMockStore';

export type ParsedPaymentImportRow = {
    /** 1-based line number in the original file (excluding header). */
    lineNumber: number;
    bookingSlug: string;
    milestoneId: string;
    amount: number;
    date: string;
    mode: PaymentMode;
    receiptNumber: string;
    status: PaymentRecordStatus;
};

function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
            if (c === '"') {
                if (line[i + 1] === '"') {
                    cur += '"';
                    i++;
                } else inQ = false;
            } else cur += c;
        } else if (c === '"') inQ = true;
        else if (c === ',') {
            out.push(cur);
            cur = '';
        } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
}

function normHeader(h: string) {
    return h
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

function parseMode(raw: string): PaymentMode | null {
    const s = raw.trim().toLowerCase();
    if (s === 'cash') return 'Cash';
    if (s === 'bank' || s === 'bank transfer' || s === 'neft' || s === 'rtgs') return 'Bank';
    if (s === 'upi') return 'UPI';
    return null;
}

function parseStatus(raw: string): PaymentRecordStatus | null {
    const s = raw.trim().toLowerCase();
    if (s === 'completed' || s === 'complete' || s === 'paid') return 'Completed';
    if (s === 'pending' || s === '') return 'Pending';
    if (s === 'failed' || s === 'fail') return 'Failed';
    return null;
}

function resolveMilestoneId(bookingSlug: string, milestoneId: string, milestoneName: string): { id: string } | { error: string } {
    const booking = getBookingBySlug(bookingSlug);
    if (!booking) return { error: `Unknown booking: ${bookingSlug}` };
    const plan = buildPaymentPlanFromBooking(booking);
    const idTrim = milestoneId.trim();
    if (idTrim) {
        const hit = plan.milestones.find((m) => m.id === idTrim);
        if (!hit) return { error: `Milestone id "${idTrim}" is not part of this booking plan.` };
        return { id: idTrim };
    }
    const nameTrim = milestoneName.trim();
    if (!nameTrim) return { error: 'Provide milestone_id or milestone_name.' };
    const lower = nameTrim.toLowerCase();
    const byName = plan.milestones.find((m) => m.name.trim().toLowerCase() === lower);
    if (byName) return { id: byName.id };
    const partial = plan.milestones.find((m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase()));
    if (partial) return { id: partial.id };
    return { error: `Milestone name "${nameTrim}" did not match any milestone for this booking.` };
}

/**
 * Parses a CSV/Excel-exported CSV for bulk payment import.
 * Expected headers (case-insensitive): booking_slug (optional if defaultBookingSlug), amount, date, mode,
 * receipt_number, milestone_id or milestone_name, status (optional).
 */
export function parsePaymentImportCsv(
    raw: string,
    defaultBookingSlug: string
): { rows: ParsedPaymentImportRow[]; errors: { line: number; message: string }[] } {
    const errors: { line: number; message: string }[] = [];
    const rows: ParsedPaymentImportRow[] = [];
    const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
        errors.push({ line: 1, message: 'File must include a header row and at least one data row.' });
        return { rows, errors };
    }

    const headerCells = parseCsvLine(lines[0]).map(normHeader);
    const idx = (name: string) => headerCells.indexOf(name);

    const iBooking = idx('booking_slug');
    const iBookingAlt = idx('booking_id');
    const iAmount = idx('amount');
    const iDate = idx('date');
    const iMode = idx('mode');
    const iReceipt = idx('receipt_number');
    const iReceiptAlt = idx('receipt');
    const iMilestoneId = idx('milestone_id');
    const iMilestoneName = idx('milestone_name');
    const iStatus = idx('status');

    if (iAmount < 0 || iDate < 0 || iMode < 0) {
        errors.push({ line: 1, message: 'Header must include columns: amount, date, mode.' });
        return { rows, errors };
    }
    const receiptCol = iReceipt >= 0 ? iReceipt : iReceiptAlt;
    if (receiptCol < 0) {
        errors.push({ line: 1, message: 'Header must include receipt_number (or receipt).' });
        return { rows, errors };
    }
    if (iMilestoneId < 0 && iMilestoneName < 0) {
        errors.push({ line: 1, message: 'Header must include milestone_id and/or milestone_name.' });
        return { rows, errors };
    }

    for (let li = 1; li < lines.length; li++) {
        const lineNumber = li + 1;
        const cells = parseCsvLine(lines[li]);
        if (cells.every((c) => c === '')) continue;

        const bookingRaw =
            (iBooking >= 0 ? cells[iBooking] : '') ||
            (iBookingAlt >= 0 ? cells[iBookingAlt] : '') ||
            defaultBookingSlug;
        const bookingSlug = bookingRaw.trim();
        if (!bookingSlug) {
            errors.push({ line: lineNumber, message: 'Missing booking slug (column or default).' });
            continue;
        }

        const amountStr = cells[iAmount]?.trim() ?? '';
        const amount = Math.round(Number(amountStr.replace(/,/g, '')));
        if (!Number.isFinite(amount) || amount <= 0) {
            errors.push({ line: lineNumber, message: `Invalid amount: "${amountStr}"` });
            continue;
        }

        const date = (cells[iDate] ?? '').trim();
        if (!date) {
            errors.push({ line: lineNumber, message: 'Missing date.' });
            continue;
        }

        const mode = parseMode(cells[iMode] ?? '');
        if (!mode) {
            errors.push({ line: lineNumber, message: `Invalid mode "${cells[iMode] ?? ''}". Use Cash, Bank, or UPI.` });
            continue;
        }

        const receiptNumber = (cells[receiptCol] ?? '').trim();
        if (!receiptNumber) {
            errors.push({ line: lineNumber, message: 'Missing receipt number.' });
            continue;
        }

        const milestoneIdCell = iMilestoneId >= 0 ? (cells[iMilestoneId] ?? '').trim() : '';
        const milestoneNameCell = iMilestoneName >= 0 ? (cells[iMilestoneName] ?? '').trim() : '';
        const resolved = resolveMilestoneId(bookingSlug, milestoneIdCell, milestoneNameCell);
        if ('error' in resolved) {
            errors.push({ line: lineNumber, message: resolved.error });
            continue;
        }

        const statusRaw = iStatus >= 0 ? cells[iStatus] ?? '' : '';
        const status = parseStatus(statusRaw);
        if (!status) {
            errors.push({ line: lineNumber, message: `Invalid status "${statusRaw}". Use Pending, Completed, or Failed.` });
            continue;
        }

        rows.push({
            lineNumber,
            bookingSlug,
            milestoneId: resolved.id,
            amount,
            date,
            mode,
            receiptNumber,
            status,
        });
    }

    return { rows, errors };
}
