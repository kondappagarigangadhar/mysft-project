'use client';

import React from 'react';
import {
    LuCheck,
    LuDownload,
    LuEye,
    LuFileCheck,
    LuFileText,
    LuMail,
    LuPencil,
    LuTrash2,
} from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import { cn } from '@/lib/utils';

export function PaymentLedgerRowActionsMenu({
    slug,
    status,
    receiptReady,
    onView,
    onEdit,
    onMarkCompleted,
    onViewReceipt,
    onDownloadReceiptPdf,
    onGenerateReceipt,
    onSendReminder,
    onDelete,
}: {
    slug: string;
    status: string;
    receiptReady: boolean;
    onView: (s: string) => void;
    onEdit: (s: string) => void;
    onMarkCompleted: (s: string) => void;
    onViewReceipt: (s: string) => void;
    onDownloadReceiptPdf?: (s: string) => void;
    onGenerateReceipt: (s: string) => void;
    onSendReminder: (s: string) => void;
    onDelete: (s: string) => void;
}) {
    const itemClass = cn(CTA_MENU_ITEM_BLOCK, 'gap-2.5 font-medium');

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={420} minMenuWidth={220}>
            {({ close }) => {
                const run = (fn: (s: string) => void) => {
                    fn(slug);
                    close();
                };
                return (
                    <>
                        <button type="button" className={itemClass} onClick={() => run(onView)}>
                            <LuEye size={16} className="shrink-0 text-slate-500" aria-hidden />
                            View details
                        </button>
                        {receiptReady ? (
                            <button type="button" className={itemClass} onClick={() => run(onViewReceipt)}>
                                <LuFileCheck size={16} className="shrink-0 text-slate-500" aria-hidden />
                                View receipt
                            </button>
                        ) : null}
                        {receiptReady && onDownloadReceiptPdf ? (
                            <button type="button" className={itemClass} onClick={() => run(onDownloadReceiptPdf)}>
                                <LuDownload size={16} className="shrink-0 text-slate-500" aria-hidden />
                                Download receipt (PDF)
                            </button>
                        ) : null}
                        <button type="button" className={itemClass} onClick={() => run(onEdit)}>
                            <LuPencil size={16} className="text-slate-500 shrink-0" />
                            Edit
                        </button>
                        {status !== 'Completed' ? (
                            <button
                                type="button"
                                className={cn(itemClass, 'text-emerald-800 hover:bg-emerald-50/80')}
                                onClick={() => run(onMarkCompleted)}
                            >
                                <LuCheck size={16} className="shrink-0 text-emerald-600" />
                                Mark completed
                            </button>
                        ) : null}
                        <div className="my-1 border-t border-slate-100" />
                        <button type="button" className={itemClass} onClick={() => run(onGenerateReceipt)}>
                            <LuFileText size={16} className="shrink-0 text-slate-500" />
                            Generate receipt
                        </button>
                        <button type="button" className={itemClass} onClick={() => run(onSendReminder)}>
                            <LuMail size={16} className="shrink-0 text-slate-500" />
                            Send reminder
                        </button>
                        <div className="my-1 border-t border-slate-100" />
                        <button
                            type="button"
                            className={cn(itemClass, 'text-rose-700 hover:bg-rose-50/90')}
                            onClick={() => run(onDelete)}
                        >
                            <LuTrash2 size={16} className="shrink-0 text-rose-600" aria-hidden />
                            Delete payment
                        </button>
                    </>
                );
            }}
        </PortaledRowActionsMenu>
    );
}
