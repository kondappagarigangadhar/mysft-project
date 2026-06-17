'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LuChevronDown, LuCircleUser, LuLogOut, LuSettings } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const menuItemClass =
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-200 hover:translate-x-0.5 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]';

export function NavbarProfileMenu({
    displayName = 'Company Admin',
    email = 'naresh@mysft.ai',
    tone = 'default',
}: {
    displayName?: string;
    email?: string;
    /** Light control on blue company admin top bar */
    tone?: 'default' | 'onBlue';
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={cn(
                    'flex items-center gap-2 rounded-xl border px-2 py-1.5 pl-2 pr-2 transition-all sm:pl-3',
                    tone === 'onBlue'
                        ? 'border-white/25 bg-white/10 shadow-none hover:border-white/40 hover:bg-white/15'
                        : 'border-slate-200/80 bg-white shadow-sm hover:border-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] hover:shadow-md',
                    tone === 'onBlue' && open && 'border-white/40 ring-2 ring-white/25',
                    tone === 'default' &&
                        open &&
                        'border-[color-mix(in_srgb,var(--cta-button-bg)_40%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]',
                )}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="hidden text-right sm:block">
                    <p
                        className={cn(
                            'text-xs font-bold leading-tight',
                            tone === 'onBlue' ? 'text-[var(--navbar-text)]' : 'text-slate-800',
                        )}
                    >
                        {displayName}
                    </p>
                    <p
                        className={cn(
                            'max-w-[140px] truncate text-[10px]',
                            tone === 'onBlue' ? 'text-white/80' : 'text-slate-500',
                        )}
                    >
                        {email}
                    </p>
                </div>
                <div
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg shadow-inner',
                        tone === 'onBlue'
                            ? 'bg-white text-[var(--cta-button-bg)] ring-1 ring-white/40'
                            : 'bg-gradient-to-br from-[var(--cta-button-bg)] to-[var(--cta-button-hover-bg)] text-[var(--cta-button-text)]',
                    )}
                >
                    <LuCircleUser size={18} aria-hidden />
                </div>
                <LuChevronDown
                    className={cn(
                        'hidden h-4 w-4 transition-transform sm:block',
                        tone === 'onBlue' ? 'text-white/75' : 'text-slate-400',
                        open && 'rotate-180',
                    )}
                    aria-hidden
                />
            </button>

            {open ? (
                <div
                    className="absolute right-0 top-full z-[100] mt-2 w-56 min-w-[220px] overflow-hidden rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200 ease-out"
                    role="menu"
                >
                    <div className="rounded-lg border-b border-slate-100 bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] px-3 py-2.5 sm:hidden">
                        <p className="text-sm font-bold text-slate-800">{displayName}</p>
                        <p className="truncate text-xs text-slate-500">{email}</p>
                    </div>
                    <Link href="/profile" role="menuitem" className={menuItemClass} onClick={() => setOpen(false)}>
                        <LuCircleUser size={18} className="text-[var(--cta-button-bg)]" aria-hidden />
                        Profile
                    </Link>
                    <Link href="/settings" role="menuitem" className={menuItemClass} onClick={() => setOpen(false)}>
                        <LuSettings size={18} className="text-slate-500" aria-hidden />
                        Organization settings
                    </Link>
                    <div className="my-2 border-t border-slate-100" />
                    <Link
                        href="/login"
                        role="menuitem"
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition-all duration-200 hover:bg-rose-50"
                        onClick={() => setOpen(false)}
                    >
                        <LuLogOut size={18} aria-hidden />
                        Log out
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
