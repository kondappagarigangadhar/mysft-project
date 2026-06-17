import React from 'react';
import { cn } from '@/lib/utils';

type StatusModalType = 'success' | 'error';

export function StatusModal({
    open,
    type,
    title,
    subtitle = 'Your data has been updated.',
    autoCloseMs = 1700,
    onClose,
}: {
    open: boolean;
    type: StatusModalType;
    title: string;
    subtitle?: string;
    autoCloseMs?: number;
    onClose: () => void;
}) {
    const [render, setRender] = React.useState(open);
    const [shown, setShown] = React.useState(open);
    const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const unmountTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
        return () => {
            if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
        };
    }, []);

    React.useEffect(() => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);

        if (open) {
            setRender(true);
            const raf = window.requestAnimationFrame(() => setShown(true));
            closeTimerRef.current = setTimeout(() => onClose(), autoCloseMs);
            return () => window.cancelAnimationFrame(raf);
        }

        setShown(false);
        unmountTimerRef.current = setTimeout(() => setRender(false), 220);
        return;
    }, [open, autoCloseMs, onClose]);

    if (!render) return null;

    const isSuccess = type === 'success';
    const iconRing = isSuccess ? 'bg-emerald-50 ring-1 ring-emerald-200/70' : 'bg-rose-50 ring-1 ring-rose-200/70';
    const iconColor = isSuccess ? 'text-emerald-600' : 'text-rose-600';

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-opacity duration-200',
                shown ? 'opacity-100' : 'opacity-0',
            )}
            role="dialog"
            aria-modal="true"
            aria-live={isSuccess ? 'polite' : 'assertive'}
        >
            <div
                className={cn(
                    'w-[320px] rounded-xl bg-white p-6 text-center shadow-2xl transition duration-200',
                    shown ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                )}
            >
                <div className={cn('mx-auto flex h-14 w-14 items-center justify-center rounded-full', iconRing)}>
                    {isSuccess ? (
                        <svg viewBox="0 0 24 24" className={cn('h-8 w-8', iconColor)} fill="none" aria-hidden="true">
                            <path
                                d="M20 6L9 17l-5-5"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" className={cn('h-8 w-8', iconColor)} fill="none" aria-hidden="true">
                            <path
                                d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    )}
                </div>

                <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>
        </div>
    );
}

