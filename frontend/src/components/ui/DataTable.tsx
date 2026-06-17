'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';

interface Column {
    key: string;
    label: string;
    className?: string; // Tailwind classes for visibility (e.g., 'hidden md:table-cell')
    render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    className?: string;
    expandable?: boolean;
}

export default function DataTable({ columns, data, className, expandable = false }: DataTableProps) {
    const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

    const toggleRow = (index: number) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Columns that are hidden on small screens
    const secondaryColumns = columns.filter(col => col.className && col.className.includes('hidden'));

    return (
        <div className={cn("bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm", className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            {expandable && <th className="px-4 py-3 w-10 sm:hidden"></th>}
                            {columns.map((col) => (
                                <th key={col.key} className={cn("px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider", col.className)}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((row, i) => (
                            <React.Fragment key={i}>
                                <tr className="group">
                                    {expandable && (
                                        <td className="px-4 py-3 sm:hidden">
                                            <button
                                                onClick={() => toggleRow(i)}
                                                className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
                                            >
                                                {expandedRows[i] ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
                                            </button>
                                        </td>
                                    )}
                                    {columns.map((col) => (
                                        <td key={col.key} className={cn("px-5 py-3 text-sm text-slate-600", col.className)}>
                                            {col.render ? col.render(row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>

                                {/* Expanded content for mobile only */}
                                {expandable && expandedRows[i] && (
                                    <tr className="sm:hidden bg-slate-50/30">
                                        <td colSpan={columns.length + 1} className="px-5 py-4">
                                            <div className="grid grid-cols-1 gap-3">
                                                {secondaryColumns.map(col => (
                                                    <div key={col.key} className="flex flex-col gap-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{col.label}</span>
                                                        <div className="text-sm text-slate-600">
                                                            {col.render ? col.render(row) : row[col.key]}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
