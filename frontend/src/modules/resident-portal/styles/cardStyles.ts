/** Shared border + surface tokens for resident portal cards */
export const residentCardBorder = 'border border-[#e0dfdc]';
export const residentCardBorderHover = 'hover:border-[#d0cfcc]';
export const residentDivider = 'border-[#ebebeb]';
export const residentCardShadow = 'shadow-[0_1px_2px_rgba(0,0,0,0.03)]';

export const residentCardShell = `overflow-hidden rounded-xl ${residentCardBorder} bg-white ${residentCardShadow}`;
export const residentHeaderDivider = `border-b ${residentDivider}`;

export const residentAccentHeaders = {
    slate: { header: 'bg-[#fafafa]', icon: 'bg-[#f3f2ef] text-[rgba(0,0,0,0.6)] border border-[#e8e8e6]' },
    blue: { header: 'bg-[#f6faff]', icon: 'bg-[#e8f1fb] text-[#0a66c2] border border-[#d4e4f2]' },
    amber: { header: 'bg-[#fffaf6]', icon: 'bg-[#fef0e3] text-[#c45d0a] border border-[#f5dcc8]' },
    violet: { header: 'bg-[#faf8ff]', icon: 'bg-[#ede8fb] text-[#6d28d9] border border-[#ddd0f5]' },
    emerald: { header: 'bg-[#f6fbf8]', icon: 'bg-[#e3f2ea] text-[#057642] border border-[#c8e6d4]' },
    rose: { header: 'bg-[#fff8f8]', icon: 'bg-[#fce8e8] text-[#b91c1c] border border-[#f5d0d0]' },
} as const;

export const residentKpiTones = {
    orange: {
        bg: 'bg-[#fffaf6]',
        icon: 'bg-[#fef0e3] text-[#c45d0a] border border-[#f5dcc8]',
        valueHover: 'group-hover:text-[#c45d0a]',
    },
    blue: {
        bg: 'bg-[#f6faff]',
        icon: 'bg-[#e8f1fb] text-[#0a66c2] border border-[#d4e4f2]',
        valueHover: 'group-hover:text-[#0a66c2]',
    },
    emerald: {
        bg: 'bg-[#f6fbf8]',
        icon: 'bg-[#e3f2ea] text-[#057642] border border-[#c8e6d4]',
        valueHover: 'group-hover:text-[#057642]',
    },
    violet: {
        bg: 'bg-[#faf8ff]',
        icon: 'bg-[#ede8fb] text-[#6d28d9] border border-[#ddd0f5]',
        valueHover: 'group-hover:text-[#6d28d9]',
    },
} as const;

export const residentSectionFeedList = '-mx-4 divide-y divide-[#ebebeb] sm:-mx-5';
export const residentWidgetFeedList = '-mx-3 divide-y divide-[#ebebeb] sm:-mx-3.5';
