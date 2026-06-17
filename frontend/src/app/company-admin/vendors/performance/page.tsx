import type { Metadata } from 'next';
import { VendorPerformanceCenterPage } from '@/components/vendors/VendorPerformanceCenterPage';

export const metadata: Metadata = {
    title: 'Vendor Performance Center | mySFT',
    description: 'Track vendor leaderboard and risk vendors.',
};

export default function VendorPerformanceRoute() {
    return <VendorPerformanceCenterPage />;
}
