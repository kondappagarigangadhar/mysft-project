'use client';

import React from 'react';
import Link from 'next/link';
import { LuArrowRight, LuPencil, LuTrash2 } from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import type { Project } from '@/lib/projectsInventoryStore';

export function PricingRowActionsMenu({
    project,
    onOpenPricing,
    onDelete,
}: {
    project: Project;
    onOpenPricing: (slug: string) => void;
    onDelete: (p: Project) => void;
}) {
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={240} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            onOpenPricing(project.slug);
                        }}
                    >
                        <LuArrowRight size={16} className="text-slate-400" />
                        Open pricing tab
                    </button>
                    <Link
                        href={`/projects-inventory/projects/view/${project.slug}?tab=overview&edit=1`}
                        className={CTA_MENU_ITEM}
                        onClick={() => close()}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit project
                    </Link>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                        onClick={() => {
                            close();
                            onDelete(project);
                        }}
                    >
                        <LuTrash2 size={16} />
                        Delete project
                    </button>
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
