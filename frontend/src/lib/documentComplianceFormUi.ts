import { cn } from '@/lib/utils';
import type { ComplianceDemoRole } from '@/lib/complianceRbac';

export const DOCUMENT_FORM_FIELD_IDS = {
    name: 'doc-field-name',
    type: 'doc-field-type',
    categories: 'doc-field-categories',
    file: 'doc-field-file',
    booking: 'doc-field-booking',
    customer: 'doc-field-customer',
    project: 'doc-field-project',
    access: 'doc-field-access',
    roles: 'doc-field-roles',
    rera: 'doc-field-rera',
    expiry: 'doc-field-expiry',
} as const;

export type DocumentHealthBand = 'good' | 'risk' | 'missing';

export type DocumentHealthBreakdownRow = {
    label: string;
    ok: boolean;
};

export type DocumentImproveItem = {
    label: string;
    impactPercent: number;
    fieldId: string;
};

export type DocumentComplianceAlert = {
    id: string;
    message: string;
    severity: 'warn' | 'danger';
};

export function focusDocumentFormField(fieldId: string) {
    const el = document.getElementById(fieldId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
        const again = document.getElementById(fieldId);
        if (!again) return;
        const tag = again.tagName.toLowerCase();
        const direct =
            tag === 'input' || tag === 'select' || tag === 'textarea'
                ? again
                : (again.querySelector('input,select,textarea') as HTMLElement | null);
        if (direct && 'focus' in direct && typeof (direct as HTMLInputElement).focus === 'function') {
            (direct as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus({ preventScroll: true });
        }
    }, 320);
}

export function documentHealthBandStyles(band: DocumentHealthBand) {
    const bar =
        band === 'good' ? 'bg-emerald-500' : band === 'risk' ? 'bg-amber-500' : 'bg-rose-500';
    const text =
        band === 'good' ? 'text-emerald-800' : band === 'risk' ? 'text-amber-900' : 'text-rose-800';
    const panel =
        band === 'good'
            ? 'bg-emerald-50/90 border-emerald-200/80'
            : band === 'risk'
              ? 'bg-amber-50/90 border-amber-200/80'
              : 'bg-rose-50/90 border-rose-200/80';
    const badge =
        band === 'good'
            ? 'bg-emerald-600/15 text-emerald-900 ring-emerald-300/80'
            : band === 'risk'
              ? 'bg-amber-500/15 text-amber-950 ring-amber-300/80'
              : 'bg-rose-600/12 text-rose-900 ring-rose-300/70';
    return { bar, text, panel, badge };
}

function daysUntilYmd(ymd: string): number | null {
    if (!ymd) return null;
    const t = Date.parse(`${ymd}T12:00:00`);
    if (Number.isNaN(t)) return null;
    const now = new Date();
    const end = new Date(t);
    return Math.ceil((end.getTime() - now.setHours(12, 0, 0, 0)) / 86_400_000);
}

type HealthInput = {
    hasFile: boolean;
    documentType: string;
    projectId: string;
    rera: string;
    expiry: string;
};

export function computeDocumentHealth(input: HealthInput): {
    percent: number;
    band: DocumentHealthBand;
    label: string;
    breakdown: DocumentHealthBreakdownRow[];
} {
    const typeOk = Boolean(input.documentType?.trim());
    const projectOk = Boolean(input.projectId?.trim());
    const complianceOk = Boolean(input.rera.trim()) && Boolean(input.expiry.trim());

    const checks = [
        { ok: input.hasFile, w: 30 },
        { ok: typeOk, w: 25 },
        { ok: projectOk, w: 22 },
        { ok: complianceOk, w: 23 },
    ];
    const totalW = checks.reduce((s, c) => s + c.w, 0);
    const percent = Math.round((checks.reduce((s, c) => s + (c.ok ? c.w : 0), 0) / totalW) * 100);

    const breakdown: DocumentHealthBreakdownRow[] = [
        { label: 'File uploaded', ok: input.hasFile },
        { label: 'Type selected', ok: typeOk },
        { label: 'Linked to project', ok: projectOk },
        { label: 'Compliance filled', ok: complianceOk },
    ];

    let band: DocumentHealthBand;
    let label: string;
    if (percent >= 82) {
        band = 'good';
        label = 'Good — ready to file';
    } else if (percent >= 55) {
        band = 'risk';
        label = 'Risk — a few gaps remain';
    } else {
        band = 'missing';
        label = 'Missing — complete key items';
    }

    return { percent, band, label, breakdown };
}

export function computeImproveChecklist(args: {
    projectId: string;
    expiry: string;
    allowedRoles: ComplianceDemoRole[];
    rera: string;
}): DocumentImproveItem[] {
    const items: DocumentImproveItem[] = [];
    if (!args.expiry.trim()) {
        items.push({
            label: 'Add expiry date',
            impactPercent: 15,
            fieldId: DOCUMENT_FORM_FIELD_IDS.expiry,
        });
    }
    if (!args.projectId.trim()) {
        items.push({
            label: 'Link to project',
            impactPercent: 10,
            fieldId: DOCUMENT_FORM_FIELD_IDS.project,
        });
    }
    if (args.allowedRoles.length < 2) {
        items.push({
            label: 'Assign roles',
            impactPercent: 8,
            fieldId: DOCUMENT_FORM_FIELD_IDS.roles,
        });
    }
    if (!args.rera.trim()) {
        items.push({
            label: 'Add RERA reference',
            impactPercent: 12,
            fieldId: DOCUMENT_FORM_FIELD_IDS.rera,
        });
    }
    return items;
}

export function computeComplianceAlerts(args: { rera: string; expiry: string }): DocumentComplianceAlert[] {
    const alerts: DocumentComplianceAlert[] = [];
    if (!args.expiry.trim()) {
        alerts.push({ id: 'no-expiry', message: 'Missing expiry date', severity: 'warn' });
    }
    if (!args.rera.trim()) {
        alerts.push({ id: 'no-rera', message: 'Missing RERA number', severity: 'warn' });
    }
    const days = args.expiry.trim() ? daysUntilYmd(args.expiry) : null;
    if (days !== null && days >= 0 && days <= 30) {
        alerts.push({
            id: 'expiring',
            message: days === 0 ? 'Expires today' : `Expiring in ${days} day${days === 1 ? '' : 's'}`,
            severity: days <= 7 ? 'danger' : 'warn',
        });
    }
    return alerts;
}

export function uploadFormStatusLabel(args: {
    name: string;
    docType: string;
    categoriesCount: number;
    file: boolean;
    allowedRolesCount: number;
}): { complete: boolean; summary: string } {
    const missing: string[] = [];
    if (!args.name.trim()) missing.push('name');
    if (!args.docType) missing.push('type');
    if (!args.categoriesCount) missing.push('categories');
    if (!args.file) missing.push('file');
    if (!args.allowedRolesCount) missing.push('roles');
    if (missing.length === 0) {
        return { complete: true, summary: 'Complete — all required fields set' };
    }
    return { complete: false, summary: `Missing fields · ${missing.join(', ')}` };
}

export function editFormStatusLabel(args: {
    name: string;
    categoriesCount: number;
    allowedRolesCount: number;
}): { complete: boolean; summary: string } {
    const missing: string[] = [];
    if (!args.name.trim()) missing.push('name');
    if (!args.categoriesCount) missing.push('categories');
    if (!args.allowedRolesCount) missing.push('roles');
    if (missing.length === 0) {
        return { complete: true, summary: 'Complete — ready to save' };
    }
    return { complete: false, summary: `Missing · ${missing.join(', ')}` };
}

export function sectionPulseClass(activeId: string | null, sectionId: string) {
    return cn(
        'rounded-xl transition-[box-shadow] duration-300',
        activeId === sectionId && 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-50',
    );
}
