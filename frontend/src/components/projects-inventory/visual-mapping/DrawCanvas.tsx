'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd, type HandleStyles } from 'react-rnd';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/forms/Fields';
import { LuMove, LuZoomIn, LuZoomOut, LuRotateCcw, LuTrash2, LuGrid3X3 } from 'react-icons/lu';
import { ShapesPanel } from './ShapesPanel';
import { SHAPE_DRAG_MIME } from './ShapeItem';
import type { DrawShape, DrawShapeType } from './drawEditorTypes';
import {
    GRID_SIZE,
    MIN_SHAPE_SIZE,
    SHAPE_COLOR_CLASSES,
    SHAPE_SIZES,
    shapeDisplayName,
    shapeLabel,
    snapCoord,
} from './drawEditorTypes';
import type { DrawMode } from './types';
import { clamp, uid } from './helpers';
import { cn } from '@/lib/utils';

/** react-rnd v10+ does not ship dist/styles.css; style handles explicitly. */
const RND_RESIZE_HANDLE_STYLES: HandleStyles = {
    top: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'ns-resize' },
    topRight: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'nesw-resize' },
    right: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'ew-resize' },
    bottomRight: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'nwse-resize' },
    bottom: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'ns-resize' },
    bottomLeft: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'nesw-resize' },
    left: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'ew-resize' },
    topLeft: { width: 10, height: 10, background: '#f97316', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, cursor: 'nwse-resize' },
};

export type DrawCanvasProps = {
    shapes: DrawShape[];
    onShapesChange: React.Dispatch<React.SetStateAction<DrawShape[]>>;
    selectedShapeId: string | null;
    onSelectShape: (id: string | null) => void;
    showGrid: boolean;
    onShowGridChange: (next: boolean) => void;
    drawMode: DrawMode;
    onDrawModeChange: (mode: DrawMode) => void;
    zoom: number;
    onZoomChange: React.Dispatch<React.SetStateAction<number>>;
    pan: { x: number; y: number };
    onPanChange: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
    canvasWidth: number;
    canvasHeight: number;
    /** Opens inventory form with a default rectangle (upload/template-style flow). */
    onQuickAddUnit?: () => void;
    /** Opens inventory form using the selected shape’s bounds. */
    onRegisterShapeAsUnit?: () => void;
    /** Opens the same add-unit drawer for this shape (e.g. double-click on canvas). */
    onOpenShapeAsUnit?: (shape: DrawShape) => void;
    /** Full-height workspace: grow canvas, hide inventory shortcuts when handlers omitted. */
    immersive?: boolean;
};

export function DrawCanvas({
    shapes,
    onShapesChange,
    selectedShapeId,
    onSelectShape,
    showGrid,
    onShowGridChange,
    drawMode,
    onDrawModeChange,
    zoom,
    onZoomChange,
    pan,
    onPanChange,
    canvasWidth,
    canvasHeight,
    onQuickAddUnit,
    onRegisterShapeAsUnit,
    onOpenShapeAsUnit,
    immersive = false,
}: DrawCanvasProps) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const canvasInnerRef = useRef<HTMLDivElement | null>(null);
    const [panDragging, setPanDragging] = useState(false);
    const panLastRef = useRef<{ x: number; y: number } | null>(null);
    const [draggingShapeId, setDraggingShapeId] = useState<string | null>(null);
    const [canvasDragOver, setCanvasDragOver] = useState(false);

    const updateShape = useCallback(
        (id: string, patch: Partial<DrawShape>) => {
            onShapesChange((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
        },
        [onShapesChange]
    );

    const deleteSelected = useCallback(() => {
        if (!selectedShapeId) return;
        onShapesChange((prev) => prev.filter((s) => s.id !== selectedShapeId));
        onSelectShape(null);
    }, [selectedShapeId, onShapesChange, onSelectShape]);

    const selectedShape = selectedShapeId ? shapes.find((s) => s.id === selectedShapeId) : undefined;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const t = e.target as HTMLElement;
                if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
                if (selectedShapeId) {
                    e.preventDefault();
                    deleteSelected();
                }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selectedShapeId, deleteSelected]);

    const clientToCanvasLocal = useCallback(
        (clientX: number, clientY: number) => {
            const inner = canvasInnerRef.current;
            if (!inner) return { x: 0, y: 0 };
            const r = inner.getBoundingClientRect();
            const x = (clientX - r.left) / zoom;
            const y = (clientY - r.top) / zoom;
            return { x, y };
        },
        [zoom]
    );

    const onDropOnCanvas = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setCanvasDragOver(false);
            const raw = e.dataTransfer.getData(SHAPE_DRAG_MIME) as DrawShapeType;
            if (!raw || !SHAPE_SIZES[raw]) return;
            const { width: w, height: h } = SHAPE_SIZES[raw];
            const { x, y } = clientToCanvasLocal(e.clientX, e.clientY);
            let nx = snapCoord(x - w / 2);
            let ny = snapCoord(y - h / 2);
            nx = clamp(nx, 0, Math.max(0, canvasWidth - w));
            ny = clamp(ny, 0, Math.max(0, canvasHeight - h));
            const next: DrawShape = { id: uid('dshape'), type: raw, x: nx, y: ny, width: w, height: h };
            onShapesChange((prev) => [...prev, next]);
            onSelectShape(next.id);
        },
        [canvasWidth, canvasHeight, clientToCanvasLocal, onShapesChange, onSelectShape]
    );

    const onDragOverCanvas = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        if ([...e.dataTransfer.types].includes(SHAPE_DRAG_MIME)) setCanvasDragOver(true);
    }, []);

    const onDragLeaveCanvas = useCallback((e: React.DragEvent) => {
        const next = e.relatedTarget as Node | null;
        if (next && canvasInnerRef.current?.contains(next)) return;
        setCanvasDragOver(false);
    }, []);

    const onViewportMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (drawMode !== 'pan') return;
            const el = e.target as HTMLElement;
            if (el.closest('.react-draggable')) return;
            setPanDragging(true);
            panLastRef.current = { x: e.clientX, y: e.clientY };
        },
        [drawMode]
    );

    useEffect(() => {
        if (!panDragging) return;
        const move = (ev: MouseEvent) => {
            const last = panLastRef.current;
            if (!last) return;
            const dx = ev.clientX - last.x;
            const dy = ev.clientY - last.y;
            panLastRef.current = { x: ev.clientX, y: ev.clientY };
            onPanChange((p) => ({ x: p.x + dx, y: p.y + dy }));
        };
        const up = () => {
            setPanDragging(false);
            panLastRef.current = null;
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        };
    }, [panDragging, onPanChange]);

    const onWheelViewport = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            onZoomChange((z) => clamp(z + (e.deltaY < 0 ? 0.07 : -0.07), 0.35, 2.5));
        },
        [onZoomChange]
    );

    return (
        <div
            className={cn(
                'flex w-full min-w-0 flex-col gap-3 lg:flex-row lg:items-stretch',
                immersive && 'min-h-0 flex-1'
            )}
        >
            <aside className="w-full shrink-0 lg:w-60 xl:w-64">
                <ShapesPanel />
            </aside>

            <div className={cn('flex min-w-0 flex-1 flex-col gap-2', immersive && 'min-h-0')}>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant={drawMode === 'select' ? 'company' : 'companyOutline'}
                            className="h-9 rounded-lg text-sm"
                            onClick={() => onDrawModeChange('select')}
                        >
                            <LuMove className="mr-1.5" size={14} />
                            Select/Drag
                        </Button>
                        <Button
                            type="button"
                            variant={drawMode === 'pan' ? 'primary' : 'outline'}
                            className="h-9 rounded-lg text-sm"
                            onClick={() => onDrawModeChange('pan')}
                        >
                            Pan
                        </Button>
                        <Button
                            type="button"
                            variant={showGrid ? 'company' : 'companyOutline'}
                            className="h-9 rounded-lg text-sm"
                            onClick={() => onShowGridChange(!showGrid)}
                        >
                            <LuGrid3X3 className="mr-1.5" size={14} />
                            Grid
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            className="h-9 rounded-lg border-red-200 text-sm text-red-700 hover:bg-red-50"
                            disabled={!selectedShapeId}
                            onClick={deleteSelected}
                        >
                            <LuTrash2 className="mr-1.5" size={14} />
                            Delete
                        </Button>
                        {selectedShape ? (
                            <InputField
                                label=""
                                className="min-w-40 max-w-56"
                                value={selectedShape.customLabel ?? ''}
                                placeholder={shapeLabel(selectedShape.type)}
                                onChange={(e) => updateShape(selectedShape.id, { customLabel: e.target.value })}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : null}
                        {onRegisterShapeAsUnit ? (
                            <Button
                                type="button"
                                variant="company"
                                className="h-9 rounded-lg text-sm"
                                disabled={!selectedShapeId}
                                onClick={onRegisterShapeAsUnit}
                                title="Or double-click a shape on the canvas"
                            >
                                Add as unit
                            </Button>
                        ) : null}
                        {onQuickAddUnit ? (
                            <Button type="button" variant="secondary" className="h-9 rounded-lg text-sm hidden" onClick={onQuickAddUnit}>
                                Quick add unit
                            </Button>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => onZoomChange((z) => clamp(z - 0.1, 0.35, 2.5))}>
                            <LuZoomOut size={16} />
                        </Button>
                        <p className="w-14 text-center text-sm font-semibold text-slate-600">{Math.round(zoom * 100)}%</p>
                        <Button type="button" variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => onZoomChange((z) => clamp(z + 0.1, 0.35, 2.5))}>
                            <LuZoomIn size={16} />
                        </Button>
                        <Button
                            type="button"
                            variant="companyOutline"
                            className="h-9 rounded-lg border-slate-200 text-sm"
                            onClick={() => {
                                onZoomChange(1);
                                onPanChange({ x: 0, y: 0 });
                            }}
                        >
                            <LuRotateCcw className="mr-1.5" size={14} />
                            Reset View
                        </Button>
                    </div>
                </div>

                <div
                    ref={viewportRef}
                    className={cn(
                        'relative flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner',
                        immersive ? 'min-h-[min(520px,calc(100dvh-10rem))] lg:min-h-[calc(100dvh-9rem)]' : 'min-h-[min(72vh,calc(100vh-14rem))]',
                        drawMode === 'pan' ? 'cursor-grab' : '',
                        panDragging ? 'cursor-grabbing' : '',
                        draggingShapeId ? 'cursor-grabbing' : ''
                    )}
                    onMouseDown={onViewportMouseDown}
                    onWheel={onWheelViewport}
                >
                    <div
                        ref={canvasInnerRef}
                        className={cn(
                            'absolute left-0 top-0 origin-top-left bg-linear-to-br from-slate-50 to-slate-200',
                            canvasDragOver && 'ring-2 ring-primary/40 ring-inset',
                            canvasDragOver && drawMode === 'select' ? 'cursor-copy' : '',
                            drawMode === 'select' && !canvasDragOver ? 'cursor-default' : ''
                        )}
                        style={{
                            width: canvasWidth,
                            height: canvasHeight,
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        }}
                        onDrop={onDropOnCanvas}
                        onDragOver={onDragOverCanvas}
                        onDragEnter={(e) => {
                            if ([...e.dataTransfer.types].includes(SHAPE_DRAG_MIME)) setCanvasDragOver(true);
                        }}
                        onDragLeave={onDragLeaveCanvas}
                        onMouseDown={(e) => {
                            if (drawMode === 'select' && e.target === e.currentTarget) onSelectShape(null);
                        }}
                    >
                        {showGrid ? (
                            <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
                                {Array.from({ length: Math.floor(canvasWidth / GRID_SIZE) + 1 }).map((_, i) => (
                                    <line
                                        key={`v-${i}`}
                                        x1={i * GRID_SIZE}
                                        y1={0}
                                        x2={i * GRID_SIZE}
                                        y2={canvasHeight}
                                        stroke="#e2e8f0"
                                        strokeWidth={1}
                                    />
                                ))}
                                {Array.from({ length: Math.floor(canvasHeight / GRID_SIZE) + 1 }).map((_, i) => (
                                    <line
                                        key={`h-${i}`}
                                        x1={0}
                                        y1={i * GRID_SIZE}
                                        x2={canvasWidth}
                                        y2={i * GRID_SIZE}
                                        stroke="#e2e8f0"
                                        strokeWidth={1}
                                    />
                                ))}
                            </svg>
                        ) : null}

                        {shapes.map((shape) => (
                            <Rnd
                                key={shape.id}
                                scale={zoom}
                                size={{ width: shape.width, height: shape.height }}
                                position={{ x: shape.x, y: shape.y }}
                                bounds="parent"
                                minWidth={MIN_SHAPE_SIZE}
                                minHeight={MIN_SHAPE_SIZE}
                                disableDragging={drawMode === 'pan'}
                                enableResizing={drawMode === 'select'}
                                resizeHandleStyles={RND_RESIZE_HANDLE_STYLES}
                                onDragStart={() => {
                                    if (drawMode === 'select') setDraggingShapeId(shape.id);
                                }}
                                onDragStop={(_e, d) => {
                                    setDraggingShapeId((id) => (id === shape.id ? null : id));
                                    updateShape(shape.id, {
                                        x: snapCoord(clamp(d.x, 0, canvasWidth - shape.width)),
                                        y: snapCoord(clamp(d.y, 0, canvasHeight - shape.height)),
                                    });
                                }}
                                onResizeStop={(_e, _dir, ref, _delta, pos) => {
                                    const w = Math.max(MIN_SHAPE_SIZE, snapCoord(parseFloat(ref.style.width)));
                                    const h = Math.max(MIN_SHAPE_SIZE, snapCoord(parseFloat(ref.style.height)));
                                    const nx = snapCoord(clamp(pos.x, 0, canvasWidth - w));
                                    const ny = snapCoord(clamp(pos.y, 0, canvasHeight - h));
                                    updateShape(shape.id, { x: nx, y: ny, width: w, height: h });
                                }}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    if (drawMode === 'select') onSelectShape(shape.id);
                                }}
                                onDoubleClick={(e: React.MouseEvent) => {
                                    e.stopPropagation();
                                    if (drawMode !== 'select' || !onOpenShapeAsUnit) return;
                                    onSelectShape(shape.id);
                                    onOpenShapeAsUnit(shape);
                                }}
                                className={cn(
                                    selectedShapeId === shape.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : '',
                                    drawMode === 'select' && 'cursor-grab',
                                    drawMode === 'pan' && 'cursor-default'
                                )}
                            >
                                <ShapeInterior shape={shape} />
                            </Rnd>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShapeInterior({ shape }: { shape: DrawShape }) {
    const bg = SHAPE_COLOR_CLASSES[shape.type];
    const label = shapeDisplayName(shape);

    if (shape.type === 'cross-road') {
        return (
            <div className={cn('flex h-full w-full flex-col overflow-hidden rounded-md border border-slate-600/30 shadow-sm', bg)}>
                <div className="relative flex-1">
                    <div className="absolute inset-y-1 left-1/2 w-[22%] -translate-x-1/2 bg-slate-800/75" />
                    <div className="absolute inset-x-1 top-1/2 h-[22%] -translate-y-1/2 bg-slate-800/75" />
                </div>
                <span className="pointer-events-none truncate bg-black/10 px-1 py-0.5 text-center text-[9px] font-bold text-slate-800">
                    {label}
                </span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex h-full w-full flex-col justify-between overflow-hidden rounded-md border border-slate-600/25 shadow-sm',
                bg
            )}
        >
            <span className="pointer-events-none select-none truncate px-1.5 pt-1 text-[10px] font-bold leading-tight text-slate-900">
                {label}
            </span>
            <div className="flex-1" />
        </div>
    );
}
