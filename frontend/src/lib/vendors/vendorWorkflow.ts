import type { VendorRecord } from '@/lib/vendors/vendorStore';
import type { VendorContract, VendorDocument } from '@/lib/vendors/types';
import { attachWorkflowStepNav, buildWorkflowSteps, type WorkflowStep, type WorkflowStepNav } from '@/lib/workflow/workflowStepTypes';

export const VENDOR_WORKFLOW_NAV: Record<string, WorkflowStepNav> = {
    onboard: { tab: 'overview', sectionId: 'wf-vendor-profile' },
    compliance: { tab: 'overview', sectionId: 'wf-vendor-compliance', requiresSaved: true },
    contracts: { tab: 'overview', sectionId: 'wf-vendor-contracts', requiresSaved: true },
    coverage: { tab: 'overview', sectionId: 'wf-vendor-coverage', requiresSaved: true },
    assign: { tab: 'overview', sectionId: 'wf-vendor-work-orders', requiresSaved: true },
    performance: { tab: 'performance', sectionId: 'wf-vendor-performance', requiresSaved: true },
};

function isProfileComplete(vendor: Pick<VendorRecord, 'name' | 'contactPerson' | 'phone' | 'onboardedDate'>): boolean {
    return Boolean(vendor.name?.trim() && vendor.contactPerson?.trim() && vendor.phone?.trim() && vendor.onboardedDate?.trim());
}

function isComplianceReady(vendor: Pick<VendorRecord, 'compliancePercent'>, documents: VendorDocument[]): boolean {
    if (documents.length === 0) return vendor.compliancePercent >= 80;
    const verified = documents.filter((d) => d.verificationStatus === 'Verified').length;
    return verified > 0 && verified === documents.length;
}

function hasActiveContract(vendor: Pick<VendorRecord, 'contractStatus'>, contracts: VendorContract[]): boolean {
    if (vendor.contractStatus === 'Active') return true;
    return contracts.some((c) => c.status === 'Active' || c.status === 'Ending Soon');
}

export function computeVendorWorkflowSteps(input: {
    isCreate: boolean;
    vendor: VendorRecord;
    documents: VendorDocument[];
    contracts: VendorContract[];
    workOrderCount: number;
    feedbackCount: number;
}): WorkflowStep[] {
    const { isCreate, vendor, documents, contracts, workOrderCount, feedbackCount } = input;
    const profileReady = !isCreate && isProfileComplete(vendor);
    const complianceReady = profileReady && isComplianceReady(vendor, documents);
    const contractsReady = complianceReady && hasActiveContract(vendor, contracts);
    const coverageReady = contractsReady;
    const assigned = coverageReady && (workOrderCount > 0 || vendor.status === 'Active');
    const performing = assigned && (vendor.rating > 0 || feedbackCount > 0);

    const verifiedDocs = documents.filter((d) => d.verificationStatus === 'Verified').length;

    const labels = [
        profileReady ? 'Onboarded' : 'Onboard',
        complianceReady
            ? 'Compliant'
            : documents.length > 0
              ? `Compliance (${verifiedDocs}/${documents.length})`
              : 'Compliance',
        hasActiveContract(vendor, contracts) ? 'Contracted' : 'Contracts',
        coverageReady ? 'Coverage set' : 'Coverage',
        workOrderCount > 0 ? `Assigned (${workOrderCount})` : 'Assign',
        performing ? `Rated (${vendor.rating.toFixed(1)})` : 'Performance',
    ];

    const stepDone = [profileReady, complianceReady, contractsReady, coverageReady, assigned, performing];

    return attachWorkflowStepNav(
        buildWorkflowSteps(
            ['onboard', 'compliance', 'contracts', 'coverage', 'assign', 'performance'].map((id, i) => ({
                id,
                label: labels[i]!,
            })),
            stepDone,
        ),
        VENDOR_WORKFLOW_NAV,
    );
}
