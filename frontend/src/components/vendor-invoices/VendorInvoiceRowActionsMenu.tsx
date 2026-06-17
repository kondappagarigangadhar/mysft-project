'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import { archiveVendorInvoice, duplicateVendorInvoice, type VendorInvoice } from '@/lib/vendorInvoiceStore';
import { LuCopy, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

export function VendorInvoiceRowActionsMenu({
    invoice,
    onArchived,
    onDuplicated,
}: {
    invoice: VendorInvoice;
    onArchived: () => void;
    onDuplicated: (created: VendorInvoice) => void;
}) {
    const router = useRouter();
    const base = `/company-admin/vendors/invoices/view/${encodeURIComponent(invoice.slug)}`;

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={220} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link href={`${base}?tab=overview`} className={CTA_MENU_ITEM} onClick={close}>
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link href={`${base}?tab=overview&edit=1`} className={CTA_MENU_ITEM} onClick={close}>
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            const created = duplicateVendorInvoice(invoice.slug);
                            if (!created) return;
                            onDuplicated(created);
                            router.push(`/company-admin/vendors/invoices/view/${encodeURIComponent(created.slug)}?tab=overview`);
                        }}
                    >
                        <LuCopy size={16} className="text-slate-400" />
                        Clone
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            archiveVendorInvoice(invoice.slug);
                            onArchived();
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
