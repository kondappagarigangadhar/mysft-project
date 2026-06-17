'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import type { Invoice } from '@/lib/invoiceStore';
import { duplicateInvoice } from '@/lib/invoiceStore';
import { LuCopy, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

export function InvoiceRowActionsMenu({
    invoice,
    onArchived,
    onDuplicated,
}: {
    invoice: Invoice;
    onArchived: (invoice: Invoice) => void;
    onDuplicated: (created: Invoice) => void;
}) {
    const router = useRouter();

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={190} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link
                        href={`/company-admin/invoices/view/${encodeURIComponent(invoice.slug)}?tab=overview`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/company-admin/invoices/view/${encodeURIComponent(invoice.slug)}?tab=overview&edit=1`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            const created = duplicateInvoice(invoice.slug);
                            if (!created) return;
                            onDuplicated(created);
                            router.push(`/company-admin/invoices/view/${encodeURIComponent(created.slug)}?tab=overview`);
                        }}
                    >
                        <LuCopy size={16} className="text-slate-400" />
                        Duplicate
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            onArchived(invoice);
                        }}
                    >
                        <LuTrash2 size={16} />
                        Archive
                    </button>
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
