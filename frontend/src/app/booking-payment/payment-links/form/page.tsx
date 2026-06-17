import { redirect } from 'next/navigation';

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TARGET = '/company-admin/booking-payment/payment-links/form';

/** Shorthand: same as company-admin form (?slug= for edit, ?booking= for new). */
export default async function PaymentLinkFormAliasPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const slug = sp.slug;
    const booking = sp.booking;
    const q = new URLSearchParams();
    if (typeof slug === 'string' && slug) q.set('slug', slug);
    if (typeof booking === 'string' && booking) q.set('booking', booking);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    redirect(`${TARGET}${suffix}`);
}
