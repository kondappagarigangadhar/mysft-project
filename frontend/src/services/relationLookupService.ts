/**
 * Mock lookup API for cross-reference (RelationPicker) fields.
 * Replace fetch bodies with real HTTP calls when backend is available.
 */

import { getUploadDateYmd, listActiveDocuments, type ComplianceDocumentRecord } from '@/lib/complianceDocumentsMockStore';
import { DEMO_PROJECT_NAMES } from '@/lib/demoCatalog';
import { getBookings, getPayments, type BookingRecord, type PaymentRecord } from '@/lib/bookingPaymentMockStore';
import { getLeadByLeadCode } from '@/lib/leadStore';
import {
    getProjectInventoryUnitHref,
    getProjects,
    getUnits,
    type UnitAvailabilityStatus,
    type UnitType,
} from '@/lib/projectsInventoryStore';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type BookingLookupRow = {
    id: string;
    leadName: string;
    projectName: string;
    unitId: string;
};

export type PaymentLookupRow = {
    id: string;
    paymentId: string;
    amount: number;
    date: string;
    status: string;
};

export type DocumentLookupRow = {
    id: string;
    name: string;
    type: string;
    uploadDate: string;
};

/** Inventory row for “Add booking” on Leads (modal picker). */
export type InventoryUnitRow = {
    id: string;
    unitId: string;
    projectName: string;
    /** Plot | Apartment | Villa — same as inventory list `unit_type` (omitted on older saved lead links). */
    unitType?: string;
    /** BHK / layout — same as inventory `configuration` (stored as `type` for backwards compatibility). */
    type: string;
    price: number;
    status: 'Available' | 'Reserved' | 'Booked';
    /** Same deep link as main inventory: project → Inventory tab + selected unit. */
    inventoryHref?: string;
};

function formatUnitTypeLabel(t: string): string {
    const s = t.trim();
    if (!s) return '—';
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function inferUnitTypeFromConfigurationLabel(config: string): string {
    const c = config.trim().toLowerCase();
    if (c.includes('plot')) return 'Plot';
    if (c.includes('villa') && !c.includes('bhk')) return 'Villa';
    if (c === 'duplex') return 'Villa';
    return 'Apartment';
}

/** Same title-case as inventory list “Unit type” column (`InventoryListPageContent`). */
export function formatInventoryUnitTypeDisplay(unitType: UnitType | string): string {
    const t = String(unitType).trim();
    if (!t) return '—';
    return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Maps CRM `preferredUnitType` (BHK-style) to inventory categories
 * Plot | Apartment | Villa.
 */
export function deriveLeadDisplayUnitType(lead: { preferredUnitType: string }): UnitType {
    const combined = `${lead.preferredUnitType}`;
    const s = combined.toLowerCase();
    if (s.includes('plot')) return 'Plot';
    if (s.includes('duplex')) return 'Villa';
    if (s.includes('villa')) return 'Villa';
    if (s.includes('commercial')) return 'Apartment';
    return 'Apartment';
}

function inventoryRowId(projectName: string, unitId: string): string {
    const p = projectName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    return `${p}__${unitId}`;
}

function buildInventoryUnitSeed(): InventoryUnitRow[] {
    const unitSets: Array<
        [string, string, number, InventoryUnitRow['status']][]
    > = [
        [
            ['101', '2 BHK', 6_200_000, 'Available'],
            ['102', '2 BHK', 6_350_000, 'Reserved'],
            ['103', '3 BHK', 7_100_000, 'Available'],
            ['104', '3 BHK', 7_350_000, 'Booked'],
            ['105', 'Penthouse', 9_800_000, 'Available'],
        ],
        [
            ['A-201', '2 BHK', 6_650_000, 'Available'],
            ['A-202', '2 BHK', 6_720_000, 'Booked'],
            ['B-301', '3 BHK', 7_890_000, 'Available'],
            ['B-302', '3 BHK', 8_050_000, 'Reserved'],
        ],
        [
            ['V-01', 'Villa', 14_200_000, 'Available'],
            ['V-02', 'Villa', 14_800_000, 'Booked'],
            ['P-12', 'Plot', 4_500_000, 'Available'],
        ],
    ];

    const rows: InventoryUnitRow[] = [];
    DEMO_PROJECT_NAMES.forEach((projectName, pi) => {
        const set = unitSets[pi] ?? unitSets[0]!;
        for (const [unitId, typ, price, status] of set) {
            rows.push({
                id: inventoryRowId(projectName, unitId),
                unitId,
                projectName,
                unitType: formatUnitTypeLabel(inferUnitTypeFromConfigurationLabel(typ)),
                type: typ,
                price,
                status,
            });
        }
    });
    return rows;
}

const INVENTORY_UNIT_SEED: InventoryUnitRow[] = buildInventoryUnitSeed();

function mapBookingToLookupRow(b: (ReturnType<typeof getBookings>[number])): BookingLookupRow {
    const lead = getLeadByLeadCode(b.leadId);
    return {
        id: b.slug,
        leadName: lead?.name?.trim() || b.customerName,
        projectName: b.projectName,
        unitId: b.unitId,
    };
}

/** Same identifiers as the payments ledger (`PaymentLedgerTable` uses `slug` as Payment ID). */
function mapPaymentToLookupRow(p: PaymentRecord): PaymentLookupRow {
    return {
        id: p.slug,
        paymentId: p.slug,
        amount: p.amount,
        date: p.date,
        status: p.status,
    };
}

/** Booked units use `BookingRecord.slug` as row id so they match booking pages; available units keep seed ids. */
/** Resolve project → Inventory + unit URL when the unit exists in the demo store (e.g. for persisted lead rows without href). */
export function resolveInventoryUnitHref(projectName: string, unitId: string): string | undefined {
    const projects = getProjects();
    const p = projects.find((x) => x.project_name === projectName);
    if (!p) return undefined;
    const u = getUnits().find((x) => x.projectSlug === p.slug && x.unit_number === unitId);
    if (!u) return undefined;
    return getProjectInventoryUnitHref(p.slug, u.slug);
}

function mapAvailabilityToPickerStatus(s: UnitAvailabilityStatus): InventoryUnitRow['status'] {
    switch (s) {
        case 'available':
            return 'Available';
        case 'reserved':
        case 'pending':
            return 'Reserved';
        case 'sold':
            return 'Booked';
        default:
            return 'Available';
    }
}

function projectUnitKey(projectName: string, unitId: string): string {
    return `${projectName}||${unitId}`;
}

/**
 * Same units as `projectsInventoryStore` / inventory list, with booking overlay for booked units.
 * Each row includes `inventoryHref` when the unit exists in the store (opens project → Inventory + unit).
 */
function buildUnifiedLeadBookingInventory(): InventoryUnitRow[] {
    const bookings = getBookings();
    const bookingByKey = new Map<string, BookingRecord>();
    for (const b of bookings) {
        bookingByKey.set(projectUnitKey(b.projectName, b.unitId), b);
    }

    const projects = getProjects();
    const rows: InventoryUnitRow[] = [];
    const consumedBookingKeys = new Set<string>();

    for (const u of getUnits()) {
        const p = projects.find((pr) => pr.slug === u.projectSlug);
        if (!p) continue;
        const key = projectUnitKey(p.project_name, u.unit_number);
        const href = getProjectInventoryUnitHref(u.projectSlug, u.slug);
        const b = bookingByKey.get(key);
        if (b) {
            consumedBookingKeys.add(key);
            rows.push({
                id: b.slug,
                unitId: u.unit_number,
                projectName: p.project_name,
                unitType: formatUnitTypeLabel(u.unit_type),
                type: b.unitConfiguration?.trim() || u.configuration || '—',
                price: b.unitPrice,
                status: 'Booked',
                inventoryHref: href,
            });
        } else {
            rows.push({
                id: u.slug,
                unitId: u.unit_number,
                projectName: p.project_name,
                unitType: formatUnitTypeLabel(u.unit_type),
                type: u.configuration,
                price: u.offer_price ?? u.price,
                status: mapAvailabilityToPickerStatus(u.availability_status),
                inventoryHref: href,
            });
        }
    }

    for (const b of bookings) {
        const key = projectUnitKey(b.projectName, b.unitId);
        if (consumedBookingKeys.has(key)) continue;
        const seedMatch = INVENTORY_UNIT_SEED.find((r) => r.projectName === b.projectName && r.unitId === b.unitId);
        const cfg = b.unitConfiguration?.trim() || seedMatch?.type || '2 BHK';
        rows.push({
            id: b.slug,
            unitId: b.unitId,
            projectName: b.projectName,
            unitType: seedMatch?.unitType
                ? formatUnitTypeLabel(seedMatch.unitType)
                : formatUnitTypeLabel(inferUnitTypeFromConfigurationLabel(cfg)),
            type: cfg,
            price: b.unitPrice,
            status: 'Booked',
            inventoryHref: resolveInventoryUnitHref(b.projectName, b.unitId),
        });
    }

    return rows.sort((a, b) => {
        const pn = a.projectName.localeCompare(b.projectName);
        if (pn !== 0) return pn;
        return a.unitId.localeCompare(b.unitId, undefined, { numeric: true });
    });
}

function complianceDocToLookupRow(d: ComplianceDocumentRecord): DocumentLookupRow {
    return {
        id: d.id,
        name: d.name,
        type: d.documentType,
        uploadDate: getUploadDateYmd(d),
    };
}

/** Simulated latency — remove or set to 0 when wiring real APIs. */
const MOCK_MS = 320;

export async function fetchBookingLookupRows(): Promise<BookingLookupRow[]> {
    await delay(MOCK_MS);
    return getBookings().map(mapBookingToLookupRow);
}

export async function fetchPaymentLookupRows(): Promise<PaymentLookupRow[]> {
    await delay(MOCK_MS);
    return getPayments().map(mapPaymentToLookupRow);
}

/** Payments ledger rows scoped to a single booking (typical “link to booking” use case). */
export async function fetchPaymentLookupRowsForBooking(bookingSlug: string): Promise<PaymentLookupRow[]> {
    await delay(MOCK_MS);
    return getPayments()
        .filter((p) => p.bookingSlug === bookingSlug)
        .map(mapPaymentToLookupRow);
}

const seedDocuments: DocumentLookupRow[] = [
    { id: 'doc-kyc-001', name: 'Buyer KYC pack.pdf', type: 'KYC', uploadDate: '2026-03-12' },
    { id: 'doc-agreement-002', name: 'Booking agreement (signed).pdf', type: 'Agreement', uploadDate: '2026-03-18' },
    { id: 'doc-noc-003', name: 'NOC — lender.pdf', type: 'Legal', uploadDate: '2026-03-20' },
    { id: 'doc-id-004', name: 'PAN & Aadhaar (redacted).zip', type: 'Identity', uploadDate: '2026-03-21' },
    { id: 'doc-plan-005', name: 'Payment plan acknowledgement.pdf', type: 'Finance', uploadDate: '2026-03-25' },
];

export async function fetchDocumentLookupRows(): Promise<DocumentLookupRow[]> {
    await delay(MOCK_MS);
    const fromCompliance = listActiveDocuments().map(complianceDocToLookupRow);
    const byId = new Map<string, DocumentLookupRow>();
    for (const r of fromCompliance) byId.set(r.id, r);
    for (const r of seedDocuments) {
        if (!byId.has(r.id)) byId.set(r.id, r);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Asset inventory for lead booking — aligned with booking list + demo inventory (no duplicate units). */
export async function fetchLeadBookingInventory(): Promise<InventoryUnitRow[]> {
    await delay(MOCK_MS);
    return buildUnifiedLeadBookingInventory();
}

/** Bookings for a CRM lead code (`AR-*`) — drives payments + compliance joins in the mock layer. */
export function getBookingSlugsForLeadCode(leadCode: string): string[] {
    const c = leadCode.trim();
    return getBookings()
        .filter((b) => b.leadId.trim() === c)
        .map((b) => b.slug);
}

/** Payments ledger rows for every booking owned by this lead (by `BookingRecord.leadId`). */
export function getPaymentsForLeadCode(leadCode: string): PaymentRecord[] {
    const slugs = new Set(getBookingSlugsForLeadCode(leadCode));
    return getPayments().filter((p) => slugs.has(p.bookingSlug));
}

/** Asset inventory rows the lead can still book (available units only). */
export async function fetchLeadBookingInventoryAvailable(): Promise<InventoryUnitRow[]> {
    const rows = await fetchLeadBookingInventory();
    return rows.filter((r) => r.status === 'Available');
}

/** Compliance documents tied to any booking for this lead (`bookingId` = booking slug). */
export async function fetchDocumentLookupRowsForLead(leadCode: string): Promise<DocumentLookupRow[]> {
    await delay(MOCK_MS);
    const slugs = new Set(getBookingSlugsForLeadCode(leadCode));
    if (slugs.size === 0) return [];
    const rows: DocumentLookupRow[] = [];
    for (const d of listActiveDocuments()) {
        const bid = d.bookingId?.trim();
        if (!bid || !slugs.has(bid)) continue;
        rows.push(complianceDocToLookupRow(d));
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
}
