'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLeaseAgreementViewUrl } from '@/lib/rentalLeaseAgreementStore';

/** Legacy route — redirects to unified lease view/sign page. */
export default function ResidentLeaseSignRedirectPage() {
    const params = useParams();
    const router = useRouter();
    const agreementId = decodeURIComponent(String(params.agreementId ?? ''));

    useEffect(() => {
        router.replace(`${getLeaseAgreementViewUrl(agreementId)}?mode=sign`);
    }, [router, agreementId]);

    return (
        <p className="text-center text-sm text-slate-600">Opening signing workflow…</p>
    );
}
