import { cn } from '@/lib/utils';
import { CTA_INPUT_FOCUS } from '@/lib/theme/ctaThemeClasses';

/** Shared filter control styles — aligned with lead list / theme primary CTA focus */
export const COMPLIANCE_SELECT_FILTER_CLASS = cn(
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800',
    CTA_INPUT_FOCUS,
);

export const COMPLIANCE_SEARCH_INPUT_CLASS = cn(
    'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white',
    CTA_INPUT_FOCUS,
);
