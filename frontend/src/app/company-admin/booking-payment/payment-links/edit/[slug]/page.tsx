import { redirect } from 'next/navigation';

const FORM = '/company-admin/booking-payment/payment-links/form';

export default async function PaymentLinkEditRedirectPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    redirect(`${FORM}?slug=${encodeURIComponent(slug)}`);
}
