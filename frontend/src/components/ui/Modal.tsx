'use client';

import React, { useEffect, useId, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidthClassName?: string;
    bodyClassName?: string;
    /** `top`: form-style dialog near top of viewport (avoids vertically centered tall modals). */
    placement?: 'center' | 'top';
    /** Extra classes on the white panel (e.g. max width overrides). */
    panelClassName?: string;
}

export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidthClassName = 'max-w-lg',
    bodyClassName,
    placement = 'center',
    panelClassName,
}: ModalProps) => {
    const [show, setShow] = useState(false);
    const titleId = useId();

    useEffect(() => {
        if (isOpen) {
            setShow(true);
            document.body.style.overflow = 'hidden';
        } else {
            setTimeout(() => setShow(false), 300);
            document.body.style.overflow = 'auto';
        }
    }, [isOpen]);

    if (!show && !isOpen) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain p-4 transition-all duration-300',
                placement === 'top' ? 'items-start pt-6 pb-10 sm:pt-8 sm:pb-12' : 'items-center py-6 sm:py-8',
                isOpen ? 'opacity-100' : 'opacity-0',
            )}
        >
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
            <div
                className={cn(
                    'relative flex w-full max-h-[min(88dvh,calc(100dvh-2.5rem))] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl',
                    maxWidthClassName,
                    panelClassName,
                    'transform transition-all duration-300',
                    isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4',
                )}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
            >
                <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-6 sm:py-4">
                    <h3 id={titleId} className="pr-2 text-lg font-bold text-slate-800 sm:text-xl">
                        {title}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                        <IoClose size={24} />
                    </button>
                </div>
                <div className={cn('min-h-0 flex-1 overflow-y-auto p-5 sm:p-6', bodyClassName)}>{children}</div>
                {footer ? <div className="flex shrink-0 justify-end gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3.5 sm:px-6 sm:py-4">{footer}</div> : null}
            </div>
        </div>
    );
};
