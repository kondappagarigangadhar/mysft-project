import { redirect } from 'next/navigation';

const FORM = '/company-admin/booking-payment/payment-links/form';

export default async function PaymentLinkAddRedirectPage({
    searchParams,
}: {
    searchParams: Promise<{ booking?: string }>;
}) {
    const sp = await searchParams;
    const b = sp.booking?.trim();
    if (b) {
        redirect(`${FORM}?booking=${encodeURIComponent(b)}`);
    }
    redirect(FORM);
}
