'use client';

import React from 'react';
import type { LayoutElement } from './layoutElements';

type OverlayVariant = 'under' | 'over';

/**
 * Non-plot layout layers (roads, building shell, rooms) using absolute divs + optional SVG polygon.
 * Plots stay on the main SVG canvas as interactive units. pointer-events: none so drag/select still works.
 * `under` = roads + building (below SVG). `over` = rooms (above semi-transparent plot fills).
 */
export function AILayoutOverlay({
    elements,
    canvasWidth,
    canvasHeight,
    variant,
}: {
    elements: LayoutElement[];
    canvasWidth: number;
    canvasHeight: number;
    variant: OverlayVariant;
}) {
    const decor = elements.filter((e) => e.type !== 'plot');
    const filtered =
        variant === 'under' ? decor.filter((e) => e.type === 'road' || e.type === 'building') : decor.filter((e) => e.type === 'room');

    return (
        <div
            className={`pointer-events-none absolute left-0 top-0 ${variant === 'under' ? 'z-[1]' : 'z-[3]'}`}
            style={{ width: canvasWidth, height: canvasHeight }}
            aria-hidden
        >
            {filtered.map((el) => {
                if (el.type === 'road') {
                    const w = el.width ?? 40;
                    const h = el.height ?? 12;
                    return (
                        <div
                            key={el.id}
                            className="absolute rounded-sm bg-slate-500/85 shadow-inner ring-1 ring-slate-600/40"
                            style={{ left: el.x, top: el.y, width: w, height: h }}
                            title={el.label}
                        />
                    );
                }

                if (el.type === 'building') {
                    if (el.shape === 'l-shape' && el.points && el.points.length >= 3) {
                        const xs = el.points.map((p) => p.x);
                        const ys = el.points.map((p) => p.y);
                        const minX = Math.min(...xs);
                        const minY = Math.min(...ys);
                        const maxX = Math.max(...xs);
                        const maxY = Math.max(...ys);
                        const bw = maxX - minX;
                        const bh = maxY - minY;
                        const pts = el.points.map((p) => `${p.x - minX},${p.y - minY}`).join(' ');
                        return (
                            <svg
                                key={el.id}
                                className="absolute overflow-visible text-slate-400/90"
                                style={{ left: minX, top: minY, width: bw, height: bh }}
                                viewBox={`0 0 ${bw} ${bh}`}
                            >
                                <polygon
                                    points={pts}
                                    fill="rgb(148 163 184 / 0.12)"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeDasharray="6 4"
                                    vectorEffect="non-scaling-stroke"
                                />
                                {el.label ? (
                                    <text x={bw / 2} y={bh / 2} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
                                        {el.label}
                                    </text>
                                ) : null}
                            </svg>
                        );
                    }

                    const w = el.width ?? 200;
                    const h = el.height ?? 160;
                    return (
                        <div
                            key={el.id}
                            className="absolute rounded-xl border-2 border-dashed border-slate-400 bg-slate-300/15 shadow-sm"
                            style={{ left: el.x, top: el.y, width: w, height: h }}
                        >
                            {el.label ? (
                                <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                                    {el.label}
                                </span>
                            ) : null}
                        </div>
                    );
                }

                if (el.type === 'room') {
                    const w = el.width ?? 32;
                    const h = el.height ?? 28;
                    return (
                        <div
                            key={el.id}
                            className="absolute flex items-center justify-center rounded-md border border-sky-200 bg-white/95 text-[9px] font-semibold text-sky-900 shadow-sm ring-1 ring-sky-100"
                            style={{ left: el.x, top: el.y, width: w, height: h }}
                        >
                            {el.label ?? 'Rm'}
                        </div>
                    );
                }

                return null;
            })}
        </div>
    );
}
