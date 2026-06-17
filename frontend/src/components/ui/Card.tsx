import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    footer?: React.ReactNode;
    /** Merged with default body padding (e.g. `p-3` for compact cards) */
    contentClassName?: string;
}

export const Card = ({ title, subtitle, footer, children, className, contentClassName, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-gray-100 border-l-4 border-l-[#0092ff] bg-white shadow-sm transition-all duration-200 hover:shadow-md',
                className
            )}
            {...props}
        >
            {(title || subtitle) && (
                <div className="border-b border-gray-100 px-6 py-4">
                    {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
                    {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
                </div>
            )}
            <div className={cn('p-6', contentClassName)}>{children}</div>
            {footer && <div className="border-t border-gray-100 bg-gray-50/80 px-6 py-4">{footer}</div>}
        </div>
    );
};
