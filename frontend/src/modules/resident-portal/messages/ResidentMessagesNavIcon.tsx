'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuMessageSquare } from 'react-icons/lu';
import { cn } from '@/lib/utils';
import { headerNavBadgeClass, headerNavIconActiveClass, headerNavIconClass } from '../components/headerNavStyles';
import { useResidentMessages } from './residentMessagesStore';

export function ResidentMessagesNavIcon() {
    const pathname = usePathname();
    const { unreadCount } = useResidentMessages();
    const active = pathname === '/resident/messages';

    return (
        <Link
            href="/resident/messages"
            className={cn(headerNavIconClass, active && headerNavIconActiveClass)}
            aria-label="Messages"
            aria-current={active ? 'page' : undefined}
        >
            <LuMessageSquare className="h-[20px] w-[20px]" aria-hidden />
            {unreadCount > 0 ? (
                <span className={headerNavBadgeClass}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            ) : null}
        </Link>
    );
}
