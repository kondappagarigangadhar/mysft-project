import type { Metadata } from 'next';
import { VendorListPage } from '@/components/vendors/VendorListPage';

export const metadata: Metadata = {
    title: 'Vendor List | mySFT',
    description: 'Search, filter, and manage all vendors.',
};

export default function VendorsListRoute() {
    return <VendorListPage />;
}
