'use client';

import { useCallback, useEffect, useState } from 'react';

type FullscreenDoc = Document & {
    webkitFullscreenElement?: Element | null;
    webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenEl = HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
};

function fullscreenElement(): Element | null {
    if (typeof document === 'undefined') return null;
    const d = document as FullscreenDoc;
    return document.fullscreenElement ?? d.webkitFullscreenElement ?? null;
}

function isSupported(): boolean {
    if (typeof document === 'undefined') return false;
    const el = document.documentElement as FullscreenEl;
    return typeof el.requestFullscreen === 'function' || typeof el.webkitRequestFullscreen === 'function';
}

/** Browser fullscreen (same idea as F11): tab fills the screen via Fullscreen API. */
export function useBrowserFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [supported, setSupported] = useState(false);

    const sync = useCallback(() => {
        setIsFullscreen(Boolean(fullscreenElement()));
    }, []);

    useEffect(() => {
        setSupported(isSupported());
        sync();
        document.addEventListener('fullscreenchange', sync);
        document.addEventListener('webkitfullscreenchange', sync);
        return () => {
            document.removeEventListener('fullscreenchange', sync);
            document.removeEventListener('webkitfullscreenchange', sync);
        };
    }, [sync]);

    const toggle = useCallback(async () => {
        try {
            if (fullscreenElement()) {
                if (document.exitFullscreen) await document.exitFullscreen();
                else {
                    const d = document as FullscreenDoc;
                    if (d.webkitExitFullscreen) await Promise.resolve(d.webkitExitFullscreen());
                }
            } else {
                const el = document.documentElement as FullscreenEl;
                if (el.requestFullscreen) await el.requestFullscreen();
                else if (el.webkitRequestFullscreen) await Promise.resolve(el.webkitRequestFullscreen());
            }
        } catch {
            /* Blocked or unsupported */
        }
    }, []);

    return { isFullscreen, toggle, supported };
}
