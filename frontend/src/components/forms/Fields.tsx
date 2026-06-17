'use client';

import React from 'react';
import { LuCheck, LuChevronDown, LuCircleAlert } from 'react-icons/lu';
import { cn } from '@/lib/utils';

const FieldStyleContext = React.createContext<'default' | 'enterprise'>('default');

/**
 * Opt-in Create Lead / enterprise admin field chrome. Other pages keep default field styling.
 */
export function CrmFieldProvider({ children }: { children: React.ReactNode }) {
    return <FieldStyleContext.Provider value="enterprise">{children}</FieldStyleContext.Provider>;
}

function useFieldStyle() {
    return React.useContext(FieldStyleContext);
}

type Option = string | { value: string; label: string };

function containsOptionalWording(node: React.ReactNode): boolean {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node).toLowerCase().includes('optional');
    }
    if (Array.isArray(node)) {
        return node.some((c) => containsOptionalWording(c));
    }
    if (React.isValidElement(node) && node.props && typeof node.props === 'object' && 'children' in node.props) {
        return containsOptionalWording((node.props as { children?: React.ReactNode }).children);
    }
    return false;
}

function FieldLabel({
    label,
    required,
    labelState = 'default',
    htmlFor,
    /** When false, never append (optional) for enterprise. */
    showOptionalTag,
}: {
    label: React.ReactNode;
    required?: boolean;
    labelState?: 'default' | 'error' | 'success';
    htmlFor?: string;
    showOptionalTag?: boolean;
}) {
    const style = useFieldStyle();

    if (style === 'enterprise') {
        const showOpt =
            !required &&
            showOptionalTag !== false &&
            !containsOptionalWording(label);
        return (
            <label
                htmlFor={htmlFor}
                className={cn(
                    'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-700',
                    labelState === 'error' && 'text-rose-600',
                )}
            >
                <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
                    <span className="inline-flex items-baseline gap-0.5">
                        {label}
                        {required ? (
                            <span className="text-rose-500" aria-hidden>
                                *
                            </span>
                        ) : null}
                    </span>
                    {showOpt ? (
                        <span className="text-[12px] font-medium normal-case tracking-normal text-gray-400">(optional)</span>
                    ) : null}
                </span>
            </label>
        );
    }

    return (
        <label
            htmlFor={htmlFor}
            className={cn(
                'flex flex-wrap items-center gap-x-1 gap-y-0.5 text-xs font-bold uppercase tracking-widest',
                labelState === 'error' && 'text-rose-600',
                labelState === 'success' && 'text-emerald-800',
                labelState === 'default' && 'text-slate-400',
            )}
        >
            {label} {required ? <span className={cn(labelState === 'error' && 'text-rose-500')}>*</span> : null}
        </label>
    );
}

function FieldError({ error }: { error?: string }) {
    if (!error) return null;
    return <p className="mt-1.5 text-xs font-medium text-red-600 transition-[opacity,transform] duration-200">{error}</p>;
}

/* Enterprise: 48px controls, #d1d5db border, 12px radius, focus ring 3px blue/10 */
const entControl =
    'h-12 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-gray-400 placeholder:font-medium hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10';

const entError =
    'border-red-500 bg-[#fef2f2] focus:border-red-500 focus:ring-red-500/10 hover:border-red-400';

const entSuccess = 'border-emerald-300/90 bg-white focus:border-blue-500 focus:ring-blue-500/10 hover:border-blue-200';

export function InputField({
    label,
    required,
    error,
    success,
    className,
    inputClassName,
    startIcon,
    showOptionalTag,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
    label: React.ReactNode;
    error?: string;
    success?: boolean;
    className?: string;
    inputClassName?: string;
    startIcon?: React.ReactNode;
    showOptionalTag?: boolean;
}) {
    const id = props.id;
    const labelState = error ? 'error' : success ? 'success' : 'default';
    const style = useFieldStyle();
    const ent = style === 'enterprise';
    const hasIcon = ent && Boolean(startIcon);
    return (
        <div className={cn(ent ? 'space-y-0' : 'space-y-2', className)}>
            <FieldLabel
                label={label}
                required={required}
                showOptionalTag={showOptionalTag}
                labelState={labelState}
                htmlFor={id}
            />
            <div className="relative">
                {hasIcon ? (
                    <span
                        className="pointer-events-none absolute left-4 top-1/2 z-1 -translate-y-1/2 text-gray-400 [&>svg]:h-[18px] [&>svg]:w-[18px]"
                        aria-hidden
                    >
                        {startIcon}
                    </span>
                ) : null}
                <input
                    {...props}
                    className={cn(
                        ent
                            ? cn(
                                  entControl,
                                  hasIcon && 'pl-11',
                                  error
                                      ? cn(entError, 'pr-11')
                                      : success
                                        ? cn(entSuccess, 'pr-11')
                                        : 'pr-4',
                              )
                            : cn(
                                  'h-11 w-full rounded-xl border px-3 text-sm transition-all focus:outline-none focus:ring-2',
                                  error
                                      ? 'border-red-500 bg-red-50/60 focus:ring-red-200'
                                      : success
                                        ? 'border-emerald-400/90 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-200/80'
                                        : 'border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary/20',
                                  success && !error && 'pr-10',
                              ),
                        inputClassName
                    )}
                    aria-invalid={Boolean(error)}
                />
                {ent && error ? (
                    <span
                        className="pointer-events-none absolute right-3.5 top-1/2 z-1 -translate-y-1/2 text-red-500"
                        aria-hidden
                    >
                        <LuCircleAlert className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    </span>
                ) : null}
                {success && !error ? (
                    <span
                        className={cn(
                            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-emerald-500',
                            ent ? 'right-4' : 'right-3 text-emerald-600',
                        )}
                        aria-hidden
                    >
                        <LuCheck className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                ) : null}
            </div>
            <FieldError error={error} />
        </div>
    );
}

export function SelectField({
    label,
    options,
    placeholder,
    required,
    error,
    success,
    className,
    selectClassName,
    startIcon,
    showOptionalTag,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: React.ReactNode;
    options: Option[];
    placeholder?: string;
    error?: string;
    success?: boolean;
    className?: string;
    selectClassName?: string;
    startIcon?: React.ReactNode;
    showOptionalTag?: boolean;
}) {
    const normalized = options.map((opt) => (typeof opt === 'string' ? { value: opt, label: opt } : opt));
    const id = props.id;
    const labelState = error ? 'error' : success ? 'success' : 'default';
    const style = useFieldStyle();
    const ent = style === 'enterprise';
    const hasIcon = ent && Boolean(startIcon);
    return (
        <div className={cn(ent ? 'space-y-0' : 'space-y-2', className)}>
            <FieldLabel
                label={label}
                required={required}
                showOptionalTag={showOptionalTag}
                labelState={labelState}
                htmlFor={id}
            />
            <div className="relative">
                {hasIcon ? (
                    <span
                        className="pointer-events-none absolute left-4 top-1/2 z-1 -translate-y-1/2 text-gray-400 [&>svg]:h-[18px] [&>svg]:w-[18px]"
                        aria-hidden
                    >
                        {startIcon}
                    </span>
                ) : null}
                <select
                    {...props}
                    className={cn(
                        ent
                            ? cn(
                                  entControl,
                                  'cursor-pointer appearance-none',
                                  error ? 'pr-11' : 'pr-10',
                                  hasIcon && 'pl-11',
                                  error ? entError : success ? entSuccess : null,
                              )
                            : cn(
                                  'h-11 w-full appearance-none rounded-xl border px-3 pr-10 text-sm transition-all focus:outline-none focus:ring-2',
                                  error
                                      ? 'border-red-500 bg-red-50/60 focus:ring-red-200'
                                      : success
                                        ? 'border-emerald-400/90 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-200/80'
                                        : 'border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary/20',
                              ),
                        selectClassName
                    )}
                    aria-invalid={Boolean(error)}
                >
                    {placeholder ? (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    ) : null}
                    {normalized.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                {ent && error ? (
                    <span
                        className="pointer-events-none absolute right-8 top-1/2 z-1 -translate-y-1/2 text-red-500"
                        aria-hidden
                    >
                        <LuCircleAlert className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    </span>
                ) : null}
                {success && !error ? (
                    <span
                        className={cn(
                            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-emerald-500',
                            ent ? 'right-9' : 'right-9 text-emerald-600',
                        )}
                        aria-hidden
                    >
                        <LuCheck className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                ) : null}
                <span
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden
                >
                    <LuChevronDown className="h-4 w-4" strokeWidth={2} />
                </span>
            </div>
            <FieldError error={error} />
        </div>
    );
}

export function TextAreaField({
    label,
    required,
    error,
    success,
    className,
    textareaClassName,
    startIcon,
    showOptionalTag,
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: React.ReactNode;
    error?: string;
    success?: boolean;
    className?: string;
    textareaClassName?: string;
    startIcon?: React.ReactNode;
    showOptionalTag?: boolean;
}) {
    const id = props.id;
    const labelState = error ? 'error' : success ? 'success' : 'default';
    const style = useFieldStyle();
    const ent = style === 'enterprise';
    const hasIcon = ent && Boolean(startIcon);
    return (
        <div className={cn(ent ? 'space-y-0' : 'space-y-2', className)}>
            <FieldLabel
                label={label}
                required={required}
                showOptionalTag={showOptionalTag}
                labelState={labelState}
                htmlFor={id}
            />
            <div className="relative">
                {hasIcon ? (
                    <span
                        className="pointer-events-none absolute left-4 top-3.5 z-1 text-gray-400 [&>svg]:h-[18px] [&>svg]:w-[18px]"
                        aria-hidden
                    >
                        {startIcon}
                    </span>
                ) : null}
                <textarea
                    {...props}
                    className={cn(
                        ent
                            ? cn(
                                  'min-h-[120px] w-full resize-y rounded-xl border border-gray-300 bg-white py-3 text-sm font-medium leading-relaxed text-gray-900 shadow-sm transition-colors duration-200 placeholder:text-gray-400 placeholder:font-medium hover:border-blue-300 focus:outline-none focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/10',
                                  hasIcon ? 'pl-11 pr-4' : 'px-4',
                                  error
                                      ? cn(entError, 'pr-11')
                                      : success
                                        ? cn(entSuccess, 'pr-10')
                                        : null,
                              )
                            : cn(
                                  'w-full rounded-xl border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none',
                                  error
                                      ? 'border-red-500 bg-red-50/60 focus:ring-red-200'
                                      : success
                                        ? 'border-emerald-400/90 bg-emerald-50/40 focus:border-emerald-500 focus:ring-emerald-200/80'
                                        : 'border-slate-200 bg-slate-50 focus:border-primary focus:ring-primary/20',
                                  success && !error && 'pb-8',
                              ),
                        textareaClassName
                    )}
                    aria-invalid={Boolean(error)}
                />
                {ent && error ? (
                    <span
                        className="pointer-events-none absolute bottom-3.5 right-3.5 z-1 text-red-500"
                        aria-hidden
                    >
                        <LuCircleAlert className="h-[18px] w-[18px]" strokeWidth={2.25} />
                    </span>
                ) : null}
                {success && !error ? (
                    <span
                        className={cn(
                            'pointer-events-none absolute text-emerald-500',
                            ent ? 'bottom-3.5 right-4' : 'bottom-2 right-2.5 text-emerald-600',
                        )}
                        aria-hidden
                    >
                        <LuCheck className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                ) : null}
            </div>
            <FieldError error={error} />
        </div>
    );
}
