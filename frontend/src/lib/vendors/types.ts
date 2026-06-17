export type VendorStatus = 'Active' | 'Inactive' | 'Blacklisted' | 'Pending';
export type VendorType = 'Contractor' | 'Supplier';
export type ContractStatus = 'Active' | 'Ending Soon' | 'Expired' | 'Draft';
export type VerificationStatus = 'Verified' | 'Pending Verification' | 'Pending' | 'Expired' | 'Rejected';

export type ComplianceWorkflowStepId =
    | 'document_uploaded'
    | 'waiting_for_approval'
    | 'compliance_review'
    | 'background_verification'
    | 'final_approval'
    | 'verified'
    | 'rejected'
    | 'reupload_required';
export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed' | 'Delayed';

export type Vendor = {
    id: string;
    name: string;
    type: VendorType;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    city: string;
    state: string;
    country: string;
    status: VendorStatus;
    rating: number;
    compliancePercent: number;
    contractStatus: ContractStatus;
    docsComplete: number;
    delays: number;
    slaBreaches: number;
    availability: 'High' | 'Medium' | 'Low';
    /** Primary project this vendor serves (work orders are scoped to this property). */
    primaryProject: string;
    createdAt: string;
};

export type VendorDocument = {
    id: string;
    vendorId: string;
    documentName: string;
    type: string;
    uploadedDate: string;
    /** Optional issue / effective date (YYYY-MM-DD) */
    issueDate?: string;
    expiryDate?: string;
    verificationStatus: VerificationStatus;
    /** Current step in the compliance verification workflow (hidden once verified). */
    verificationWorkflowStep?: ComplianceWorkflowStepId;
    verifiedBy: string;
    verifiedDate?: string;
    approvalNotes?: string;
    rejectionReason?: string;
    /** Original filename for download/view demo */
    fileName?: string;
    notes?: string;
};

export type VendorContract = {
    id: string;
    vendorId: string;
    contractName: string;
    startDate: string;
    endDate: string;
    value: number;
    status: ContractStatus;
    fileName: string;
};

export type VendorAssignment = {
    id: string;
    vendorId: string;
    workOrderId: string;
    taskTitle: string;
    assignedDate: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    dueDate: string;
    status: AssignmentStatus;
    progress: number;
};

export type VendorFeedback = {
    id: string;
    vendorId: string;
    date: string;
    reviewer: string;
    rating: number;
    comment: string;
};

export type VendorHistoryLog = {
    id: string;
    vendorId: string;
    dateTime: string;
    user: string;
    action: string;
    module: string;
    oldValue: string;
    newValue: string;
};

export type VendorCoveragePriority = 'Low' | 'Medium' | 'High' | 'Critical';

/** Coverage rules used by the service-request auto assignment engine. */
export type VendorCoverageAssignment = {
    vendorId: string;
    projectsCovered: string[];
    towersCovered: string[];
    categoriesCovered: string[];
    serviceAreas: string[];
    preferredPriorityLevels: VendorCoveragePriority[];
};
