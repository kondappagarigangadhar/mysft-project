import type { Lead, LeadStage } from '@/lib/leadStore';
import { attachWorkflowStepNav, buildWorkflowSteps, type WorkflowStep, type WorkflowStepNav } from '@/lib/workflow/workflowStepTypes';

export const LEAD_WORKFLOW_NAV: Record<string, WorkflowStepNav> = {
    capture: { tab: 'overview', sectionId: 'wf-lead-information' },
    assign: { tab: 'assignment', sectionId: 'wf-lead-assignment', requiresSaved: true },
    'follow-up': { tab: 'follow-up', sectionId: 'wf-lead-follow-up', requiresSaved: true },
    qualify: { tab: 'pipeline', sectionId: 'wf-lead-pipeline', requiresSaved: true },
    'site-visit': { tab: 'site-visit', sectionId: 'wf-lead-site-visit', requiresSaved: true },
    proposal: { tab: 'pipeline', sectionId: 'wf-lead-pipeline', requiresSaved: true },
    convert: { tab: 'conversion', sectionId: 'wf-lead-conversion', requiresSaved: true },
    booking: { tab: 'overview', sectionId: 'wf-lead-booking', requiresSaved: true },
};

function isAssigned(lead: Lead): boolean {
    const owner = lead.assignment?.assignedTo?.trim() || lead.assignedTo?.trim();
    return Boolean(owner);
}

function hasFollowUp(lead: Lead): boolean {
    return (lead.followUps?.length ?? 0) > 0;
}

function isQualified(lead: Lead): boolean {
    if (lead.status === 'Qualified') return true;
    const stage = lead.pipeline?.leadStage;
    if (stage && stage !== 'New') return true;
    const col = lead.kanbanColumn;
    return col === 'qualified' || col === 'proposal' || col === 'closed';
}

function hasSiteVisit(lead: Lead): boolean {
    return (lead.siteVisits ?? []).some((v) => v.visitStatus === 'Scheduled' || v.visitStatus === 'Completed');
}

function isProposalOrBeyond(lead: Lead): boolean {
    const stage = lead.pipeline?.leadStage;
    if (stage === 'Proposal' || stage === 'Closed') return true;
    const col = lead.kanbanColumn;
    return col === 'proposal' || col === 'closed';
}

function isConverted(lead: Lead): boolean {
    if (lead.conversion?.convertedDate?.trim()) return true;
    if (lead.conversion?.conversionStatus === 'Lost') return true;
    if (lead.pipeline?.leadStage === 'Closed' && lead.conversion?.conversionStatus === 'Won') return true;
    return lead.status === 'Lost';
}

function hasBooking(lead: Lead): boolean {
    return (lead.linkedBookings?.length ?? 0) > 0;
}

function stageLabel(stage: LeadStage | undefined, fallback: string): string {
    if (stage === 'Proposal') return 'Proposal';
    if (stage === 'Closed') return 'Closed';
    return fallback;
}

export function computeLeadWorkflowSteps(input: { isCreate: boolean; lead: Lead }): WorkflowStep[] {
    const { isCreate, lead } = input;
    const stage = lead.pipeline?.leadStage;

    const done = [
        !isCreate,
        !isCreate && isAssigned(lead),
        !isCreate && hasFollowUp(lead),
        !isCreate && isQualified(lead),
        !isCreate && hasSiteVisit(lead),
        !isCreate && isProposalOrBeyond(lead),
        !isCreate && isConverted(lead),
        !isCreate && hasBooking(lead),
    ];

    const labels = [
        'Capture',
        isAssigned(lead) ? 'Assigned' : 'Assign',
        hasFollowUp(lead) ? 'Engaged' : 'Follow-up',
        isQualified(lead) ? 'Qualified' : 'Qualify',
        hasSiteVisit(lead) ? 'Site Visit' : 'Visit',
        stageLabel(stage, 'Proposal'),
        lead.conversion?.conversionStatus === 'Won'
            ? 'Won'
            : lead.conversion?.conversionStatus === 'Lost'
              ? 'Lost'
              : 'Convert',
        hasBooking(lead) ? 'Booked' : 'Booking',
    ];

    return attachWorkflowStepNav(
        buildWorkflowSteps(
            ['capture', 'assign', 'follow-up', 'qualify', 'site-visit', 'proposal', 'convert', 'booking'].map((id, i) => ({
                id,
                label: labels[i]!,
            })),
            done,
        ),
        LEAD_WORKFLOW_NAV,
    );
}
