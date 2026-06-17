import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getStatusStyles = (status: string) => {
        const s = status.toLowerCase();
        if (s.includes('active') || s.includes('progress') || s.includes('verified') || s.includes('completed') || s.includes('booked') || s.includes('closed')) {
            return 'bg-green-50 text-green-700 border-green-100';
        }
        if (s.includes('pending') || s.includes('planning') || s.includes('waiting') || s.includes('contacted') || s.includes('negotiation')) {
            return 'bg-orange-50 text-orange-700 border-orange-100';
        }
        if (s === 'inactive') {
            return 'bg-slate-100 text-slate-600 border-slate-200';
        }
        if (s.includes('suspended') || s.includes('delayed') || s.includes('cancelled') || s.includes('lost')) {
            return 'bg-red-50 text-red-700 border-red-100';
        }
        if (s.includes('new') || s.includes('interested')) {
            return 'bg-blue-50 text-blue-700 border-blue-100';
        }
        if (s.includes('site visit')) {
            return 'bg-purple-50 text-purple-700 border-purple-100';
        }
        return 'bg-slate-50 text-slate-700 border-slate-100';
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
            getStatusStyles(status)
        )}>
            {status}
        </span>
    );
}
