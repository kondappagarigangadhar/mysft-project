'use client';

import React from 'react';
import Link from 'next/link';
import { LuEye, LuPencil } from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM } from '@/lib/theme/ctaThemeClasses';
import type { InventoryUnit } from '@/lib/projectsInventoryStore';

export function InventoryRowActionsMenu({
    unit,
    viewHref,
    editHref,
}: {
    unit: InventoryUnit;
    /** Open project inventory tab for this unit (read-only). */
    viewHref: string;
    /** Same page with inline edit enabled (`?edit=1`). */
    editHref: string;
}) {
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={140} minMenuWidth={200}>
            {({ close }) => (
                <>
                    <Link
                        href={viewHref}
                        className={CTA_MENU_ITEM}
                        onClick={() => close()}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={editHref}
                        className={CTA_MENU_ITEM}
                        onClick={() => close()}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
