'use client';

import React from 'react';
import { LuBan, LuCopy, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';

export function PaymentLinkRowActionsMenu({
    onView,
    onEdit,
    onCopyUrl,
    onCancel,
    onDelete,
    canEdit,
    showCancel,
    showDelete,
}: {
    onView: () => void;
    onEdit: () => void;
    onCopyUrl: () => void;
    onCancel: () => void;
    onDelete: () => void;
    canEdit: boolean;
    showCancel: boolean;
    showDelete: boolean;
}) {
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={340} minMenuWidth={200}>
            {({ close }) => (
                <>
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            onView();
                        }}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </button>
                    {canEdit ? (
                        <button
                            type="button"
                            className={CTA_MENU_ITEM_BLOCK}
                            onClick={() => {
                                close();
                                onEdit();
                            }}
                        >
                            <LuPencil size={16} className="text-slate-400" />
                            Edit
                        </button>
                    ) : null}
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            onCopyUrl();
                        }}
                    >
                        <LuCopy size={16} className="text-slate-400" />
                        Copy URL
                    </button>
                    {showCancel ? (
                        <>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-800 hover:bg-amber-50"
                                onClick={() => {
                                    close();
                                    onCancel();
                                }}
                            >
                                <LuBan size={16} />
                                Cancel link
                            </button>
                        </>
                    ) : null}
                    {showDelete ? (
                        <>
                            <div className="my-1 border-t border-slate-100" />
                            <button
                                type="button"
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                                onClick={() => {
                                    close();
                                    onDelete();
                                }}
                            >
                                <LuTrash2 size={16} />
                                Delete
                            </button>
                        </>
                    ) : null}
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
