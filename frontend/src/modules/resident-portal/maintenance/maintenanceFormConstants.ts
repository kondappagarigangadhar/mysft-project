import type { MaintenanceCategory, Priority } from '@/modules/resident-portal/utils/types';

export const MAINTENANCE_CATEGORIES: MaintenanceCategory[] = [
    'Water Leakage',
    'Plumbing',
    'Electricity',
    'Lift Issue',
    'Security',
    'Housekeeping',
    'Parking',
    'Noise',
    'Other',
];

export const MAINTENANCE_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
