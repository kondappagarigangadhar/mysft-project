'use client';

import React, { useState } from 'react';
import type { VisitorRequest } from './types';
import {
    buildVisitorShareMessage,
    copyTextToClipboard,
    getVisitorPassPageUrl,
    shareVisitorPassNative,
    smsShareUrl,
    whatsAppShareUrl,
} from './visitorPassShare';
import { cn } from '@/lib/utils';
import { LuCheck, LuCopy, LuLink, LuMessageCircle, LuShare2, LuSmartphone } from 'react-icons/lu';

type Props = {
    visitor: VisitorRequest;
    mobile?: string;
    layout?: 'row' | 'stack';
    className?: string;
    onCopied?: () => void;
};

export function VisitorPassShareActions({ visitor, mobile, layout = 'row', className, onCopied }: Props) {
    const [copied, setCopied] = useState(false);
    const passUrl = getVisitorPassPageUrl(visitor.id);
    const shareText = buildVisitorShareMessage(visitor, passUrl);
    const smsUrl = mobile && mobile !== '—' ? smsShareUrl(mobile, shareText) : '';

    const copyLink = async () => {
        const ok = await copyTextToClipboard(passUrl);
        if (ok) {
            setCopied(true);
            onCopied?.();
            window.setTimeout(() => setCopied(false), 2000);
        }
    };

    const btnClass =
        'inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e0dfdc] bg-white px-3 py-1.5 text-xs font-semibold text-[rgba(0,0,0,0.85)] transition hover:border-[#0a66c2] hover:text-[#0a66c2]';

    return (
        <div
            className={cn(
                layout === 'stack' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-2',
                className,
            )}
        >
            <button type="button" onClick={() => void copyLink()} className={btnClass}>
                {copied ? <LuCheck className="h-3.5 w-3.5 text-emerald-600" /> : <LuCopy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
                type="button"
                onClick={() => void shareVisitorPassNative(visitor, passUrl)}
                className={btnClass}
            >
                <LuShare2 className="h-3.5 w-3.5" />
                Share
            </button>
            <a
                href={whatsAppShareUrl(shareText)}
                target="_blank"
                rel="noreferrer"
                className={btnClass}
            >
                <LuMessageCircle className="h-3.5 w-3.5" />
                WhatsApp
            </a>
            {smsUrl ? (
                <a href={smsUrl} className={btnClass}>
                    <LuSmartphone className="h-3.5 w-3.5" />
                    SMS
                </a>
            ) : null}
            <a href={passUrl} target="_blank" rel="noreferrer" className={btnClass}>
                <LuLink className="h-3.5 w-3.5" />
                Open pass
            </a>
        </div>
    );
}
