import type { AssignedMatrixUser, AuditMatrixEntry, MatrixModule, MatrixRole, PermissionId } from './types';

/**
 * Platform default roles (access matrix columns).
 * Includes legacy platform seed roles plus client-aligned org roles (all kept).
 */
const SEED_MATRIX_ROLE_DEFS: Omit<MatrixRole, 'id'>[] = [
    // —— Platform (legacy) ——
    {
        name: 'Super Admin',
        description: 'Platform super administrator — full cross-tenant access',
        category: 'Platform',
        accessScope: 'Global',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Tenant Admin',
        description: 'Tenant administrator — org configuration and user management',
        category: 'Platform',
        accessScope: 'Global',
        isSystem: true,
        status: 'Active',
    },
    // —— Client-aligned org roles ——
    {
        name: 'Org Admin',
        description: 'Organization administrator — tenant setup, users, and full module access',
        category: 'Administration',
        accessScope: 'Global',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Sales Manager',
        description: 'Sales leadership — pipeline, bookings, pricing approvals, and team oversight',
        category: 'Sales',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Sales Exec',
        description: 'Sales executive — leads, customers, site visits, and booking execution',
        category: 'Sales',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Finance',
        description: 'Finance — payments, invoices, reconciliation, and accounting exports',
        category: 'Finance',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Ops Manager',
        description: 'Operations — projects, inventory, procurement, work orders, and vendors',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Support',
        description: 'Customer support — tickets, service requests, and resident communications',
        category: 'Support',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Customer',
        description: 'Buyer / customer portal — bookings, documents, and payment links (limited)',
        category: 'External',
        accessScope: 'Limited',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Resident',
        description: 'Resident portal — notices, amenities, lease documents, and community',
        category: 'External',
        accessScope: 'Limited',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Vendor',
        description: 'Vendor portal — work orders, invoices, compliance uploads, and messaging',
        category: 'Partner',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Broker',
        description: 'Broker / channel partner — leads, inventory visibility, and booking assist',
        category: 'Partner',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    // —— Operations & specialty (legacy) ——
    {
        name: 'Procurement Manager',
        description: 'Procurement — PR/PO, vendor selection, and approval workflows',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Finance Manager',
        description: 'Finance management — approvals, reconciliation, and reporting',
        category: 'Finance',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Vendor Coordinator',
        description: 'Vendor coordination — onboarding, assignments, and compliance',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Inventory Manager',
        description: 'Inventory — stock, consumption, pricing, and availability',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Project Manager',
        description: 'Project delivery — setup, phases, milestones, and collaboration',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Service Manager',
        description: 'Service operations — SLAs, integrations, and resolution tracking',
        category: 'Operations',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Compliance Officer',
        description: 'Compliance — contracts, licenses, insurance, and audit trails',
        category: 'Compliance',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Vendor User',
        description: 'Vendor portal user — limited vendor-facing modules',
        category: 'Partner',
        accessScope: 'Limited',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Leadership',
        description: 'Executive leadership — dashboards, analytics, and read-heavy oversight',
        category: 'Leadership',
        accessScope: 'Global',
        isSystem: true,
        status: 'Active',
    },
    {
        name: 'Service Representative',
        description: 'Front-line service — tickets, resident support, and work updates',
        category: 'Support',
        accessScope: 'Tenant',
        isSystem: true,
        status: 'Active',
    },
];

/** Fast lookup for default (seed) role names. */
export const DEFAULT_ROLE_NAME_SET = new Set<string>(SEED_MATRIX_ROLE_DEFS.map((r) => r.name));

/** @deprecated Use {@link DEFAULT_ROLE_NAME_SET} or {@link isDefaultMatrixRole}. */
export const DEFAULT_ROLE_NAMES: string[] = [...DEFAULT_ROLE_NAME_SET];

/** True for platform seed roles (from {@link buildDefaultRoles}). */
export function isDefaultMatrixRole(role: Pick<MatrixRole, 'name' | 'isSystem'>): boolean {
    if (role.isSystem === true) return true;
    if (role.isSystem === false) return false;
    return DEFAULT_ROLE_NAME_SET.has(role.name);
}

/**
 * Client-aligned modules & features (access matrix).
 * IDs are stable keys for saved matrix state; labels match the client spec wording.
 */
export const MATRIX_MODULES: MatrixModule[] = [
    // Match platform navigation flow (sidebar-like ordering)
    {
        id: 'projects-setup',
        title: 'Project Setup',
        features: [
            { id: 'projects-create', label: 'Create projects' },
            { id: 'projects-phases-milestones', label: 'Phases & milestones' },
            { id: 'projects-units-inventory-setup', label: 'Unit / inventory setup' },
            { id: 'projects-collaboration', label: 'Internal collaboration' },
        ],
    },
    {
        id: 'inventory-pricing',
        title: 'Inventory & Pricing',
        features: [
            { id: 'invp-units-availability', label: 'Unit availability' },
            { id: 'invp-pricing-management', label: 'Pricing management' },
            { id: 'invp-discounts-offers', label: 'Discounts & offers' },
            { id: 'invp-price-approvals', label: 'Price approvals' },
            { id: 'invp-exports', label: 'Exports' },
        ],
    },
    {
        id: 'visual-mapping',
        title: 'Visual Mapping',
        features: [
            { id: 'vmap-floor-plans', label: 'Floor plans' },
            { id: 'vmap-unit-map', label: 'Unit map & selection' },
            { id: 'vmap-annotations', label: 'Annotations & tags' },
            { id: 'vmap-publish', label: 'Publish / share views' },
        ],
    },
    {
        id: 'leads',
        title: 'Leads',
        features: [
            { id: 'leads-create-capture', label: 'Create / capture leads' },
            { id: 'leads-qualification-routing', label: 'Qualification & routing' },
            { id: 'leads-status-pipeline', label: 'Pipeline & status management' },
            { id: 'leads-assignments', label: 'Owner assignment' },
            { id: 'leads-import-export', label: 'Import / export' },
        ],
    },
    {
        id: 'lead-intelligence',
        title: 'Lead Intelligence',
        features: [
            { id: 'leadintel-scoring', label: 'AI scoring & prioritization' },
            { id: 'leadintel-recommendations', label: 'Recommendations & next best action' },
            { id: 'leadintel-insights', label: 'Insights & intent signals' },
            { id: 'leadintel-automation', label: 'Automation triggers' },
        ],
    },
    {
        id: 'ai-demand-intelligence',
        title: 'AI Demand Intelligence',
        features: [
            { id: 'demandintel-market-signals', label: 'Market signals' },
            { id: 'demandintel-demand-forecast', label: 'Demand forecasting' },
            { id: 'demandintel-segmentation', label: 'Segmentation & cohorts' },
            { id: 'demandintel-reports', label: 'Dashboards & reports' },
        ],
    },
    {
        id: 'customers',
        title: 'Customers',
        features: [
            { id: 'customers-create-manage', label: 'Create & manage customers' },
            { id: 'customers-profile-summary', label: 'Customer summary & profile' },
            { id: 'customers-documents', label: 'Customer documents' },
            { id: 'customers-status-health', label: 'Status & relationship health' },
            { id: 'customers-import-export', label: 'Import / export' },
        ],
    },
    {
        id: 'residents',
        title: 'Residents',
        features: [
            { id: 'residents-directory', label: 'Resident directory' },
            { id: 'residents-onboarding', label: 'Onboarding & profiles' },
            { id: 'residents-notices', label: 'Notices & communications' },
            { id: 'residents-documents', label: 'Resident documents' },
            { id: 'residents-exports', label: 'Exports' },
        ],
    },
    {
        id: 'bookings',
        title: 'Bookings',
        features: [
            { id: 'bookings-create', label: 'Create bookings' },
            { id: 'bookings-schedule-visits', label: 'Schedule visits / meetings' },
            { id: 'bookings-status', label: 'Booking status tracking' },
            { id: 'bookings-documents', label: 'Booking documents' },
            { id: 'bookings-cancellation', label: 'Cancellation & refunds (workflow)' },
        ],
    },
    {
        id: 'payments',
        title: 'Payments',
        features: [
            { id: 'payments-tracking', label: 'Payment tracking' },
            { id: 'payments-receipts', label: 'Receipts & reconciliation' },
            { id: 'payments-schedules', label: 'Payment schedules' },
            { id: 'payments-status', label: 'Payment status & reminders' },
        ],
    },
    {
        id: 'payment-links',
        title: 'Payment Links',
        features: [
            { id: 'paylinks-create', label: 'Create payment links' },
            { id: 'paylinks-share', label: 'Share via email / WhatsApp' },
            { id: 'paylinks-expiry', label: 'Expiry & access control' },
            { id: 'paylinks-tracking', label: 'Tracking & status' },
        ],
    },
    {
        id: 'booking-payment-ai',
        title: 'Booking & Payment AI',
        features: [
            { id: 'bpai-followups', label: 'AI follow-ups & nudges' },
            { id: 'bpai-risk-flags', label: 'Risk flags & anomaly detection' },
            { id: 'bpai-summaries', label: 'AI summaries & notes' },
        ],
    },
    {
        id: 'document-management',
        title: 'Document Management',
        features: [
            { id: 'docs-upload', label: 'Upload & organize documents' },
            { id: 'docs-templates', label: 'Templates' },
            { id: 'docs-sharing', label: 'Sharing & permissions' },
            { id: 'docs-retention', label: 'Retention & lifecycle' },
        ],
    },
    {
        id: 'e-sign',
        title: 'e-Sign',
        features: [
            { id: 'esign-create', label: 'Create signature requests' },
            { id: 'esign-signer-routing', label: 'Signer routing' },
            { id: 'esign-status', label: 'Status tracking' },
            { id: 'esign-audit', label: 'Signature audit trail' },
        ],
    },
    {
        id: 'procurement',
        title: 'Purchase & Procurement',
        features: [
            { id: 'procurement-pr', label: 'Purchase requests (PR)' },
            { id: 'procurement-po', label: 'Purchase orders (PO)' },
            { id: 'procurement-approval-workflow', label: 'Approval workflow' },
            { id: 'procurement-vendor-selection', label: 'Vendor selection' },
            { id: 'procurement-order-tracking', label: 'Order tracking' },
        ],
    },
    {
        id: 'work-order-mgmt',
        title: 'Work Order Management',
        features: [
            { id: 'wo-creation', label: 'Work order creation' },
            { id: 'wo-vendor-assignment', label: 'Vendor assignment' },
            { id: 'wo-scope-timeline', label: 'Scope & timeline tracking' },
            { id: 'wo-status-tracking', label: 'Status tracking' },
            { id: 'wo-documents-photos', label: 'Document & photo upload' },
        ],
    },
    {
        id: 'invoice-payment',
        title: 'Invoice & Payment Tracking',
        features: [
            { id: 'inv-vendor-upload', label: 'Vendor invoice upload' },
            { id: 'inv-validation', label: 'Invoice validation' },
            { id: 'inv-payment-status', label: 'Payment status tracking' },
            { id: 'inv-accounting-export', label: 'Accounting export' },
        ],
    },
    {
        id: 'vendor-mgmt',
        title: 'Vendor Management',
        features: [
            { id: 'vendor-onboarding', label: 'Vendor onboarding' },
            { id: 'vendor-kyc-verification', label: 'Vendor KYC verification' },
            { id: 'vendor-categorization', label: 'Vendor categorization' },
            { id: 'vendor-status-management', label: 'Vendor status management' },
            { id: 'vendor-contract-management', label: 'Contract management' },
        ],
    },
    {
        id: 'supplier-mgmt',
        title: 'Supplier Management',
        features: [
            { id: 'supplier-onboarding', label: 'Supplier onboarding' },
            { id: 'supplier-material-mapping', label: 'Material mapping' },
            { id: 'supplier-rate-card', label: 'Rate card management' },
            { id: 'supplier-capacity-tracking', label: 'Supply capacity tracking' },
        ],
    },
    {
        id: 'compliance-documentation',
        title: 'Compliance & Documentation',
        features: [
            { id: 'comp-contracts', label: 'Contracts' },
            { id: 'comp-licenses', label: 'Licenses' },
            { id: 'comp-insurance-docs', label: 'Insurance documents' },
            { id: 'comp-expiry-alerts', label: 'Expiry alerts' },
        ],
    },
    {
        id: 'vendor-communication',
        title: 'Vendor Communication Hub',
        features: [
            { id: 'vcomm-in-app-messaging', label: 'In-app messaging' },
            { id: 'vcomm-notifications', label: 'Notifications' },
            { id: 'vcomm-work-updates', label: 'Work updates' },
        ],
    },
    {
        id: 'vendor-analytics',
        title: 'Vendor Analytics Dashboard',
        features: [
            { id: 'vanalytics-active-vendors', label: 'Active vendors' },
            { id: 'vanalytics-cost-by-vendor', label: 'Cost by vendor' },
            { id: 'vanalytics-performance-score', label: 'Performance score' },
            { id: 'vanalytics-pending-payments', label: 'Pending payments' },
            { id: 'vanalytics-work-completion-rate', label: 'Work completion rate' },
        ],
    },
    {
        id: 'service-integration',
        title: 'Service Integration',
        features: [
            { id: 'svc-auto-vendor-assignment', label: 'Auto vendor assignment' },
            { id: 'svc-resolution-tracking', label: 'Resolution tracking' },
        ],
    },
    {
        id: 'sla-performance',
        title: 'SLA & Performance',
        features: [
            { id: 'sla-definition', label: 'SLA definition' },
            { id: 'sla-task-completion', label: 'Task completion tracking' },
            { id: 'sla-delay-tracking', label: 'Delay tracking' },
            { id: 'sla-vendor-rating', label: 'Vendor rating system' },
            { id: 'sla-poor-performer', label: 'Poor performer flagging' },
        ],
    },
    {
        id: 'inventory-consumption',
        title: 'Inventory Consumption',
        features: [
            { id: 'invc-material-issue', label: 'Material issue tracking' },
            { id: 'invc-consumption-logs', label: 'Consumption logs' },
            { id: 'invc-waste-tracking', label: 'Waste tracking' },
            { id: 'invc-inventory-linkage', label: 'Inventory linkage' },
        ],
    },
    {
        id: 'audit-activity',
        title: 'Audit & Activity',
        features: [
            { id: 'audit-history-logs', label: 'History logs' },
            { id: 'audit-activity-stream', label: 'Activity stream' },
            { id: 'audit-exports', label: 'Audit exports' },
            { id: 'audit-retention', label: 'Retention policy' },
        ],
    },
    {
        id: 'records-management',
        title: 'Records Management',
        features: [
            { id: 'records-delete', label: 'Delete records' },
            { id: 'records-restore', label: 'Restore (soft-delete)' },
            { id: 'records-purge', label: 'Purge (hard-delete)' },
            { id: 'records-access-requests', label: 'Access requests (privacy)' },
        ],
    },
];

export function buildDefaultRoles(): MatrixRole[] {
    return SEED_MATRIX_ROLE_DEFS.map((def, i) => ({
        id: `role-${i + 1}`,
        ...def,
    }));
}

function pick(featureIdx: number, roleIdx: number): PermissionId {
    if (roleIdx === 0) return 'CRUD';
    if (roleIdx === 1) return featureIdx % 2 === 0 ? 'CRUD' : 'Edit';
    const presets: PermissionId[] = ['View', 'Create', 'Edit', 'CRUD', 'No Access'];
    return presets[(featureIdx * 3 + roleIdx * 2) % presets.length] ?? 'View';
}

export function buildInitialMatrix(roleIds: string[]): Record<string, Record<string, PermissionId>> {
    const rows: Record<string, Record<string, PermissionId>> = {};
    let r = 0;
    for (const mod of MATRIX_MODULES) {
        for (const f of mod.features) {
            rows[f.id] = {};
            roleIds.forEach((rid, j) => {
                rows[f.id][rid] = pick(r, j);
            });
            r += 1;
        }
    }
    return rows;
}

export function seedUsersByRole(roleIds: string[]): Record<string, AssignedMatrixUser[]> {
    const deptByRoleId = Object.fromEntries(
        buildDefaultRoles().map((r) => [r.id, r.category ?? 'Operations']),
    ) as Record<string, string>;
    const mk = (id: string, name: string, dept: string, status: AssignedMatrixUser['status'], last: string): AssignedMatrixUser => ({
        id,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@mysft.demo`,
        department: dept,
        status,
        lastActive: last,
    });
    const out: Record<string, AssignedMatrixUser[]> = {};
    for (const rid of roleIds) {
        const dept = deptByRoleId[rid] ?? 'Operations';
        out[rid] = [
            mk(`${rid}-u1`, 'Alex Morgan', dept, 'Active', '2h ago'),
            mk(`${rid}-u2`, 'Priya Shah', dept, 'Active', 'Yesterday'),
        ];
    }
    return out;
}

export const SEED_AUDIT: AuditMatrixEntry[] = [
    {
        id: 'a1',
        at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        actor: 'Jordan Lee',
        action: 'Permission changed',
        previousValue: 'Procurement Manager / Purchase requests (PR) → Edit',
        updatedValue: 'Procurement Manager / Purchase requests (PR) → CRUD',
    },
    {
        id: 'a2',
        at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        actor: 'Sam Rivera',
        action: 'User assigned',
        previousValue: 'Finance Manager — (empty)',
        updatedValue: 'Finance Manager — Taylor Kim',
    },
    {
        id: 'a3',
        at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        actor: 'System',
        action: 'Role created',
        previousValue: '—',
        updatedValue: 'Broker',
    },
    {
        id: 'a4',
        at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
        actor: 'Morgan Patel',
        action: 'Access updated',
        previousValue: 'Vendor User / Vendor KYC verification → View',
        updatedValue: 'Vendor User / Vendor KYC verification → Edit',
    },
];
