'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField } from '@/components/forms/Fields';
import { LuArrowLeft, LuMove, LuSave, LuZoomIn, LuZoomOut, LuRotateCcw, LuFilter, LuX } from 'react-icons/lu';
import { ModeSelector } from '@/components/projects-inventory/visual-mapping/ModeSelector';
import { UploadLayout } from '@/components/projects-inventory/visual-mapping/UploadLayout';
import { DrawCanvas } from '@/components/projects-inventory/visual-mapping/DrawCanvas';
import { TemplateLoader } from '@/components/projects-inventory/visual-mapping/TemplateLoader';
import { AIDrawMode } from '@/components/projects-inventory/visual-mapping/AIDrawMode';
import type { LayoutElement } from '@/components/projects-inventory/visual-mapping/layoutElements';
import { UnitCanvas } from '@/components/projects-inventory/visual-mapping/UnitCanvas';
import { UnitFormDrawer } from '@/components/projects-inventory/visual-mapping/UnitFormDrawer';
import {
    DEFAULT_FORM_VALUES,
    DrawMode,
    MappingMode,
    STATUS_COLORS,
    TEMPLATE_KEYS,
    TemplateKey,
    UnitFormValues,
    UnitMap,
    UnitShape,
} from '@/components/projects-inventory/visual-mapping/types';
import { buildTemplateUnits, clamp, uid } from '@/components/projects-inventory/visual-mapping/helpers';
import { shapeDisplayName, type DrawShape } from '@/components/projects-inventory/visual-mapping/drawEditorTypes';

const DRAW_LAYOUT_STORAGE_KEY = 'arris-visual-inventory-draw-layout-v1';

const MAPPING_MODE_SELECT_OPTIONS: { value: MappingMode; label: string }[] = [
    { value: 'upload', label: 'Upload Layout' },
    { value: 'draw', label: 'Draw Mode' },
    { value: 'template', label: 'Template Mode' },
    { value: 'aiDraw', label: 'AI Draw Mode' },
];

function validateForm(values: UnitFormValues) {
    const errors: Record<string, string> = {};
    const unitNumberPattern = /^[A-Za-z0-9\s\-./]*$/;
    const textPattern = /^[A-Za-z\s\-./]*$/;
    if (!values.plotNumber.trim()) errors.plotNumber = 'Plot Number is required';
    else if (!unitNumberPattern.test(values.plotNumber)) errors.plotNumber = 'Only text/numbers are allowed';
    if (!values.plotShape) errors.plotShape = 'Plot Shape is required';
    if (!values.projectName.trim()) errors.projectName = 'Project Name is required';
    if (!values.layoutName.trim()) errors.layoutName = 'Layout Name is required';
    if (!values.floor) errors.floor = 'Floor is required';
    if (!values.width || values.width <= 0) errors.width = 'Width must be greater than 0';
    if (!values.length || values.length <= 0) errors.length = 'Length must be greater than 0';
    if (values.facing && !['N', 'E', 'S', 'W'].includes(values.facing)) errors.facing = 'Facing must be N/E/S/W';
    if (!Number.isFinite(values.price) || values.price <= 0) errors.price = 'Price must be greater than 0';
    if (!values.status) errors.status = 'Status is required';
    if (values.lockStatus === 'locked' && values.lockExpiry && new Date(values.lockExpiry).getTime() <= Date.now()) {
        errors.lockExpiry = 'Lock Expiry must be future datetime';
    }
    return errors;
}

export default function VisualInventoryMappingPage() {
    const [setupDone, setSetupDone] = useState(false);
    const [setupValues, setSetupValues] = useState({
        projectName: '',
        layoutName: '',
        layoutType: 'floor-plan',
        status: 'active',
    });
    const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});

    const [mappingMode, setMappingMode] = useState<MappingMode>('upload');
    const [drawMode, setDrawMode] = useState<DrawMode>('select');
    const [template, setTemplate] = useState<TemplateKey>('Ground Floor');
    const [templateView, setTemplateView] = useState<'split' | 'map' | 'list'>('split');

    const [layoutFileName, setLayoutFileName] = useState('');
    const [layoutUrl, setLayoutUrl] = useState('');
    const [isPdfLayout, setIsPdfLayout] = useState(false);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);

    const [units, setUnits] = useState<UnitMap[]>([]);
    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);

    const [isPanning, setIsPanning] = useState(false);
    const [panDragStart, setPanDragStart] = useState<{ x: number; y: number } | null>(null);
    const [draggingUnitId, setDraggingUnitId] = useState<string | null>(null);
    const [dragUnitStart, setDragUnitStart] = useState<{ x: number; y: number } | null>(null);
    const [resizingUnitId, setResizingUnitId] = useState<string | null>(null);
    const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'sw' | 'se' | null>(null);
    const [resizePointer, setResizePointer] = useState<{ x: number; y: number } | null>(null);

    const [drawShapes, setDrawShapes] = useState<DrawShape[]>([]);
    const [selectedDrawShapeId, setSelectedDrawShapeId] = useState<string | null>(null);

    const [unitFormOpen, setUnitFormOpen] = useState(false);
    const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
    const [pendingShape, setPendingShape] = useState<UnitShape | null>(null);
    const [formValues, setFormValues] = useState<UnitFormValues>(DEFAULT_FORM_VALUES);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [auditLog, setAuditLog] = useState<Array<{ actionType: string; timestamp: string; userId: string; plotId: string }>>([]);
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [searchPlot, setSearchPlot] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | UnitMap['status']>('all');
    const [canvasWidth, setCanvasWidth] = useState(1200);
    const [canvasHeight, setCanvasHeight] = useState(800);
    const [filtersCollapsed, setFiltersCollapsed] = useState(true);
    const [aiLayoutElements, setAiLayoutElements] = useState<LayoutElement[]>([]);
    const [drawSaveNotice, setDrawSaveNotice] = useState('');

    const canvasRef = useRef<HTMLDivElement | null>(null);
    const uploadRef = useRef<HTMLInputElement | null>(null);

    const [lockCompareNow, setLockCompareNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setLockCompareNow(Date.now()), 30_000);
        return () => window.clearInterval(id);
    }, []);

    const validateSetup = () => {
        const next: Record<string, string> = {};
        if (!setupValues.projectName.trim()) next.projectName = 'Project Name is required';
        if (!setupValues.layoutName.trim()) next.layoutName = 'Layout Name is required';
        if (!setupValues.layoutType) next.layoutType = 'Layout Type is required';
        if (!setupValues.status) next.status = 'Status is required';
        setSetupErrors(next);
        return Object.keys(next).length === 0;
    };

    useEffect(() => {
        if (mappingMode !== 'template') return;
        if (!TEMPLATE_KEYS.includes(template)) return;
        setUnits(buildTemplateUnits(template));
        setSelectedUnitId(null);
        setHoveredUnitId(null);
    }, [mappingMode, template]);

    const analytics = useMemo(
        () => ({
            total: units.length,
            available: units.filter((u) => u.status === 'available').length,
            sold: units.filter((u) => u.status === 'sold').length,
            reserved: units.filter((u) => u.status === 'reserved').length,
        }),
        [units]
    );
    const filteredUnits = useMemo(() => {
        const min = budgetMin ? Number(budgetMin) : 0;
        const max = budgetMax ? Number(budgetMax) : Number.MAX_SAFE_INTEGER;
        const q = searchPlot.trim().toLowerCase();
        return units.filter((u) => {
            const byStatus = statusFilter === 'all' || u.status === statusFilter;
            const byBudget = u.price >= min && u.price <= max;
            const bySearch = !q || u.plotNumber.toLowerCase().includes(q);
            return byStatus && byBudget && bySearch;
        });
    }, [units, statusFilter, budgetMin, budgetMax, searchPlot]);

    const toWorldPoint = (clientX: number, clientY: number) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        const x = (clientX - rect.left - pan.x) / zoom;
        const y = (clientY - rect.top - pan.y) / zoom;
        return { x, y };
    };

    const openCreateDrawer = (shape: UnitShape, options?: { suggestedPlotNumber?: string }) => {
        setEditingUnitId(null);
        setPendingShape(shape);
        const width = shape.type === 'rect' ? shape.width : 0;
        const length = shape.type === 'rect' ? shape.height : 0;
        const plotNum = options?.suggestedPlotNumber?.trim() ?? '';
        setFormValues({
            ...DEFAULT_FORM_VALUES,
            plotNumber: plotNum,
            projectName: setupValues.projectName,
            layoutName: setupValues.layoutName,
            plotShape: shape.type === 'rect' ? 'rectangle' : 'polygon',
            coordinates:
                shape.type === 'rect'
                    ? `x:${Math.round(shape.x)},y:${Math.round(shape.y)},w:${Math.round(shape.width)},h:${Math.round(shape.height)}`
                    : JSON.stringify(shape.points),
            width,
            length,
            area: width * length,
            colorCode: STATUS_COLORS.available,
            lockedBy: 'current-user',
        });
        setFormErrors({});
        setUnitFormOpen(true);
    };

    const openEditDrawer = (unit: UnitMap) => {
        setSelectedUnitId(unit.id);
        setEditingUnitId(unit.id);
        setPendingShape(unit.shape);
        setFormValues({
            plotNumber: unit.plotNumber,
            plotShape: unit.plotShape,
            coordinates: unit.coordinates,
            floor: unit.floor,
            projectName: unit.projectName,
            layoutName: unit.layoutName,
            width: unit.width,
            length: unit.length,
            facing: unit.facing,
            roadSize: unit.roadSize,
            area: unit.area,
            price: unit.price,
            status: unit.status,
            colorCode: unit.colorCode,
            assignedSales: unit.assignedSales,
            lockStatus: unit.lockStatus,
            lockExpiry: unit.lockExpiry,
            lockedBy: unit.lockedBy,
            statusChangeReason: unit.statusChangeReason,
            statusChangedAt: unit.statusChangedAt,
            statusChangedBy: unit.statusChangedBy,
            notes: unit.notes,
        });
        setFormErrors({});
        setUnitFormOpen(true);
    };

    const updateFormValues = (updater: (prev: UnitFormValues) => UnitFormValues) => {
        setFormValues((prev) => {
            const raw = updater(prev);
            const next = { ...raw, area: (raw.width || 0) * (raw.length || 0), colorCode: STATUS_COLORS[raw.status] };
            setFormErrors(validateForm(next));
            return next;
        });
    };

    const handleSaveUnit = () => {
        const errors = validateForm(formValues);
        const duplicate = units.some((u) => u.plotNumber.toLowerCase() === formValues.plotNumber.toLowerCase() && u.id !== editingUnitId);
        if (duplicate) errors.plotNumber = 'Plot Number must be unique';
        setFormErrors(errors);
        if (Object.keys(errors).length > 0 || !pendingShape) return;

        const computedArea = formValues.width * formValues.length;
        const computedColor = STATUS_COLORS[formValues.status];
        const userId = 'current-user';

        if (editingUnitId) {
            setUnits((prev) =>
                prev.map((u) =>
                    u.id === editingUnitId
                        ? {
                              ...u,
                              ...formValues,
                              area: computedArea,
                              colorCode: computedColor,
                              statusChangedAt: new Date().toISOString(),
                              statusChangedBy: userId,
                              shape: pendingShape,
                          }
                        : u
                )
            );
            setSelectedUnitId(editingUnitId);
            setAuditLog((prev) => [...prev, { actionType: 'update', timestamp: new Date().toISOString(), userId, plotId: editingUnitId }]);
        } else {
            const nextId = uid('unit');
            setUnits((prev) => [
                ...prev,
                {
                    id: nextId,
                    ...formValues,
                    area: computedArea,
                    colorCode: computedColor,
                    statusChangedAt: new Date().toISOString(),
                    statusChangedBy: userId,
                    shape: pendingShape,
                },
            ]);
            setSelectedUnitId(nextId);
            setAuditLog((prev) => [...prev, { actionType: 'create', timestamp: new Date().toISOString(), userId, plotId: nextId }]);
        }
        setUnitFormOpen(false);
        setPendingShape(null);
    };

    const removeAiLayoutForPlotNumber = (plotNumber: string) => {
        setAiLayoutElements((prev) =>
            prev.filter((e) => {
                if (e.type === 'plot' && (e.id === plotNumber || e.label === plotNumber)) return false;
                if (e.type === 'room' && e.id.startsWith(`${plotNumber}-room`)) return false;
                return true;
            })
        );
    };

    const handleDeleteUnit = () => {
        if (!editingUnitId) return;
        const pn = units.find((u) => u.id === editingUnitId)?.plotNumber;
        if (mappingMode === 'aiDraw' && pn) removeAiLayoutForPlotNumber(pn);
        const willBeEmpty = units.filter((u) => u.id !== editingUnitId).length === 0;
        setUnits((prev) => prev.filter((u) => u.id !== editingUnitId));
        if (mappingMode === 'aiDraw' && willBeEmpty) setAiLayoutElements([]);
        setAuditLog((prev) => [...prev, { actionType: 'delete', timestamp: new Date().toISOString(), userId: 'current-user', plotId: editingUnitId }]);
        setSelectedUnitId((prev) => (prev === editingUnitId ? null : prev));
        setUnitFormOpen(false);
        setPendingShape(null);
    };

    const onCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (drawMode === 'pan') {
            setIsPanning(true);
            setPanDragStart({ x: e.clientX, y: e.clientY });
            return;
        }
    };

    const onCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (resizingUnitId && resizeHandle && resizePointer) {
            const world = toWorldPoint(e.clientX, e.clientY);
            const dx = world.x - resizePointer.x;
            const dy = world.y - resizePointer.y;
            setUnits((prev) =>
                prev.map((u) => {
                    if (u.id !== resizingUnitId || u.shape.type !== 'rect') return u;
                    let { x, y, width, height } = u.shape;
                    if (resizeHandle === 'se') {
                        width += dx;
                        height += dy;
                    } else if (resizeHandle === 'sw') {
                        x += dx;
                        width -= dx;
                        height += dy;
                    } else if (resizeHandle === 'ne') {
                        y += dy;
                        width += dx;
                        height -= dy;
                    } else {
                        x += dx;
                        y += dy;
                        width -= dx;
                        height -= dy;
                    }
                    return { ...u, shape: { type: 'rect', x, y, width: Math.max(24, width), height: Math.max(24, height) } };
                })
            );
            setResizePointer(world);
            return;
        }

        if (isPanning && panDragStart) {
            const dx = e.clientX - panDragStart.x;
            const dy = e.clientY - panDragStart.y;
            setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
            setPanDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (draggingUnitId && dragUnitStart) {
            const world = toWorldPoint(e.clientX, e.clientY);
            const dx = world.x - dragUnitStart.x;
            const dy = world.y - dragUnitStart.y;
            setUnits((prev) =>
                prev.map((u) => {
                    if (u.id !== draggingUnitId) return u;
                    if (u.shape.type === 'rect') return { ...u, shape: { ...u.shape, x: u.shape.x + dx, y: u.shape.y + dy } };
                    return { ...u, shape: { type: 'polygon', points: u.shape.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } };
                })
            );
            setDragUnitStart(world);
            return;
        }

    };

    const onCanvasMouseUp = () => {
        setIsPanning(false);
        setPanDragStart(null);
        setDraggingUnitId(null);
        setDragUnitStart(null);
        setResizingUnitId(null);
        setResizeHandle(null);
        setResizePointer(null);

    };

    const handleUnitMouseDown = (e: React.MouseEvent, unitId: string) => {
        if (drawMode !== 'select') return;
        e.stopPropagation();
        setSelectedUnitId(unitId);
        setDraggingUnitId(unitId);
        setDragUnitStart(toWorldPoint(e.clientX, e.clientY));
    };

    const handleResizeMouseDown = (e: React.MouseEvent, unitId: string, handle: 'nw' | 'ne' | 'sw' | 'se') => {
        if (drawMode !== 'select') return;
        e.stopPropagation();
        setSelectedUnitId(unitId);
        setResizingUnitId(unitId);
        setResizeHandle(handle);
        setResizePointer(toWorldPoint(e.clientX, e.clientY));
    };

    const openQuickAddUnit = () => openCreateDrawer({ type: 'rect', x: 300, y: 220, width: 120, height: 90 });

    const registerSelectedDrawShapeAsUnit = () => {
        if (!selectedDrawShapeId) return;
        const s = drawShapes.find((d: DrawShape) => d.id === selectedDrawShapeId);
        if (!s) return;
        openCreateDrawer(
            { type: 'rect', x: s.x, y: s.y, width: s.width, height: s.height },
            { suggestedPlotNumber: shapeDisplayName(s) }
        );
    };

    const resetWorkspaceState = () => {
        setUnits([]);
        setSelectedUnitId(null);
        setHoveredUnitId(null);
        setDrawMode('select');
        setDrawShapes([]);
        setSelectedDrawShapeId(null);
        setIsPanning(false);
        setPanDragStart(null);
        setDraggingUnitId(null);
        setDragUnitStart(null);
        setResizingUnitId(null);
        setResizeHandle(null);
        setResizePointer(null);
        setUnitFormOpen(false);
        setEditingUnitId(null);
        setPendingShape(null);
        setFormValues(DEFAULT_FORM_VALUES);
        setFormErrors({});
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setShowGrid(true);
        setLayoutFileName('');
        setLayoutUrl('');
        setIsPdfLayout(false);
        setAiLayoutElements([]);
    };

    /** Switch mapping mode. Any transition that does not involve Draw Mode clears the workspace (previous behavior). Draw Mode keeps state when you leave or return so layouts are not wiped. */
    const applyMappingModeChange = (next: MappingMode) => {
        if (next === mappingMode) return;
        const involvesDraw = mappingMode === 'draw' || next === 'draw';
        if (!involvesDraw) {
            resetWorkspaceState();
        }
        setMappingMode(next);
        if (next === 'draw') setDrawMode('select');
        if (next === 'template') setTemplate('Ground Floor');
        if (next === 'aiDraw') setDrawMode('select');
    };

    const saveDrawLayout = useCallback(() => {
        const payload = {
            version: 1 as const,
            savedAt: new Date().toISOString(),
            projectName: setupValues.projectName,
            layoutName: setupValues.layoutName,
            shapes: drawShapes,
            canvasWidth,
            canvasHeight,
            zoom,
            pan,
            showGrid,
        };
        try {
            localStorage.setItem(DRAW_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
            setDrawSaveNotice('Layout saved to this browser.');
        } catch {
            setDrawSaveNotice('Could not save layout.');
        }
        window.setTimeout(() => setDrawSaveNotice(''), 4000);
    }, [drawShapes, canvasWidth, canvasHeight, zoom, pan, showGrid, setupValues.projectName, setupValues.layoutName]);

    useEffect(() => {
        if (!setupDone || mappingMode !== 'draw' || drawShapes.length > 0) return;
        try {
            const raw = localStorage.getItem(DRAW_LAYOUT_STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw) as {
                shapes?: DrawShape[];
                canvasWidth?: number;
                canvasHeight?: number;
                zoom?: number;
                pan?: { x: number; y: number };
                showGrid?: boolean;
            };
            if (Array.isArray(data.shapes)) {
                setDrawShapes(data.shapes);
            }
            if (typeof data.canvasWidth === 'number' && data.canvasWidth >= 200) setCanvasWidth(data.canvasWidth);
            if (typeof data.canvasHeight === 'number' && data.canvasHeight >= 200) setCanvasHeight(data.canvasHeight);
            if (typeof data.zoom === 'number') setZoom(clamp(data.zoom, 0.35, 2.5));
            if (data.pan && typeof data.pan.x === 'number' && typeof data.pan.y === 'number') {
                setPan({ x: data.pan.x, y: data.pan.y });
            }
            if (typeof data.showGrid === 'boolean') setShowGrid(data.showGrid);
        } catch {
            /* ignore corrupt storage */
        }
    }, [setupDone, mappingMode, drawShapes.length]);

    const aiDrawListPanel = (
        <Card className="border-none shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">AI-generated plots ({units.length})</p>
                <p className="text-xs text-slate-500">Edit or delete from the list.</p>
            </div>
            <div className="max-h-[680px] overflow-y-auto pr-1 grid grid-cols-1 gap-3">
                {units.map((unit) => (
                    <div
                        key={unit.id}
                        className={`rounded-xl border p-3 ${selectedUnitId === unit.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-bold text-slate-800">{unit.plotNumber}</p>
                                <p className="text-xs text-slate-600 mt-1">Floor: {unit.floor}</p>
                                <p className="text-xs text-slate-600">Facing: {unit.facing || 'NA'}</p>
                                <p className="text-xs text-slate-600 capitalize">Status: {unit.status}</p>
                            </div>
                            <span
                                className="inline-block h-3 w-3 rounded-full mt-1 shrink-0"
                                style={{ backgroundColor: unit.colorCode || STATUS_COLORS[unit.status] }}
                                title={unit.status}
                            />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Button variant="companyOutline" className="h-8 rounded-lg text-xs" onClick={() => openEditDrawer(unit)}>
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                className="h-8 rounded-lg text-xs"
                                onClick={() => {
                                    removeAiLayoutForPlotNumber(unit.plotNumber);
                                    const willBeEmpty = units.filter((u) => u.id !== unit.id).length === 0;
                                    setUnits((prev) => prev.filter((u) => u.id !== unit.id));
                                    if (mappingMode === 'aiDraw' && willBeEmpty) setAiLayoutElements([]);
                                    setSelectedUnitId((prev) => (prev === unit.id ? null : prev));
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );

    const templateListPanel = (
        <Card className="border-none shadow-sm">
            <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Template Plot Cards ({units.length})</p>
                <p className="text-xs text-slate-500">Floor, room and facing shown clearly.</p>
            </div>
            <div className="max-h-[680px] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
                {units.map((unit) => (
                    <div key={unit.id} className={`rounded-xl border p-3 ${selectedUnitId === unit.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white'}`}>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="text-sm font-bold text-slate-800">{unit.plotNumber}</p>
                                <p className="text-xs text-slate-600 mt-1">Floor: {unit.floor}</p>
                                <p className="text-xs text-slate-600">Coordinates: {unit.coordinates || 'Auto'}</p>
                                <p className="text-xs text-slate-600">Facing: {unit.facing || 'NA'}</p>
                            </div>
                            <span className="inline-block h-3 w-3 rounded-full mt-1" style={{ backgroundColor: unit.colorCode || STATUS_COLORS[unit.status] }} title={unit.status} />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <Button
                                variant="companyOutline"
                                className="h-8 rounded-lg text-xs"
                                disabled={
                                    unit.lockStatus === 'locked' &&
                                    !!unit.lockExpiry &&
                                    new Date(unit.lockExpiry).getTime() > lockCompareNow
                                }
                                onClick={() => openEditDrawer(unit)}
                            >
                                Edit
                            </Button>
                            <Button variant="danger" className="h-8 rounded-lg text-xs" onClick={() => setUnits((prev) => prev.filter((u) => u.id !== unit.id))}>Delete</Button>
                        </div>
                        {unit.lockStatus === 'locked' && unit.lockExpiry ? (
                            <p className="mt-2 text-[11px] text-amber-700 font-medium">
                                Locked until {new Date(unit.lockExpiry).toLocaleString()}
                            </p>
                        ) : null}
                    </div>
                ))}
            </div>
        </Card>
    );

    const renderCanvasToolbar = (opts?: { hideAddUnit?: boolean }) => (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Button variant={drawMode === 'select' ? 'company' : 'companyOutline'} className="h-9 rounded-lg" onClick={() => setDrawMode('select')}>
                    <LuMove className="mr-1.5" size={14} />
                    Select/Drag
                </Button>
                <Button variant={drawMode === 'pan' ? 'company' : 'companyOutline'} className="h-9 rounded-lg" onClick={() => setDrawMode('pan')}>
                    Pan
                </Button>
                {!opts?.hideAddUnit && mappingMode !== 'upload' && mappingMode !== 'aiDraw' ? (
                    <Button variant="company" className="h-9 rounded-lg" onClick={openQuickAddUnit}>
                        Add Unit
                    </Button>
                ) : null}
            </div>
            <div className="flex items-center gap-2">
                <Button variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => clamp(z - 0.1, 0.4, 2.5))}>
                    <LuZoomOut size={16} />
                </Button>
                <p className="w-14 text-center text-sm font-semibold text-slate-600">{Math.round(zoom * 100)}%</p>
                <Button variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => clamp(z + 0.1, 0.4, 2.5))}>
                    <LuZoomIn size={16} />
                </Button>
                <Button variant="companyOutline" className="h-9 rounded-lg border-slate-200" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                    <LuRotateCcw className="mr-1.5" size={14} />
                    Reset View
                </Button>
            </div>
        </div>
    );

    const renderUnitCanvas = (outerClassName?: string) => (
        <UnitCanvas
            layoutUrl={layoutUrl}
            layoutLabel={
                mappingMode === 'aiDraw' && aiLayoutElements.length > 0
                    ? 'AI layout (mock) — use Select/Drag and zoom'
                    : isPdfLayout
                      ? `PDF uploaded: ${layoutFileName}`
                      : 'Layout preview'
            }
            showGrid={showGrid}
            pan={pan}
            zoom={zoom}
            units={filteredUnits}
            selectedUnitId={selectedUnitId}
            hoveredUnitId={hoveredUnitId}
            previewRect={null}
            drawingPolygon={[]}
            canvasWidthProp={canvasWidth}
            canvasHeightProp={canvasHeight}
            layoutElements={mappingMode === 'aiDraw' ? aiLayoutElements : undefined}
            outerClassName={outerClassName}
            onMouseDown={onCanvasMouseDown}
            onMouseMove={onCanvasMouseMove}
            onMouseUp={onCanvasMouseUp}
            onClick={() => {}}
            onDoubleClick={(e) => e.preventDefault()}
            onWheel={(e) => {
                e.preventDefault();
                setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.07 : -0.07), 0.4, 2.5));
            }}
            onUnitMouseDown={handleUnitMouseDown}
            onUnitClick={(e, unit) => {
                e.stopPropagation();
                openEditDrawer(unit);
            }}
            onUnitEnter={setHoveredUnitId}
            onUnitLeave={(id) => setHoveredUnitId((prev) => (prev === id ? null : prev))}
            onResizeMouseDown={handleResizeMouseDown}
            setCanvasRef={(el) => {
                canvasRef.current = el;
            }}
        />
    );

    const mapPanel = (
        <Card className="border-none shadow-sm">
            {renderCanvasToolbar({ hideAddUnit: false })}
            {renderUnitCanvas()}
        </Card>
    );

    if (!setupDone) {
        return (
            <CompanyAdminDashboardLayout>
                <Breadcrumb
                    items={[
                        { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                        { label: 'Visual Inventory Mapping', href: '/projects-inventory/visual-inventory-mapping' },
                    ]}
                />
                <div className="mb-4 mt-2">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visual Inventory Mapping</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Step 1: create project layout details before opening mapping workspace.</p>
                </div>
                <Card className="border-none shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField
                            label="Project Name"
                            required
                            value={setupValues.projectName}
                            onChange={(e) => setSetupValues((p) => ({ ...p, projectName: e.target.value }))}
                            options={[
                                { value: '', label: 'Select project' },
                                { value: 'Skyline Heights', label: 'Skyline Heights' },
                                { value: 'mySFT One', label: 'mySFT One' },
                                { value: 'Maple Residency', label: 'Maple Residency' },
                            ]}
                            error={setupErrors.projectName}
                        />
                        <InputField
                            label="Layout Name"
                            required
                            value={setupValues.layoutName}
                            onChange={(e) => setSetupValues((p) => ({ ...p, layoutName: e.target.value }))}
                            error={setupErrors.layoutName}
                        />
                        <SelectField
                            label="Layout Type"
                            required
                            value={setupValues.layoutType}
                            onChange={(e) => setSetupValues((p) => ({ ...p, layoutType: e.target.value }))}
                            options={[
                                { value: 'floor-plan', label: 'Floor Plan' },
                                { value: 'block-plan', label: 'Block Plan' },
                                { value: 'tower-plan', label: 'Tower Plan' },
                            ]}
                            error={setupErrors.layoutType}
                        />
                        <SelectField
                            label="Status"
                            required
                            value={setupValues.status}
                            onChange={(e) => setSetupValues((p) => ({ ...p, status: e.target.value }))}
                            options={[
                                { value: 'active', label: 'Active' },
                                { value: 'draft', label: 'Draft' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            error={setupErrors.status}
                        />
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            className="h-10"
                            onClick={() => {
                                if (!validateSetup()) return;
                                setSetupDone(true);
                            }}
                        >
                            Continue To Mapping
                        </Button>
                    </div>
                </Card>
            </CompanyAdminDashboardLayout>
        );
    }

    if (mappingMode === 'draw') {
        return (
            <CompanyAdminDashboardLayout mainClassName="flex max-w-none flex-col px-2 pb-2 pt-2 lg:px-3 lg:pb-3 !mx-0 min-h-[calc(100dvh-3.5rem)]">
                <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Button
                            type="button"
                            variant="companyOutline"
                            className="h-9 shrink-0 rounded-lg border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={() => applyMappingModeChange('upload')}
                        >
                            <LuArrowLeft className="mr-1.5 inline-block" size={16} aria-hidden />
                            Back to mapping
                        </Button>
                        <span className="shrink-0 rounded-md bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                            Draw mode active
                        </span>
                        {drawSaveNotice ? (
                            <span className="text-xs font-medium text-emerald-700" role="status">
                                {drawSaveNotice}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="company" className="h-9 rounded-lg text-sm" onClick={saveDrawLayout}>
                            <LuSave className="mr-1.5" size={14} />
                            Save layout
                        </Button>
                        <div className="w-[min(100%,220px)] min-w-44">
                            <SelectField
                                label="Workspace"
                                value={mappingMode}
                                onChange={(e) => applyMappingModeChange(e.target.value as MappingMode)}
                                options={MAPPING_MODE_SELECT_OPTIONS}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                    <DrawCanvas
                        immersive
                        shapes={drawShapes}
                        onShapesChange={setDrawShapes}
                        selectedShapeId={selectedDrawShapeId}
                        onSelectShape={setSelectedDrawShapeId}
                        showGrid={showGrid}
                        onShowGridChange={setShowGrid}
                        drawMode={drawMode}
                        onDrawModeChange={setDrawMode}
                        zoom={zoom}
                        onZoomChange={setZoom}
                        pan={pan}
                        onPanChange={setPan}
                        canvasWidth={canvasWidth}
                        canvasHeight={canvasHeight}
                        onQuickAddUnit={openQuickAddUnit}
                        onRegisterShapeAsUnit={registerSelectedDrawShapeAsUnit}
                        onOpenShapeAsUnit={(s) =>
                            openCreateDrawer(
                                { type: 'rect', x: s.x, y: s.y, width: s.width, height: s.height },
                                { suggestedPlotNumber: shapeDisplayName(s) }
                            )
                        }
                    />
                </div>
                <UnitFormDrawer
                    isOpen={unitFormOpen}
                    isEditing={Boolean(editingUnitId)}
                    values={formValues}
                    errors={formErrors}
                    onChange={updateFormValues}
                    onSave={handleSaveUnit}
                    onDelete={handleDeleteUnit}
                    onClose={() => {
                        setUnitFormOpen(false);
                        setPendingShape(null);
                    }}
                />
            </CompanyAdminDashboardLayout>
        );
    }

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Visual Inventory Mapping', href: '/projects-inventory/visual-inventory-mapping' },
                ]}
            />
            <div className="mb-4 mt-2 grid grid-cols-1 xl:grid-cols-12 gap-3 items-start">
                <div className="xl:col-span-6">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visual Inventory Mapping</h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Choose a mode first, then map and manage units cleanly.</p>
                </div>
                <div className="xl:col-span-6">
                    <div className="relative flex justify-end">
                        <Button
                            variant="company"
                            className="h-9 rounded-lg text-xs px-3"
                            onClick={() => setFiltersCollapsed((prev) => !prev)}
                        >
                            <span className="inline-flex items-center gap-1.5">
                                {filtersCollapsed ? <LuFilter size={14} /> : <LuX size={14} />}
                                {filtersCollapsed ? 'Filter' : 'Close Filter'}
                            </span>
                        </Button>
                        {!filtersCollapsed ? (
                            <div className="absolute right-0 top-11 z-20 w-full max-w-3xl rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <SelectField
                                        label="Filter Type"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as 'all' | UnitMap['status'])}
                                        options={[
                                            { value: 'all', label: 'All' },
                                            { value: 'available', label: 'Available' },
                                            { value: 'reserved', label: 'Reserved' },
                                            { value: 'sold', label: 'Sold' },
                                            { value: 'blocked', label: 'Blocked' },
                                        ]}
                                    />
                                    <InputField label="Budget Min" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value.replace(/[^\d]/g, ''))} />
                                    <InputField label="Budget Max" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value.replace(/[^\d]/g, ''))} />
                                </div>
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <InputField label="Search Plot Number" value={searchPlot} onChange={(e) => setSearchPlot(e.target.value)} />
                                    <InputField label="Canvas Width" value={String(canvasWidth)} onChange={(e) => setCanvasWidth(Number(e.target.value.replace(/[^\d]/g, '')) || 1200)} />
                                    <InputField label="Canvas Height" value={String(canvasHeight)} onChange={(e) => setCanvasHeight(Number(e.target.value.replace(/[^\d]/g, '')) || 800)} />
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
            <Card className="mb-4 border-none shadow-sm bg-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm w-full">
                        <p><span className="font-semibold text-slate-700">Project Name:</span> {setupValues.projectName}</p>
                        <p><span className="font-semibold text-slate-700">Layout Name:</span> {setupValues.layoutName}</p>
                        <p><span className="font-semibold text-slate-700">Layout Type:</span> {setupValues.layoutType}</p>
                        <p><span className="font-semibold text-slate-700">Status:</span> {setupValues.status}</p>
                    </div>
                    <Button type="button" variant="companyOutline" className="h-9 rounded-lg text-xs" onClick={() => setSetupDone(false)}>
                        Edit Setup
                    </Button>
                </div>
            </Card>

            <Card className="mb-4 border-none shadow-sm">
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                    <div className="xl:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <ModeSelector mode={mappingMode} onChange={applyMappingModeChange} />
                    </div>

                    <div className="xl:col-span-7">
                        {mappingMode === 'upload' ? (
                            <UploadLayout
                                uploadRef={uploadRef}
                                layoutFileName={layoutFileName}
                                onPickFile={(file) => {
                                    setLayoutFileName(file.name);
                                    if (file.type.includes('pdf')) {
                                        setLayoutUrl('');
                                        setIsPdfLayout(true);
                                    } else {
                                        setLayoutUrl(URL.createObjectURL(file));
                                        setIsPdfLayout(false);
                                    }
                                }}
                            />
                        ) : null}

                        {mappingMode === 'template' ? <TemplateLoader selected={template} onSelect={setTemplate} /> : null}

                        {mappingMode === 'aiDraw' ? (
                            <AIDrawMode
                                projectName={setupValues.projectName}
                                layoutName={setupValues.layoutName}
                                currentUnits={units}
                                currentElements={aiLayoutElements}
                                onApplyLayout={(elements, nextUnits) => {
                                    setAiLayoutElements(elements);
                                    setUnits(nextUnits);
                                    setSelectedUnitId(null);
                                    setHoveredUnitId(null);
                                }}
                            />
                        ) : null}
                    </div>
                </div>
            </Card>

            {mappingMode !== 'template' && mappingMode !== 'aiDraw' ? mapPanel : null}

            {mappingMode === 'aiDraw' ? (
                <div className="mt-4">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                        <div className="xl:col-span-8">{mapPanel}</div>
                        <div className="xl:col-span-4">{aiDrawListPanel}</div>
                    </div>
                </div>
            ) : null}

            {mappingMode === 'template' ? (
                <div className="space-y-4 mt-4">
                    <Card className="border-none shadow-sm">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-1">View Type</span>
                            <Button type="button" variant={templateView === 'split' ? 'company' : 'companyOutline'} className="h-8 rounded-lg text-xs" onClick={() => setTemplateView('split')}>Split View</Button>
                            <Button type="button" variant={templateView === 'map' ? 'company' : 'companyOutline'} className="h-8 rounded-lg text-xs" onClick={() => setTemplateView('map')}>Map View</Button>
                            <Button type="button" variant={templateView === 'list' ? 'company' : 'companyOutline'} className="h-8 rounded-lg text-xs" onClick={() => setTemplateView('list')}>List View</Button>
                        </div>
                    </Card>
                    {templateView === 'split' ? (
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                            <div className="xl:col-span-8">{mapPanel}</div>
                            <div className="xl:col-span-4">{templateListPanel}</div>
                        </div>
                    ) : templateView === 'map' ? (
                        mapPanel
                    ) : (
                        templateListPanel
                    )}
                </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-white p-0"><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Units</p><p className="mt-2 text-2xl font-bold text-slate-800">{analytics.total}</p></div></Card>
                <Card className="border-none shadow-sm bg-white p-0"><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available</p><p className="mt-2 text-2xl font-bold" style={{ color: STATUS_COLORS.available }}>{analytics.available}</p></div></Card>
                <Card className="border-none shadow-sm bg-white p-0"><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sold</p><p className="mt-2 text-2xl font-bold" style={{ color: STATUS_COLORS.sold }}>{analytics.sold}</p></div></Card>
                <Card className="border-none shadow-sm bg-white p-0"><div className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reserved</p><p className="mt-2 text-2xl font-bold" style={{ color: STATUS_COLORS.reserved }}>{analytics.reserved}</p></div></Card>
            </div>

            <UnitFormDrawer
                isOpen={unitFormOpen}
                isEditing={Boolean(editingUnitId)}
                values={formValues}
                errors={formErrors}
                onChange={updateFormValues}
                onSave={handleSaveUnit}
                onDelete={handleDeleteUnit}
                onClose={() => {
                    setUnitFormOpen(false);
                    setPendingShape(null);
                }}
            />
        </CompanyAdminDashboardLayout>
    );
}
