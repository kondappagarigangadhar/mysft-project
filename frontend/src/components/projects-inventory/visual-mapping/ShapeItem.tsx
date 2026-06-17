'use client';

import React from 'react';
import type { DrawShapeType } from './drawEditorTypes';
import { SHAPE_COLOR_CLASSES } from './drawEditorTypes';
import { cn } from '@/lib/utils';

export const SHAPE_DRAG_MIME = 'application/x-draw-shape-type';

export function ShapeItem({ type, label }: { type: DrawShapeType; label: string }) {
    const color = SHAPE_COLOR_CLASSES[type];

    return (
        <div
            draggable
            onDragStart={(e) => {
                e.dataTransfer.setData(SHAPE_DRAG_MIME, type);
                e.dataTransfer.effectAllowed = 'copy';
            }}
            className={cn(
                'flex cursor-grab items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-primary/40 hover:shadow-md active:cursor-grabbing'
            )}
        >
            <div
                className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200/80',
                    color
                )}
                aria-hidden
            >
                <ShapeGlyph type={type} />
            </div>
            <span className="text-left text-sm font-semibold text-slate-800">{label}</span>
        </div>
    );
}

function ShapeGlyph({ type }: { type: DrawShapeType }) {
    switch (type) {
        case 'plot':
            return <div className="h-5 w-7 rounded-sm border border-slate-600/40 bg-white/50" />;
        case 'square':
            return <div className="h-6 w-6 rounded-sm border border-slate-600/40 bg-white/50" />;
        case 'road-h':
            return <div className="h-2 w-8 rounded-sm bg-slate-700/50" />;
        case 'road-v':
            return <div className="h-8 w-2 rounded-sm bg-slate-700/50" />;
        case 'cross-road':
            return (
                <div className="relative h-7 w-7">
                    <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 bg-slate-800/60" />
                    <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-slate-800/60" />
                </div>
            );
        case 'room':
            return <div className="h-5 w-5 rounded border border-slate-600/40 bg-white/60" />;
        case 'hall':
            return <div className="h-4 w-7 rounded border border-slate-600/40 bg-white/60" />;
        case 'kitchen':
            return <div className="h-5 w-6 rounded-sm border border-slate-600/40 bg-white/60" />;
        case 'parking':
            return <span className="text-[10px] font-bold text-slate-700">P</span>;
        case 'garden':
            return <div className="h-6 w-6 rounded-full border border-slate-600/40 bg-white/40" />;
        default:
            return null;
    }
}
