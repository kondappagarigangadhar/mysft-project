'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CompanyAdminDashboardLayout } from '@/components/layout/CompanyAdminDashboardLayout';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { InputField, SelectField } from '@/components/forms/Fields';
import { UnitCanvas } from '@/components/projects-inventory/visual-mapping/UnitCanvas';
import { buildTemplateUnits, clamp } from '@/components/projects-inventory/visual-mapping/helpers';
import { STATUS_COLORS, TemplateKey, UnitMap, UnitStatus } from '@/components/projects-inventory/visual-mapping/types';
import { LuSearch, LuZoomIn, LuZoomOut, LuRotateCcw } from 'react-icons/lu';

type BookingForm = {
    name: string;
    phone: string;
    email: string;
    bookingDate: string;
    bookingStatus: 'reserved' | 'sold' | 'blocked';
    totalAmount: string;
    paidAmount: string;
};

type BookingRecord = BookingForm & { balance: number };

const projects = ['Skyline Heights', 'mySFT One', 'Maple Residency'];
type ProjectLayout = { id: string; label: string; template: TemplateKey };
const projectLayouts: Record<string, ProjectLayout[]> = {
    'Skyline Heights': [
        { id: 'sky-gf', label: 'Ground Floor', template: 'Ground Floor' },
        { id: 'sky-f1', label: 'Floor 1', template: 'Floor 1' },
        { id: 'sky-f2', label: 'Floor 2', template: 'Floor 2' },
    ],
    'mySFT One': [
        { id: 'arris-podium', label: 'Podium', template: 'Ground Floor' },
        { id: 'arris-a1', label: 'Tower A - Level 1', template: 'Floor 1' },
        { id: 'arris-a2', label: 'Tower A - Level 2', template: 'Floor 2' },
    ],
    'Maple Residency': [
        { id: 'maple-gf', label: 'Block B - Ground', template: 'Ground Floor' },
        { id: 'maple-f1', label: 'Block B - Floor 1', template: 'Floor 1' },
        { id: 'maple-f2', label: 'Block B - Floor 2', template: 'Floor 2' },
    ],
};

function defaultBookingForm(unit: UnitMap): BookingForm {
    return {
        name: '',
        phone: '',
        email: '',
        bookingDate: new Date().toISOString().slice(0, 10),
        bookingStatus: unit.status === 'available' ? 'reserved' : (unit.status as 'reserved' | 'sold' | 'blocked'),
        totalAmount: String(unit.price),
        paidAmount: '0',
    };
}

function buildInitialUnitLayouts(): Record<string, Record<string, UnitMap[]>> {
    return Object.fromEntries(
        projects.map((projectName) => [
            projectName,
            Object.fromEntries(projectLayouts[projectName].map((layout) => [layout.id, buildTemplateUnits(layout.template)])),
        ]),
    );
}

function validateBooking(values: BookingForm, isReadOnly: boolean) {
    const errors: Record<string, string> = {};
    if (isReadOnly) return errors;

    const namePattern = /^[A-Za-z\s.'-]+$/;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!values.name.trim()) errors.name = 'Name is required';
    else if (!namePattern.test(values.name.trim())) errors.name = 'Name must contain text only';

    if (!values.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d+$/.test(values.phone)) errors.phone = 'Phone must contain numbers only';
    else if (values.phone.length < 8) errors.phone = 'Phone must be at least 8 digits';

    if (!values.email.trim()) errors.email = 'Email is required';
    else if (!emailPattern.test(values.email.trim())) errors.email = 'Enter a valid email';

    if (!values.bookingDate) errors.bookingDate = 'Booking date is required';
    if (!values.totalAmount || Number(values.totalAmount) <= 0) errors.totalAmount = 'Total amount must be > 0';
    if (!values.paidAmount || Number(values.paidAmount) < 0) errors.paidAmount = 'Paid amount cannot be negative';
    if (Number(values.paidAmount) > Number(values.totalAmount)) errors.paidAmount = 'Paid amount cannot exceed total';

    return errors;
}

export default function VisualInventoryViewPage() {
    const pathname = usePathname();
    const isCompanyAdmin = pathname.startsWith('/company-admin');
    const [project, setProject] = useState(projects[0]);
    const [selectedLayoutId, setSelectedLayoutId] = useState(projectLayouts[projects[0]][0].id);
    const [statusFilter, setStatusFilter] = useState<'all' | UnitStatus>('all');
    const [priceFilter, setPriceFilter] = useState<'all' | 'lt50' | '50to80' | 'gt80'>('all');
    const [search, setSearch] = useState('');

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });

    const [unitsByProjectLayout, setUnitsByProjectLayout] = useState<Record<string, Record<string, UnitMap[]>>>(() =>
        buildInitialUnitLayouts(),
    );

    const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
    const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalUnit, setModalUnit] = useState<UnitMap | null>(null);
    const [bookingForm, setBookingForm] = useState<BookingForm | null>(null);
    const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});
    const [bookingByUnit, setBookingByUnit] = useState<Record<string, BookingRecord>>(() => {
        const seeded: Record<string, BookingRecord> = {};
        Object.values(buildInitialUnitLayouts())
            .flatMap((layouts) => Object.values(layouts))
            .flat()
            .forEach((unit, idx) => {
                if (unit.status === 'available') return;
                const paid = unit.status === 'sold' ? unit.price : Math.round(unit.price * 0.2);
                seeded[unit.id] = {
                    name: `Customer ${idx + 1}`,
                    phone: `9000000${String(idx).padStart(2, '0')}`,
                    email: `customer${idx + 1}@example.com`,
                    bookingDate: new Date().toISOString().slice(0, 10),
                    bookingStatus: unit.status as 'reserved' | 'sold' | 'blocked',
                    totalAmount: String(unit.price),
                    paidAmount: String(paid),
                    balance: Math.max(0, unit.price - paid),
                };
            });
        return seeded;
    });

    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
    const canvasRef = useRef<HTMLDivElement | null>(null);

    const activeLayouts = projectLayouts[project];
    const selectedLayoutMeta = activeLayouts.find((layout) => layout.id === selectedLayoutId) ?? activeLayouts[0];
    const currentUnits = unitsByProjectLayout[project]?.[selectedLayoutMeta.id] || [];

    useEffect(() => {
        if (selectedLayoutMeta.id !== selectedLayoutId) {
            setSelectedLayoutId(selectedLayoutMeta.id);
        }
    }, [selectedLayoutMeta.id, selectedLayoutId]);
    const filteredUnits = useMemo(() => {
        return currentUnits.filter((unit) => {
            const statusOk = statusFilter === 'all' || unit.status === statusFilter;
            const q = search.trim().toLowerCase();
            const searchOk = !q || unit.plotNumber.toLowerCase().includes(q) || unit.facing.toLowerCase().includes(q);

            const lacs = unit.price / 100000;
            const priceOk =
                priceFilter === 'all' ||
                (priceFilter === 'lt50' && lacs < 50) ||
                (priceFilter === '50to80' && lacs >= 50 && lacs <= 80) ||
                (priceFilter === 'gt80' && lacs > 80);

            return statusOk && searchOk && priceOk;
        });
    }, [currentUnits, statusFilter, search, priceFilter]);

    const openModal = (unit: UnitMap) => {
        const previous = bookingByUnit[unit.id];
        setModalUnit(unit);
        setSelectedUnitId(unit.id);
        setBookingForm(
            previous
                ? {
                      name: previous.name,
                      phone: previous.phone,
                      email: previous.email,
                      bookingDate: previous.bookingDate,
                      bookingStatus: previous.bookingStatus,
                      totalAmount: previous.totalAmount,
                      paidAmount: previous.paidAmount,
                  }
                : defaultBookingForm(unit)
        );
        setBookingErrors({});
        setModalOpen(true);
    };

    const isSold = modalUnit?.status === 'sold';
    const isReserved = modalUnit?.status === 'reserved';
    const isBlocked = modalUnit?.status === 'blocked';
    const modalReadOnly = Boolean((isSold || isReserved || isBlocked) && !isCompanyAdmin);
    const totalAmount = Number(bookingForm?.totalAmount || 0);
    const paidAmount = Number(bookingForm?.paidAmount || 0);
    const balance = Math.max(0, totalAmount - paidAmount);
    const computedErrors = bookingForm ? validateBooking(bookingForm, modalReadOnly) : {};
    const hasErrors = Object.keys(computedErrors).length > 0;

    const saveBooking = () => {
        if (!modalUnit || !bookingForm) return;
        const errors = validateBooking(bookingForm, modalReadOnly);
        setBookingErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setBookingByUnit((prev) => ({
            ...prev,
            [modalUnit.id]: {
                ...bookingForm,
                balance,
            },
        }));

        const nextStatus = bookingForm.bookingStatus as UnitStatus;
        setUnitsByProjectLayout((prev) => ({
            ...prev,
            [project]: {
                ...prev[project],
                [selectedLayoutMeta.id]: prev[project][selectedLayoutMeta.id].map((u) => (u.id === modalUnit.id ? { ...u, status: nextStatus } : u)),
            },
        }));
        setModalOpen(false);
    };

    return (
        <CompanyAdminDashboardLayout>
            <Breadcrumb
                items={[
                    { label: 'Projects & Inventory', href: '/projects-inventory/projects' },
                    { label: 'Visual Inventory View', href: '/projects-inventory/visual-inventory-view' },
                ]}
            />

            <div className="mb-4 mt-2">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Visual Inventory View</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Sales-focused visual plot interaction with booking flow.</p>
            </div>

            <Card className="mb-4 border-none shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
                    <SelectField
                        label="Project"
                        value={project}
                        onChange={(e) => {
                            const nextProject = e.target.value;
                            setProject(nextProject);
                            setSelectedLayoutId(projectLayouts[nextProject][0].id);
                        }}
                        options={projects.map((p) => ({ value: p, label: p }))}
                    />
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-400">Search Plot</label>
                        <div className="relative">
                            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Plot / room number"
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <SelectField
                        label="Status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as 'all' | UnitStatus)}
                        options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'available', label: 'Available' },
                            { value: 'reserved', label: 'Reserved' },
                            { value: 'sold', label: 'Sold' },
                            { value: 'blocked', label: 'Blocked' },
                        ]}
                    />
                    <SelectField
                        label="Price"
                        value={priceFilter}
                        onChange={(e) => setPriceFilter(e.target.value as 'all' | 'lt50' | '50to80' | 'gt80')}
                        options={[
                            { value: 'all', label: 'All Prices' },
                            { value: 'lt50', label: '< 50 Lac' },
                            { value: '50to80', label: '50 - 80 Lac' },
                            { value: 'gt80', label: '> 80 Lac' },
                        ]}
                    />
                </div>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                <Card className="xl:col-span-3 border-none shadow-sm">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Layout List</p>
                            <div className="space-y-2">
                                {activeLayouts.map((layout) => (
                                    <button
                                        key={layout.id}
                                        onClick={() => setSelectedLayoutId(layout.id)}
                                        className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                                            selectedLayoutMeta.id === layout.id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {layout.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Status Legend</p>
                            <div className="space-y-2">
                                {(Object.keys(STATUS_COLORS) as UnitStatus[]).map((status) => (
                                    <div key={status} className="flex items-center gap-2 text-sm text-slate-600">
                                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[status] }} />
                                        <span className="capitalize">{status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="xl:col-span-9 border-none shadow-sm">
                    <div className="mb-3 flex items-center justify-end gap-2">
                        <Button variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => clamp(z - 0.1, 0.4, 2.5))}>
                            <LuZoomOut size={16} />
                        </Button>
                        <p className="w-14 text-center text-sm font-semibold text-slate-600">{Math.round(zoom * 100)}%</p>
                        <Button variant="companyOutline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => clamp(z + 0.1, 0.4, 2.5))}>
                            <LuZoomIn size={16} />
                        </Button>
                        <Button variant="companyOutline" className="h-9 rounded-lg border-slate-200" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>
                            <LuRotateCcw className="mr-1.5" size={14} />
                            Reset
                        </Button>
                    </div>

                    <UnitCanvas
                        layoutUrl=""
                        layoutLabel={`${project} - ${selectedLayoutMeta.label}`}
                        showGrid
                        pan={pan}
                        zoom={zoom}
                        units={filteredUnits}
                        selectedUnitId={selectedUnitId}
                        hoveredUnitId={hoveredUnitId}
                        previewRect={null}
                        drawingPolygon={[]}
                        onMouseDown={(e) => {
                            setIsPanning(true);
                            setPanStart({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseMove={(e) => {
                            if (!isPanning || !panStart) return;
                            const dx = e.clientX - panStart.x;
                            const dy = e.clientY - panStart.y;
                            setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
                            setPanStart({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseUp={() => {
                            setIsPanning(false);
                            setPanStart(null);
                        }}
                        onClick={() => {}}
                        onDoubleClick={() => {}}
                        onWheel={(e) => {
                            e.preventDefault();
                            setZoom((z) => clamp(z + (e.deltaY < 0 ? 0.07 : -0.07), 0.4, 2.5));
                        }}
                        onUnitMouseDown={(e, unitId) => {
                            e.stopPropagation();
                            setSelectedUnitId(unitId);
                        }}
                        onUnitClick={(e, unit) => {
                            e.stopPropagation();
                            openModal(unit);
                        }}
                        onUnitEnter={setHoveredUnitId}
                        onUnitLeave={(id) => setHoveredUnitId((prev) => (prev === id ? null : prev))}
                        onResizeMouseDown={() => {}}
                        setCanvasRef={(el) => {
                            canvasRef.current = el;
                        }}
                        showResizeHandles={false}
                    />
                </Card>
            </div>

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalUnit ? `Plot ${modalUnit.plotNumber}` : 'Plot Details'}
                maxWidthClassName="max-w-5xl"
                bodyClassName="max-h-[72vh] overflow-y-auto"
                footer={
                    <div className="w-full flex items-center justify-end gap-2">
                        <Button type="button" variant="companyOutline" size="cta" onClick={() => setModalOpen(false)}>
                            Close
                        </Button>
                        <Button
                            type="button"
                            variant="company"
                            size="cta"
                            onClick={saveBooking}
                            disabled={!bookingForm || hasErrors || modalReadOnly}
                        >
                            {modalReadOnly
                                ? isSold
                                    ? 'Sold (View Only)'
                                    : isReserved
                                      ? 'Reserved (View Only)'
                                      : 'Blocked (View Only)'
                                : isCompanyAdmin && (isSold || isReserved || isBlocked)
                                  ? 'Update Booking (Admin)'
                                  : 'Confirm Booking'}
                        </Button>
                    </div>
                }
            >
                {modalUnit && bookingForm ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
                        <div className="xl:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-4 h-fit">
                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Plot Information</p>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <p><span className="font-semibold text-slate-700">Plot:</span> {modalUnit.plotNumber}</p>
                                <p><span className="font-semibold text-slate-700">Floor:</span> {modalUnit.floor}</p>
                                <p><span className="font-semibold text-slate-700">Area:</span> {modalUnit.area} sq.ft</p>
                                <p><span className="font-semibold text-slate-700">Price:</span> {modalUnit.price.toLocaleString()}</p>
                                <p><span className="font-semibold text-slate-700">Status:</span> <span className="capitalize">{modalUnit.status}</span></p>
                                <p><span className="font-semibold text-slate-700">Balance:</span> {balance.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="xl:col-span-8 space-y-5">
                            {modalReadOnly ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                                    This plot is {modalUnit.status}. Details are visible, editing is restricted.
                                </div>
                            ) : null}
                            {!modalReadOnly && isCompanyAdmin && (isSold || isReserved || isBlocked) ? (
                                <div className="rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3 py-2 text-xs font-medium text-slate-900">
                                    Admin override enabled: you can edit this booking.
                                </div>
                            ) : null}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Customer Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InputField label="Name" required value={bookingForm.name} error={bookingErrors.name || computedErrors.name} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, name: e.target.value } : p))} />
                                    <InputField label="Phone" required value={bookingForm.phone} error={bookingErrors.phone || computedErrors.phone} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, phone: e.target.value.replace(/[^\d]/g, '') } : p))} />
                                    <InputField label="Email" required className="md:col-span-2" value={bookingForm.email} error={bookingErrors.email || computedErrors.email} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, email: e.target.value } : p))} />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Booking Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <InputField label="Booking Date" required type="date" value={bookingForm.bookingDate} error={bookingErrors.bookingDate || computedErrors.bookingDate} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, bookingDate: e.target.value } : p))} />
                                    <SelectField
                                        label="Status"
                                        required
                                        value={bookingForm.bookingStatus}
                                        error={bookingErrors.bookingStatus || computedErrors.bookingStatus}
                                        disabled={modalReadOnly}
                                        onChange={(e) => setBookingForm((p) => (p ? { ...p, bookingStatus: e.target.value as BookingForm['bookingStatus'] } : p))}
                                        options={[
                                            { value: 'reserved', label: 'Reserve' },
                                            { value: 'sold', label: 'Sold' },
                                            { value: 'blocked', label: 'Blocked' },
                                        ]}
                                    />
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Payment Details</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <InputField label="Total Amount" required value={bookingForm.totalAmount} error={bookingErrors.totalAmount || computedErrors.totalAmount} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, totalAmount: e.target.value.replace(/[^\d]/g, '') } : p))} />
                                    <InputField label="Paid Amount" required value={bookingForm.paidAmount} error={bookingErrors.paidAmount || computedErrors.paidAmount} disabled={modalReadOnly} onChange={(e) => setBookingForm((p) => (p ? { ...p, paidAmount: e.target.value.replace(/[^\d]/g, '') } : p))} />
                                    <InputField label="Balance" value={String(balance)} disabled />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </CompanyAdminDashboardLayout>
    );
}
