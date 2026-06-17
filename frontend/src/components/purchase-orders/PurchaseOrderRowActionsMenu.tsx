'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import type { PurchaseOrder } from '@/lib/purchaseOrderStore';
import { archivePurchaseOrder } from '@/lib/purchaseOrderStore';
import { LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

export function PurchaseOrderRowActionsMenu({
    row,
    onUpdated,
    onArchived,
}: {
    row: PurchaseOrder;
    onUpdated: () => void;
    onArchived: (row: PurchaseOrder) => void;
}) {
    const router = useRouter();

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={160} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link
                        href={`/procurement/purchase-orders/view/${encodeURIComponent(row.slug)}?tab=overview`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/procurement/purchase-orders/view/${encodeURIComponent(row.slug)}?tab=overview&edit=1`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            const ok = window.confirm(`Archive purchase order “${row.poNumber}”?`);
                            if (!ok) return;
                            if (archivePurchaseOrder(row.slug)) {
                                onArchived(row);
                                router.push('/procurement/purchase-orders');
                            }
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
