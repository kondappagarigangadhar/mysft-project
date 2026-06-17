import { redirect } from 'next/navigation';

type PageProps = {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TARGET = '/company-admin/booking-payment/booking/create';

/**
 * Shorthand entry: same screen as
 * /company-admin/booking-payment/booking/create (preserves ?leadCode= & ?returnTo=).
 */
export default async function BookingCreatePage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const leadCode = sp.leadCode;
    const returnTo = sp.returnTo;
    const q = new URLSearchParams();
    if (typeof leadCode === 'string' && leadCode) q.set('leadCode', leadCode);
    if (typeof returnTo === 'string' && returnTo) q.set('returnTo', returnTo);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    redirect(`${TARGET}${suffix}`);
}
