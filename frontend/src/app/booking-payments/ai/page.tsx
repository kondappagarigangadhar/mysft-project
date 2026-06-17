import { redirect } from 'next/navigation';

/** Alias route — product hub lives under company-admin booking & payment. */
export default function BookingPaymentsAiAliasPage() {
    redirect('/company-admin/booking-payment/ai');
}
