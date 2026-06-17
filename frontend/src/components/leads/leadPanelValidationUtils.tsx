'use client';

import React from 'react';
import { LuAsterisk } from 'react-icons/lu';

export const LEAD_PANEL_SCROLL_OFFSET_PX = 96;

/** Focus + scroll a panel control by `id` (input/textarea/select). */
export function focusPanelFieldById(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - LEAD_PANEL_SCROLL_OFFSET_PX;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
        const again = document.getElementById(id);
        if (again && 'focus' in again && typeof (again as HTMLElement & { focus: () => void }).focus === 'function') {
            (again as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).focus({ preventScroll: true });
        }
    }, 400);
}

export function RequiredAsteriskMark() {
    return (
        <LuAsterisk
            className="ml-0.5 inline h-2.5 w-2.5 align-[-0.1em] text-rose-500"
            strokeWidth={3}
            aria-hidden="true"
            title="Required"
        />
    );
}
