'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: IconType;
    trend?: string;
    trendUp?: boolean;
    linkTo?: string;
    className?: string;
}

const StatsCard = ({ title, value, icon: Icon, trend, trendUp, linkTo, className }: StatsCardProps) => {
    const content = (
        <div className={cn("stat-card group h-full", linkTo && "cursor-pointer", className)}>
            <div className="flex items-start justify-between h-full">
                <div className="flex h-full flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        <p className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
                    </div>
                    {trend && (
                        <p
                            className={cn(
                                'mt-2 flex items-center gap-1 text-xs font-semibold',
                                trendUp ? 'text-[#22c55e]' : 'text-[#ef4444]'
                            )}
                        >
                            {trendUp ? '↑' : '↓'} {trend}
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 rounded-xl border border-[#0092ff]/20 bg-[#0092ff]/10 p-3 text-[#0092ff] shadow-sm transition-all duration-200 group-hover:border-[#0092ff]/35 group-hover:bg-[#0092ff]/15">
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );

    if (linkTo) return <Link href={linkTo} className="block h-full">{content}</Link>;
    return content;
};

export default StatsCard;
