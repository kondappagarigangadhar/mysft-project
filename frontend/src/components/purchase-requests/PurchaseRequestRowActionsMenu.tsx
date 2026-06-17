'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import type { PurchaseRequest } from '@/lib/purchaseRequestStore';
import { archivePurchaseRequest, setApprovalStatus } from '@/lib/purchaseRequestStore';
import { LuBan, LuCheck, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';

export function PurchaseRequestRowActionsMenu({
    row,
    onUpdated,
    onArchived,
}: {
    row: PurchaseRequest;
    onUpdated: () => void;
    onArchived: (row: PurchaseRequest) => void;
}) {
    const router = useRouter();

    return (
        <PortaledRowActionsMenu estimatedMenuHeight={220} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link
                        href={`/procurement/requests/view/${encodeURIComponent(row.slug)}?tab=overview`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/procurement/requests/view/${encodeURIComponent(row.slug)}?tab=overview&edit=1`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>
                    {row.approval.status === 'Pending' ? (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-emerald-800 hover:bg-emerald-50"
                            onClick={() => {
                                close();
                                const ok = window.confirm(`Approve ${row.prNumber}?`);
                                if (!ok) return;
                                setApprovalStatus(row.slug, 'Approved');
                                onUpdated();
                            }}
                        >
                            <LuCheck size={16} className="text-emerald-600" />
                            Approve
                        </button>
                    ) : null}
                    {row.approval.status === 'Pending' ? (
                        <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-800 hover:bg-rose-50"
                            onClick={() => {
                                close();
                                const ok = window.confirm(`Reject ${row.prNumber}?`);
                                if (!ok) return;
                                setApprovalStatus(row.slug, 'Rejected');
                                onUpdated();
                            }}
                        >
                            <LuBan size={16} className="text-rose-600" />
                            Reject
                        </button>
                    ) : null}
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            const ok = window.confirm(`Archive purchase request “${row.prNumber}”? You can restore it later.`);
                            if (!ok) return;
                            if (archivePurchaseRequest(row.slug)) {
                                onArchived(row);
                                router.push('/procurement/requests');
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
