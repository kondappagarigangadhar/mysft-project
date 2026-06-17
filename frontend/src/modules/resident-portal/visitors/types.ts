export type VisitorStatus = 'Pending' | 'Approved' | 'Rejected';

export type VisitorRequest = {
    id: string;
    name: string;
    mobile: string;
    vehicle?: string;
    when: string;
    status: VisitorStatus;
    purpose?: string;
    requestedAt?: string;
};

/** @deprecated Use VisitorRequest */
export type VisitorPass = VisitorRequest;
