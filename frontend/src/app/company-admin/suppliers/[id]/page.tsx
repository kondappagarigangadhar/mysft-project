import type { Metadata } from 'next';
import { SupplierProfilePage } from '@/components/suppliers/SupplierProfilePage';

export const metadata: Metadata = {
    title: 'Supplier Profile | mySFT',
    description: 'Supplier profile, materials, pricing, capacity, compliance, and performance.',
};

export default async function SupplierProfileRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <SupplierProfilePage supplierId={id} />;
}
