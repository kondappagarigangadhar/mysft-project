import type { MaintenanceCategory, Priority, VendorTeam } from '../utils/types';

export type RoutingDecision = {
    team: VendorTeam;
    vendorName: string;
    slaTargetMinutes: number;
};

function defaultSlaMinutes(priority: Priority) {
    if (priority === 'Critical') return 120;
    if (priority === 'High') return 180;
    if (priority === 'Medium') return 360;
    return 720;
}

export function routeMaintenanceIssue(opts: { category: MaintenanceCategory; priority: Priority }): RoutingDecision {
    const { category, priority } = opts;
    const slaTargetMinutes = defaultSlaMinutes(priority);

    switch (category) {
        case 'Water Leakage':
        case 'Plumbing':
            return { team: 'Plumbing', vendorName: 'AquaFix Plumbing Co.', slaTargetMinutes };
        case 'Electricity':
            return { team: 'Electrical', vendorName: 'BrightSpark Electricals', slaTargetMinutes };
        case 'Lift Issue':
            return { team: 'Elevator', vendorName: 'Otis Service', slaTargetMinutes };
        case 'Security':
            return { team: 'Security', vendorName: 'SecureGate Team', slaTargetMinutes };
        case 'Housekeeping':
            return { team: 'Housekeeping', vendorName: 'CleanWave Services', slaTargetMinutes };
        case 'Parking':
        case 'Noise':
        case 'Other':
        default:
            return { team: 'Facilities', vendorName: 'Community Facilities Desk', slaTargetMinutes };
    }
}

