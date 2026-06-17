import type { UnitAvailabilityStatus, UnitType } from '@/lib/projectsInventoryStore';

export const INVENTORY_CSV_SAMPLE = `project_slug,unit_number,unit_type,configuration,unit_size,price,availability_status,offer_price,block_phase
skyline-residency,901,Apartment,2 BHK,1100,6200000,available,6000000,Phase A
skyline-residency,902,Villa,Villa,2000,12500000,sold,,`;

const UNIT_TYPES: UnitType[] = ['Plot', 'Apartment', 'Villa'];
const STATUSES: UnitAvailabilityStatus[] = ['available', 'reserved', 'sold', 'pending'];

function normalizeHeader(h: string) {
    return h.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Minimal CSV parser with quote support. */
export function parseCsvRows(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let i = 0;
    let inQuotes = false;
    const pushCell = () => {
        row.push(cur);
        cur = '';
    };
    const pushRow = () => {
        if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
        row = [];
    };
    while (i < text.length) {
        const c = text[i]!;
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    cur += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i += 1;
                continue;
            }
            cur += c;
            i += 1;
            continue;
        }
        if (c === '"') {
            inQuotes = true;
            i += 1;
            continue;
        }
        if (c === ',') {
            pushCell();
            i += 1;
            continue;
        }
        if (c === '\r') {
            i += 1;
            continue;
        }
        if (c === '\n') {
            pushCell();
            pushRow();
            i += 1;
            continue;
        }
        cur += c;
        i += 1;
    }
    pushCell();
    if (row.length && row.some((x) => x.trim() !== '')) pushRow();
    return rows;
}

export type ParsedInventoryRow = {
    projectSlug: string;
    unit_number: string;
    unit_type: UnitType;
    /** e.g. 2 BHK — optional; defaults from unit_type when omitted */
    configuration?: string;
    unit_size: number;
    price: number;
    offer_price?: number;
    availability_status: UnitAvailabilityStatus;
    block_phase?: string;
};

export type RowParseResult =
    | { ok: true; line: number; data: ParsedInventoryRow }
    | { ok: false; line: number; error: string };

function parseStatus(raw: string): UnitAvailabilityStatus | null {
    const s = raw.trim().toLowerCase();
    if (STATUSES.includes(s as UnitAvailabilityStatus)) return s as UnitAvailabilityStatus;
    if (s === 'blocked') return 'reserved';
    return null;
}

function parseUnitType(raw: string): UnitType | null {
    const t = raw.trim();
    const cap = (t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) as string;
    if (UNIT_TYPES.includes(cap as UnitType)) return cap as UnitType;
    return null;
}

export function parseInventoryCsvContent(csvText: string): RowParseResult[] {
    const rows = parseCsvRows(csvText.trim());
    if (rows.length < 2) {
        return [{ ok: false, line: 1, error: 'File must include a header row and at least one data row.' }];
    }
    const header = rows[0]!.map(normalizeHeader);
    const idx = (name: string) => header.indexOf(name);

    const iSlug = idx('project_slug');
    const iNum = idx('unit_number');
    const iType = idx('unit_type');
    const iConfig = idx('configuration') >= 0 ? idx('configuration') : idx('bhk');
    const iSize = idx('unit_size');
    const iPrice = idx('price');
    const iStatus = idx('availability_status');
    const iOffer = idx('offer_price');
    const iBlock = idx('block_phase');

    if (iSlug < 0 || iNum < 0 || iType < 0 || iSize < 0 || iPrice < 0 || iStatus < 0) {
        return [
            {
                ok: false,
                line: 1,
                error: 'Missing required columns: project_slug, unit_number, unit_type, unit_size, price, availability_status',
            },
        ];
    }

    const out: RowParseResult[] = [];
    for (let r = 1; r < rows.length; r++) {
        const line = r + 1;
        const cells = rows[r]!;
        const projectSlug = (cells[iSlug] ?? '').trim();
        const unit_number = (cells[iNum] ?? '').trim();
        const unit_type = parseUnitType(cells[iType] ?? '');
        const configurationRaw = iConfig >= 0 ? (cells[iConfig] ?? '').trim() : '';
        const unit_size = Number(String(cells[iSize] ?? '').replace(/,/g, ''));
        const price = Number(String(cells[iPrice] ?? '').replace(/,/g, ''));
        const availability_status = parseStatus(cells[iStatus] ?? '');
        const offerRaw = iOffer >= 0 ? (cells[iOffer] ?? '').trim() : '';
        const block_phase = iBlock >= 0 ? (cells[iBlock] ?? '').trim() : '';

        if (!projectSlug) {
            out.push({ ok: false, line, error: 'project_slug is required' });
            continue;
        }
        if (!unit_number) {
            out.push({ ok: false, line, error: 'unit_number is required' });
            continue;
        }
        if (!unit_type) {
            out.push({ ok: false, line, error: `Invalid unit_type: ${cells[iType] ?? ''}` });
            continue;
        }
        if (!Number.isFinite(unit_size) || unit_size <= 0) {
            out.push({ ok: false, line, error: 'unit_size must be a positive number' });
            continue;
        }
        if (!Number.isFinite(price) || price < 0) {
            out.push({ ok: false, line, error: 'price must be a non-negative number' });
            continue;
        }
        if (!availability_status) {
            out.push({ ok: false, line, error: `Invalid availability_status: ${cells[iStatus] ?? ''}` });
            continue;
        }

        let offer_price: number | undefined;
        if (offerRaw) {
            const o = Number(offerRaw.replace(/,/g, ''));
            if (!Number.isFinite(o) || o < 0) {
                out.push({ ok: false, line, error: 'offer_price must be a valid number' });
                continue;
            }
            offer_price = o;
        }

        out.push({
            ok: true,
            line,
            data: {
                projectSlug,
                unit_number,
                unit_type,
                configuration: configurationRaw || undefined,
                unit_size,
                price,
                offer_price,
                availability_status,
                block_phase: block_phase || undefined,
            },
        });
    }
    return out;
}

export function downloadSampleInventoryCsv() {
    const blob = new Blob([`\uFEFF${INVENTORY_CSV_SAMPLE}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory-units-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
}
