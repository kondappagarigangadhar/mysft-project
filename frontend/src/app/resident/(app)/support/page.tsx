'use client';

import React, { useMemo, useState } from 'react';
import { SectionCard } from '@/modules/resident-portal/components/SectionCard';
import { ResidentCard } from '@/modules/resident-portal/components/ResidentCard';
import {
    ResidentPageHeader,
    ResidentPageShell,
    residentInputClass,
    residentTextareaClass,
} from '@/modules/resident-portal/components/ResidentPageShell';
import { residentSectionFeedList } from '@/modules/resident-portal/styles/cardStyles';
import { cn } from '@/lib/utils';
import { LuCircleHelp, LuLifeBuoy, LuMessageSquare, LuPhone, LuSend } from 'react-icons/lu';

export default function ResidentSupportPage() {
    const faqs = useMemo(
        () => [
            {
                q: 'How do I raise a complaint?',
                a: 'Go to Maintenance Requests and submit the issue. The system auto-assigns the vendor and starts SLA.',
            },
            {
                q: 'How do I download my receipts?',
                a: 'Open Billing & Payments, then tap the receipt button on a paid bill.',
            },
            {
                q: 'How do I invite a visitor?',
                a: 'Go to Visitors, create a pass, and share the QR with your guest.',
            },
        ],
        [],
    );

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sent, setSent] = useState(false);

    return (
        <ResidentPageShell>
            <ResidentPageHeader
                icon={<LuCircleHelp className="h-5 w-5" aria-hidden />}
                title="Support"
                subtitle="Get help, browse FAQs, or reach emergency contacts."
            />

            <SectionCard
                title="Contact support"
                subtitle="Submit a ticket to our team"
                accent="blue"
                icon={<LuMessageSquare className="h-4 w-4" />}
            >
                {sent ? (
                    <div className="flex items-start gap-3 rounded-lg border border-[#c8e6d4] bg-[#f6fbf8] p-4">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#c8e6d4] bg-[#e3f2ea] text-[#057642]">
                            <LuLifeBuoy className="h-4 w-4" aria-hidden />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">Ticket submitted</p>
                            <p className="mt-0.5 text-sm text-[rgba(0,0,0,0.55)]">Our team will respond shortly.</p>
                        </div>
                    </div>
                ) : (
                    <form
                        className="space-y-4"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!subject.trim() || !message.trim()) return;
                            setSent(true);
                        }}
                    >
                        <div className="space-y-2">
                            <label htmlFor="s-subject" className="block text-xs font-semibold text-[rgba(0,0,0,0.9)]">
                                Subject
                            </label>
                            <input
                                id="s-subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Brief summary of your issue"
                                required
                                className={cn(residentInputClass, 'pl-3')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="s-message" className="block text-xs font-semibold text-[rgba(0,0,0,0.9)]">
                                Message
                            </label>
                            <textarea
                                id="s-message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className={residentTextareaClass}
                                placeholder="Explain your issue…"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!subject.trim() || !message.trim()}
                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-[#0a66c2] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                        >
                            <LuSend className="h-4 w-4" aria-hidden />
                            Submit ticket
                        </button>
                    </form>
                )}
            </SectionCard>

            <SectionCard
                title="Frequently asked questions"
                subtitle="Quick answers to common topics"
                accent="emerald"
                icon={<LuCircleHelp className="h-4 w-4" />}
                bodyClassName="p-0"
            >
                <ul className={residentSectionFeedList}>
                    {faqs.map((f) => (
                        <li key={f.q}>
                            <div className="px-4 py-4 sm:px-5">
                                <p className="text-sm font-semibold text-[rgba(0,0,0,0.9)]">{f.q}</p>
                                <p className="mt-1.5 text-sm leading-relaxed text-[rgba(0,0,0,0.55)]">{f.a}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </SectionCard>

            <SectionCard
                title="Emergency contacts"
                subtitle="Available 24/7"
                accent="rose"
                icon={<LuPhone className="h-4 w-4" />}
                bodyClassName="p-0"
            >
                <ul className={residentSectionFeedList}>
                    {[
                        { label: 'Security', value: '+919000000001', display: '+91 90000 00001' },
                        { label: 'Reception', value: '+919000000002', display: '+91 90000 00002' },
                        { label: 'Fire safety', value: '+919000000003', display: '+91 90000 00003' },
                    ].map((c) => (
                        <li key={c.label}>
                            <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                                <span className="text-sm font-semibold text-[rgba(0,0,0,0.85)]">{c.label}</span>
                                <a
                                    href={`tel:${c.value}`}
                                    className="inline-flex items-center gap-1 rounded-md border border-[#f5d0d0] bg-[#fce8e8] px-2.5 py-1 text-xs font-medium text-[#b91c1c] transition-colors hover:border-[#eab8b8] hover:bg-[#fad4d4]"
                                >
                                    <LuPhone className="h-3 w-3 shrink-0" aria-hidden />
                                    {c.display}
                                </a>
                            </div>
                        </li>
                    ))}
                </ul>
            </SectionCard>
        </ResidentPageShell>
    );
}
