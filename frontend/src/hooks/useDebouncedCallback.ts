'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delayMs: number,
): (...args: Parameters<T>) => void {
    const t = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fnRef = useRef(fn);

    useEffect(() => {
        fnRef.current = fn;
    }, [fn]);

    useEffect(
        () => () => {
            if (t.current) clearTimeout(t.current);
        },
        [],
    );

    return useCallback(
        (...args: Parameters<T>) => {
            if (t.current) clearTimeout(t.current);
            t.current = setTimeout(() => {
                fnRef.current(...args);
            }, delayMs);
        },
        [delayMs],
    );
}
