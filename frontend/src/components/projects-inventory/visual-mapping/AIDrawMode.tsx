'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TextAreaField } from '@/components/forms/Fields';
import { LuSave, LuSparkles } from 'react-icons/lu';
import type { UnitMap } from './types';
import { generateLayout, layoutElementsToUnitMaps, type LayoutElement } from './layoutElements';

const AI_LAYOUTS_STORAGE_KEY = 'aiLayouts';

export type AIDrawModeProps = {
    projectName: string;
    layoutName: string;
    currentUnits: UnitMap[];
    currentElements: LayoutElement[];
    onApplyLayout: (elements: LayoutElement[], units: UnitMap[]) => void;
};

/**
 * AI Draw Mode — prompt UI, `generateLayout` (mock), optional localStorage save.
 * No backend / OpenAI integration.
 */
export function AIDrawMode({ projectName, layoutName, currentUnits, currentElements, onApplyLayout }: AIDrawModeProps) {
    const [prompt, setPrompt] = useState('');
    const [lastMockJson, setLastMockJson] = useState<string>('');
    const [saveHint, setSaveHint] = useState<string | null>(null);

    const handleGenerate = () => {
        const elements = generateLayout(prompt);
        setLastMockJson(JSON.stringify(elements, null, 2));
        const units = layoutElementsToUnitMaps(elements, projectName || 'Project', layoutName || 'Layout');
        onApplyLayout(elements, units);
        setSaveHint(null);
    };

    const handleSaveLayout = () => {
        const plots = currentUnits
            .filter((u): u is UnitMap & { shape: { type: 'rect'; x: number; y: number; width: number; height: number } } => u.shape.type === 'rect')
            .map((u) => ({
                id: u.plotNumber,
                x: u.shape.x,
                y: u.shape.y,
                width: u.shape.width,
                height: u.shape.height,
                status: u.status === 'blocked' ? 'available' : u.status,
            }));

        const payload = {
            savedAt: new Date().toISOString(),
            projectName,
            layoutName,
            elements: currentElements,
            plots,
        };
        try {
            localStorage.setItem(AI_LAYOUTS_STORAGE_KEY, JSON.stringify(payload));
            setSaveHint('Layout saved to this browser (localStorage, key "aiLayouts").');
        } catch {
            setSaveHint('Could not save (storage unavailable).');
        }
    };

    return (
        <div className="rounded-xl border border-orange-600 bg-orange-50 p-4 shadow-sm ">
            <div className="mb-3 flex items-center gap-2 ">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                    <LuSparkles size={18} />
                </span>
                <div>
                    <p className="text-sm font-semibold text-slate-800">AI Draw Mode</p>
                    <p className="text-xs text-slate-500">
                        Mock layout: plots, roads, L-shapes, building shell, nested rooms — driven by your prompt.
                    </p>
                </div>
            </div>

            <TextAreaField
                label="Layout prompt"
                placeholder="Describe layout (e.g., create 20 plots in 4 rows with roads)"
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="text-sm"
            />

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="button" variant="company" className="h-9 rounded-lg text-sm" onClick={handleGenerate}>
                    <LuSparkles className="mr-1.5" size={16} />
                    Generate Layout
                </Button>
                <Button
                    type="button"
                    variant="companyOutline"
                    className="h-9 rounded-lg border-slate-200 text-sm"
                    onClick={handleSaveLayout}
                    disabled={currentUnits.length === 0}
                >
                    <LuSave className="mr-1.5" size={16} />
                    Save Layout
                </Button>
            </div>

            {saveHint ? <p className="mt-2 text-xs font-medium text-emerald-700">{saveHint}</p> : null}

            {lastMockJson ? (
                <details className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <summary className="cursor-pointer text-xs font-semibold text-slate-600">Last generated elements (JSON)</summary>
                    <pre className="mt-2 max-h-40 overflow-auto text-[11px] leading-relaxed text-slate-700">{lastMockJson}</pre>
                </details>
            ) : null}
        </div>
    );
}

export { AI_LAYOUTS_STORAGE_KEY };
