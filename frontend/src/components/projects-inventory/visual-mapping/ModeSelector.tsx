'use client';

import React from 'react';
import { MappingMode } from './types';

export function ModeSelector({
    mode,
    onChange,
}: {
    mode: MappingMode;
    onChange: (next: MappingMode) => void;
}) {
    return (
        <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Page Type</label>
            <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                <button
                    type="button"
                    onClick={() => onChange('upload')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        mode === 'upload' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                    }`}
                >
                    Upload Layout
                </button>
                <button
                    type="button"
                    onClick={() => onChange('draw')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        mode === 'draw' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                    }`}
                >
                    Draw Mode
                </button>
                <button
                    type="button"
                    onClick={() => onChange('template')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        mode === 'template' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                    }`}
                >
                    Template Mode
                </button>
                <button
                    type="button"
                    onClick={() => onChange('aiDraw')}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                        mode === 'aiDraw' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-white'
                    }`}
                >
                    AI Draw Mode
                </button>
            </div>
        </div>
    );
}
