'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

function buildQrModules(data: string, moduleCount = 21): boolean[][] {
    const grid: boolean[][] = Array.from({ length: moduleCount }, () => Array(moduleCount).fill(false));

    const drawFinder = (x: number, y: number) => {
        for (let dy = 0; dy < 7; dy += 1) {
            for (let dx = 0; dx < 7; dx += 1) {
                const onBorder = dx === 0 || dx === 6 || dy === 0 || dy === 6;
                const onCenter = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
                grid[y + dy][x + dx] = onBorder || onCenter;
            }
        }
    };

    drawFinder(0, 0);
    drawFinder(moduleCount - 7, 0);
    drawFinder(0, moduleCount - 7);

    let hash = 0;
    for (let i = 0; i < data.length; i += 1) {
        hash = (hash * 31 + data.charCodeAt(i)) >>> 0;
    }

    for (let y = 0; y < moduleCount; y += 1) {
        for (let x = 0; x < moduleCount; x += 1) {
            if (grid[y][x]) continue;
            if (y < 8 && x < 8) continue;
            if (y < 8 && x >= moduleCount - 8) continue;
            if (y >= moduleCount - 8 && x < 8) continue;
            hash = (hash * 1664525 + 1013904223 + x * 17 + y * 23) >>> 0;
            grid[y][x] = (hash & 1) === 1;
        }
    }

    return grid;
}

export function VisitorPassQr({
    value,
    size = 128,
    className,
}: {
    value: string;
    size?: number;
    className?: string;
}) {
    const modules = useMemo(() => buildQrModules(value), [value]);
    const moduleCount = modules.length;
    const cellSize = size / moduleCount;

    return (
        <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className={cn('rounded-md', className)}
            role="img"
            aria-label="Visitor pass QR code"
        >
            <rect width={size} height={size} fill="#ffffff" />
            {modules.map((row, y) =>
                row.map((on, x) =>
                    on ? (
                        <rect
                            key={`${x}-${y}`}
                            x={x * cellSize}
                            y={y * cellSize}
                            width={cellSize}
                            height={cellSize}
                            fill="#111111"
                        />
                    ) : null,
                ),
            )}
        </svg>
    );
}

export function visitorPassQrValue(passId: string, name: string) {
    return `ARRIS-VISITOR:${passId}:${name.replace(/\s+/g, '-')}`;
}
