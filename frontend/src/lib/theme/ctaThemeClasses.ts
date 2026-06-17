/**
 * Tailwind class fragments aligned with `/settings/theme` primary CTA (`--cta-button-*`).
 * Use on company chrome / lead record view for chips, links, banners, and focus rings.
 */

/** Toolbar chip / outline-adjacent control: soft fill + stronger tint on hover */
export const CTA_UTILITY_BTN =
    'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.25 py-1.5 text-sm font-medium text-slate-800 transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_42%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_16%,white)] hover:text-[var(--cta-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]';

export const CTA_LINK_UNDERLINE =
    'rounded font-semibold text-[var(--cta-button-bg)] underline decoration-[color-mix(in_srgb,var(--cta-button-bg)_35%,transparent)] underline-offset-2 transition hover:text-[var(--cta-button-hover-bg)]';

export const CTA_LINK_TEXT =
    'font-semibold text-[var(--cta-button-bg)] transition hover:text-[var(--cta-button-hover-bg)]';

export const CTA_INFO_BANNER =
    'mt-3 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] p-3 text-sm font-medium text-slate-900';

export const CTA_INFO_BANNER_BADGE =
    'ml-2 rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2 py-0.5 text-xs font-semibold text-[var(--cta-button-bg)]';

export const CTA_CARD_EDITING_RING =
    'border-[color-mix(in_srgb,var(--cta-button-bg)_32%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--cta-button-bg)_20%,transparent)]';

/** Focus ring for tab bars / ghost buttons (~30% mix of primary) */
export const CTA_FOCUS_VISIBLE_RING =
    'focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]';

/** Default-state note / input ring when valid */
export const CTA_FOCUS_RING_SOFT =
    'focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

/** Full border + ring focus for native inputs */
export const CTA_INPUT_FOCUS =
    'focus:border-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

/** Profile inline selects — neutral border tint + themed focus */
export const CTA_SELECT_DEFAULT_BORDER =
    'border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] focus:border-[var(--cta-button-bg)] focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

export const CTA_SELECT_BG_TINT = 'bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)]';

export const CTA_EDITING_BADGE =
    'inline-flex items-center rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--cta-button-bg)] shadow-sm';

export const CTA_DASHED_DROPZONE_HOVER =
    'hover:border-[color-mix(in_srgb,var(--cta-button-bg)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]';

/** Small avatar chip (timeline initials) */
export const CTA_AVATAR_GRADIENT =
    'bg-linear-to-br from-[var(--cta-button-bg)] to-[var(--cta-button-hover-bg)]';

/** Data table / cross-ref links */
export const CTA_FLOW_LINK =
    'font-medium text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline';

export const CTA_FLOW_LINK_SEMIBOLD =
    'font-semibold text-[var(--cta-button-bg)] hover:text-[var(--cta-button-hover-bg)] hover:underline';

export const CTA_FLOW_ICON_TILE =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white text-[var(--cta-button-bg)] shadow-sm transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-hover-bg)]';

export const CTA_FLOW_CHIP_LINK =
    'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-white px-2.5 text-xs font-semibold text-[var(--cta-button-bg)] shadow-sm transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-hover-bg)]';

/** Text-only row action (no default border) */
export const CTA_GHOST_ROW_HOVER =
    'transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]';

/** Breadcrumb trail links */
export const CTA_BREADCRUMB_LINK =
    'min-w-0 truncate font-medium text-slate-500 transition-colors hover:text-[var(--cta-button-bg)]';

/** Current breadcrumb segment (no href) */
export const CTA_BREADCRUMB_CURRENT = 'min-w-0 truncate font-medium text-[var(--cta-button-bg)]';

/** Checkboxes in lists / pickers (accent matches primary CTA) */
export const CTA_CHECKBOX_SM =
    'h-4 w-4 shrink-0 rounded border-slate-300 text-[var(--cta-button-bg)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]';

/** Kanban / toolbar bulk-selection strip */
export const CTA_BULK_BAR =
    'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)]';

/** Primary-tinted shadow for prominent CTAs */
export const CTA_SHADOW_SOFT = 'shadow-md shadow-[color-mix(in_srgb,var(--cta-button-bg)_18%,transparent)]';

/** Segmented / pill nav — active segment (matches `Button` `company` fill tokens) */
export const CTA_NAV_PILL_ACTIVE = 'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm';

/** List/table pagination — active page button */
export const CTA_PAGINATION_PAGE_ACTIVE =
    'bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm shadow-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

/** List/table pagination — inactive page button */
export const CTA_PAGINATION_PAGE =
    'text-slate-600 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)] active:scale-95';

/** Pagination summary counts (Showing X to Y of Z) */
export const CTA_PAGINATION_EMPHASIS = 'font-semibold text-[var(--cta-button-bg)]';

/** Compact prev/next control (icon or chevron pagination) */
export const CTA_PAGINATION_NAV_BTN =
    'inline-flex items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-white text-slate-700 transition hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:text-[var(--cta-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-40';

/** Info / success strip without top margin (banners, create-mode callouts) */
export const CTA_INFO_STRIP =
    'rounded-xl border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm';

/** Small outline chip (categories, tags) — primary tint, readable on white */
export const CTA_CHIP_SUBTLE =
    'rounded-full border border-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)] bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] px-3 py-1 text-xs font-medium text-slate-900';

/** Selected option in multi-select chips (categories, roles) */
export const CTA_SELECTABLE_PILL_ACTIVE =
    'border-[var(--cta-button-bg)] bg-[color-mix(in_srgb,var(--cta-button-bg)_12%,white)] text-slate-900';

/** Progress / meter fill */
export const CTA_PROGRESS_FILL = 'bg-[var(--cta-button-bg)]';

/** Collapsible “blue” section header — primary-tinted (replaces fixed `bg-blue-50` chrome) */
export const CTA_COLLAPSE_HEADER_TINT =
    'bg-[color-mix(in_srgb,var(--cta-button-bg)_14%,white)] border-b border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

export const CTA_COLLAPSE_HEADER_ICON = 'text-[var(--cta-button-bg)]';

export const CTA_COLLAPSE_HEADER_RING = 'ring-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)]';

/** Horizontal record tabs (vendor / supplier / WO / invoice / PR / PO detail shells) */
export const CTA_RECORD_TAB_BTN_FOCUS =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]';

export const CTA_RECORD_TAB_ACTIVE = 'font-semibold text-[var(--cta-button-bg)]';

/** Portaled row-actions menu — neutral rows (Links use inline-flex; buttons add `w-full text-left`) */
export const CTA_MENU_ITEM =
    'flex items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]';

export const CTA_MENU_ITEM_BLOCK =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)]';
