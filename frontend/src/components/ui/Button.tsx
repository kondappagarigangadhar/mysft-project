import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** `company*` variants match Company Admin sidebar (blue-600) — use on company-layout pages. */
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'company' | 'companyOutline' | 'companyGhost';
    size?: 'sm' | 'md' | 'lg' | 'icon' | 'cta';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-orange-600 active:scale-95',
            secondary: 'border border-gray-300 bg-white text-slate-900 transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50',
            outline: 'border border-slate-200 bg-transparent text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50',
            ghost: 'bg-transparent text-slate-600 transition-all duration-200 hover:bg-slate-100',
            danger: 'bg-red-500 text-white transition-all duration-200 hover:bg-red-600',
            company:
                'rounded-lg bg-[var(--cta-button-bg)] text-[var(--cta-button-text)] shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-[var(--cta-button-hover-bg)] hover:text-[var(--cta-button-hover-text)] hover:shadow-md active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--cta-button-hover-bg)] focus-visible:ring-offset-2',
            companyOutline:
                'rounded-lg border border-[color-mix(in_srgb,var(--cta-button-bg)_22%,transparent)] bg-white text-gray-800 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:border-[color-mix(in_srgb,var(--cta-button-bg)_38%,transparent)] hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_8%,white)] hover:text-[var(--cta-button-bg)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)]',
            companyGhost:
                'rounded-lg bg-transparent text-gray-600 transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--cta-button-bg)_10%,white)] hover:text-[var(--cta-button-bg)] focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_28%,transparent)]',
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-8 text-lg',
            icon: 'h-10 w-10 p-2',
            /** Primary actions in company chrome (matches common h-[42px] toolbars). */
            cta: 'h-[42px] min-h-[42px] rounded-xl px-4 text-sm font-semibold',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex cursor-pointer items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                    variant !== 'company' &&
                        variant !== 'companyOutline' &&
                        variant !== 'companyGhost' &&
                        'focus-visible:ring-2 focus-visible:ring-primary/50',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button };
