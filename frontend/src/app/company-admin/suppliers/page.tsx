import type { Metadata } from 'next';
import { SupplierListPage } from '@/components/suppliers/SupplierListPage';

export const metadata: Metadata = {
    title: 'Supplier List | mySFT',
    description: 'Search, filter, and manage suppliers.',
};

export default function SuppliersHubRoute() {
    return <SupplierListPage />;
}
