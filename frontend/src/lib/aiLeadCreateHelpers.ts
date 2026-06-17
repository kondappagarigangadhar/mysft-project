/**
 * Client-side mocks for AI-assisted lead creation.
 * Replace with API calls when ready:
 *   POST /api/ai/lead-score
 *   POST /api/ai/lead-suggestions
 */

import type { LeadSource } from '@/lib/leadStore';

/** Shape of create-lead form values used for AI heuristics (keeps this module free of UI imports). */
export type AiLeadFormSnapshot = {
    name: string;
    phone: string;
    email: string;
    source: string;
    project: string;
    budgetRange: string;
    preferredUnitType: string;
    status: string;
    assignedTo: string;
    presentAddress: string;
    notes: string;
};

export type LeadQualityBand = 'high' | 'medium' | 'low';

export type LeadQualityResult = {
    percent: number;
    band: LeadQualityBand;
    label: string;
};

const PHONE_OK = /^\d{10}$/;
const HAS_BUDGET_SIGNAL = /[\d₹$]|lakh|lac|cr|crore|k\b|million/i;

/** Heuristic quality score from budget, source, project, and basics (mock until API). */
export function computeLeadQualityScore(values: AiLeadFormSnapshot): LeadQualityResult {
    let raw = 38;

    if (values.budgetRange.trim()) {
        raw += HAS_BUDGET_SIGNAL.test(values.budgetRange) ? 22 : 12;
    }
    if (values.project?.trim()) raw += 14;

    const src = values.source;
    if (src === 'Website' || src === 'Referral') raw += 12;
    else if (src === 'Google Ads' || src === 'Facebook Ads') raw += 8;
    else if (src === 'Walk-in' || src === 'Broker') raw += 6;

    if (PHONE_OK.test(values.phone.trim())) raw += 8;
    if (values.email.trim().includes('@')) raw += 4;
    if (values.preferredUnitType) raw += 2;

    const percent = Math.max(12, Math.min(96, Math.round(raw)));
    let band: LeadQualityBand;
    let label: string;
    if (percent >= 68) {
        band = 'high';
        label = 'High Potential';
    } else if (percent >= 45) {
        band = 'medium';
        label = 'Medium';
    } else {
        band = 'low';
        label = 'Low';
    }
    return { percent, band, label };
}

export function computeFormProgressPercent(values: AiLeadFormSnapshot): number {
    let pts = 0;
    const max = 100;
    if (values.name.trim()) pts += 11;
    if (PHONE_OK.test(values.phone.trim())) pts += 13;
    if (values.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) pts += 11;
    if (values.source) pts += 8;
    if (values.project?.trim()) pts += 12;
    if (values.budgetRange.trim()) pts += 14;
    if (values.preferredUnitType) pts += 8;
    if (values.status) pts += 6;
    if (values.assignedTo?.trim()) pts += 7;
    if (values.presentAddress.trim()) pts += 5;
    if (values.notes.trim()) pts += 5;
    return Math.min(max, Math.round(pts));
}

const FREE_EMAIL = /(gmail|yahoo|hotmail|outlook|icloud|proton|rediffmail)\./i;

export function isLikelyCorporateEmail(email: string): boolean {
    const e = email.trim();
    if (!e.includes('@')) return false;
    return !FREE_EMAIL.test(e);
}

export function sourceConversionHint(source: LeadSource): string {
    switch (source) {
        case 'Website':
            return 'Website leads convert ~32% higher in similar cohorts.';
        case 'Referral':
            return 'Referrals show the strongest close rates — prioritize fast response.';
        case 'Google Ads':
        case 'Facebook Ads':
            return 'Paid leads need quick qualification — book a call within 24h.';
        case 'Walk-in':
            return 'Walk-ins often decide on site — offer same-day site visit.';
        case 'Broker':
            return 'Broker channels: align on inventory & incentives early.';
        default:
            return 'Match source to the right nurture playbook for better conversion.';
    }
}

export function budgetSmartHint(): string {
    return 'Similar buyers are interested in ₹75L–₹95L';
}

export type AiSuggestionBundle = {
    followUp: string;
    approach: string;
    priority: 'High' | 'Medium' | 'Low';
};

export function defaultAiSuggestions(quality: LeadQualityResult): AiSuggestionBundle {
    if (quality.band === 'high') {
        return {
            followUp: 'Today 6–8 PM',
            approach: 'Offer site visit + share limited inventory shortlist',
            priority: 'High',
        };
    }
    if (quality.band === 'medium') {
        return {
            followUp: 'Tomorrow 11 AM–1 PM',
            approach: 'Send brochure + schedule discovery call',
            priority: 'Medium',
        };
    }
    return {
        followUp: 'This week — flexible slot',
        approach: 'Nurture with financing education + soft check-in',
        priority: 'Low',
    };
}

/** Alternate copy after "Generate Strategy" (mock). */
export function alternateAiSuggestions(quality: LeadQualityResult): AiSuggestionBundle {
    if (quality.band === 'low') {
        return {
            followUp: 'Today 7–9 PM (re-engagement window)',
            approach: 'Lead with payment-plan comparison + callback promise',
            priority: 'Medium',
        };
    }
    if (quality.band === 'high') {
        return {
            followUp: 'Within 2 hours — hot window',
            approach: 'VIP site visit + senior sales owner on call',
            priority: 'High',
        };
    }
    return {
        followUp: 'Tomorrow 5–7 PM',
        approach: 'Virtual walkthrough + ROI worksheet',
        priority: 'Medium',
    };
}

export function buildGeneratedNotesPreview(values: AiLeadFormSnapshot): string {
    const name = values.name.trim() || 'Customer';
    const unit = values.preferredUnitType || 'preferred unit';
    const proj = values.project?.trim() || 'selected project';
    const budget = values.budgetRange.trim() || 'budget TBD';
    return `${name} is looking for ${unit} in ${proj}. Budget discussion: ${budget}. Captured via ${values.source} — follow up with requirements confirmation and site visit options.`;
}

export function previewRiskOpportunity(quality: LeadQualityResult): { risk: string; opportunity: string } {
    if (quality.band === 'high') {
        return {
            risk: 'Low — maintain momentum; avoid slow follow-up.',
            opportunity: 'Strong — prioritize human touch and inventory hold if applicable.',
        };
    }
    if (quality.band === 'medium') {
        return {
            risk: 'Moderate — competitor noise may delay decision.',
            opportunity: 'Solid — clarify timeline and financing early.',
        };
    }
    return {
        risk: 'Higher — needs structured nurture and clear next step.',
        opportunity: 'Upside if re-engaged with concrete offers within 48h.',
    };
}

/** Short tag for inline UI (Create Lead). */
export function sourceConversionShortTag(source: LeadSource): string {
    switch (source) {
        case 'Website':
            return '🔥 +32% vs avg';
        case 'Referral':
            return '🔥 Best close rate';
        case 'Google Ads':
        case 'Facebook Ads':
            return '⚡ Qualify in 24h';
        case 'Walk-in':
            return '⚡ Same-day visit';
        case 'Broker':
            return '⚡ Align early';
        default:
            return '⚡ Match playbook';
    }
}

export function budgetShortTag(): string {
    return '⚡ ₹75L–₹95L typical';
}

/** Mock “conversion chance” for insights rail (replace with API). */
export function computeMockConversionChance(quality: LeadQualityResult, hasBudget: boolean): number {
    const base = Math.round(22 + quality.percent * 0.62);
    const adj = hasBudget ? 0 : -10;
    return Math.max(14, Math.min(91, base + adj));
}

/** Short risk / signal chips for the sticky panel. */
export function quickRiskFlagTags(values: AiLeadFormSnapshot, quality: LeadQualityResult): string[] {
    const tags: string[] = [];
    if (!values.budgetRange.trim()) tags.push('⚠ No budget');
    if (quality.band === 'low') tags.push('⚠ Low score');
    if (quality.band === 'high' && values.budgetRange.trim() && values.project?.trim()) tags.push('✔ Hot lead');
    if (quality.band === 'medium') tags.push('⚡ Nurture');
    if (tags.length === 0) tags.push('✔ On track');
    return tags.slice(0, 4);
}

/** DOM id targets for scroll-to-field (Create Lead copilot). */
export const LEAD_FIELD_IDS = {
    name: 'lead-field-name',
    phone: 'lead-field-phone',
    email: 'lead-field-email',
    source: 'lead-field-source',
    assignedTo: 'lead-field-assignedTo',
    project: 'lead-field-project',
    budgetRange: 'lead-field-budgetRange',
    preferredUnitType: 'lead-field-preferredUnitType',
    status: 'lead-field-status',
    presentAddress: 'lead-field-presentAddress',
    permanentAddress: 'lead-field-permanentAddress',
    notes: 'lead-field-notes',
} as const;

export type ScoreBreakdownRow = {
    label: string;
    earned: number;
    cap: number;
    ok: boolean;
};

/** Factor breakdown aligned with score heuristics (for copilot card). */
export function computeScoreBreakdown(values: AiLeadFormSnapshot): ScoreBreakdownRow[] {
    const rows: ScoreBreakdownRow[] = [];

    const b = values.budgetRange.trim();
    let bEarn = 0;
    const bCap = 22;
    if (b) bEarn = HAS_BUDGET_SIGNAL.test(values.budgetRange) ? 22 : 12;
    rows.push({ label: 'Budget clarity', earned: bEarn, cap: bCap, ok: bEarn >= 12 });

    const hasProj = Boolean(values.project?.trim());
    rows.push({ label: 'Project interest', earned: hasProj ? 14 : 0, cap: 14, ok: hasProj });

    const src = values.source;
    let sEarn = 0;
    const sCap = 12;
    if (src === 'Website' || src === 'Referral') sEarn = 12;
    else if (src === 'Google Ads' || src === 'Facebook Ads') sEarn = 8;
    else if (src === 'Walk-in' || src === 'Broker') sEarn = 6;
    rows.push({ label: 'Channel strength', earned: sEarn, cap: sCap, ok: sEarn >= 8 });

    const phoneOk = PHONE_OK.test(values.phone.trim());
    rows.push({ label: 'Phone verified', earned: phoneOk ? 8 : 0, cap: 8, ok: phoneOk });

    const emailOk = values.email.trim().includes('@');
    rows.push({ label: 'Email on file', earned: emailOk ? 4 : 0, cap: 4, ok: emailOk });

    const unitOk = Boolean(values.preferredUnitType);
    rows.push({ label: 'Unit preference', earned: unitOk ? 2 : 0, cap: 2, ok: unitOk });

    return rows;
}

export type ImproveScoreItem = {
    /** Key of LEAD_FIELD_IDS */
    fieldKey: keyof typeof LEAD_FIELD_IDS;
    label: string;
    /** Approximate score lift if completed (mock). */
    impactPercent: number;
};

/** Prioritized checklist: missing / weak fields with estimated lift. */
export function computeImproveScoreChecklist(values: AiLeadFormSnapshot): ImproveScoreItem[] {
    const out: ImproveScoreItem[] = [];

    if (!values.budgetRange.trim()) {
        out.push({ fieldKey: 'budgetRange', label: 'Add budget range', impactPercent: 14 });
    } else if (!HAS_BUDGET_SIGNAL.test(values.budgetRange)) {
        out.push({ fieldKey: 'budgetRange', label: 'Clarify budget (₹ / L / Cr)', impactPercent: 8 });
    }

    if (!values.project?.trim()) {
        out.push({ fieldKey: 'project', label: 'Pick project interest', impactPercent: 12 });
    }

    if (!PHONE_OK.test(values.phone.trim())) {
        out.push({ fieldKey: 'phone', label: 'Valid 10-digit phone', impactPercent: 7 });
    }

    if (!values.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        out.push({ fieldKey: 'email', label: 'Workable email', impactPercent: 4 });
    }

    if (!values.notes.trim()) {
        out.push({ fieldKey: 'notes', label: 'Add notes / intent', impactPercent: 5 });
    }

    if (!values.presentAddress.trim()) {
        out.push({ fieldKey: 'presentAddress', label: 'Present address', impactPercent: 4 });
    }

    if (!values.name.trim()) {
        out.push({ fieldKey: 'name', label: 'Lead name', impactPercent: 6 });
    }

    return out.sort((a, b) => b.impactPercent - a.impactPercent).slice(0, 6);
}

/** Mock: likelihood of agreeing to a site visit (0–100). */
export function computeSiteVisitChance(values: AiLeadFormSnapshot, quality: LeadQualityResult): number {
    let v = 28;
    if (values.project?.trim()) v += 14;
    if (values.budgetRange.trim()) v += 12;
    if (values.source === 'Walk-in') v += 18;
    if (values.source === 'Referral') v += 10;
    if (values.notes.trim()) v += 6;
    if (quality.band === 'high') v += 12;
    else if (quality.band === 'medium') v += 6;
    return Math.max(8, Math.min(94, Math.round(v)));
}

/** Mock: likelihood of progressing to booking (0–100), typically below site visit. */
export function computeBookingChance(values: AiLeadFormSnapshot, quality: LeadQualityResult, siteVisitChance: number): number {
    let v = Math.round(siteVisitChance * 0.42);
    if (values.budgetRange.trim() && HAS_BUDGET_SIGNAL.test(values.budgetRange)) v += 12;
    if (quality.band === 'high') v += 10;
    if (values.source === 'Referral') v += 8;
    return Math.max(5, Math.min(88, v));
}
