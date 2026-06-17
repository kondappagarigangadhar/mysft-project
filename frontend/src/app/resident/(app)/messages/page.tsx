'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    formatMessageTime,
    formatMessageTimestamp,
    getMessagesForConversation,
    getParticipantInitials,
    useResidentMessages,
} from '@/modules/resident-portal/messages';
import type { Conversation } from '@/modules/resident-portal/messages/mockMessages';
import { LuArrowLeft, LuImage, LuPaperclip, LuSearch, LuSend, LuSmile } from 'react-icons/lu';

function ChatAvatar({ name, size = 'md', online }: { name: string; size?: 'sm' | 'md' | 'lg'; online?: boolean }) {
    const sizeClasses = {
        sm: 'h-8 w-8 text-[10px]',
        md: 'h-10 w-10 text-xs',
        lg: 'h-12 w-12 text-sm',
    };

    return (
        <div className="relative shrink-0">
            <div
                className={cn(
                    'grid place-items-center rounded-full bg-[#0a66c2] font-semibold text-white',
                    sizeClasses[size],
                )}
            >
                {getParticipantInitials(name)}
            </div>
            {online ? (
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#057642]" />
            ) : null}
        </div>
    );
}

function ConversationListItem({
    conversation,
    active,
    onSelect,
}: {
    conversation: Conversation;
    active: boolean;
    onSelect: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={cn(
                'flex w-full items-start gap-3 border-b border-[#ebebeb] px-4 py-3 text-left transition-colors hover:bg-[#f3f2ef]',
                active && 'bg-[#eef3f8]',
            )}
        >
            <ChatAvatar name={conversation.participantName} online={conversation.online} />
            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.9)]">{conversation.participantName}</p>
                    <span className="shrink-0 text-[11px] text-[rgba(0,0,0,0.6)]">
                        {formatMessageTime(conversation.lastMessageAt)}
                    </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-[rgba(0,0,0,0.6)]">{conversation.participantRole}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                    <p
                        className={cn(
                            'truncate text-xs',
                            conversation.unreadCount > 0
                                ? 'font-semibold text-[rgba(0,0,0,0.9)]'
                                : 'text-[rgba(0,0,0,0.6)]',
                        )}
                    >
                        {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 ? (
                        <span className="flex h-4 min-w-[1rem] shrink-0 items-center justify-center rounded-full bg-[#0a66c2] px-1 text-[10px] font-bold text-white">
                            {conversation.unreadCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </button>
    );
}

function EmptyThreadState() {
    return (
        <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-[#eef3f8] text-[#0a66c2]">
                <LuSend className="h-7 w-7" aria-hidden />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[rgba(0,0,0,0.9)]">Your messages</h2>
            <p className="mt-2 max-w-sm text-sm text-[rgba(0,0,0,0.6)]">
                Select a conversation to chat with property management, maintenance, security, and billing teams.
            </p>
        </div>
    );
}

export default function ResidentMessagesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const threadId = searchParams.get('thread');
    const { conversations, messages, selectConversation, sendMessage } = useResidentMessages();
    const [query, setQuery] = useState('');
    const [draft, setDraft] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const activeConversation = useMemo(
        () => conversations.find((c) => c.id === threadId) ?? null,
        [conversations, threadId],
    );

    const threadMessages = useMemo(
        () => (threadId ? getMessagesForConversation(threadId, messages) : []),
        [threadId, messages],
    );

    const filteredConversations = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter(
            (c) =>
                c.participantName.toLowerCase().includes(q) ||
                c.participantRole.toLowerCase().includes(q) ||
                c.lastMessage.toLowerCase().includes(q),
        );
    }, [conversations, query]);

    useEffect(() => {
        if (threadId) selectConversation(threadId);
    }, [threadId, selectConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadMessages]);

    const openThread = (conversationId: string) => {
        router.push(`/resident/messages?thread=${conversationId}`);
    };

    const handleSend = () => {
        if (!threadId || !draft.trim()) return;
        sendMessage(threadId, draft);
        setDraft('');
    };

    const showThreadOnMobile = Boolean(threadId);

    return (
        <div className="mx-auto w-full max-w-[1128px] [--resident-header-h:104px] md:[--resident-header-h:52px]">
            <div className="overflow-hidden rounded-none border-y border-[#e0dfdc] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.04)] sm:rounded-xl sm:border">
                <div className="flex h-[calc(100dvh-var(--resident-header-h)-4.5rem-env(safe-area-inset-bottom))] min-h-[360px] sm:min-h-[420px] md:h-[calc(100dvh-var(--resident-header-h)-1rem)] md:min-h-[520px]">
                    {/* Conversation list */}
                    <aside
                        className={cn(
                            'flex w-full shrink-0 flex-col border-r border-[#ebebeb] md:w-[360px]',
                            showThreadOnMobile ? 'hidden md:flex' : 'flex',
                        )}
                    >
                        <div className="border-b border-[#ebebeb] px-4 py-4">
                            <h1 className="text-base font-semibold text-[rgba(0,0,0,0.9)]">Messaging</h1>
                            <div className="relative mt-3">
                                <LuSearch
                                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgba(0,0,0,0.45)]"
                                    aria-hidden
                                />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search messages"
                                    className="h-9 w-full rounded-md border border-[#e0dfdc] bg-[#eef3f8] pl-9 pr-3 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto [scrollbar-width:thin]">
                            {filteredConversations.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-[rgba(0,0,0,0.6)]">No conversations found.</p>
                            ) : (
                                filteredConversations.map((conversation) => (
                                    <ConversationListItem
                                        key={conversation.id}
                                        conversation={conversation}
                                        active={conversation.id === threadId}
                                        onSelect={() => openThread(conversation.id)}
                                    />
                                ))
                            )}
                        </div>
                    </aside>

                    {/* Chat thread */}
                    <section
                        className={cn(
                            'flex min-w-0 flex-1 flex-col',
                            !showThreadOnMobile ? 'hidden md:flex' : 'flex',
                        )}
                    >
                        {activeConversation ? (
                            <>
                                <div className="flex items-center gap-3 border-b border-[#ebebeb] px-4 py-3">
                                    <button
                                        type="button"
                                        className="grid h-8 w-8 place-items-center rounded-md text-[rgba(0,0,0,0.6)] hover:bg-[#f3f2ef] md:hidden"
                                        onClick={() => router.push('/resident/messages')}
                                        aria-label="Back to conversations"
                                    >
                                        <LuArrowLeft className="h-5 w-5" />
                                    </button>
                                    <ChatAvatar name={activeConversation.participantName} online={activeConversation.online} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[rgba(0,0,0,0.9)]">
                                            {activeConversation.participantName}
                                        </p>
                                        <p className="truncate text-xs text-[rgba(0,0,0,0.6)]">
                                            {activeConversation.participantRole}
                                            {activeConversation.online ? ' · Active now' : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto bg-[#fafafa] px-4 py-4 [scrollbar-width:thin]">
                                    <div className="mx-auto flex max-w-2xl flex-col gap-3">
                                        {threadMessages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={cn('flex', message.isMine ? 'justify-end' : 'justify-start')}
                                            >
                                                <div
                                                    className={cn(
                                                        'max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm',
                                                        message.isMine
                                                            ? 'rounded-br-md bg-[#0a66c2] text-white'
                                                            : 'rounded-bl-md border border-[#e0dfdc] bg-white text-[rgba(0,0,0,0.9)]',
                                                    )}
                                                >
                                                    {!message.isMine ? (
                                                        <p className="mb-1 text-[11px] font-semibold text-[#0a66c2]">
                                                            {message.senderName}
                                                        </p>
                                                    ) : null}
                                                    <p className="text-sm leading-relaxed">{message.text}</p>
                                                    <p
                                                        className={cn(
                                                            'mt-1 text-[10px]',
                                                            message.isMine ? 'text-white/75' : 'text-[rgba(0,0,0,0.45)]',
                                                        )}
                                                    >
                                                        {formatMessageTimestamp(message.sentAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                <div className="border-t border-[#ebebeb] bg-white px-4 py-3">
                                    <div className="mx-auto flex max-w-2xl items-end gap-2">
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                className="grid h-9 w-9 place-items-center rounded-md text-[rgba(0,0,0,0.6)] hover:bg-[#f3f2ef]"
                                                aria-label="Attach file"
                                            >
                                                <LuPaperclip className="h-[18px] w-[18px]" />
                                            </button>
                                            <button
                                                type="button"
                                                className="grid h-9 w-9 place-items-center rounded-md text-[rgba(0,0,0,0.6)] hover:bg-[#f3f2ef]"
                                                aria-label="Add image"
                                            >
                                                <LuImage className="h-[18px] w-[18px]" />
                                            </button>
                                            <button
                                                type="button"
                                                className="grid h-9 w-9 place-items-center rounded-md text-[rgba(0,0,0,0.6)] hover:bg-[#f3f2ef]"
                                                aria-label="Add emoji"
                                            >
                                                <LuSmile className="h-[18px] w-[18px]" />
                                            </button>
                                        </div>
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSend();
                                                }
                                            }}
                                            rows={1}
                                            placeholder="Write a message…"
                                            className="max-h-28 min-h-[40px] flex-1 resize-none rounded-3xl border border-[#e0dfdc] bg-[#fafafa] px-4 py-2.5 text-sm text-[rgba(0,0,0,0.9)] placeholder:text-[rgba(0,0,0,0.45)] focus:border-[#0a66c2] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0a66c2]"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleSend}
                                            disabled={!draft.trim()}
                                            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0a66c2] text-white transition-colors hover:bg-[#004182] disabled:cursor-not-allowed disabled:bg-[#b0b0b0]"
                                            aria-label="Send message"
                                        >
                                            <LuSend className="h-[18px] w-[18px]" />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <EmptyThreadState />
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
