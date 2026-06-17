'use client';

import { cn } from '@/lib/utils';
import { LuStar } from 'react-icons/lu';

type StarRatingInputProps = {
    value: number;
    onChange: (rating: number) => void;
    error?: string;
    disabled?: boolean;
    label?: string;
    id?: string;
};

export function StarRatingInput({ value, onChange, error, disabled, label = 'Task completion rating', id = 'task-star-rating' }: StarRatingInputProps) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label id={`${id}-label`} className="text-sm font-semibold text-slate-800">
                    {label} <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-medium text-slate-500" aria-live="polite">
                    {value > 0 ? `${value} / 5` : 'Select 1–5 stars'}
                </span>
            </div>
            <div role="group" aria-labelledby={`${id}-label`} className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                    const active = value >= star;
                    return (
                        <button
                            key={star}
                            type="button"
                            disabled={disabled}
                            aria-label={`Set rating to ${star} of 5`}
                            onClick={() => onChange(star)}
                            className={cn(
                                'rounded-lg p-1.5 transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--cta-button-bg)_30%,transparent)] disabled:opacity-50',
                                active ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300',
                            )}
                        >
                            <LuStar className={cn('h-8 w-8 sm:h-9 sm:w-9', active && 'fill-amber-400')} strokeWidth={1.75} />
                        </button>
                    );
                })}
            </div>
            {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
        </div>
    );
}
