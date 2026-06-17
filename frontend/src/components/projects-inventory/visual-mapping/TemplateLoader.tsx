'use client';

import React from 'react';
import { TEMPLATE_KEYS, TemplateKey } from './types';

export function TemplateLoader({
    selected,
    onSelect,
}: {
    selected: TemplateKey;
    onSelect: (key: TemplateKey) => void;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Choose template floor</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {TEMPLATE_KEYS.map((template) => (
                    <button
                        key={template}
                        onClick={() => onSelect(template)}
                        className={`rounded-xl border px-3 py-2 text-sm transition ${
                            selected === template
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        {template}
                    </button>
                ))}
            </div>
        </div>
    );
}
