import type { Metadata } from 'next';
import { VendorProfilePage } from '@/components/vendors/VendorProfilePage';

export const metadata: Metadata = {
    title: 'Vendor Profile | mySFT',
    description: 'Vendor profile, overview, documents, performance, and history logs.',
};

export default async function VendorProfileRoute({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <VendorProfilePage vendorId={id} />;
}
