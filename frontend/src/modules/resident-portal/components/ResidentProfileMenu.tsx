'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LuChevronDown,
    LuCircleUser,
    LuCreditCard,
    LuFileText,
    LuHouse,
    LuLifeBuoy,
    LuLogOut,
} from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { useResidentSession, residentAuthApi } from '../store/residentSessionStore';
import { ResidentProfileAvatar } from './ResidentProfileAvatar';

const MENU_LINKS = [
    { label: 'View profile', href: '/resident/profile', icon: LuCircleUser },
    { label: 'My unit', href: '/resident/unit', icon: LuHouse },
    { label: 'Billing & payments', href: '/resident/billing', icon: LuCreditCard },
    { label: 'Documents', href: '/resident/documents', icon: LuFileText },
    { label: 'Support', href: '/resident/support', icon: LuLifeBuoy },
];

export function ResidentProfileMenu() {
    const router = useRouter();
    const { currentResident } = useResidentSession();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    if (!currentResident) return null;

    const firstName = currentResident.fullName.split(' ')[0];

    return (
        <div className="relative ml-0.5 shrink-0" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    'flex h-9 max-w-[180px] items-center gap-1.5 rounded-md px-1 transition-colors hover:bg-[#f3f2ef]',
                    open && 'bg-[#f3f2ef]',
                )}
                aria-expanded={open}
                aria-haspopup="menu"
                aria-label="Account menu"
            >
                <ResidentProfileAvatar name={currentResident.fullName} size="sm" />
                <span className="hidden truncate text-xs font-semibold text-[rgba(0,0,0,0.9)] lg:block">
                    {firstName}
                </span>
                <LuChevronDown
                    className={cn(
                        'hidden h-4 w-4 shrink-0 text-[rgba(0,0,0,0.6)] transition-transform lg:block',
                        open && 'rotate-180',
                    )}
                    aria-hidden
                />
            </button>

            {open ? (
                <div
                    className="absolute right-0 top-full z-[110] mt-1 w-[min(100vw-2rem,16rem)] overflow-hidden rounded-xl border border-[#e0dfdc] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    role="menu"
                >
                    <div className="border-b border-[#ebebeb] px-4 py-3">
                        <div className="flex items-center gap-3">
                            <ResidentProfileAvatar name={currentResident.fullName} size="md" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                                    {currentResident.fullName}
                                </p>
                                <p className="truncate text-xs text-[rgba(0,0,0,0.6)]">
                                    Unit {currentResident.unitNumber} · {currentResident.residentType}
                                </p>
                            </div>
                        </div>
                    </div>

                    <ul className="py-1">
                        {MENU_LINKS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        role="menuitem"
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[rgba(0,0,0,0.75)] transition-colors hover:bg-[#f3f2ef] hover:text-[rgba(0,0,0,0.9)]"
                                        onClick={() => setOpen(false)}
                                    >
                                        <Icon className="h-[18px] w-[18px] shrink-0 text-[rgba(0,0,0,0.6)]" aria-hidden />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="border-t border-[#ebebeb] py-1">
                        <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[rgba(0,0,0,0.75)] transition-colors hover:bg-[#f3f2ef] hover:text-[#b24020]"
                            onClick={() => {
                                setOpen(false);
                                residentAuthApi().logout();
                                router.push('/resident/login');
                            }}
                        >
                            <LuLogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
                            Sign out
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
