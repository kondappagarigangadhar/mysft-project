export type SupplierStatus = 'Active' | 'Inactive' | 'Pending' | 'Suspended';
export type SupplierType = 'Manufacturer' | 'Distributor' | 'Trader' | 'Service';

export type Supplier = {
    id: string;
    name: string;
    type: SupplierType;
    categories: string[];
    contactPerson: string;
    phone: string;
    email: string;
    city: string;
    status: SupplierStatus;
    rating: number;
    /** YYYY-MM-DD */
    createdAt: string;
};

export type SupplierRecord = Supplier & {
    address: string;
    /** YYYY-MM-DD (set on create and each update) */
    updatedAt: string;
};

export type SupplierMaterialRow = {
    id: string;
    supplierId: string;
    /** Display ID e.g. MAT-1021 (auto-generated, read-only in UI). */
    materialCode: string;
    materialName: string;
    category: string;
    unit: string;
    description?: string;
};

export type SupplierPricingRow = {
    id: string;
    supplierId: string;
    material: string;
    unitPrice: number;
    currency: string;
    /** YYYY-MM-DD */
    effectiveDate: string;
    /** YYYY-MM-DD */
    validTill: string;
    status: 'Active' | 'Inactive' | 'Ending Soon' | 'Expired' | 'Draft';
};

export type SupplierCapacityRow = {
    id: string;
    supplierId: string;
    material: string;
    dailyCapacity: number;
    leadTimeDays: number;
    availabilityStatus: 'Available' | 'Limited' | 'Unavailable';
};

/** Excel spec: Pending (default), Verified, Rejected. Date-based expiry is shown separately. */
export type SupplierComplianceVerificationStatus = 'Pending' | 'Verified' | 'Rejected';

export type SupplierComplianceRow = {
    id: string;
    supplierId: string;
    documentType: string;
    fileName: string;
    fileUrl?: string;
    /** When uploaded via browser (for preview / download). */
    fileMime?: string;
    verificationStatus: SupplierComplianceVerificationStatus;
    /** YYYY-MM-DD or empty string when not set */
    expiryDate: string;
};

export type SupplierProcurementSelectionTag = 'Best Price' | 'Preferred Supplier' | 'Fast Delivery' | 'Low SLA Risk';

export type SupplierProcurementSelectionRow = {
    id: string;
    supplierId: string;
    /** Selected supplier to evaluate (active suppliers only). */
    selectedSupplierId: string;
    material: string;
    /** System tags can be computed and optionally persisted. */
    tags?: SupplierProcurementSelectionTag[];
};

/** Delivery / quality row for performance tracking (per supplier). */
export type SupplierPerformanceDeliveryRow = {
    id: string;
    supplierId: string;
    project: string;
    material: string;
    /** YYYY-MM-DD */
    deliveryDate: string;
    /** 0 = on time */
    delayDays: number;
    /** 1–5 */
    rating: number;
    remarks: string;
};

export type SupplierTabBundle = {
    materials: SupplierMaterialRow[];
    pricing: SupplierPricingRow[];
    capacity: SupplierCapacityRow[];
    compliance: SupplierComplianceRow[];
    selections?: SupplierProcurementSelectionRow[];
    performanceDeliveries: SupplierPerformanceDeliveryRow[];
};
