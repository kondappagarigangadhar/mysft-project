import type { Metadata } from 'next';
import { VendorAlertsCenterPage } from '@/components/vendors/VendorAlertsCenterPage';

export const metadata: Metadata = {
    title: 'Vendor Alerts Center | mySFT',
    description: 'Operational and risk alerts for vendor management.',
};

export default function VendorAlertsRoute() {
    return <VendorAlertsCenterPage />;
}
