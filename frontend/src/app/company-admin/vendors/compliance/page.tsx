import type { Metadata } from 'next';
import { VendorComplianceCenterPage } from '@/components/vendors/VendorComplianceCenterPage';

export const metadata: Metadata = {
    title: 'Vendor Documents & Compliance | mySFT',
    description: 'Upload, verify, and manage vendor licenses, tax documents, agreements, and compliance records.',
};

export default function VendorComplianceRoute() {
    return <VendorComplianceCenterPage />;
}
