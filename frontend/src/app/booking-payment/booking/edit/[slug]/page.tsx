import { redirect } from 'next/navigation';

type PageProps = {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TARGET_BASE = '/company-admin/booking-payment/booking/edit';

/** Short URL: same screen as company-admin edit (preserves ?returnTo=). */
export default async function BookingEditAliasPage({ params, searchParams }: PageProps) {
    const { slug } = await params;
    const sp = await searchParams;
    const returnTo = sp.returnTo;
    const q = new URLSearchParams();
    if (typeof returnTo === 'string' && returnTo) q.set('returnTo', returnTo);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    redirect(`${TARGET_BASE}/${encodeURIComponent(slug)}${suffix}`);
}
