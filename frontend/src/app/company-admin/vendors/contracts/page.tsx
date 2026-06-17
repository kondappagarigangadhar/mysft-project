import type { Metadata } from 'next';
import { VendorContractsCenterPage } from '@/components/vendors/VendorContractsCenterPage';

export const metadata: Metadata = {
    title: 'Vendor Contracts Center | mySFT',
    description: 'View and filter all vendor contracts.',
};

export default function VendorContractsRoute() {
    return <VendorContractsCenterPage />;
}
