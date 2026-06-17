'use client';

import Link from 'next/link';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import type { Vendor } from '@/lib/vendors/types';
import { LuCopy, LuEye, LuPencil, LuShieldAlert, LuTrash2, LuUpload } from 'react-icons/lu';

export function VendorRowActionsMenu({
    vendor,
    onUpload,
    onClone,
    onBlacklist,
    onDelete,
}: {
    vendor: Vendor;
    onUpload: (vendor: Vendor) => void;
    onClone: (vendor: Vendor) => void;
    onBlacklist: (vendor: Vendor) => void;
    onDelete: (vendor: Vendor) => void;
}) {
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={220} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link
                        href={`/company-admin/vendors/${vendor.id}`}
                        className={CTA_MENU_ITEM}
                        onClick={close}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/company-admin/vendors/${encodeURIComponent(vendor.id)}?edit=1`}
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
                            onUpload(vendor);
                        }}
                    >
                        <LuUpload size={16} className="text-slate-400" />
                        Upload Docs
                    </button>
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            onClone(vendor);
                        }}
                    >
                        <LuCopy size={16} className="text-slate-400" />
                        Clone Vendor
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            onBlacklist(vendor);
                        }}
                    >
                        <LuShieldAlert size={16} />
                        Blacklist
                    </button>
                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            onDelete(vendor);
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
