'use client';

import React from 'react';
import Link from 'next/link';
import { LuArchiveRestore, LuEye, LuPencil, LuTrash2 } from 'react-icons/lu';
import { PortaledRowActionsMenu } from '@/components/ui/PortaledRowActionsMenu';
import { CTA_MENU_ITEM, CTA_MENU_ITEM_BLOCK } from '@/lib/theme/ctaThemeClasses';
import type { Project } from '@/lib/projectsInventoryStore';

export function ProjectRowActionsMenu({
    project,
    onDelete,
    onArchive,
}: {
    project: Project;
    onDelete: (p: Project) => void;
    onArchive: (p: Project) => void;
}) {
    const isArchived = project.archived === true;
    return (
        <PortaledRowActionsMenu estimatedMenuHeight={260} minMenuWidth={220}>
            {({ close }) => (
                <>
                    <Link
                        href={`/projects-inventory/projects/view/${project.slug}`}
                        className={CTA_MENU_ITEM}
                        onClick={() => close()}
                    >
                        <LuEye size={16} className="text-slate-400" />
                        View
                    </Link>
                    <Link
                        href={`/projects-inventory/projects/view/${project.slug}?tab=overview&edit=1`}
                        className={CTA_MENU_ITEM}
                        onClick={() => close()}
                    >
                        <LuPencil size={16} className="text-slate-400" />
                        Edit
                    </Link>

                    <button
                        type="button"
                        className={CTA_MENU_ITEM_BLOCK}
                        onClick={() => {
                            close();
                            onArchive(project);
                        }}
                    >
                        <LuArchiveRestore size={16} className="text-slate-400" />
                        {isArchived ? 'Restore' : 'Archive'}
                    </button>

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
                        Delete
                    </button>
                </>
            )}
        </PortaledRowActionsMenu>
    );
}
