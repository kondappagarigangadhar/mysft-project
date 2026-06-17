'use client';

import React, { useMemo } from 'react';
import { buildLeasePreviewHtml, ensureLeaseDocumentBlob, type RentalLeaseAgreement } from '@/lib/rentalLeaseAgreementStore';
import { cn } from '@/lib/utils';
import { LuExternalLink, LuFileText } from 'react-icons/lu';

type Props = {
    agreement: RentalLeaseAgreement;
    signed?: boolean;
    className?: string;
};

export function LeaseDocumentPreview({ agreement, signed = false, className }: Props) {
    const previewHtml = useMemo(() => buildLeasePreviewHtml(agreement, signed), [agreement, signed]);
    const blobUrl = useMemo(() => ensureLeaseDocumentBlob(agreement.id, signed), [agreement.id, signed]);
    const file = signed ? agreement.signedFile : agreement.agreementFile;

    return (
        <div className={cn('overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner', className)}>
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <LuFileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
                    <span className="truncate text-xs font-semibold text-slate-800">{file?.fileName ?? 'Lease document'}</span>
                </div>
                {blobUrl ? (
                    <a
                        href={blobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-orange-600 hover:underline"
                    >
                        Open in tab
                        <LuExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </a>
                ) : null}
            </div>
            <iframe
                title={`Lease preview — ${agreement.agreementCode}`}
                srcDoc={previewHtml}
                className="h-[min(52vh,480px)] w-full border-0 bg-white"
                sandbox="allow-same-origin"
            />
        </div>
    );
}
