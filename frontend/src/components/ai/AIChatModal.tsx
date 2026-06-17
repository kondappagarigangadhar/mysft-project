'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AIGenerateButton } from '@/components/ai/AIGenerateButton';
import { LuSend } from 'react-icons/lu';

export type ChatMessage = { role: 'user' | 'assistant'; text: string };

export function AIChatModal({
    isOpen,
    onClose,
    title,
    placeholder = 'Ask a question…',
    messages,
    onSend,
    sending,
    emptyHint,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    placeholder?: string;
    messages: ChatMessage[];
    onSend: (text: string) => void;
    sending?: boolean;
    emptyHint?: string;
}) {
    const [draft, setDraft] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sending]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const t = draft.trim();
        if (!t || sending) return;
        onSend(t);
        setDraft('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            maxWidthClassName="max-w-lg"
            bodyClassName="!p-0 flex flex-col max-h-[min(560px,80vh)]"
        >
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
                    {messages.length === 0 ? (
                        <p className="text-sm text-slate-500">{emptyHint ?? 'Start the conversation.'}</p>
                    ) : null}
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={
                                m.role === 'user'
                                    ? 'ml-8 rounded-xl bg-blue-50 px-3 py-2 text-sm text-slate-900'
                                    : 'mr-8 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800'
                            }
                        >
                            {m.text}
                        </div>
                    ))}
                    {sending ? (
                        <p className="text-xs text-slate-500">Thinking…</p>
                    ) : null}
                    <div ref={bottomRef} />
                </div>
                <form
                    onSubmit={submit}
                    className="border-t border-slate-100 bg-slate-50/80 px-6 py-4"
                >
                    <div className="flex gap-2">
                        <input
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            placeholder={placeholder}
                            className="min-h-[44px] flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                        />
                        <AIGenerateButton
                            type="submit"
                            loading={sending}
                            disabled={!draft.trim()}
                            className="shrink-0 px-3"
                            variant="primary"
                        >
                            <LuSend size={18} aria-hidden />
                        </AIGenerateButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
