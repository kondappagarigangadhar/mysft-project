'use client';

import React, { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import { cn } from '@/lib/utils';

export type LookupShellVariant = 'center' | 'drawer';

export function LookupShell({
    open,
    onClose,
    variant = 'center',
    children,
    className,
    panelClassName,
    'aria-label': ariaLabel = 'Lookup',
}: {
    open: boolean;
    onClose: () => void;
    variant?: LookupShellVariant;
    children: React.ReactNode;
    className?: string;
    panelClassName?: string;
    'aria-label'?: string;
}) {
    const [mounted, setMounted] = React.useState(false);

    useEffect(() => {
        if (open) {
            setMounted(true);
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }
        const t = window.setTimeout(() => setMounted(false), 280);
        return () => window.clearTimeout(t);
    }, [open]);

    if (!mounted && !open) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex transition-all duration-300 ease-out',
                variant === 'drawer' ? 'justify-end' : 'items-center justify-center p-3 sm:p-6',
                open ? 'opacity-100' : 'pointer-events-none opacity-0'
            )}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
        >
            <button
                type="button"
                className={cn(
                    'absolute inset-0 bg-slate-900/45 backdrop-blur-[2px] transition-opacity duration-300',
                    open ? 'opacity-100' : 'opacity-0'
                )}
                aria-label="Close"
                onClick={onClose}
            />
            <div
                className={cn(
                    'relative flex max-h-[min(92vh,900px)] w-full min-h-0 flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-slate-900/10 transition duration-300 ease-out',
                    variant === 'drawer'
                        ? cn(
                              'h-full max-w-full sm:max-w-2xl rounded-none sm:rounded-l-2xl',
                              open ? 'translate-x-0' : 'translate-x-full'
                          )
                        : cn(
                              'max-w-4xl rounded-2xl',
                              open ? 'scale-100 translate-y-0 opacity-100' : 'scale-[0.98] translate-y-3 opacity-0'
                          ),
                    className,
                    panelClassName
                )}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

export function LookupShellHeader({
    title,
    description,
    onClose,
    children,
}: {
    title: string;
    description?: string;
    onClose: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div className="flex shrink-0 flex-col border-b border-slate-100 bg-linear-to-r from-slate-50/90 to-white px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>
                    {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Close dialog"
                >
                    <IoClose size={22} />
                </button>
            </div>
            {children ? <div className="mt-4">{children}</div> : null}
        </div>
    );
}

export function LookupShellFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={cn(
                'shrink-0 border-t border-slate-100 bg-slate-50/90 px-5 py-4 sm:px-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
                className
            )}
        >
            {children}
        </div>
    );
}
