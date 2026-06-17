import type {
    SupplierRecord,
    SupplierTabBundle,
    SupplierType,
} from '@/lib/suppliers/types';

export const SUPPLIER_CATEGORIES = [
    'Cement & aggregates',
    'Steel & reinforcement',
    'Electrical',
    'Plumbing',
    'Finishes',
    'HVAC',
    'Logistics',
] as const;

export const SUPPLIER_CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Delhi NCR'] as const;

const TYPES: SupplierType[] = ['Manufacturer', 'Distributor', 'Trader', 'Service'];

function tinySvgDataUrl(label: string, tone: 'blue' | 'emerald' | 'amber' | 'rose' = 'blue') {
    const bg = tone === 'emerald' ? '#ecfdf5' : tone === 'amber' ? '#fffbeb' : tone === 'rose' ? '#fff1f2' : '#eff6ff';
    const fg = tone === 'emerald' ? '#065f46' : tone === 'amber' ? '#92400e' : tone === 'rose' ? '#9f1239' : '#1e3a8a';
    const safe = label.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"760\" height=\"420\"><rect width=\"100%\" height=\"100%\" fill=\"${bg}\"/><text x=\"40\" y=\"90\" font-family=\"ui-sans-serif, system-ui\" font-size=\"34\" fill=\"${fg}\" font-weight=\"700\">${safe}</text><text x=\"40\" y=\"140\" font-family=\"ui-sans-serif, system-ui\" font-size=\"18\" fill=\"${fg}\">Demo preview only</text></svg>`;
    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/\"/g, '%22');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

function bundleFor(supplierId: string, name: string): SupplierTabBundle {
    const isElectrical = supplierId === 'SUP-2402';
    const isPlumbing = supplierId === 'SUP-2403';
    const isFinishes = supplierId === 'SUP-2404';
    const isLogistics = supplierId === 'SUP-2405';

    const materials: SupplierTabBundle['materials'] = isElectrical
        ? [
              { id: `${supplierId}-m1`, supplierId, materialCode: 'MAT-2101', materialName: 'FRLS Copper Cable 4 sqmm', category: 'Electrical', unit: 'm', description: 'Low-smoke FRLS cable; ISI compliant' },
              { id: `${supplierId}-m2`, supplierId, materialCode: 'MAT-2102', materialName: 'MCB 32A (C Curve)', category: 'Electrical', unit: 'Nos', description: 'DIN rail MCB; 10kA breaking capacity' },
              { id: `${supplierId}-m3`, supplierId, materialCode: 'MAT-2103', materialName: 'LED Panel Light 18W', category: 'Electrical', unit: 'Nos', description: 'Cool white 6500K; 2-year warranty' },
          ]
        : isPlumbing
          ? [
                { id: `${supplierId}-m1`, supplierId, materialCode: 'MAT-3101', materialName: 'CPVC Pipe 25mm', category: 'Plumbing', unit: 'Nos', description: 'Hot & cold water line; SDR 11' },
                { id: `${supplierId}-m2`, supplierId, materialCode: 'MAT-3102', materialName: 'PVC Elbow 90° 40mm', category: 'Plumbing', unit: 'Nos', description: 'Solvent weld; heavy duty' },
                { id: `${supplierId}-m3`, supplierId, materialCode: 'MAT-3103', materialName: 'GI Union 1 inch', category: 'HVAC', unit: 'Nos', description: 'Galvanized; for service connections' },
            ]
          : isFinishes
            ? [
                  { id: `${supplierId}-m1`, supplierId, materialCode: 'MAT-4101', materialName: 'Ceramic Tile 600x600', category: 'Finishes', unit: 'Sq.ft', description: 'Gloss finish; 1st quality' },
                  { id: `${supplierId}-m2`, supplierId, materialCode: 'MAT-4102', materialName: 'Wall Putty (20kg)', category: 'Finishes', unit: 'Bag', description: 'Premium polymer based putty' },
                  { id: `${supplierId}-m3`, supplierId, materialCode: 'MAT-4103', materialName: 'Acrylic Emulsion Paint', category: 'Finishes', unit: 'Litre', description: 'Interior; low VOC' },
              ]
            : isLogistics
              ? [
                    { id: `${supplierId}-m1`, supplierId, materialCode: 'MAT-5101', materialName: 'Last-mile Delivery (≤5km)', category: 'Logistics', unit: 'Nos', description: 'One trip; small truck' },
                    { id: `${supplierId}-m2`, supplierId, materialCode: 'MAT-5102', materialName: 'Handling & Unloading', category: 'Logistics', unit: 'Nos', description: 'Per consignment; includes labour' },
                ]
              : [
                    {
                        id: `${supplierId}-m1`,
                        supplierId,
                        materialCode: 'MAT-1021',
                        materialName: 'OPC 53 Grade cement',
                        category: 'Cement & aggregates',
                        unit: 'MT',
                        description: 'High strength cement for structural work',
                    },
                    {
                        id: `${supplierId}-m2`,
                        supplierId,
                        materialCode: 'MAT-1022',
                        materialName: 'TMT 500D bars',
                        category: 'Steel & reinforcement',
                        unit: 'MT',
                        description: 'Corrosion resistant; Fe500D',
                    },
                    {
                        id: `${supplierId}-m3`,
                        supplierId,
                        materialCode: 'MAT-1023',
                        materialName: 'Ready-mix concrete M30',
                        category: 'Cement & aggregates',
                        unit: 'm³',
                        description: 'Grade M30 ready mix',
                    },
                ];

    const pricing: SupplierTabBundle['pricing'] = isElectrical
        ? [
              { id: `${supplierId}-p1`, supplierId, material: materials[0]!.materialName, unitPrice: 118, currency: 'INR', effectiveDate: '2026-05-01', validTill: '2026-12-31', status: 'Active' },
              { id: `${supplierId}-p2`, supplierId, material: materials[1]!.materialName, unitPrice: 220, currency: 'INR', effectiveDate: '2026-04-15', validTill: '2026-09-30', status: 'Ending Soon' },
              { id: `${supplierId}-p3`, supplierId, material: materials[2]!.materialName, unitPrice: 485, currency: 'INR', effectiveDate: '2026-05-10', validTill: '', status: 'Active' },
          ]
        : isPlumbing
          ? [
                { id: `${supplierId}-p1`, supplierId, material: materials[0]!.materialName, unitPrice: 145, currency: 'INR', effectiveDate: '2026-05-01', validTill: '', status: 'Active' },
                { id: `${supplierId}-p2`, supplierId, material: materials[1]!.materialName, unitPrice: 38, currency: 'INR', effectiveDate: '2026-05-01', validTill: '2026-12-31', status: 'Active' },
                { id: `${supplierId}-p3`, supplierId, material: materials[2]!.materialName, unitPrice: 260, currency: 'INR', effectiveDate: '2026-03-20', validTill: '2026-08-31', status: 'Inactive' },
            ]
          : isFinishes
            ? [
                  { id: `${supplierId}-p1`, supplierId, material: materials[0]!.materialName, unitPrice: 78, currency: 'INR', effectiveDate: '2026-04-01', validTill: '2026-10-31', status: 'Active' },
                  { id: `${supplierId}-p2`, supplierId, material: materials[1]!.materialName, unitPrice: 520, currency: 'INR', effectiveDate: '2026-04-15', validTill: '', status: 'Active' },
                  { id: `${supplierId}-p3`, supplierId, material: materials[2]!.materialName, unitPrice: 265, currency: 'INR', effectiveDate: '2026-05-01', validTill: '2026-07-31', status: 'Ending Soon' },
              ]
            : isLogistics
              ? [
                    { id: `${supplierId}-p1`, supplierId, material: materials[0]!.materialName, unitPrice: 1800, currency: 'INR', effectiveDate: '2026-05-01', validTill: '', status: 'Active' },
                    { id: `${supplierId}-p2`, supplierId, material: materials[1]!.materialName, unitPrice: 950, currency: 'INR', effectiveDate: '2026-05-01', validTill: '2026-12-31', status: 'Active' },
                ]
              : [
                    { id: `${supplierId}-p1`, supplierId, material: 'OPC 53 Grade cement', unitPrice: 420, currency: 'INR', effectiveDate: '2026-04-01', validTill: '2026-12-31', status: 'Active' },
                    { id: `${supplierId}-p2`, supplierId, material: 'TMT 500D bars', unitPrice: 58500, currency: 'INR', effectiveDate: '2026-04-15', validTill: '2026-09-30', status: 'Ending Soon' },
                    { id: `${supplierId}-p3`, supplierId, material: 'Ready-mix concrete M30', unitPrice: 5200, currency: 'INR', effectiveDate: '2026-05-01', validTill: '2026-08-01', status: 'Active' },
                ];

    const capacity: SupplierTabBundle['capacity'] = isElectrical
        ? [
              { id: `${supplierId}-c1`, supplierId, material: materials[0]!.materialName, dailyCapacity: 4500, leadTimeDays: 2, availabilityStatus: 'Available' },
              { id: `${supplierId}-c2`, supplierId, material: materials[1]!.materialName, dailyCapacity: 800, leadTimeDays: 3, availabilityStatus: 'Limited' },
          ]
        : isPlumbing
          ? [
                { id: `${supplierId}-c1`, supplierId, material: materials[0]!.materialName, dailyCapacity: 1200, leadTimeDays: 2, availabilityStatus: 'Available' },
                { id: `${supplierId}-c2`, supplierId, material: materials[1]!.materialName, dailyCapacity: 600, leadTimeDays: 1, availabilityStatus: 'Available' },
                { id: `${supplierId}-c3`, supplierId, material: materials[2]!.materialName, dailyCapacity: 250, leadTimeDays: 4, availabilityStatus: 'Limited' },
            ]
          : isFinishes
            ? [
                  { id: `${supplierId}-c1`, supplierId, material: materials[0]!.materialName, dailyCapacity: 2200, leadTimeDays: 3, availabilityStatus: 'Limited' },
                  { id: `${supplierId}-c2`, supplierId, material: materials[1]!.materialName, dailyCapacity: 700, leadTimeDays: 2, availabilityStatus: 'Available' },
              ]
            : isLogistics
              ? [
                    { id: `${supplierId}-c1`, supplierId, material: materials[0]!.materialName, dailyCapacity: 18, leadTimeDays: 1, availabilityStatus: 'Available' },
                    { id: `${supplierId}-c2`, supplierId, material: materials[1]!.materialName, dailyCapacity: 20, leadTimeDays: 1, availabilityStatus: 'Available' },
                ]
              : [
                    { id: `${supplierId}-c1`, supplierId, material: 'OPC 53 Grade cement', dailyCapacity: 8000, leadTimeDays: 2, availabilityStatus: 'Available' },
                    { id: `${supplierId}-c2`, supplierId, material: 'TMT 500D bars', dailyCapacity: 1200, leadTimeDays: 4, availabilityStatus: 'Limited' },
                ];

    const compliance: SupplierTabBundle['compliance'] = [
        {
            id: `${supplierId}-d1`,
            supplierId,
            documentType: 'GST',
            fileName: `${supplierId}-gst-certificate.svg`,
            fileUrl: tinySvgDataUrl(`${name} · GST Certificate`, 'emerald'),
            fileMime: 'image/svg+xml',
            verificationStatus: 'Verified',
            expiryDate: '2027-12-31',
        },
        {
            id: `${supplierId}-d2`,
            supplierId,
            documentType: 'PAN',
            fileName: `${supplierId}-pan.svg`,
            fileUrl: tinySvgDataUrl(`${name} · PAN`, 'blue'),
            fileMime: 'image/svg+xml',
            verificationStatus: supplierId === 'SUP-2404' ? 'Rejected' : 'Pending',
            expiryDate: '',
        },
        {
            id: `${supplierId}-d3`,
            supplierId,
            documentType: 'Insurance',
            fileName: `${supplierId}-insurance.svg`,
            fileUrl: tinySvgDataUrl(`${name} · Insurance`, supplierId === 'SUP-2405' ? 'rose' : 'amber'),
            fileMime: 'image/svg+xml',
            verificationStatus: 'Pending',
            // keep one doc near expiry for alert badge (30d window) relative to 2026-06-02
            expiryDate: supplierId === 'SUP-2402' ? '2026-06-20' : '2026-12-01',
        },
    ];

    const selections: NonNullable<SupplierTabBundle['selections']> = [
        {
            id: `${supplierId}-sel1`,
            supplierId,
            selectedSupplierId: supplierId,
            material: materials[0]?.materialName ?? '',
            tags: ['Preferred Supplier'],
        },
        {
            id: `${supplierId}-sel2`,
            supplierId,
            selectedSupplierId: 'SUP-2401',
            material: isElectrical ? 'OPC 53 Grade cement' : materials[1]?.materialName ?? '',
            tags: [],
        },
    ];

    return {
        materials,
        pricing,
        capacity,
        compliance,
        selections,
        performanceDeliveries: [
            {
                id: `${supplierId}-perf1`,
                supplierId,
                project: 'Skyline Residency',
                material: materials[0]?.materialName ?? '—',
                deliveryDate: '2026-04-18',
                delayDays: 0,
                rating: 5,
                remarks: `On-time drop; QC pass for ${name}.`,
            },
            {
                id: `${supplierId}-perf2`,
                supplierId,
                project: 'Urban Flux Apartments',
                material: materials[1]?.materialName ?? '—',
                deliveryDate: '2026-03-25',
                delayDays: 2,
                rating: 4,
                remarks: 'Weather delay; communication proactive.',
            },
            {
                id: `${supplierId}-perf3`,
                supplierId,
                project: 'Industrial Bay 4',
                material: materials[2]?.materialName ?? (materials[0]?.materialName ?? '—'),
                deliveryDate: '2026-05-02',
                delayDays: 0,
                rating: 5,
                remarks: 'Documentation complete.',
            },
            {
                id: `${supplierId}-perf4`,
                supplierId,
                project: 'Skyline Residency',
                material: materials[0]?.materialName ?? '—',
                deliveryDate: '2026-02-14',
                delayDays: 5,
                rating: 3,
                remarks: 'Escalated; recovered next slot.',
            },
        ],
    };
}

export const MOCK_SUPPLIERS: SupplierRecord[] = [
    {
        id: 'SUP-2401',
        name: 'MetroBuild Materials Pvt Ltd',
        type: TYPES[1],
        categories: ['Cement & aggregates', 'Steel & reinforcement'],
        contactPerson: 'Ananya Rao',
        phone: '9876543210',
        email: 'sales@metrobuild.example.com',
        city: 'Hyderabad',
        status: 'Active',
        rating: 4.6,
        createdAt: '2025-11-02',
        updatedAt: '2025-11-02',
        address: 'Plot 12, IDA Nacharam, Hyderabad, Telangana 500076',
    },
    {
        id: 'SUP-2402',
        name: 'Southline Electricals',
        type: TYPES[0],
        categories: ['Electrical'],
        contactPerson: 'Vikram Singh',
        phone: '9123456789',
        email: 'orders@southline.example.com',
        city: 'Bengaluru',
        status: 'Active',
        rating: 4.1,
        createdAt: '2026-01-14',
        updatedAt: '2026-01-14',
        address: '88 Industrial Suburb, Bengaluru, Karnataka 560058',
    },
    {
        id: 'SUP-2403',
        name: 'AquaFlow Plumbing Co',
        type: TYPES[3],
        categories: ['Plumbing', 'HVAC'],
        contactPerson: 'Meera Krishnan',
        phone: '9988776655',
        email: 'desk@aquaflow.example.com',
        city: 'Chennai',
        status: 'Pending',
        rating: 3.8,
        createdAt: '2026-03-20',
        updatedAt: '2026-03-20',
        address: 'Door 4, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
    },
    {
        id: 'SUP-2404',
        name: 'FinishCraft Traders',
        type: TYPES[2],
        categories: ['Finishes'],
        contactPerson: 'Rahul Desai',
        phone: '9090909090',
        email: 'rahul@finishcraft.example.com',
        city: 'Mumbai',
        status: 'Inactive',
        rating: 3.2,
        createdAt: '2025-08-30',
        updatedAt: '2025-08-30',
        address: 'Unit 302, BKC Annex, Mumbai, Maharashtra 400051',
    },
    {
        id: 'SUP-2405',
        name: 'HighRise Logistics LLP',
        type: TYPES[3],
        categories: ['Logistics'],
        contactPerson: 'Sunita Patil',
        phone: '9812345678',
        email: 'ops@highrise-logistics.example.com',
        city: 'Pune',
        status: 'Suspended',
        rating: 2.9,
        createdAt: '2025-05-11',
        updatedAt: '2025-05-11',
        address: 'Warehouse 7, Chakan MIDC, Pune, Maharashtra 410501',
    },
];

/** Seed tab payloads keyed by supplier id (demo). */
export const MOCK_SUPPLIER_TAB_BUNDLES: Record<string, SupplierTabBundle> = Object.fromEntries(
    MOCK_SUPPLIERS.map((s) => [s.id, bundleFor(s.id, s.name)]),
);

export function emptyTabBundle(): SupplierTabBundle {
    return {
        materials: [],
        pricing: [],
        capacity: [],
        compliance: [],
        selections: [],
        performanceDeliveries: [],
    };
}
