'use client';

import React from 'react';
import { canvasHeight, canvasWidth, getCentroid, toPointsString } from './helpers';
import { STATUS_COLORS, UnitMap } from './types';
import type { LayoutElement } from './layoutElements';
import { AILayoutOverlay } from './AILayoutOverlay';
import { cn } from '@/lib/utils';

export function UnitCanvas({
    layoutUrl,
    layoutLabel,
    showGrid,
    pan,
    zoom,
    units,
    selectedUnitId,
    hoveredUnitId,
    previewRect,
    drawingPolygon,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onClick,
    onDoubleClick,
    onWheel,
    onUnitMouseDown,
    onUnitClick,
    onUnitEnter,
    onUnitLeave,
    onResizeMouseDown,
    setCanvasRef,
    showResizeHandles = true,
    canvasWidthProp,
    canvasHeightProp,
    layoutElements,
    outerClassName,
}: {
    layoutUrl: string;
    layoutLabel: string;
    showGrid: boolean;
    pan: { x: number; y: number };
    zoom: number;
    units: UnitMap[];
    selectedUnitId: string | null;
    hoveredUnitId: string | null;
    previewRect: { x: number; y: number; width: number; height: number } | null;
    drawingPolygon: { x: number; y: number }[];
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
    onMouseUp: () => void;
    onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
    onWheel: (e: React.WheelEvent<HTMLDivElement>) => void;
    onUnitMouseDown: (e: React.MouseEvent, unitId: string) => void;
    onUnitClick: (e: React.MouseEvent, unit: UnitMap) => void;
    onUnitEnter: (unitId: string) => void;
    onUnitLeave: (unitId: string) => void;
    onResizeMouseDown: (e: React.MouseEvent, unitId: string, handle: 'nw' | 'ne' | 'sw' | 'se') => void;
    setCanvasRef: (el: HTMLDivElement | null) => void;
    showResizeHandles?: boolean;
    canvasWidthProp?: number;
    canvasHeightProp?: number;
    /** AI Draw Mode: roads, building shell, rooms (plots still rendered in SVG). */
    layoutElements?: LayoutElement[];
    /** Override default fixed canvas shell height (e.g. draw focus mode). */
    outerClassName?: string;
}) {
    const safeCanvasWidth = canvasWidthProp && canvasWidthProp > 0 ? canvasWidthProp : canvasWidth;
    const safeCanvasHeight = canvasHeightProp && canvasHeightProp > 0 ? canvasHeightProp : canvasHeight;
    return (
        <div
            ref={setCanvasRef}
            className={cn(
                'relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50',
                outerClassName ?? 'h-[620px]'
            )}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            onWheel={onWheel}
        >
            <div
                className="absolute left-0 top-0 origin-top-left"
                style={{
                    width: `${safeCanvasWidth}px`,
                    height: `${safeCanvasHeight}px`,
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                }}
            >
                {layoutUrl ? (
                    <img src={layoutUrl} alt="layout" className="absolute inset-0 h-full w-full object-contain pointer-events-none" />
                ) : (
                    <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-slate-100 to-slate-200 text-slate-500 text-sm font-medium">
                        {layoutLabel}
                    </div>
                )}

                {layoutElements && layoutElements.length > 0 ? (
                    <AILayoutOverlay
                        variant="under"
                        elements={layoutElements}
                        canvasWidth={safeCanvasWidth}
                        canvasHeight={safeCanvasHeight}
                    />
                ) : null}

                <svg
                    width={safeCanvasWidth}
                    height={safeCanvasHeight}
                    className="absolute left-0 top-0 z-[2]"
                    viewBox={`0 0 ${safeCanvasWidth} ${safeCanvasHeight}`}
                >
                    {showGrid ? (
                        <>
                            {Array.from({ length: Math.floor(safeCanvasWidth / 40) }).map((_, idx) => (
                                <line key={`grid-v-${idx}`} x1={idx * 40} y1={0} x2={idx * 40} y2={safeCanvasHeight} stroke="#e2e8f0" strokeWidth={1} />
                            ))}
                            {Array.from({ length: Math.floor(safeCanvasHeight / 40) }).map((_, idx) => (
                                <line key={`grid-h-${idx}`} x1={0} y1={idx * 40} x2={safeCanvasWidth} y2={idx * 40} stroke="#e2e8f0" strokeWidth={1} />
                            ))}
                        </>
                    ) : null}

                    {units.map((unit) => {
                        const centroid = getCentroid(unit.shape);
                        const isSelected = selectedUnitId === unit.id;
                        const isHovered = hoveredUnitId === unit.id;
                        const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2;
                        const fillOpacity = isSelected ? 0.45 : isHovered ? 0.38 : 0.3;

                        return (
                            <g
                                key={unit.id}
                                onMouseDown={(e) => onUnitMouseDown(e, unit.id)}
                                onMouseEnter={() => onUnitEnter(unit.id)}
                                onMouseLeave={() => onUnitLeave(unit.id)}
                                onClick={(e) => onUnitClick(e, unit)}
                                className="cursor-pointer"
                            >
                                {unit.shape.type === 'rect' ? (
                                    <rect
                                        x={unit.shape.x}
                                        y={unit.shape.y}
                                        width={unit.shape.width}
                                        height={unit.shape.height}
                                        fill={STATUS_COLORS[unit.status]}
                                        fillOpacity={fillOpacity}
                                        stroke={STATUS_COLORS[unit.status]}
                                        strokeWidth={strokeWidth}
                                        rx={4}
                                        className="transition-all duration-150"
                                    />
                                ) : (
                                    <polygon
                                        points={toPointsString(unit.shape.points)}
                                        fill={STATUS_COLORS[unit.status]}
                                        fillOpacity={fillOpacity}
                                        stroke={STATUS_COLORS[unit.status]}
                                        strokeWidth={strokeWidth}
                                        className="transition-all duration-150"
                                    />
                                )}
                                <text x={centroid.x} y={centroid.y} textAnchor="middle" dominantBaseline="middle" fontSize={14} fontWeight={700} fill="#0f172a">
                                    {unit.plotNumber}
                                </text>
                                <text x={centroid.x} y={centroid.y + 14} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#334155">
                                    F{unit.floor} | {unit.facing}
                                </text>

                                {showResizeHandles && isSelected && unit.shape.type === 'rect' ? (
                                    <>
                                        <circle cx={unit.shape.x} cy={unit.shape.y} r={5} fill="#fff" stroke="#0f172a" strokeWidth={1.5} onMouseDown={(e) => onResizeMouseDown(e, unit.id, 'nw')} />
                                        <circle cx={unit.shape.x + unit.shape.width} cy={unit.shape.y} r={5} fill="#fff" stroke="#0f172a" strokeWidth={1.5} onMouseDown={(e) => onResizeMouseDown(e, unit.id, 'ne')} />
                                        <circle cx={unit.shape.x} cy={unit.shape.y + unit.shape.height} r={5} fill="#fff" stroke="#0f172a" strokeWidth={1.5} onMouseDown={(e) => onResizeMouseDown(e, unit.id, 'sw')} />
                                        <circle cx={unit.shape.x + unit.shape.width} cy={unit.shape.y + unit.shape.height} r={5} fill="#fff" stroke="#0f172a" strokeWidth={1.5} onMouseDown={(e) => onResizeMouseDown(e, unit.id, 'se')} />
                                    </>
                                ) : null}
                            </g>
                        );
                    })}

                    {previewRect ? (
                        <rect x={previewRect.x} y={previewRect.y} width={previewRect.width} height={previewRect.height} fill="#0092ff" fillOpacity={0.2} stroke="#0092ff" strokeDasharray="6 4" />
                    ) : null}

                    {drawingPolygon.length > 0 ? (
                        <polygon points={toPointsString(drawingPolygon)} fill="#0092ff" fillOpacity={0.2} stroke="#0092ff" strokeWidth={2} strokeDasharray="6 4" />
                    ) : null}
                    {drawingPolygon.map((point, index) => (
                        <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={4} fill="#0092ff" />
                    ))}
                </svg>

                {layoutElements && layoutElements.length > 0 ? (
                    <AILayoutOverlay
                        variant="over"
                        elements={layoutElements}
                        canvasWidth={safeCanvasWidth}
                        canvasHeight={safeCanvasHeight}
                    />
                ) : null}
            </div>
        </div>
    );
}
