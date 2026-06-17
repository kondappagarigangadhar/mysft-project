'use client';

import React from 'react';

export type AdminTheme = {
    sidebarBg: string;
    sidebarText: string;
    sidebarActive: string;
    sidebarHoverText: string;
    navbarBg: string;
    navbarText: string;
    /** Filled primary actions (`Button` variant `company`) */
    ctaButtonBg: string;
    ctaButtonHoverBg: string;
    ctaButtonText: string;
    ctaButtonHoverText: string;
};

export const DEFAULT_ADMIN_THEME: AdminTheme = {
    // Matches your current company-admin brand colors
    sidebarBg: '#0b2a4a',
    sidebarText: '#ffffff',
    sidebarActive: '#0092ff',
    sidebarHoverText: '#ffffff',
    navbarBg: '#0092ff',
    navbarText: '#ffffff',
    ctaButtonBg: '#0092ff',
    ctaButtonHoverBg: '#2563eb',
    ctaButtonText: '#ffffff',
    ctaButtonHoverText: '#ffffff',
};

const STORAGE_KEY = 'app_theme';

function safeParseTheme(raw: string | null): AdminTheme | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as Partial<AdminTheme>;
        if (!parsed || typeof parsed !== 'object') return null;
        const t: AdminTheme = {
            sidebarBg: typeof parsed.sidebarBg === 'string' ? parsed.sidebarBg : DEFAULT_ADMIN_THEME.sidebarBg,
            sidebarText: typeof parsed.sidebarText === 'string' ? parsed.sidebarText : DEFAULT_ADMIN_THEME.sidebarText,
            sidebarActive: typeof parsed.sidebarActive === 'string' ? parsed.sidebarActive : DEFAULT_ADMIN_THEME.sidebarActive,
            sidebarHoverText: typeof parsed.sidebarHoverText === 'string' ? parsed.sidebarHoverText : DEFAULT_ADMIN_THEME.sidebarHoverText,
            navbarBg: typeof parsed.navbarBg === 'string' ? parsed.navbarBg : DEFAULT_ADMIN_THEME.navbarBg,
            navbarText: typeof parsed.navbarText === 'string' ? parsed.navbarText : DEFAULT_ADMIN_THEME.navbarText,
            ctaButtonBg: typeof parsed.ctaButtonBg === 'string' ? parsed.ctaButtonBg : DEFAULT_ADMIN_THEME.ctaButtonBg,
            ctaButtonHoverBg:
                typeof parsed.ctaButtonHoverBg === 'string' ? parsed.ctaButtonHoverBg : DEFAULT_ADMIN_THEME.ctaButtonHoverBg,
            ctaButtonText: typeof parsed.ctaButtonText === 'string' ? parsed.ctaButtonText : DEFAULT_ADMIN_THEME.ctaButtonText,
            ctaButtonHoverText:
                typeof parsed.ctaButtonHoverText === 'string' ? parsed.ctaButtonHoverText : DEFAULT_ADMIN_THEME.ctaButtonHoverText,
        };
        return t;
    } catch {
        return null;
    }
}

function applyThemeToRoot(theme: AdminTheme) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--sidebar-bg', theme.sidebarBg);
    root.style.setProperty('--sidebar-text', theme.sidebarText);
    root.style.setProperty('--sidebar-active', theme.sidebarActive);
    root.style.setProperty('--sidebar-hover-text', theme.sidebarHoverText);
    root.style.setProperty('--navbar-bg', theme.navbarBg);
    root.style.setProperty('--navbar-text', theme.navbarText);
    root.style.setProperty('--cta-button-bg', theme.ctaButtonBg);
    root.style.setProperty('--cta-button-hover-bg', theme.ctaButtonHoverBg);
    root.style.setProperty('--cta-button-text', theme.ctaButtonText);
    root.style.setProperty('--cta-button-hover-text', theme.ctaButtonHoverText);
}

function readThemeFromCssVars(): AdminTheme {
    if (typeof document === 'undefined') return DEFAULT_ADMIN_THEME;
    const css = getComputedStyle(document.documentElement);
    const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    return {
        sidebarBg: get('--sidebar-bg', DEFAULT_ADMIN_THEME.sidebarBg),
        sidebarText: get('--sidebar-text', DEFAULT_ADMIN_THEME.sidebarText),
        sidebarActive: get('--sidebar-active', DEFAULT_ADMIN_THEME.sidebarActive),
        sidebarHoverText: get('--sidebar-hover-text', DEFAULT_ADMIN_THEME.sidebarHoverText),
        navbarBg: get('--navbar-bg', DEFAULT_ADMIN_THEME.navbarBg),
        navbarText: get('--navbar-text', DEFAULT_ADMIN_THEME.navbarText),
        ctaButtonBg: get('--cta-button-bg', DEFAULT_ADMIN_THEME.ctaButtonBg),
        ctaButtonHoverBg: get('--cta-button-hover-bg', DEFAULT_ADMIN_THEME.ctaButtonHoverBg),
        ctaButtonText: get('--cta-button-text', DEFAULT_ADMIN_THEME.ctaButtonText),
        ctaButtonHoverText: get('--cta-button-hover-text', DEFAULT_ADMIN_THEME.ctaButtonHoverText),
    };
}

type AdminThemeContextValue = {
    theme: AdminTheme;
    setTheme: (next: AdminTheme) => void;
    patchTheme: (patch: Partial<AdminTheme>) => void;
    resetTheme: () => void;
    saveTheme: () => void;
};

const AdminThemeContext = React.createContext<AdminThemeContextValue | null>(null);

export function useAdminTheme() {
    const ctx = React.useContext(AdminThemeContext);
    if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider');
    return ctx;
}

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = React.useState<AdminTheme>(DEFAULT_ADMIN_THEME);

    // Load once (client-side).
    React.useEffect(() => {
        const saved = safeParseTheme(window.localStorage.getItem(STORAGE_KEY));
        // If user hasn't saved a theme, keep your existing CSS defaults.
        const next = saved ?? readThemeFromCssVars();
        setThemeState(next);
        // Only override CSS variables when user explicitly saved a theme.
        if (saved) applyThemeToRoot(next);
    }, []);

    // Live preview.
    React.useEffect(() => {
        applyThemeToRoot(theme);
    }, [theme]);

    const setTheme = React.useCallback((next: AdminTheme) => {
        setThemeState(next);
    }, []);

    const patchTheme = React.useCallback((patch: Partial<AdminTheme>) => {
        setThemeState((prev) => ({ ...prev, ...patch }));
    }, []);

    const resetTheme = React.useCallback(() => {
        setThemeState(DEFAULT_ADMIN_THEME);
        if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    }, []);

    const saveTheme = React.useCallback(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    }, [theme]);

    const value = React.useMemo<AdminThemeContextValue>(
        () => ({ theme, setTheme, patchTheme, resetTheme, saveTheme }),
        [patchTheme, resetTheme, saveTheme, setTheme, theme],
    );

    return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}

