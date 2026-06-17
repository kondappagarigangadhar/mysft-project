'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { useAdminTheme, DEFAULT_ADMIN_THEME } from '@/components/theme/AdminThemeProvider';

function ColorRow({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (next: string) => void;
}) {
    return (
        <label className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200">
            <span className="text-sm font-semibold text-slate-800">{label}</span>
            <div className="flex items-center gap-3">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                    aria-label={label}
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="#RRGGBB"
                />
                <span className="h-8 w-8 rounded-lg border border-slate-200" style={{ backgroundColor: value }} />
            </div>
        </label>
    );
}

export function AdminThemeControls({ variant }: { variant: 'page' | 'drawer' }) {
    const { theme, patchTheme, resetTheme, saveTheme } = useAdminTheme();

    return (
        <div className="space-y-4">
            {variant === 'drawer' ? (
                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="companyOutline" size="sm" onClick={resetTheme}>
                        Reset
                    </Button>
                    <Button type="button" variant="company" size="sm" onClick={saveTheme}>
                        Save
                    </Button>
                    <Button type="button" variant="companyGhost" size="sm" onClick={() => patchTheme(DEFAULT_ADMIN_THEME)}>
                        Default
                    </Button>
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ColorRow label="Sidebar background" value={theme.sidebarBg} onChange={(v) => patchTheme({ sidebarBg: v })} />
                <ColorRow label="Sidebar text" value={theme.sidebarText} onChange={(v) => patchTheme({ sidebarText: v })} />
                <ColorRow label="Sidebar active" value={theme.sidebarActive} onChange={(v) => patchTheme({ sidebarActive: v })} />
                <ColorRow label="Sidebar hover text" value={theme.sidebarHoverText} onChange={(v) => patchTheme({ sidebarHoverText: v })} />
                <ColorRow label="Navbar background" value={theme.navbarBg} onChange={(v) => patchTheme({ navbarBg: v })} />
                <ColorRow label="Navbar text" value={theme.navbarText} onChange={(v) => patchTheme({ navbarText: v })} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Primary action button</p>
                <p className="mt-1 text-xs text-slate-600">
                    Applies to <span className="font-mono text-[11px]">variant=&quot;company&quot;</span> (e.g. Analytics on the company-admin dashboard).
                    Save theme to persist.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ColorRow label="Button background" value={theme.ctaButtonBg} onChange={(v) => patchTheme({ ctaButtonBg: v })} />
                    <ColorRow label="Button hover background" value={theme.ctaButtonHoverBg} onChange={(v) => patchTheme({ ctaButtonHoverBg: v })} />
                    <ColorRow label="Button text" value={theme.ctaButtonText} onChange={(v) => patchTheme({ ctaButtonText: v })} />
                    <ColorRow label="Button hover text" value={theme.ctaButtonHoverText} onChange={(v) => patchTheme({ ctaButtonHoverText: v })} />
                </div>
            </div>
        </div>
    );
}

