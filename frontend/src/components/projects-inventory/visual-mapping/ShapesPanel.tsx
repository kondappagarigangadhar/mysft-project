'use client';

import React from 'react';
import { SHAPES } from './drawEditorTypes';
import { ShapeItem } from './ShapeItem';

export function ShapesPanel() {
    return (
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Shapes toolbox</p>
            <p className="mb-3 text-xs text-red-800 leading-relaxed">
                Drag a shape onto the grid. Double-click a shape on the canvas to open the add-unit form (same as main mapping).
            </p>
            <div className="flex max-h-[calc(100vh-9rem)] flex-col gap-2 overflow-y-auto pr-1">
                {SHAPES.map((s) => (
                    <ShapeItem key={s.type} type={s.type} label={s.label} />
                ))}
            </div>
        </div>
    );
}
