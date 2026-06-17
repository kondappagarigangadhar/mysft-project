import type { ProjectApprovalStatus, ProjectStatus } from '@/lib/projectsInventoryStore';
import { attachWorkflowStepNav, buildWorkflowSteps, type WorkflowStep, type WorkflowStepNav } from '@/lib/workflow/workflowStepTypes';

export const PROJECT_WORKFLOW_NAV: Record<string, WorkflowStepNav> = {
    project: { tab: 'overview', sectionId: 'wf-project-information' },
    approval: { tab: 'overview', sectionId: 'wf-project-approval' },
    inventory: { tab: 'inventory', sectionId: 'wf-project-inventory', requiresSaved: true },
    pricing: { tab: 'pricing', sectionId: 'wf-project-pricing', requiresSaved: true },
    documents: { tab: 'documents', sectionId: 'wf-project-documents', requiresSaved: true },
    'go-live': { tab: 'overview', sectionId: 'wf-project-status', requiresSaved: true },
    maturity: { tab: 'overview', sectionId: 'wf-project-status', requiresSaved: true },
};

export function computeProjectWorkflowSteps(input: {
    isCreate: boolean;
    approvalStatus: ProjectApprovalStatus;
    projectStatus: ProjectStatus;
    inventoryUnitCount: number;
    hasPricingConfigured: boolean;
    documentCount: number;
}): WorkflowStep[] {
    const { isCreate, approvalStatus, projectStatus, inventoryUnitCount, hasPricingConfigured, documentCount } = input;
    const approved = approvalStatus === 'approved';
    const hasInventory = inventoryUnitCount > 0;
    const isLive = approved && projectStatus === 'active';
    const isSoldOut = approved && projectStatus === 'sold out';

    const done = [
        !isCreate,
        approved,
        approved && hasInventory,
        approved && hasInventory && hasPricingConfigured,
        approved && hasInventory && documentCount > 0,
        isLive || isSoldOut,
        isSoldOut,
    ];

    const labels = [
        'Project',
        approved ? 'Approved' : approvalStatus === 'pending' ? 'Approval' : 'Approval',
        hasInventory ? `Inventory (${inventoryUnitCount})` : 'Inventory',
        hasPricingConfigured ? 'Pricing set' : 'Pricing',
        documentCount > 0 ? `Documents (${documentCount})` : 'Documents',
        isSoldOut ? 'Sold out' : isLive ? 'Live' : 'Go-live',
        isSoldOut ? 'Complete' : 'Maturity',
    ];

    return attachWorkflowStepNav(
        buildWorkflowSteps(
            ['project', 'approval', 'inventory', 'pricing', 'documents', 'go-live', 'maturity'].map((id, i) => ({
                id,
                label: labels[i]!,
            })),
            done,
        ),
        PROJECT_WORKFLOW_NAV,
    );
}
