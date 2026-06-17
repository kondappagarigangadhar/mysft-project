'use client';

import Link from 'next/link';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import type { SupplierRecord } from '@/lib/suppliers/types';
import { LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

export function SupplierRowActionsMenu({
    supplier,
    onDelete,
}: {
    supplier: SupplierRecord;
    onDelete: (supplier: SupplierRecord) => void;
}) {
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={160} minMenuWidth={200}>
            {({ close }) => (
                <>
                    <Link
                        href={`/company-admin/suppliers/${encodeURIComponent(supplier.id)}`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/company-admin/suppliers/${encodeURIComponent(supplier.id)}?tab=overview&edit=1`}
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
                            onDelete(supplier);
                        }}
                    >
                        <LuTrash2 size={16} />
                        Delete
                    </button>
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
