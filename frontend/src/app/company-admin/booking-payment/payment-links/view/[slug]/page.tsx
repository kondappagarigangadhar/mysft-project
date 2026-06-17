'use client';

import React, { use, useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LuPencil } from 'react-icons/lu';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/booking-payment/ConfirmModal';
import { InlineToast } from '@/components/booking-payment/InlineToast';
import { PaymentLinkDetailView } from '@/components/booking-payment/payment-links/PaymentLinkDetailView';
import {
    cancelPaymentLink,
    deletePaymentLink,
    getEffectivePaymentLinkDisplayStatus,
    getPaymentLinkBySlug,
} from '@/lib/bookingPaymentMockStore';
import { cn } from '@/lib/utils';
import { CTA_FLOW_LINK_SEMIBOLD, CTA_UTILITY_BTN } from '@/lib/theme/ctaThemeClasses';

const LINKS = '/company-admin/booking-payment/payment-links';

export default function PaymentLinkViewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const [v, setV] = useState(0);
    const bump = useCallback(() => setV((x) => x + 1), []);

    const link = useMemo(() => getPaymentLinkBySlug(slug), [slug, v]);

    const [cancelOpen, setCancelOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
    const dismissToast = useCallback(() => setToast(null), []);

    const copyUrl = useCallback((url: string) => {
        void navigator.clipboard.writeText(url);
        setToast({ msg: 'Link copied to clipboard.' });
    }, []);

    const onConfirmCancel = () => {
        if (!link) return;
        const res = cancelPaymentLink(link.slug);
        setCancelOpen(false);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        setToast({ msg: 'Payment link cancelled.' });
        bump();
    };

    const onConfirmDelete = () => {
        if (!link) return;
        const res = deletePaymentLink(link.slug);
        setDeleteOpen(false);
        if (!res.ok) {
            setToast({ msg: res.error, err: true });
            return;
        }
        router.push(LINKS);
    };

    if (!link) {
        return (
            <div className="mx-auto max-w-3xl pb-12">
                <div className="mt-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-800">Payment link not found</h1>
                    <p className="mt-2 text-slate-500">This link is not in the list.</p>
                    <Link href={LINKS} className={cn('mt-4 inline-block', CTA_FLOW_LINK_SEMIBOLD)}>
                        Back to Payment links
                    </Link>
                </div>
            </div>
        );
    }

    const editHref = `${LINKS}/form?slug=${encodeURIComponent(slug)}`;
    const displayStatus = getEffectivePaymentLinkDisplayStatus(link);
    const canEdit = link.linkStatus !== 'paid' && link.linkStatus !== 'cancelled';
    const showHeaderEdit = canEdit && displayStatus !== 'Expired';

    return (
        <>
            <Breadcrumb
                items={[
                    { label: 'Booking & Payment', href: '/company-admin/booking-payment/booking' },
                    { label: 'Payment links', href: LINKS },
                    { label: link.slug },
                ]}
            />
            <div className="mx-auto max-w-3xl pb-12">
            {toast ? <InlineToast message={toast.msg} variant={toast.err ? 'error' : 'success'} onDismiss={dismissToast} /> : null}

            <ConfirmModal
                open={cancelOpen}
                title="Cancel payment link?"
                message="Customers will no longer be able to pay using this link. This cannot be undone for settlement records."
                confirmLabel="Cancel link"
                onCancel={() => setCancelOpen(false)}
                onConfirm={onConfirmCancel}
            />

            <ConfirmModal
                open={deleteOpen}
                title="Delete payment link?"
                message="This removes the link from your list. Paid links cannot be deleted."
                confirmLabel="Delete"
                onCancel={() => setDeleteOpen(false)}
                onConfirm={onConfirmDelete}
            />

            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Payment link</h1>
                    <p className="mt-1 font-medium text-slate-500">Share URL, status, and delivery details.</p>
                </div>
                {showHeaderEdit ? (
                    <Link
                        href={editHref}
                        className={cn(CTA_UTILITY_BTN, 'h-10 rounded-xl px-4 shadow-sm')}
                        aria-label="Edit payment link"
                    >
                        <LuPencil size={18} aria-hidden />
                        Edit
                    </Link>
                ) : null}
            </div>

            <div className="mt-8">
                <Card className="border border-slate-200/80 bg-white shadow-lg shadow-slate-200/40">
                    <PaymentLinkDetailView
                        link={link}
                        onCopyUrl={copyUrl}
                        onCancel={() => setCancelOpen(true)}
                        onDelete={() => setDeleteOpen(true)}
                    />
                </Card>
            </div>
        </div>
        </>
    );
}
