'use client';

import React, { useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface TableProps {
    columns: {
        key: string;
        header: string;
        render?: (item: any) => React.ReactNode;
        className?: string;
    }[];
    data: any[];
    className?: string;
    renderExpandedRow?: (item: any) => React.ReactNode;
    rowKey?: string;
    onRowClick?: (item: any) => void;
}

export const Table = ({ columns, data, className, renderExpandedRow, rowKey = 'id', onRowClick }: TableProps) => {
    const [expandedRows, setExpandedRows] = useState<Set<any>>(new Set());

    const toggleRow = (id: any) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    return (
        <div className={cn('w-full overflow-x-auto rounded-lg border border-slate-200', className)}>
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200">
                    <tr>
                        {renderExpandedRow && (
                            <th className="px-4 py-4 w-10"></th>
                        )}
                        {columns.map((column) => (
                            <th key={column.key} className={cn("px-6 py-4 whitespace-nowrap", column.className)}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                    {data.length > 0 ? (
                        data.map((item, index) => {
                            const isExpanded = expandedRows.has(item[rowKey] || index);
                            const clickable = Boolean(renderExpandedRow || onRowClick);
                            return (
                                <React.Fragment key={item[rowKey] || index}>
                                    <tr 
                                        className={cn(
                                            "group hover:bg-slate-50/50 transition-colors",
                                            clickable && "cursor-pointer",
                                            isExpanded && "bg-slate-50/50"
                                        )}
                                        onClick={() => {
                                            if (renderExpandedRow) toggleRow(item[rowKey] || index);
                                            else onRowClick?.(item);
                                        }}
                                    >
                                        {renderExpandedRow && (
                                            <td className="px-4 py-4 text-slate-400">
                                                <button 
                                                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleRow(item[rowKey] || index);
                                                    }}
                                                >
                                                    {isExpanded ? <LuChevronDown size={16} /> : <LuChevronRight size={16} />}
                                                </button>
                                            </td>
                                        )}
                                        {columns.map((column) => (
                                            <td key={column.key} className={cn("px-6 py-4 text-slate-600", column.className)}>
                                                {column.render ? column.render(item) : item[column.key]}
                                            </td>
                                        ))}
                                    </tr>
                                    {isExpanded && renderExpandedRow && (
                                        <tr>
                                            <td colSpan={columns.length + 1} className="p-0 border-b border-slate-100 bg-slate-50/30">
                                                {renderExpandedRow(item)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={columns.length + (renderExpandedRow ? 1 : 0)} className="px-6 py-10 text-center text-slate-400">
                                No data available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
