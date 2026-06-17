'use client';

import { getLeads } from '@/lib/leadStore';

export type ProjectType = 'Plot' | 'Apartment' | 'Villa';
export type ProjectStatus = 'upcoming' | 'active' | 'sold out';
export type ProjectApprovalStatus = 'pending' | 'approved';

export type UnitType = 'Plot' | 'Apartment' | 'Villa';
export type UnitAvailabilityStatus = 'available' | 'reserved' | 'sold' | 'pending';

/** Apartment layouts — also used as labels in bookings and lead inventory pickers. */
export const APARTMENT_BHK_OPTIONS = ['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Penthouse'] as const;
export const VILLA_CONFIGURATION_OPTIONS = ['Villa', 'Duplex', '4 BHK'] as const;
export const PLOT_CONFIGURATION_OPTIONS = ['Plot'] as const;

export function defaultConfigurationForUnitType(unitType: UnitType): string {
    switch (unitType) {
        case 'Apartment':
            return '2 BHK';
        case 'Villa':
            return 'Villa';
        case 'Plot':
            return 'Plot';
        default:
            return '—';
    }
}

export function configurationOptionsForUnitType(unitType: UnitType): string[] {
    switch (unitType) {
        case 'Apartment':
            return [...APARTMENT_BHK_OPTIONS];
        case 'Villa':
            return [...VILLA_CONFIGURATION_OPTIONS];
        case 'Plot':
            return [...PLOT_CONFIGURATION_OPTIONS];
        default:
            return [];
    }
}

export type ProjectAmenitiesMap = Partial<
    Record<
        | 'swimming_pool'
        | 'clubhouse'
        | 'gym'
        | 'power_backup'
        | 'security'
        | 'cctv'
        | 'lift'
        | 'ev_charging'
        | 'visitor_parking'
        | 'park'
        | 'indoor_games',
        boolean
    >
>;

export interface ProjectConstructionStatus {
    excavation_pct?: number;
    structure_pct?: number;
    plumbing_pct?: number;
    electrical_pct?: number;
    finishing_pct?: number;
    completion_pct?: number;
    last_site_update?: string;
}

export interface ProjectSalesInsights {
    leads_count?: number;
    booking_count?: number;
    conversion_pct?: number;
    revenue_generated?: number;
    unsold_inventory?: number;
    top_selling_configuration?: string;
}

export interface ProjectPortalSettings {
    customer_portal_enabled?: boolean;
    resident_portal_enabled?: boolean;
    visitor_access_enabled?: boolean;
    online_booking_enabled?: boolean;
}

export interface ProjectMediaGallery {
    cover_image?: string;
    project_banner?: string;
    gallery_images?: string[];
    walkthrough_video?: string;
    master_plan?: string;
    floor_plan_pdf?: string;
}

export interface Project {
    id: number; // internal numeric id (never shown directly)
    slug: string; // URL-safe slug
    project_id: string; // user-facing code (e.g., PR-1)
    project_name: string;
    project_type: ProjectType;
    location: string;
    total_units: number;
    project_status: ProjectStatus;
    approval_status?: ProjectApprovalStatus;
    /** Enterprise extended profile (optional for backward compatibility). */
    full_address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    landmark?: string;
    map_url?: string;
    developer_name?: string;
    project_owner_name?: string;
    project_manager_name?: string;
    executive_manager_name?: string;
    sales_head?: string;
    towers_blocks?: string;
    floors?: string;
    launch_date?: string;
    possession_date?: string;
    starting_price?: number;
    max_price?: number;
    internal_notes?: string;
    created_at?: string;
    updated_at?: string;
    archived?: boolean;
    /** Enterprise: project configuration */
    project_category?: string;
    development_type?: string;
    property_type?: string;
    project_phase?: string;
    construction_type?: string;
    rera_applicable?: boolean;
    launch_status?: string;
    possession_status?: string;
    project_priority?: string;
    /** Enterprise: RERA & legal */
    rera_number?: string;
    approval_authority?: string;
    approval_number?: string;
    legal_status?: string;
    registration_status?: string;
    land_ownership_type?: string;
    legal_documents_note?: string;
    approval_expiry_date?: string;
    /** Enterprise: amenities, construction, sales, media, portals */
    amenities?: ProjectAmenitiesMap;
    construction_status?: ProjectConstructionStatus;
    sales_insights?: ProjectSalesInsights;
    media_gallery?: ProjectMediaGallery;
    portal_settings?: ProjectPortalSettings;
}

export interface InventoryUnit {
    id: number;
    slug: string; // URL-safe single segment: `{projectSlug}--{slugifiedUnitNumber}` (no `/`)
    unit_id: string; // user-facing code (e.g., UN-1)
    projectSlug: string;

    unit_number: string; // unique within a project
    unit_type: UnitType;
    /** e.g. 2 BHK, 3 BHK, Studio, Villa, Plot — shown in inventory, bookings, and leads. */
    configuration: string;
    unit_size: number; // positive
    price: number; // base price
    offer_price?: number; // optional
    availability_status: UnitAvailabilityStatus;
    block_phase?: string;
    tower_block?: string;
    floor?: string;
    facing?: string;
    plc_charges?: number;
    gst_tax_percent?: number;
    created_at?: string;
    updated_at?: string;

    // Booking / inventory sync (required fields; empty string until first event)
    inventory_lock_status: boolean;
    lock_timestamp: string;
    unlock_timestamp: string;

    /** Enterprise: unit dimensions */
    carpet_area?: number;
    built_up_area?: number;
    super_built_up_area?: number;
    balcony_area?: number;
    terrace_area?: number;
    uds_area?: number;
    /** Enterprise: unit features */
    furnishing_status?: string;
    view_type?: string;
    corner_unit?: boolean;
    balcony_count?: number;
    washroom_count?: number;
    smart_home_enabled?: boolean;
    ventilation_rating?: string;
    /** Enterprise: parking */
    parking_type?: string;
    parking_slot_number?: string;
    parking_covered_open?: string;
    parking_ev_charging?: boolean;
    /** Enterprise: workflow & booking */
    inventory_workflow_status?: string;
    booking_customer?: string;
    booking_id?: string;
    booking_status?: string;
    lead_source?: string;
    assigned_salesperson?: string;
    /** Enterprise: extended pricing */
    floor_rise_charges?: number;
    registration_charges?: number;
    parking_charges?: number;
    clubhouse_charges?: number;
    /** Enterprise: locking metadata */
    locked_by_user?: string;
    lock_reason?: string;
    lock_expiry?: string;
    auto_unlock?: boolean;
    lock_activity?: Array<{ at: string; action: string; user: string; note?: string }>;
    /** Enterprise: unit documents (demo metadata) */
    unit_documents?: Array<{ id: string; name: string; type: string; uploadedAt?: string }>;
    /** Enterprise: demand insights */
    demand_trend?: number[];
    booking_prediction_pct?: number;
    pricing_recommendation?: string;
    fastest_selling_unit_type?: string;
}

export type PriceApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface PriceUpdateApproval {
    id: number;
    slug: string;
    unitSlug: string;
    requested_base_price: number;
    requested_offer_price?: number;
    status: PriceApprovalStatus;
    requested_at: string;
    decided_at?: string;
    history_row_id?: string;
    discount_pct?: number;
    plc_charges?: number;
    gst_pct?: number;
    final_price?: number;
    effective_from?: string;
    notes?: string;
}

export type ProjectDocumentCategory =
    | 'RERA'
    | 'Legal'
    | 'RERA Documents'
    | 'Legal Documents'
    | 'Floor Plans'
    | 'Brochures'
    | 'Brochure'
    | 'Price Sheets'
    | 'Agreements'
    | 'Approval Certificates'
    | 'Marketing Materials'
    | 'NOC'
    | 'Other';

export type ProjectDocumentStatus = 'Active' | 'Expiring' | 'Expired' | 'Missing';

export interface ProjectDocument {
    id: string;
    projectSlug: string;
    name: string;
    category: ProjectDocumentCategory;
    version: string;
    uploadedBy: string;
    uploadedAt: string;
    sizeLabel?: string;
    /** Demo-only inline preview (e.g. data URL for uploaded text). */
    previewText?: string;
    expiryDate?: string;
    status?: ProjectDocumentStatus;
    versionHistory?: Array<{ version: string; uploadedAt: string; uploadedBy: string }>;
}

export type ProjectActivityKind =
    | 'project_created'
    | 'price_changed'
    | 'inventory_updated'
    | 'unit_booked'
    | 'approval_requested'
    | 'approval_completed'
    | 'document_uploaded'
    | 'document_deleted'
    | 'project_archived'
    | 'project_edited';

export interface ProjectActivityEntry {
    id: string;
    projectSlug: string;
    kind: ProjectActivityKind;
    message: string;
    at: string;
    actor?: string;
}

export interface PricingHistoryRow {
    id: string;
    projectSlug: string;
    unitSlug: string;
    unitNumber: string;
    oldBase: number;
    newBase: number;
    oldOffer?: number;
    newOffer?: number;
    discountPct?: number;
    plcCharges?: number;
    gstPct?: number;
    finalPrice?: number;
    effectiveFrom?: string;
    notes?: string;
    updatedBy: string;
    at: string;
    status: 'pending' | 'approved' | 'rejected' | 'direct';
    approvalSlug?: string;
}

export const slugify = (input: string) =>
    input
        .trim()
        .toLowerCase()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

/** Stable one-segment key for App Router `[slug]` (no `/` — avoids broken %2F handling). */
export function buildUnitSlug(projectSlug: string, unitNumber: string) {
    const part = slugify(unitNumber);
    return `${projectSlug}--${part || 'unit'}`;
}

/** Optional: encode only if slug ever contains unusual characters. */
export function encodeUnitSlugForUrl(unitSlug: string) {
    return encodeURIComponent(unitSlug);
}

export function decodeUnitSlugParam(encodedSlug: string) {
    if (!encodedSlug) return '';
    try {
        return decodeURIComponent(encodedSlug);
    } catch {
        return encodedSlug;
    }
}

/** Deep-link to project → Inventory tab with a unit selected (primary unit detail surface). */
export function getProjectInventoryUnitHref(projectSlug: string, unitSlug: string, options?: { startInlineEdit?: boolean }) {
    const unit = encodeURIComponent(unitSlug);
    const edit = options?.startInlineEdit ? '&edit=1' : '';
    return `/projects-inventory/projects/view/${projectSlug}?tab=inventory&unit=${unit}${edit}`;
}

/** Map old `projectSlug/unit-NNN` style to current `projectSlug--NNN` slug. */
function legacyPathToUnitSlug(key: string): string | undefined {
    const i = key.indexOf('/');
    if (i <= 0) return undefined;
    const pSlug = key.slice(0, i);
    const tail = key.slice(i + 1);
    if (!tail.startsWith('unit-')) return undefined;
    const num = tail.slice('unit-'.length);
    return buildUnitSlug(pSlug, num);
}

const formatProjectCode = (n: number) => `PR-${n}`;
const formatUnitCode = (n: number) => `UN-${n}`;

const nowYmdHms = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

/** Final list price after discount, PLC, and GST (demo calculator). */
export function computeFinalUnitPrice(input: {
    basePrice: number;
    offerPrice?: number;
    discountPct?: number;
    plcCharges?: number;
    gstPct?: number;
}): number {
    const base = Math.max(0, Number(input.basePrice) || 0);
    let afterDisc = input.offerPrice;
    if (afterDisc === undefined || !Number.isFinite(afterDisc)) {
        const d = Number(input.discountPct) || 0;
        afterDisc = base * (1 - Math.min(100, Math.max(0, d)) / 100);
    }
    afterDisc = Math.max(0, afterDisc);
    const plc = Math.max(0, Number(input.plcCharges) || 0);
    const subtotal = afterDisc + plc;
    const gst = Number(input.gstPct) || 0;
    return Math.round(subtotal * (1 + Math.min(100, Math.max(0, gst)) / 100));
}

/** Demo flag: set `localStorage.setItem('arris-pricing-direct','0')` to hide direct updates. */
export function canUpdatePricingDirectly(): boolean {
    if (typeof window === 'undefined') return true;
    try {
        return window.localStorage.getItem('arris-pricing-direct') !== '0';
    } catch {
        return true;
    }
}

function mapLeadPropertyTypeToUnitType(p: string): UnitType {
    const s = (p || '').toLowerCase();
    if (s.includes('villa')) return 'Villa';
    if (s.includes('duplex')) return 'Villa';
    // BHK => apartment by default
    return 'Apartment';
}

function buildSeedProjects(): Project[] {
    const leads = getLeads();
    const uniqueProjectNames = Array.from(new Set(leads.map((l) => l.project).filter(Boolean)));
    const seededNames = uniqueProjectNames.slice(0, 3);

    const seedStamp = nowYmdHms();

    /** Demo roster — realistic names for UI; cycles if there are more seed projects than entries. */
    const SEED_PROJECT_TEAMS: Array<{
        project_owner_name: string;
        project_manager_name: string;
        executive_manager_name: string;
        sales_head: string;
    }> = [
        {
            project_owner_name: 'Rajesh Kulkarni',
            project_manager_name: 'Priya Sharma',
            executive_manager_name: 'Amit Deshpande',
            sales_head: 'Neha Iyer',
        },
        {
            project_owner_name: 'Vikram Singh',
            project_manager_name: 'Ananya Menon',
            executive_manager_name: 'Karthik Rao',
            sales_head: 'Deepa Nair',
        },
        {
            project_owner_name: 'Suresh Patil',
            project_manager_name: 'Kavitha Reddy',
            executive_manager_name: 'Rahul Mehta',
            sales_head: 'Pooja Gupta',
        },
    ];

    const seedTeamForIndex = (idx: number) => SEED_PROJECT_TEAMS[idx % SEED_PROJECT_TEAMS.length]!;

    if (seededNames.length === 0) {
        return [
            {
                id: 1,
                slug: 'skyline-residency',
                project_id: formatProjectCode(1),
                project_name: 'Skyline Residency',
                project_type: 'Apartment',
                location: 'Mumbai, Maharashtra',
                total_units: 20,
                project_status: 'active',
                approval_status: 'approved',
                full_address: 'Skyline Residency, Andheri East',
                city: 'Mumbai',
                state: 'Maharashtra',
                country: 'India',
                pincode: '400069',
                developer_name: 'Skyline Developers',
                towers_blocks: 'Tower A, B',
                floors: 'G + 18',
                launch_date: '2024-01-15',
                possession_date: '2027-03-31',
                starting_price: 6200000,
                max_price: 12500000,
                ...seedTeamForIndex(0),
                created_at: seedStamp,
                updated_at: seedStamp,
            },
        ];
    }

    return seededNames.map((name, idx) => {
        const slug = slugify(name) || `project-${idx + 1}`;
        const leadMatches = leads.filter((l) => l.project === name);
        const inferredLeadType = leadMatches[0]?.preferredUnitType || '';

        // crude mapping: leads have "Villa"/BHK types but not project_type directly
        const inferredType: ProjectType =
            mapLeadPropertyTypeToUnitType(inferredLeadType) === 'Villa'
                ? 'Villa'
                : mapLeadPropertyTypeToUnitType(inferredLeadType) === 'Plot'
                  ? 'Plot'
                  : 'Apartment';

        const totalUnits = 20 + idx * 10;
        const approval_status: ProjectApprovalStatus = idx === 0 ? 'approved' : 'pending';
        const t = nowYmdHms();

        return {
            id: idx + 1,
            slug,
            project_id: formatProjectCode(idx + 1),
            project_name: name,
            project_type: inferredType,
            location: 'Pune, Maharashtra',
            total_units: totalUnits,
            project_status: approval_status === 'approved' ? 'active' : 'upcoming',
            approval_status,
            full_address: `${name} — Sample Address Line`,
            city: 'Pune',
            state: 'Maharashtra',
            country: 'India',
            pincode: '411001',
            developer_name: 'mySFT Demo Builders',
            towers_blocks: idx % 2 === 0 ? 'Block A' : 'Tower 1',
            floors: String(10 + idx * 2),
            launch_date: '2024-06-01',
            possession_date: '2028-12-31',
            starting_price: 4500000 + idx * 250000,
            max_price: 9000000 + idx * 500000,
            ...seedTeamForIndex(idx),
            created_at: t,
            updated_at: t,
        };
    });
}

const seededProjects: Project[] = buildSeedProjects();

let _projects: Project[] = seededProjects.map((p) => ({ ...p }));

let _nextProjectId = (_projects.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;

export function getNextProjectCode() {
    return formatProjectCode(_nextProjectId);
}

function buildSeedUnits(): InventoryUnit[] {
    const unitNumbersByType = (projectType: ProjectType) => {
        const start = projectType === 'Villa' ? 1 : projectType === 'Plot' ? 200 : 101;
        return Array.from({ length: 10 }, (_, i) => String(start + i));
    };

    const units: InventoryUnit[] = [];
    let nextId = 1;

    const apartmentBhkCycle = ['2 BHK', '3 BHK', '2 BHK', '4 BHK', 'Studio', 'Penthouse', '1 BHK', '2 BHK', '3 BHK', '4 BHK'];

    for (const p of _projects) {
        const unitNumbers = unitNumbersByType(p.project_type);
        unitNumbers.forEach((unitNum, idx) => {
            const availability_status: UnitAvailabilityStatus =
                idx < 5 ? 'available' : idx < 8 ? 'reserved' : 'sold';

            const unitType = p.project_type;
            const configuration =
                unitType === 'Apartment'
                    ? apartmentBhkCycle[idx % apartmentBhkCycle.length]!
                    : unitType === 'Villa'
                      ? idx % 2 === 0
                          ? 'Villa'
                          : 'Duplex'
                      : 'Plot';
            const unitSize = p.project_type === 'Villa' ? 1800 + idx * 30 : p.project_type === 'Plot' ? 600 + idx * 10 : 950 + idx * 20;
            const ut = nowYmdHms();

            units.push({
                id: nextId++,
                slug: buildUnitSlug(p.slug, unitNum),
                unit_id: formatUnitCode(nextId - 1),
                projectSlug: p.slug,
                unit_number: unitNum,
                unit_type: unitType,
                configuration,
                unit_size: unitSize,
                price: 6500000 + idx * 150000,
                offer_price: idx % 3 === 0 ? 6200000 + idx * 120000 : undefined,
                availability_status,
                block_phase: idx % 2 === 0 ? 'Phase A' : undefined,
                tower_block: p.towers_blocks?.split(',')[0]?.trim() || 'A',
                floor: String((idx % 12) + 1),
                facing: idx % 2 === 0 ? 'East' : 'West',
                plc_charges: 75000 + idx * 5000,
                gst_tax_percent: 5,
                created_at: ut,
                updated_at: ut,
                inventory_lock_status: false,
                lock_timestamp: '',
                unlock_timestamp: '',
                carpet_area: Math.round(unitSize * 0.78),
                built_up_area: unitSize,
                super_built_up_area: Math.round(unitSize * 1.15),
                furnishing_status: idx % 3 === 0 ? 'Semi-furnished' : 'Unfurnished',
                view_type: idx % 2 === 0 ? 'Garden View' : 'City View',
                corner_unit: idx % 4 === 0,
                inventory_workflow_status:
                    availability_status === 'available'
                        ? 'Available'
                        : availability_status === 'reserved'
                          ? 'Reserved'
                          : availability_status === 'sold'
                            ? 'Booked'
                            : 'Blocked',
                floor_rise_charges: idx * 10000,
                registration_charges: 150000,
                parking_charges: 250000,
                clubhouse_charges: 100000,
                auto_unlock: true,
                demand_trend: [40 + idx, 45 + idx, 50 + idx, 55 + idx, 52 + idx, 60 + idx],
                booking_prediction_pct: 55 + idx * 2,
            });
        });
    }

    return units;
}

let _units: InventoryUnit[] = buildSeedUnits();
let _nextUnitId = (_units.reduce((max, u) => Math.max(max, u.id), 0) || 0) + 1;

export function getNextUnitCode() {
    return formatUnitCode(_nextUnitId);
}

let _nextApprovalId = 1;
let _approvals: PriceUpdateApproval[] = [];

let _documents: ProjectDocument[] = [];
let _activities: ProjectActivityEntry[] = [];
let _pricingHistory: PricingHistoryRow[] = [];
let _activitySeq = 1;
let _historySeq = 1;

function nextActivityId() {
    return `act-${_activitySeq++}`;
}

function nextHistoryId() {
    return `ph-${_historySeq++}`;
}

export function appendProjectActivity(entry: Omit<ProjectActivityEntry, 'id'>) {
    const row: ProjectActivityEntry = { ...entry, id: nextActivityId() };
    _activities = [row, ..._activities];
    return row;
}

export function getProjectActivities(projectSlug: string) {
    return _activities.filter((a) => a.projectSlug === projectSlug);
}

export function getProjectDocuments(projectSlug: string) {
    return _documents.filter((d) => d.projectSlug === projectSlug).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}

export function addProjectDocument(input: Omit<ProjectDocument, 'id' | 'uploadedAt'> & { uploadedAt?: string }) {
    const doc: ProjectDocument = {
        ...input,
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        uploadedAt: input.uploadedAt ?? nowYmdHms(),
    };
    _documents = [..._documents, doc];
    appendProjectActivity({
        projectSlug: input.projectSlug,
        kind: 'document_uploaded',
        message: `Document uploaded: ${input.name} (${input.category})`,
        at: doc.uploadedAt,
        actor: input.uploadedBy,
    });
    return doc;
}

export function deleteProjectDocument(projectSlug: string, docId: string) {
    const doc = _documents.find((d) => d.id === docId && d.projectSlug === projectSlug);
    if (!doc) return false;
    _documents = _documents.filter((d) => d.id !== docId);
    appendProjectActivity({
        projectSlug,
        kind: 'document_deleted',
        message: `Document removed: ${doc.name}`,
        at: nowYmdHms(),
        actor: doc.uploadedBy,
    });
    return true;
}

export function getPricingHistoryForProject(projectSlug: string) {
    return _pricingHistory.filter((h) => h.projectSlug === projectSlug).sort((a, b) => b.at.localeCompare(a.at));
}

/** Inventory KPI buckets for a single project (UI labels). */
export function getProjectInventoryBuckets(projectSlug: string) {
    const units = _units.filter((u) => u.projectSlug === projectSlug);
    let available = 0;
    let reserved = 0;
    let booked = 0;
    let blocked = 0;
    for (const u of units) {
        if (u.availability_status === 'sold') {
            booked += 1;
            continue;
        }
        if (u.availability_status === 'reserved') {
            reserved += 1;
            continue;
        }
        if (u.availability_status === 'pending' || u.inventory_lock_status) {
            blocked += 1;
            continue;
        }
        if (u.availability_status === 'available') {
            available += 1;
        }
    }
    return { available, reserved, booked, blocked, total: units.length };
}

export function estimateProjectRevenuePotential(project: Project) {
    const units = _units.filter((u) => u.projectSlug === project.slug);
    let sum = 0;
    for (const u of units) {
        if (u.availability_status !== 'sold') {
            sum += u.offer_price ?? u.price;
        }
    }
    if (project.max_price && project.total_units) {
        return Math.max(sum, project.max_price * Math.max(0, project.total_units - units.filter((u) => u.availability_status === 'sold').length));
    }
    return sum;
}

export function archiveProject(slug: string) {
    const p = getProjectBySlug(slug);
    if (!p) return undefined;
    const t = nowYmdHms();
    _projects = _projects.map((x) => (x.slug === slug ? { ...x, archived: true, updated_at: t } : x));
    appendProjectActivity({ projectSlug: slug, kind: 'project_archived', message: 'Project archived', at: t });
    return getProjectBySlug(slug);
}

export function unarchiveProject(slug: string) {
    const p = getProjectBySlug(slug);
    if (!p) return undefined;
    const t = nowYmdHms();
    _projects = _projects.map((x) => (x.slug === slug ? { ...x, archived: false, updated_at: t } : x));
    appendProjectActivity({ projectSlug: slug, kind: 'project_edited', message: 'Project restored from archive', at: t });
    return getProjectBySlug(slug);
}

export function getProjects() {
    return _projects;
}

export function getProjectBySlug(slug: string) {
    return _projects.find((p) => p.slug === slug);
}

export type ProjectCreateInput = {
    project_name: string;
    project_type: ProjectType;
    location: string;
    total_units: number;
    project_status: ProjectStatus;
    requires_approval: boolean;
} & Partial<
    Omit<
        Project,
        | 'id'
        | 'slug'
        | 'project_id'
        | 'project_name'
        | 'project_type'
        | 'location'
        | 'total_units'
        | 'project_status'
        | 'approval_status'
    >
>;

export function addProject(input: ProjectCreateInput) {
    const id = _nextProjectId++;
    const slug = slugify(input.project_name) || `project-${id}`;
    const project_id = formatProjectCode(id);

    const needsApproval = input.requires_approval;
    const approval_status: ProjectApprovalStatus | undefined = needsApproval ? 'pending' : 'approved';
    const project_status: ProjectStatus = needsApproval ? 'upcoming' : input.project_status;
    const t = nowYmdHms();

    const {
        project_name,
        project_type,
        location,
        total_units,
        requires_approval: _ra,
        project_status: _ps,
        ...rest
    } = input;

    const project: Project = {
        id,
        slug,
        project_id,
        project_name,
        project_type,
        location,
        total_units,
        project_status,
        approval_status,
        ...rest,
        created_at: t,
        updated_at: t,
        archived: rest.archived ?? false,
    };

    _projects = [..._projects, project];
    appendProjectActivity({
        projectSlug: slug,
        kind: 'project_created',
        message: `Project created: ${project_name}`,
        at: t,
        actor: 'You',
    });
    if (needsApproval) {
        appendProjectActivity({
            projectSlug: slug,
            kind: 'approval_requested',
            message: 'Project approval requested before go-live',
            at: t,
            actor: 'You',
        });
    }
    return project;
}

/** Bulk import projects from CSV (demo store). Skips rows whose slug/name already exists. */
export function bulkImportProjects(
    rows: Array<{
        project_name: string;
        project_type: ProjectType;
        location: string;
        total_units: number;
        project_status: ProjectStatus;
        requires_approval: boolean;
    }>,
): { success: number; failed: Array<{ row: number; reason: string }> } {
    const failed: Array<{ row: number; reason: string }> = [];
    let success = 0;
    const seenSlugs = new Set<string>();
    rows.forEach((row, i) => {
        const line = i + 2;
        const name = row.project_name.trim();
        const slug = slugify(name);
        if (!name || !slug) {
            failed.push({ row: line, reason: 'project_name is required' });
            return;
        }
        if (seenSlugs.has(slug)) {
            failed.push({ row: line, reason: 'Duplicate project_name in this file' });
            return;
        }
        seenSlugs.add(slug);
        const exists = _projects.some((p) => p.slug === slug || p.project_name.toLowerCase() === name.toLowerCase());
        if (exists) {
            failed.push({ row: line, reason: 'A project with this name already exists' });
            return;
        }
        addProject({
            project_name: name,
            project_type: row.project_type,
            location: row.location.trim(),
            total_units: row.total_units,
            project_status: row.project_status,
            requires_approval: row.requires_approval,
        });
        success += 1;
    });
    return { success, failed };
}

export function updateProject(slug: string, updates: Partial<Omit<Project, 'id' | 'slug' | 'project_id'>>) {
    const t = nowYmdHms();
    const next = _projects.map((p) => (p.slug === slug ? ({ ...p, ...updates, updated_at: t } as Project) : p));
    _projects = next;
    const updated = _projects.find((p) => p.slug === slug);
    if (updated) {
        appendProjectActivity({
            projectSlug: slug,
            kind: 'project_edited',
            message: 'Project details updated',
            at: t,
            actor: 'You',
        });
    }
    return updated;
}

export function approveProject(slug: string) {
    const p = getProjectBySlug(slug);
    if (!p) return undefined;
    const t = nowYmdHms();
    _projects = _projects.map((x) =>
        x.slug === slug
            ? {
                  ...x,
                  approval_status: 'approved',
                  project_status: 'active',
                  updated_at: t,
                }
            : x
    );
    appendProjectActivity({
        projectSlug: slug,
        kind: 'approval_completed',
        message: 'Project approval completed — record is active',
        at: t,
        actor: 'You',
    });
    return getProjectBySlug(slug);
}

/** Bulk delete for enterprise list UIs (demo store). */
export function bulkDeleteProjects(slugs: string[]): number {
    let n = 0;
    for (const s of slugs) {
        if (deleteProject(s)) n += 1;
    }
    return n;
}

/** Removes project and all its units and related price approvals (demo store). */
export function deleteProject(slug: string): boolean {
    if (!getProjectBySlug(slug)) return false;
    const unitSlugs = new Set(_units.filter((u) => u.projectSlug === slug).map((u) => u.slug));
    _units = _units.filter((u) => u.projectSlug !== slug);
    _approvals = _approvals.filter((a) => !unitSlugs.has(a.unitSlug));
    _documents = _documents.filter((d) => d.projectSlug !== slug);
    _activities = _activities.filter((a) => a.projectSlug !== slug);
    _pricingHistory = _pricingHistory.filter((h) => h.projectSlug !== slug);
    _projects = _projects.filter((p) => p.slug !== slug);
    return true;
}

export function bulkDeleteUnits(unitSlugs: string[]): number {
    let n = 0;
    for (const s of unitSlugs) {
        if (deleteUnit(s)) n += 1;
    }
    return n;
}

/** Removes a single unit and its price approvals (demo store). */
export function deleteUnit(unitSlug: string): boolean {
    if (!getUnitBySlug(unitSlug)) return false;
    _units = _units.filter((u) => u.slug !== unitSlug);
    _approvals = _approvals.filter((a) => a.unitSlug !== unitSlug);
    return true;
}

export function getUnits() {
    return _units;
}

export function getUnitBySlug(unitSlug: string) {
    return _units.find((u) => u.slug === unitSlug);
}

export function addUnit(input: {
    projectSlug: string;
    unit_number: string;
    unit_type: UnitType;
    unit_size: number;
    price: number;
    offer_price?: number;
    availability_status: UnitAvailabilityStatus;
    block_phase?: string;
    configuration?: string;
    tower_block?: string;
    floor?: string;
    facing?: string;
    plc_charges?: number;
    gst_tax_percent?: number;
}) {
    const project = getProjectBySlug(input.projectSlug);
    if (!project) return undefined;

    const exists = _units.some((u) => u.projectSlug === input.projectSlug && u.unit_number === input.unit_number);
    if (exists) return undefined;

    const id = _nextUnitId++;
    const unit_id = formatUnitCode(id);
    const unit_slug = buildUnitSlug(project.slug, input.unit_number);

    const configuration =
        (input.configuration && input.configuration.trim()) || defaultConfigurationForUnitType(input.unit_type);

    const ut = nowYmdHms();
    const unit: InventoryUnit = {
        id,
        slug: unit_slug,
        unit_id,
        projectSlug: project.slug,
        unit_number: input.unit_number,
        unit_type: input.unit_type,
        configuration,
        unit_size: input.unit_size,
        price: input.price,
        offer_price: input.offer_price,
        availability_status: input.availability_status,
        block_phase: input.block_phase?.trim() || undefined,
        tower_block: input.tower_block?.trim() || undefined,
        floor: input.floor?.trim() || undefined,
        facing: input.facing?.trim() || undefined,
        plc_charges: input.plc_charges,
        gst_tax_percent: input.gst_tax_percent,
        inventory_lock_status: false,
        lock_timestamp: '',
        unlock_timestamp: '',
        created_at: ut,
        updated_at: ut,
    };

    _units = [..._units, unit];
    appendProjectActivity({
        projectSlug: project.slug,
        kind: 'inventory_updated',
        message: `Unit added: ${input.unit_number}`,
        at: ut,
        actor: 'You',
    });
    return unit;
}

/** Clone an existing unit with a unique unit number within the same project (demo store). */
export function duplicateUnit(unitSlug: string): InventoryUnit | undefined {
    const u = getUnitBySlug(unitSlug);
    if (!u) return undefined;
    let candidate = `${u.unit_number} (Copy)`;
    let n = 2;
    while (_units.some((x) => x.projectSlug === u.projectSlug && x.unit_number === candidate)) {
        candidate = `${u.unit_number} (Copy ${n})`;
        n += 1;
    }
    return addUnit({
        projectSlug: u.projectSlug,
        unit_number: candidate,
        unit_type: u.unit_type,
        unit_size: u.unit_size,
        price: u.price,
        offer_price: u.offer_price,
        availability_status: 'available',
        block_phase: u.block_phase,
        configuration: u.configuration,
        tower_block: u.tower_block,
        floor: u.floor,
        facing: u.facing,
        plc_charges: u.plc_charges,
        gst_tax_percent: u.gst_tax_percent,
    });
}

/** Bulk import for CSV/Excel flows — returns per-row failures (duplicate unit, missing project, etc.). */
export function bulkImportInventoryUnits(
    rows: Array<{
        projectSlug: string;
        unit_number: string;
        unit_type: UnitType;
        unit_size: number;
        price: number;
        offer_price?: number;
        availability_status: UnitAvailabilityStatus;
        block_phase?: string;
        configuration?: string;
    }>,
): { success: number; failed: Array<{ row: number; reason: string }> } {
    const failed: Array<{ row: number; reason: string }> = [];
    let success = 0;
    rows.forEach((row, i) => {
        const line = i + 2; // 1-based data row; header is row 1
        if (!getProjectBySlug(row.projectSlug)) {
            failed.push({ row: line, reason: `Unknown project_slug: ${row.projectSlug}` });
            return;
        }
        const added = addUnit(row);
        if (!added) {
            failed.push({ row: line, reason: 'Duplicate unit in project or invalid data' });
        } else {
            success += 1;
        }
    });
    return { success, failed };
}

export function updateUnit(unitSlug: string, updates: Partial<Omit<InventoryUnit, 'id' | 'slug' | 'unit_id' | 'projectSlug'>>) {
    const current = getUnitBySlug(unitSlug);
    if (!current) return undefined;

    const canonical = current.slug;
    const nextUnitNumber = (updates.unit_number ?? current.unit_number).toString();
    const nextSlug = buildUnitSlug(current.projectSlug, nextUnitNumber);
    const slugChanged = nextSlug !== canonical;

    const exists = _units.some(
        (u) => u.slug !== canonical && u.projectSlug === current.projectSlug && u.unit_number === nextUnitNumber
    );
    if (exists) return undefined;

    const t = nowYmdHms();
    _units = _units.map((u) =>
        u.slug === canonical
            ? ({
                  ...u,
                  ...updates,
                  unit_number: nextUnitNumber,
                  slug: slugChanged ? nextSlug : u.slug,
                  updated_at: t,
              } as InventoryUnit)
            : u
    );

    if (slugChanged) {
        _approvals = _approvals.map((a) => (a.unitSlug === canonical ? { ...a, unitSlug: nextSlug } : a));
        _pricingHistory = _pricingHistory.map((h) => (h.unitSlug === canonical ? { ...h, unitSlug: nextSlug } : h));
    }

    const becameSold = updates.availability_status === 'sold' && current.availability_status !== 'sold';
    appendProjectActivity({
        projectSlug: current.projectSlug,
        kind: becameSold ? 'unit_booked' : 'inventory_updated',
        message: becameSold ? `Unit ${nextUnitNumber} marked as booked` : `Unit updated: ${nextUnitNumber}`,
        at: t,
        actor: 'You',
    });

    return getUnitBySlug(nextSlug);
}

export type PriceUpdateRequestInput = {
    base_price: number;
    offer_price?: number;
    discount_pct?: number;
    plc_charges?: number;
    gst_pct?: number;
    effective_from?: string;
    notes?: string;
    updated_by?: string;
};

export function requestPriceUpdate(unitSlug: string, input: PriceUpdateRequestInput) {
    const unit = getUnitBySlug(unitSlug);
    if (!unit) return undefined;

    const base = Number(input.base_price);
    if (!Number.isFinite(base) || base <= 0) return undefined;

    const offer = input.offer_price;
    if (offer !== undefined && (!Number.isFinite(offer) || offer > base)) return undefined;

    const finalPrice = computeFinalUnitPrice({
        basePrice: base,
        offerPrice: offer,
        discountPct: input.discount_pct,
        plcCharges: input.plc_charges,
        gstPct: input.gst_pct,
    });

    const approvalId = _nextApprovalId++;
    const approvalSlug = `price-${approvalId}`;
    const t = nowYmdHms();
    const actor = input.updated_by ?? 'You';
    const project = getProjectBySlug(unit.projectSlug);

    const historyId = nextHistoryId();
    const historyRow: PricingHistoryRow = {
        id: historyId,
        projectSlug: unit.projectSlug,
        unitSlug: unit.slug,
        unitNumber: unit.unit_number,
        oldBase: unit.price,
        newBase: base,
        oldOffer: unit.offer_price,
        newOffer: offer,
        discountPct: input.discount_pct,
        plcCharges: input.plc_charges,
        gstPct: input.gst_pct,
        finalPrice,
        effectiveFrom: input.effective_from,
        notes: input.notes,
        updatedBy: actor,
        at: t,
        status: 'pending',
        approvalSlug,
    };
    _pricingHistory = [historyRow, ..._pricingHistory];

    const approval: PriceUpdateApproval = {
        id: approvalId,
        slug: approvalSlug,
        unitSlug: unit.slug,
        requested_base_price: base,
        requested_offer_price: offer,
        status: 'pending',
        requested_at: t,
        history_row_id: historyId,
        discount_pct: input.discount_pct,
        plc_charges: input.plc_charges,
        gst_pct: input.gst_pct,
        final_price: finalPrice,
        effective_from: input.effective_from,
        notes: input.notes,
    };

    _approvals = [..._approvals, approval];

    if (project) {
        appendProjectActivity({
            projectSlug: project.slug,
            kind: 'approval_requested',
            message: `Price change requested for unit ${unit.unit_number}`,
            at: t,
            actor,
        });
    }

    return approval;
}

export function decidePriceApproval(approvalSlug: string, decision: 'approved' | 'rejected') {
    const approval = _approvals.find((a) => a.slug === approvalSlug);
    if (!approval) return undefined;

    const decidedAt = nowYmdHms();
    _approvals = _approvals.map((a) => (a.slug === approvalSlug ? { ...a, status: decision, decided_at: decidedAt } : a));

    const updated = _approvals.find((a) => a.slug === approvalSlug);

    if (approval.history_row_id) {
        _pricingHistory = _pricingHistory.map((h) =>
            h.id === approval.history_row_id ? { ...h, status: decision === 'approved' ? 'approved' : 'rejected', at: decidedAt } : h
        );
    }

    if (decision === 'approved' && updated?.status === 'approved') {
        const unit = getUnitBySlug(updated.unitSlug);
        if (unit) {
            _units = _units.map((u) =>
                u.slug === unit.slug
                    ? {
                          ...u,
                          price: updated.requested_base_price,
                          offer_price: updated.requested_offer_price,
                          plc_charges: updated.plc_charges ?? u.plc_charges,
                          gst_tax_percent: updated.gst_pct ?? u.gst_tax_percent,
                          updated_at: decidedAt,
                      }
                    : u
            );
            const p = getProjectBySlug(unit.projectSlug);
            if (p) {
                appendProjectActivity({
                    projectSlug: p.slug,
                    kind: 'price_changed',
                    message: `Approved new pricing for unit ${unit.unit_number}`,
                    at: decidedAt,
                    actor: 'You',
                });
                appendProjectActivity({
                    projectSlug: p.slug,
                    kind: 'approval_completed',
                    message: `Price approval completed for unit ${unit.unit_number}`,
                    at: decidedAt,
                    actor: 'You',
                });
            }
        }
    } else if (decision === 'rejected') {
        const rejUnit = getUnitBySlug(approval.unitSlug);
        if (rejUnit) {
            const p = getProjectBySlug(rejUnit.projectSlug);
            if (p) {
                appendProjectActivity({
                    projectSlug: p.slug,
                    kind: 'approval_completed',
                    message: `Price change rejected for unit ${rejUnit.unit_number}`,
                    at: decidedAt,
                    actor: 'You',
                });
            }
        }
    }

    return updated;
}

/** Apply pricing immediately (demo enterprise bypass). */
export function applyDirectUnitPricing(unitSlug: string, input: PriceUpdateRequestInput) {
    if (!canUpdatePricingDirectly()) return undefined;
    const unit = getUnitBySlug(unitSlug);
    if (!unit) return undefined;
    const base = Number(input.base_price);
    if (!Number.isFinite(base) || base <= 0) return undefined;
    const offer = input.offer_price;
    if (offer !== undefined && (!Number.isFinite(offer) || offer > base)) return undefined;

    const t = nowYmdHms();
    const actor = input.updated_by ?? 'You';
    const finalPrice = computeFinalUnitPrice({
        basePrice: base,
        offerPrice: offer,
        discountPct: input.discount_pct,
        plcCharges: input.plc_charges,
        gstPct: input.gst_pct,
    });

    const historyRow: PricingHistoryRow = {
        id: nextHistoryId(),
        projectSlug: unit.projectSlug,
        unitSlug: unit.slug,
        unitNumber: unit.unit_number,
        oldBase: unit.price,
        newBase: base,
        oldOffer: unit.offer_price,
        newOffer: offer,
        discountPct: input.discount_pct,
        plcCharges: input.plc_charges,
        gstPct: input.gst_pct,
        finalPrice,
        effectiveFrom: input.effective_from,
        notes: input.notes,
        updatedBy: actor,
        at: t,
        status: 'direct',
    };
    _pricingHistory = [historyRow, ..._pricingHistory];

    _units = _units.map((u) =>
        u.slug === unit.slug
            ? {
                  ...u,
                  price: base,
                  offer_price: offer,
                  plc_charges: input.plc_charges ?? u.plc_charges,
                  gst_tax_percent: input.gst_pct ?? u.gst_tax_percent,
                  updated_at: t,
              }
            : u
    );

    const p = getProjectBySlug(unit.projectSlug);
    if (p) {
        appendProjectActivity({
            projectSlug: p.slug,
            kind: 'price_changed',
            message: `Price updated directly for unit ${unit.unit_number}`,
            at: t,
            actor,
        });
    }

    return getUnitBySlug(unit.slug);
}

export function getPriceApprovals() {
    return _approvals;
}

export function lockInventory(unitSlug: string, meta?: { locked_by_user?: string; lock_reason?: string; lock_expiry?: string }) {
    const unit = getUnitBySlug(unitSlug);
    if (!unit) return undefined;
    const key = unit.slug;
    const t = nowYmdHms();
    const activity = [
        ...(unit.lock_activity ?? []),
        { at: t, action: 'Locked', user: meta?.locked_by_user ?? 'You', note: meta?.lock_reason },
    ];
    _units = _units.map((u) =>
        u.slug === key
            ? {
                  ...u,
                  inventory_lock_status: true,
                  lock_timestamp: t,
                  unlock_timestamp: '',
                  locked_by_user: meta?.locked_by_user ?? 'You',
                  lock_reason: meta?.lock_reason ?? '',
                  lock_expiry: meta?.lock_expiry ?? '',
                  lock_activity: activity,
              }
            : u
    );
    return getUnitBySlug(key);
}

export function unlockInventory(unitSlug: string) {
    const unit = getUnitBySlug(unitSlug);
    if (!unit) return undefined;
    const key = unit.slug;
    const t = nowYmdHms();
    const activity = [...(unit.lock_activity ?? []), { at: t, action: 'Unlocked', user: 'You' }];
    _units = _units.map((u) =>
        u.slug === key
            ? { ...u, inventory_lock_status: false, unlock_timestamp: t, lock_activity: activity }
            : u
    );
    return getUnitBySlug(key);
}

/** Display helper: spec requires lock/unlock timestamps to exist; UI shows this until an event is recorded. */
export function formatInventorySyncTimestampDisplay(raw: string) {
    const t = (raw || '').trim();
    if (!t) return 'Not recorded yet';
    return t;
}

/** Dashboard: counts by availability + units locked for booking (double-booking prevention). */
export function getInventoryAggregateCounts() {
    const units = _units;
    return {
        available: units.filter((u) => u.availability_status === 'available').length,
        reserved: units.filter((u) => u.availability_status === 'reserved').length,
        sold: units.filter((u) => u.availability_status === 'sold').length,
        pending: units.filter((u) => u.availability_status === 'pending').length,
        lockedForBooking: units.filter((u) => u.inventory_lock_status).length,
        total: units.length,
    };
}

/** Analytics: leads whose `project` name matches this inventory project. */
export function getLeadDemandCountForProjectName(projectName: string) {
    return getLeads().filter((l) => l.project === projectName).length;
}

/** Demand score 0–100 from lead count vs portfolio size (deterministic demo formula). */
export function computeDemandScorePercent(leadCountForProject: number, totalProjects: number) {
    const denom = Math.max(1, totalProjects * 10);
    return Math.max(0, Math.min(100, Math.round((leadCountForProject / denom) * 100)));
}

export function getTotalLeadDemandCountAcrossProjects(projectNames: string[]) {
    const set = new Set(projectNames);
    return getLeads().filter((l) => set.has(l.project)).length;
}

export function formatCurrencyINR(amount: number) {
    // Simple formatter for demo (no precision requirements)
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    } catch {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

