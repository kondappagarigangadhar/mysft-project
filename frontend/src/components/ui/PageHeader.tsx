import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
                {subtitle && (
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500 sm:text-[15px]">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex flex-shrink-0 items-center gap-3">{actions}</div>}
        </div>
    );
}
