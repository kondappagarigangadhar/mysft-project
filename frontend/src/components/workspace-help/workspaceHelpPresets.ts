import type { WorkspaceHelpContent } from '@/components/workspace-help/types';

/** Tenant (platform organization) master workspace — company onboarding & access. */
export const TENANT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Tenant Workspace',
    subtitle: 'Company master workspace',
    purpose:
        'This workspace manages company onboarding, subscription access, admin contacts, users, and connected business operations within mySFT.',
    features: [
        'Organization profile & contacts',
        'Subscription & workspace settings',
        'Company users & permissions',
        'Related projects & vendors',
        'Documents & history tracking',
    ],
    workflow: [
        'Create tenant/company',
        'Configure subscription access',
        'Assign admin users',
        'Enable operational modules',
        'Manage related workspace data',
    ],
    tips: [
        'Use inline Edit to update fields',
        'History tab tracks workspace changes',
        'Documents tab stores agreements/licenses',
        'AI Copilot provides contextual suggestions',
    ],
};

/** Lead CRM workspace — pipeline, follow-ups, and conversion. */
export const LEAD_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Lead Workspace',
    subtitle: 'Sales pipeline workspace',
    purpose:
        'This workspace manages prospect capture, qualification, follow-ups, site visits, and conversion through your sales pipeline within mySFT.',
    features: [
        'Lead profile & contact details',
        'Follow-up tasks & reminders',
        'Site visit scheduling & outcomes',
        'Conversion & booking handoff',
        'Notes, activity & assignment tracking',
    ],
    workflow: [
        'Capture or import lead',
        'Qualify and update pipeline stage',
        'Schedule follow-ups and site visits',
        'Log notes and activity',
        'Convert to customer when ready',
    ],
    tips: [
        'Use Edit on the toolbar for inline overview updates',
        'Follow-up tab manages tasks and next actions',
        'AI Copilot suggests next best contact times',
        'Activity tab shows the full audit trail',
    ],
};

export const CUSTOMER_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Customer Workspace',
    subtitle: 'Buyer portal workspace',
    purpose:
        'This workspace manages converted buyers and customers — bookings, payments, documents, project updates, and portal journey tracking within mySFT.',
    features: [
        'Customer summary & contact details',
        'Booking and payment history',
        'Documents and agreements',
        'Project updates & journey timeline',
        'History & audit trail',
    ],
    workflow: [
        'Create or convert from lead/booking',
        'Confirm unit allocation and booking',
        'Track payments and milestones',
        'Share documents and project updates',
        'Review history for compliance',
    ],
    tips: [
        'Use Edit for inline overview changes',
        'Payments tab links to ledger records',
        'Documents tab stores buyer agreements',
        'AI insights support retention and collections',
    ],
};

export const PROJECT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Project Workspace',
    subtitle: 'Project setup & inventory',
    purpose:
        'This workspace manages project master data, inventory units, pricing, visual mapping, and rollout configuration for developments within mySFT.',
    features: [
        'Project profile & location',
        'Inventory units & availability',
        'Pricing and payment plans',
        'Visual mapping & layouts',
        'Documents and compliance links',
    ],
    workflow: [
        'Create project and baseline metadata',
        'Configure inventory and unit types',
        'Set pricing and installment rules',
        'Map towers/floors visually',
        'Publish for sales and booking teams',
    ],
    tips: [
        'Use Edit to update project overview inline',
        'Inventory tab tracks unit status',
        'Export supports offline reviews',
        'Link bookings from sales workflows',
    ],
};

export const BOOKING_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Booking Workspace',
    subtitle: 'Unit booking & schedule',
    purpose:
        'This workspace manages customer bookings, installment schedules, payment milestones, and collection status for sold units within mySFT.',
    features: [
        'Booking overview & customer link',
        'Installment plan & milestones',
        'Payments ledger integration',
        'Documents and receipts',
        'AI collection insights',
    ],
    workflow: [
        'Create booking from sales conversion',
        'Define payment plan and milestones',
        'Record payments against schedule',
        'Track outstanding and overdue amounts',
        'Close booking when fully paid',
    ],
    tips: [
        'Payments tab shows ledger-level detail',
        'Print/export for customer statements',
        'Clone supports similar unit bookings',
        'Use AI insights for reminder timing',
    ],
};

export const PAYMENT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Payment Workspace',
    subtitle: 'Ledger payment record',
    purpose:
        'This workspace shows a single payment receipt — amount, milestone, status, booking link, and audit fields for finance and collections.',
    features: [
        'Payment ID and receipt details',
        'Booking and milestone linkage',
        'Amount, date, and status',
        'Installment schedule context',
        'AI payment insights',
    ],
    workflow: [
        'Open from booking or payments list',
        'Verify amount and milestone',
        'Confirm status (completed/pending)',
        'Print or export receipt',
        'Return to booking for balance view',
    ],
    tips: [
        'Edit updates ledger fields',
        'Receipt card supports print/PDF',
        'Link back to parent booking for context',
        'AI flags anomalies and follow-ups',
    ],
};

export const DOCUMENT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Document Workspace',
    subtitle: 'Compliance & records',
    purpose:
        'This workspace manages document metadata, uploads, compliance status, expiry, and audit history for regulated real-estate records.',
    features: [
        'Document profile & classification',
        'File upload and versioning',
        'Compliance and expiry tracking',
        'Related entity references',
        'History and audit trail',
    ],
    workflow: [
        'Create document record',
        'Upload file and required metadata',
        'Validate compliance fields',
        'Monitor expiry and renewals',
        'Archive or update as needed',
    ],
    tips: [
        'Inline edit updates metadata quickly',
        'Export supports compliance packs',
        'Email shares document context',
        'Expired status triggers renewal workflows',
    ],
};

export const VENDOR_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Vendor Workspace',
    subtitle: 'Vendor master record',
    purpose:
        'This workspace manages vendor profiles, contracts, compliance, assignments, and operational links for procurement and projects.',
    features: [
        'Vendor profile & contacts',
        'Contracts and commercial terms',
        'Compliance and certifications',
        'Assignments and work orders',
        'Documents and activity history',
    ],
    workflow: [
        'Onboard vendor master record',
        'Upload compliance documents',
        'Link contracts and rate cards',
        'Assign to projects or POs',
        'Monitor performance and renewals',
    ],
    tips: [
        'Use Edit for inline profile updates',
        'Compliance tab tracks expiring certs',
        'Clone speeds similar vendor setup',
        'Export for audit and RFQ packs',
    ],
};

export const SUPPLIER_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Supplier Workspace',
    subtitle: 'Supply chain master',
    purpose:
        'This workspace manages supplier profiles, material catalogs, pricing, capacity, and compliance for procurement operations.',
    features: [
        'Supplier profile & contacts',
        'Material catalog linkage',
        'Pricing and capacity',
        'Compliance documentation',
        'Purchase request alignment',
    ],
    workflow: [
        'Register supplier',
        'Define materials and pricing',
        'Validate compliance documents',
        'Raise purchase requests/orders',
        'Track deliveries and invoices',
    ],
    tips: [
        'Edit updates master data inline',
        'Link PRs and POs from procurement',
        'Export for vendor comparison',
        'AI assists catalog and pricing review',
    ],
};

export const PURCHASE_REQUEST_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Purchase Request Workspace',
    subtitle: 'Procurement intake',
    purpose:
        'This workspace manages internal purchase requests — line items, approvals, vendor quotes, and conversion to purchase orders.',
    features: [
        'PR header & requester',
        'Line items and quantities',
        'Approval workflow status',
        'Vendor and project references',
        'History and attachments',
    ],
    workflow: [
        'Create purchase request',
        'Add line items and justification',
        'Submit for approval',
        'Select vendor quotes',
        'Convert to purchase order',
    ],
    tips: [
        'Edit updates draft PR fields',
        'Track approval state on overview',
        'Export for finance review',
        'Link project/cost center early',
    ],
};

export const PURCHASE_ORDER_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Purchase Order Workspace',
    subtitle: 'Committed procurement',
    purpose:
        'This workspace manages issued purchase orders — vendor, lines, delivery, and goods receipt against procurement requests.',
    features: [
        'PO header & vendor',
        'Line items and pricing',
        'Delivery and GRN tracking',
        'Audit and history',
    ],
    workflow: [
        'Create PO from approved PR',
        'Confirm vendor and line pricing',
        'Issue PO to vendor',
        'Track delivery and goods receipt',
    ],
    tips: [
        'Inline edit for open PO changes',
        'Print PO for vendor communication',
        'Export for procurement review',
        'Status drives fulfillment workflow',
    ],
};

export const WORK_ORDER_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Work Order Workspace',
    subtitle: 'Operations execution',
    purpose:
        'This workspace manages work orders — scope, vendor assignment, scheduling, costs, and completion for facilities and projects.',
    features: [
        'Work order scope & priority',
        'Vendor and assignee',
        'Schedule and site details',
        'Costs and materials',
        'Activity and closure notes',
    ],
    workflow: [
        'Raise work order',
        'Assign vendor or internal team',
        'Schedule execution',
        'Log progress and costs',
        'Close with completion evidence',
    ],
    tips: [
        'Edit updates open work orders',
        'Email vendor with WO link',
        'Export for site supervisors',
        'Link to projects and assets',
    ],
};

export const INVOICE_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Invoice Workspace',
    subtitle: 'Accounts payable / receivable',
    purpose:
        'This workspace manages invoices — party, line items, tax, payment status, and linkage to POs, bookings, or vendors.',
    features: [
        'Invoice header & party',
        'Line items and tax',
        'Payment and due dates',
        'PO/booking references',
        'History and documents',
    ],
    workflow: [
        'Create or import invoice',
        'Validate lines and tax',
        'Submit for approval',
        'Record payment allocation',
        'Archive when settled',
    ],
    tips: [
        'Edit open invoices inline',
        'Print for vendor/customer copies',
        'Export for finance systems',
        'Match to PO or booking references',
    ],
};

export const RESIDENT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Resident Workspace',
    subtitle: 'Community management',
    purpose:
        'This workspace manages residents — portal access, property unit, notices, records, and community activity within mySFT.',
    features: [
        'Resident profile & credentials',
        'Property unit assignment',
        'Notices and communications',
        'Records and documents',
        'Activity audit trail',
    ],
    workflow: [
        'Onboard resident profile',
        'Assign unit and access',
        'Publish notices',
        'Maintain records',
        'Archive when moved out',
    ],
    tips: [
        'Edit enables inline profile updates',
        'Notices tab for community comms',
        'Portal access toggles on overview',
        'Export for society audits',
    ],
};

export const ACCESS_MATRIX_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Access Matrix',
    subtitle: 'Role & permission control',
    purpose:
        'This workspace defines which roles can access each module and feature across mySFT. Use it to configure default platform roles and custom roles for your organization.',
    features: [
        'Module × role permission grid',
        'Default and custom role columns',
        'Bulk apply permissions to modules',
        'Saved views and filters',
        'Audit log for permission changes',
    ],
    workflow: [
        'Review default platform roles',
        'Add custom roles as needed',
        'Set permissions per module/feature',
        'Save views for common configurations',
        'Publish changes and review audit log',
    ],
    tips: [
        'Use Default vs Custom tabs to separate seed and org roles',
        'Collapse modules to focus on one area',
        'Export CSV/JSON before large changes',
        'View logs tracks who changed permissions',
    ],
};

export const SERVICE_MAINTENANCE_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Service Request Workspace',
    subtitle: 'Maintenance & tickets',
    purpose:
        'This workspace manages service and maintenance tickets — issue type, priority, assignment, SLA, and resolution for properties and assets.',
    features: [
        'Ticket profile & category',
        'Priority and SLA tracking',
        'Assignee and vendor',
        'Site/unit references',
        'Notes, activity & closure',
    ],
    workflow: [
        'Log service request',
        'Triage priority and category',
        'Assign technician or vendor',
        'Update status through resolution',
        'Close with resolution notes',
    ],
    tips: [
        'Edit updates open tickets inline',
        'Email shares ticket context',
        'Activity tab shows full timeline',
        'Link residents and work orders',
    ],
};

export const USER_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'User Workspace',
    subtitle: 'Platform user directory',
    purpose:
        'This workspace manages platform users — identity, role assignment, tenant linkage, access status, and security settings within mySFT.',
    features: [
        'User profile & contact details',
        'Role and tenant assignment',
        'Account status & last login',
        'Security and permissions context',
        'History and audit trail',
    ],
    workflow: [
        'Create or invite user',
        'Assign role and tenant',
        'Set status (active/inactive)',
        'Verify access via Access Matrix',
        'Review activity in History tab',
    ],
    tips: [
        'Use Edit for inline overview updates',
        'Roles tie to Access Matrix permissions',
        'Export supports directory audits',
        'Archive suspends access without deleting history',
    ],
};

export const DEPARTMENT_WORKSPACE_HELP: WorkspaceHelpContent = {
    title: 'Department Workspace',
    subtitle: 'Organization structure',
    purpose:
        'This workspace manages departments — codes, heads, hierarchy, and operational ownership for users and workflows across mySFT.',
    features: [
        'Department profile & code',
        'Department head & contacts',
        'Status and org linkage',
        'Related users and assignments',
        'History tracking',
    ],
    workflow: [
        'Create department record',
        'Assign department head',
        'Link users and business units',
        'Maintain status and metadata',
        'Review changes in history',
    ],
    tips: [
        'Use Edit to update fields inline',
        'Email contacts department head when set',
        'Unique department codes aid reporting',
        'Export for org chart reviews',
    ],
};
