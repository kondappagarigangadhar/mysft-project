'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { downloadProjectsCsv, downloadProjectsExcel } from '@/lib/exportProjectsInventoryCsv';
import type { Project } from '@/lib/projectsInventoryStore';
import { LuChevronDown, LuDownload } from 'react-icons/lu';

type Props = {
    rows: Project[];
    label?: string;
    className?: string;
};

export function ProjectsExportMenu({ rows, label = 'Export', className }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    const base = `projects-export-${new Date().toISOString().slice(0, 10)}`;

    return (
        <div className={cn('relative', className)} ref={ref}>
            <Button type="button" variant="companyOutline" size="cta" className="gap-2" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
                <LuDownload size={18} />
                {label}
                <LuChevronDown size={16} className={cn('transition-transform', open && 'rotate-180')} />
            </Button>
            {open ? (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl ring-1 ring-black/5">
                    <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                            downloadProjectsCsv(rows, `${base}.csv`);
                            setOpen(false);
                        }}
                    >
                        Export as CSV
                    </button>
                    <button
                        type="button"
                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
                        onClick={() => {
                            downloadProjectsExcel(rows, `${base}.xls`);
                            setOpen(false);
                        }}
                    >
                        Export as Excel
                    </button>
                </div>
            ) : null}
        </div>
    );
}
