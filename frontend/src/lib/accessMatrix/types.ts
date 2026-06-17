export type PermissionId = 'CRUD' | 'Create' | 'Edit' | 'View' | 'No Access';

export type MatrixRole = {
    id: string;
    name: string;
    description?: string;
    category?: string;
    accessScope?: string;
    /** UI / governance status for the role record (not auth enforcement). */
    status?: 'Active' | 'Draft' | 'Disabled';
    isSystem?: boolean;
};

export type MatrixFeature = {
    id: string;
    label: string;
};

export type MatrixModule = {
    id: string;
    title: string;
    features: MatrixFeature[];
};

export type AssignedMatrixUser = {
    id: string;
    name: string;
    email: string;
    department: string;
    status: 'Active' | 'Invited' | 'Suspended';
    lastActive: string;
};

export type AuditMatrixEntry = {
    id: string;
    at: string;
    actor: string;
    action: string;
    previousValue: string;
    updatedValue: string;
};
