'use client';

import type { InventoryUnit, Project, ProjectDocument, ProjectMediaGallery, ProjectType } from '@/lib/projectsInventoryStore';

/** Demo real-estate media URLs (Unsplash) — used when project has no uploaded gallery yet. */
const DEMO_MEDIA_BY_TYPE: Record<ProjectType, ProjectMediaGallery> = {
    Apartment: {
        cover_image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&q=80',
        project_banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1400&q=80',
        gallery_images: [
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2e93688?w=800&q=80',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        ],
        walkthrough_video: 'https://www.youtube.com/watch?v=demo-walkthrough',
        master_plan: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80',
        floor_plan_pdf: 'skyline-residency-floor-plan.pdf',
    },
    Villa: {
        cover_image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80',
        project_banner: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80',
        gallery_images: [
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
            'https://images.unsplash.com/photo-1600047509807-ba889080e659?w=800&q=80',
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        ],
        walkthrough_video: 'https://www.youtube.com/watch?v=demo-villa-tour',
        master_plan: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80',
        floor_plan_pdf: 'villa-master-layout.pdf',
    },
    Plot: {
        cover_image: 'https://images.unsplash.com/photo-1500382017468-90403fed947d?w=1200&q=80',
        project_banner: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1400&q=80',
        gallery_images: [
            'https://images.unsplash.com/photo-1500382017468-90403fed947d?w=800&q=80',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80',
            'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
            'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80',
        ],
        walkthrough_video: 'https://www.youtube.com/watch?v=demo-site-visit',
        master_plan: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&q=80',
        floor_plan_pdf: 'plot-layout-master.pdf',
    },
};

export function defaultProjectMediaGallery(project: Pick<Project, 'project_type' | 'media_gallery' | 'project_name'>): ProjectMediaGallery {
    const existing = project.media_gallery;
    if (existing?.cover_image?.trim() && (existing.gallery_images?.length ?? 0) > 0) {
        return existing;
    }
    const base = DEMO_MEDIA_BY_TYPE[project.project_type] ?? DEMO_MEDIA_BY_TYPE.Apartment;
    return {
        ...base,
        ...existing,
        gallery_images: existing?.gallery_images?.length ? existing.gallery_images : base.gallery_images,
        cover_image: existing?.cover_image?.trim() ? existing.cover_image : base.cover_image,
        project_banner: existing?.project_banner?.trim() ? existing.project_banner : base.project_banner,
    };
}

export function isImageMediaUrl(url: string) {
    const u = url.trim().toLowerCase();
    if (u.startsWith('data:image/')) return true;
    if (u.startsWith('blob:')) return true;
    return (
        u.startsWith('http') &&
        (u.includes('.jpg') ||
            u.includes('.jpeg') ||
            u.includes('.png') ||
            u.includes('.webp') ||
            u.includes('unsplash.com') ||
            u.includes('images.'))
    );
}

export function isVideoMediaUrl(url: string) {
    const u = url.trim().toLowerCase();
    if (u.startsWith('data:video/')) return true;
    return (
        u.includes('youtube.com') ||
        u.includes('youtu.be') ||
        u.includes('vimeo.com') ||
        u.includes('.mp4') ||
        u.includes('.webm') ||
        u.includes('.mov')
    );
}

export function isPdfMediaRef(url: string) {
    const u = url.trim().toLowerCase();
    if (u.startsWith('data:application/pdf')) return true;
    return u.endsWith('.pdf') || u.includes('.pdf?');
}

/** Enterprise inventory workflow statuses */
export type InventoryWorkflowStatus =
    | 'Available'
    | 'Reserved'
    | 'Blocked'
    | 'Token Paid'
    | 'Booked'
    | 'Registered'
    | 'Possession Given'
    | 'Cancelled';

export const INVENTORY_WORKFLOW_STATUSES: InventoryWorkflowStatus[] = [
    'Available',
    'Reserved',
    'Blocked',
    'Token Paid',
    'Booked',
    'Registered',
    'Possession Given',
    'Cancelled',
];

export type DocumentLifecycleStatus = 'Active' | 'Expiring' | 'Expired' | 'Missing';

export type ProjectAmenityKey =
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
    | 'indoor_games';

export const PROJECT_AMENITY_LABELS: Record<ProjectAmenityKey, string> = {
    swimming_pool: 'Swimming Pool',
    clubhouse: 'Clubhouse',
    gym: 'Gym',
    power_backup: 'Power Backup',
    security: 'Security',
    cctv: 'CCTV',
    lift: 'Lift',
    ev_charging: 'EV Charging',
    visitor_parking: 'Visitor Parking',
    park: 'Park',
    indoor_games: 'Indoor Games',
};

export interface ProjectPricingMaster {
    base_price?: number;
    offer_price?: number;
    plc_charges?: number;
    gst_pct?: number;
    registration_charges?: number;
    floor_rise_charges?: number;
    clubhouse_charges?: number;
    parking_charges?: number;
    maintenance_charges?: number;
    discount_rules?: string;
    construction_linked_plan?: boolean;
    down_payment_plan?: boolean;
    flexi_plan?: boolean;
    custom_installments?: boolean;
}

export interface PricingInstallmentRow {
    id: string;
    name: string;
    due_date: string;
    percentage: number;
    amount: number;
    trigger_event: string;
}

export interface PricingDiscountRow {
    id: string;
    type: 'Campaign Discount' | 'Festival Offer' | 'Broker Offer' | 'Corporate Discount';
    value: string;
    active: boolean;
}

export interface UnitPriceBreakdown {
    base_price: number;
    plc_charges: number;
    floor_rise_charges: number;
    gst: number;
    registration_charges: number;
    parking_charges: number;
    clubhouse_charges: number;
    discount: number;
    final_sale_value: number;
}

export function computeUnitPriceBreakdown(unit: InventoryUnit): UnitPriceBreakdown {
    const base = Math.max(0, unit.price ?? 0);
    const plc = Math.max(0, unit.plc_charges ?? 0);
    const floorRise = Math.max(0, unit.floor_rise_charges ?? 0);
    const parking = Math.max(0, unit.parking_charges ?? 0);
    const clubhouse = Math.max(0, unit.clubhouse_charges ?? 0);
    const registration = Math.max(0, unit.registration_charges ?? 0);
    const offer = unit.offer_price ?? base;
    const discount = Math.max(0, base - offer);
    const subtotal = offer + plc + floorRise + parking + clubhouse + registration;
    const gstPct = unit.gst_tax_percent ?? 0;
    const gst = Math.round(subtotal * (gstPct / 100));
    const final = Math.round(subtotal + gst);
    return {
        base_price: base,
        plc_charges: plc,
        floor_rise_charges: floorRise,
        gst,
        registration_charges: registration,
        parking_charges: parking,
        clubhouse_charges: clubhouse,
        discount,
        final_sale_value: final,
    };
}

export function getDocumentLifecycleStatus(doc: ProjectDocument): DocumentLifecycleStatus {
    if (!doc.expiryDate?.trim()) return 'Active';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(doc.expiryDate);
    if (Number.isNaN(expiry.getTime())) return 'Active';
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Expired';
    if (diffDays <= 30) return 'Expiring';
    return 'Active';
}

export function defaultProjectEnterpriseFields(project: Project): Partial<Project> {
    const isResidential = project.project_type !== 'Plot';
    return {
        project_category: project.project_category ?? (isResidential ? 'Residential' : 'Residential'),
        development_type: project.development_type ?? (project.project_type === 'Villa' ? 'Villa' : project.project_type === 'Plot' ? 'Plotting' : 'Apartment'),
        property_type: project.property_type ?? 'High-rise',
        project_phase: project.project_phase ?? 'Phase 1',
        construction_type: project.construction_type ?? 'RCC Frame',
        rera_applicable: project.rera_applicable ?? true,
        launch_status: project.launch_status ?? 'Launched',
        possession_status: project.possession_status ?? 'Under Construction',
        project_priority: project.project_priority ?? 'Medium',
        rera_number: project.rera_number ?? '',
        approval_authority: project.approval_authority ?? 'Local Development Authority',
        approval_number: project.approval_number ?? '',
        legal_status: project.legal_status ?? 'Clear Title',
        registration_status: project.registration_status ?? 'Registered',
        land_ownership_type: project.land_ownership_type ?? 'Freehold',
        legal_documents_note: project.legal_documents_note ?? '',
        approval_expiry_date: project.approval_expiry_date ?? '',
        amenities: project.amenities ?? {
            swimming_pool: true,
            clubhouse: true,
            gym: true,
            power_backup: true,
            security: true,
            cctv: true,
            lift: isResidential,
            ev_charging: false,
            visitor_parking: true,
            park: true,
            indoor_games: false,
        },
        construction_status: project.construction_status ?? {
            excavation_pct: 100,
            structure_pct: 72,
            plumbing_pct: 45,
            electrical_pct: 38,
            finishing_pct: 18,
            completion_pct: 42,
            last_site_update: new Date().toISOString().slice(0, 10),
        },
        sales_insights: project.sales_insights ?? {
            leads_count: 0,
            booking_count: 0,
            conversion_pct: 0,
            revenue_generated: 0,
            unsold_inventory: project.total_units,
            top_selling_configuration: '2 BHK',
        },
        portal_settings: project.portal_settings ?? {
            customer_portal_enabled: true,
            resident_portal_enabled: true,
            visitor_access_enabled: false,
            online_booking_enabled: true,
        },
        media_gallery: defaultProjectMediaGallery(project),
    };
}

export function defaultUnitEnterpriseFields(unit: InventoryUnit): Partial<InventoryUnit> {
    const carpet = Math.round(unit.unit_size * 0.78);
    return {
        carpet_area: unit.carpet_area ?? carpet,
        built_up_area: unit.built_up_area ?? unit.unit_size,
        super_built_up_area: unit.super_built_up_area ?? Math.round(unit.unit_size * 1.15),
        balcony_area: unit.balcony_area ?? 80,
        terrace_area: unit.terrace_area ?? 0,
        uds_area: unit.uds_area ?? Math.round(unit.unit_size * 0.35),
        furnishing_status: unit.furnishing_status ?? 'Unfurnished',
        view_type: unit.view_type ?? 'City View',
        corner_unit: unit.corner_unit ?? false,
        balcony_count: unit.balcony_count ?? 2,
        washroom_count: unit.washroom_count ?? 2,
        smart_home_enabled: unit.smart_home_enabled ?? false,
        ventilation_rating: unit.ventilation_rating ?? 'Good',
        parking_type: unit.parking_type ?? 'Covered',
        parking_slot_number: unit.parking_slot_number ?? '',
        parking_covered_open: unit.parking_covered_open ?? 'Covered',
        parking_ev_charging: unit.parking_ev_charging ?? false,
        inventory_workflow_status: unit.inventory_workflow_status ?? mapAvailabilityToWorkflow(unit.availability_status),
        booking_customer: unit.booking_customer ?? '',
        booking_id: unit.booking_id ?? '',
        booking_status: unit.booking_status ?? '',
        lead_source: unit.lead_source ?? '',
        assigned_salesperson: unit.assigned_salesperson ?? '',
        floor_rise_charges: unit.floor_rise_charges ?? 0,
        registration_charges: unit.registration_charges ?? 150000,
        parking_charges: unit.parking_charges ?? 250000,
        clubhouse_charges: unit.clubhouse_charges ?? 100000,
        lock_reason: unit.lock_reason ?? '',
        locked_by_user: unit.locked_by_user ?? '',
        lock_expiry: unit.lock_expiry ?? '',
        auto_unlock: unit.auto_unlock ?? true,
        lock_activity: unit.lock_activity ?? [],
        unit_documents: unit.unit_documents ?? [],
        demand_trend: unit.demand_trend ?? [42, 48, 55, 61, 58, 67],
        booking_prediction_pct: unit.booking_prediction_pct ?? 68,
        pricing_recommendation: unit.pricing_recommendation ?? '',
        fastest_selling_unit_type: unit.fastest_selling_unit_type ?? unit.configuration,
    };
}

function mapAvailabilityToWorkflow(status: InventoryUnit['availability_status']): InventoryWorkflowStatus {
    switch (status) {
        case 'available':
            return 'Available';
        case 'reserved':
            return 'Reserved';
        case 'sold':
            return 'Booked';
        case 'pending':
            return 'Blocked';
        default:
            return 'Available';
    }
}

export function enrichProjectWithDefaults(project: Project): Project {
    return { ...project, ...defaultProjectEnterpriseFields(project) };
}

export function enrichUnitWithDefaults(unit: InventoryUnit): InventoryUnit {
    return { ...unit, ...defaultUnitEnterpriseFields(unit) };
}

export function computeSalesInsightsForProject(project: Project, units: InventoryUnit[]): Project['sales_insights'] {
    const projectUnits = units.filter((u) => u.projectSlug === project.slug);
    const booked = projectUnits.filter((u) => u.availability_status === 'sold').length;
    const leads = project.sales_insights?.leads_count ?? 24;
    const conversion = leads > 0 ? Math.round((booked / leads) * 100) : 0;
    const revenue = projectUnits
        .filter((u) => u.availability_status === 'sold')
        .reduce((sum, u) => sum + (u.offer_price ?? u.price), 0);
    const configCounts = new Map<string, number>();
    for (const u of projectUnits.filter((x) => x.availability_status === 'sold')) {
        configCounts.set(u.configuration, (configCounts.get(u.configuration) ?? 0) + 1);
    }
    let topConfig = '2 BHK';
    let max = 0;
    configCounts.forEach((count, cfg) => {
        if (count > max) {
            max = count;
            topConfig = cfg;
        }
    });
    return {
        leads_count: leads,
        booking_count: booked,
        conversion_pct: conversion,
        revenue_generated: revenue,
        unsold_inventory: projectUnits.filter((u) => u.availability_status !== 'sold').length,
        top_selling_configuration: topConfig,
    };
}

export function defaultPricingMasterForProject(project: Project): ProjectPricingMaster {
    return {
        base_price: project.starting_price ?? 6500000,
        offer_price: project.starting_price ? Math.round(project.starting_price * 0.97) : undefined,
        plc_charges: 75000,
        gst_pct: 5,
        registration_charges: 150000,
        floor_rise_charges: 50000,
        clubhouse_charges: 100000,
        parking_charges: 250000,
        maintenance_charges: 4500,
        discount_rules: 'Max 5% without approval; broker offers require manager sign-off.',
        construction_linked_plan: true,
        down_payment_plan: true,
        flexi_plan: false,
        custom_installments: true,
    };
}

export function defaultInstallmentSchedule(basePrice: number): PricingInstallmentRow[] {
    return [
        { id: 'i1', name: 'Booking Amount', due_date: 'On Booking', percentage: 10, amount: Math.round(basePrice * 0.1), trigger_event: 'Booking' },
        { id: 'i2', name: 'Agreement', due_date: 'Within 30 days', percentage: 15, amount: Math.round(basePrice * 0.15), trigger_event: 'Agreement Signed' },
        { id: 'i3', name: 'Foundation', due_date: 'On slab completion', percentage: 20, amount: Math.round(basePrice * 0.2), trigger_event: 'Construction Milestone' },
        { id: 'i4', name: 'Structure', due_date: 'On structure completion', percentage: 25, amount: Math.round(basePrice * 0.25), trigger_event: 'Construction Milestone' },
        { id: 'i5', name: 'Possession', due_date: 'On handover', percentage: 30, amount: Math.round(basePrice * 0.3), trigger_event: 'Possession' },
    ];
}

export function defaultDiscountRows(): PricingDiscountRow[] {
    return [
        { id: 'd1', type: 'Campaign Discount', value: '3% off on select units', active: true },
        { id: 'd2', type: 'Festival Offer', value: 'Waive PLC on corner units', active: false },
        { id: 'd3', type: 'Broker Offer', value: '1% broker incentive', active: true },
        { id: 'd4', type: 'Corporate Discount', value: '2% for corporate tie-ups', active: false },
    ];
}
