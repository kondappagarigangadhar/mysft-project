'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCircleHelp, LuX } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import type { WorkspaceHelpContent } from '@/components/workspace-help/types';

const VIEWPORT_PAD = 12;
const GAP = 8;
const PANEL_WIDTH = 380;

type Props = WorkspaceHelpContent & {
    triggerLabel?: string;
    className?: string;
    disabled?: boolean;
};

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
            {children}
        </section>
    );
}

function HelpPanelBody({
    title,
    subtitle,
    purpose,
    features,
    workflow,
    tips,
    onClose,
    titleId,
}: WorkspaceHelpContent & { onClose: () => void; titleId: string }) {
    return (
        <>
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div className="min-w-0">
                    <h2 id={titleId} className="text-base font-semibold text-slate-900">
                        {title}
                    </h2>
                    {subtitle ? <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p> : null}
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]"
                    aria-label="Close help"
                >
                    <LuX size={16} aria-hidden />
                </button>
            </div>
            <div className="max-h-[min(60vh,28rem)] space-y-4 overflow-y-auto px-4 py-3.5 text-sm leading-relaxed text-slate-700">
                <HelpSection title="Purpose">
                    <p>{purpose}</p>
                </HelpSection>
                {features && features.length > 0 ? (
                    <HelpSection title="What you can manage">
                        <ul className="list-disc space-y-1.5 pl-4 marker:text-slate-400">
                            {features.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </HelpSection>
                ) : null}
                {workflow && workflow.length > 0 ? (
                    <HelpSection title="Workflow">
                        <ol className="list-decimal space-y-1.5 pl-4 marker:font-medium marker:text-slate-500">
                            {workflow.map((step) => (
                                <li key={step}>{step}</li>
                            ))}
                        </ol>
                    </HelpSection>
                ) : null}
                {tips && tips.length > 0 ? (
                    <HelpSection title="Best practices">
                        <ul className="list-disc space-y-1.5 pl-4 marker:text-slate-400">
                            {tips.map((tip) => (
                                <li key={tip}>{tip}</li>
                            ))}
                        </ul>
                    </HelpSection>
                ) : null}
            </div>
        </>
    );
}

/**
 * Lightweight contextual workspace help — icon trigger + floating popover (no drawer/modal).
 * Reuse across tenant, resident, customer, procurement, and other detail workspaces.
 */
export function ContextualHelpPopover({
    triggerLabel = 'Workspace help',
    className,
    disabled = false,
    ...content
}: Props) {
    const titleId = useId();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLSpanElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [panelPos, setPanelPos] = useState<{ top: number; left: number; mobile: boolean } | null>(null);

    const close = useCallback(() => setOpen(false), []);

    const updatePosition = useCallback(() => {
        const btn = triggerRef.current;
        if (!btn || typeof window === 'undefined') return;
        const r = btn.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const mobile = vw < 640;
        const panelEl = panelRef.current;
        const panelH = panelEl && panelEl.offsetHeight > 0 ? panelEl.offsetHeight : 420;
        const panelW = Math.min(PANEL_WIDTH, vw * 0.92);

        if (mobile) {
            const top = Math.min(Math.max(VIEWPORT_PAD, r.bottom + GAP), vh - panelH - VIEWPORT_PAD);
            setPanelPos({ top, left: vw / 2, mobile: true });
            return;
        }

        let top = r.bottom + GAP;
        if (top + panelH > vh - VIEWPORT_PAD) {
            top = Math.max(VIEWPORT_PAD, r.top - panelH - GAP);
        }
        let left = r.right - panelW;
        left = Math.min(Math.max(VIEWPORT_PAD, left), vw - panelW - VIEWPORT_PAD);
        setPanelPos({ top, left, mobile: false });
    }, []);

    useLayoutEffect(() => {
        if (!open) {
            setPanelPos(null);
            return;
        }
        updatePosition();
        const raf = requestAnimationFrame(() => updatePosition());
        return () => cancelAnimationFrame(raf);
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onScroll = () => updatePosition();
        const onResize = () => updatePosition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [open, updatePosition]);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (rootRef.current?.contains(t)) return;
            if (panelRef.current?.contains(t)) return;
            setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDoc);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const panelWidth = panelPos?.mobile ? 'min(92vw, 380px)' : `${PANEL_WIDTH}px`;

    const panel =
        open && panelPos && typeof document !== 'undefined' ? (
            <div
                style={{
                    top: panelPos.top,
                    left: panelPos.left,
                    width: panelWidth,
                    transform: panelPos.mobile ? 'translateX(-50%)' : undefined,
                }}
                className="fixed z-[200]"
            >
                <div
                    ref={panelRef}
                    role="dialog"
                    aria-labelledby={titleId}
                    className="animate-contextual-help-in overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_12px_40px_-12px_rgba(15,23,42,0.22)] ring-1 ring-black/5"
                >
                    <HelpPanelBody {...content} onClose={close} titleId={titleId} />
                </div>
            </div>
        ) : null;

    return (
        <span ref={rootRef} className={cn('inline-flex shrink-0', className)}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                aria-label={triggerLabel}
                aria-expanded={open}
                aria-haspopup="dialog"
                title={triggerLabel}
                onClick={(e) => {
                    e.stopPropagation();
                    if (disabled) return;
                    setOpen((o) => !o);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                    'relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-300 bg-white text-red-600 shadow-sm transition duration-150',
                    'hover:border-red-400 hover:bg-red-50 hover:text-red-700',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200',
                    'disabled:pointer-events-none disabled:opacity-50',
                    open && 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-200',
                )}
            >
                <LuCircleHelp size={16} strokeWidth={1.75} aria-hidden />
            </button>
            {panel ? createPortal(panel, document.body) : null}
        </span>
    );
}

/** Alias for toolbar usage — same component, semantic name for workspace pages. */
export function WorkspaceHelp(props: Props) {
    return <ContextualHelpPopover {...props} />;
}
