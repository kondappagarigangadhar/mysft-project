'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { ChatMessage, Conversation } from './mockMessages';
import {
    getInitialConversations,
    getInitialMessages,
    getTotalUnreadCount,
} from './mockMessages';

type MessagesState = {
    conversations: Conversation[];
    messages: ChatMessage[];
};

let state: MessagesState = {
    conversations: getInitialConversations(),
    messages: getInitialMessages(),
};

const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    return state;
}

export function useResidentMessages() {
    const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const selectConversation = useCallback((conversationId: string) => {
        state = {
            ...state,
            conversations: state.conversations.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c,
            ),
        };
        emit();
    }, []);

    const sendMessage = useCallback((conversationId: string, text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        const now = new Date().toISOString();
        const newMessage: ChatMessage = {
            id: `msg_${Date.now()}`,
            conversationId,
            senderId: 'resident',
            senderName: 'You',
            isMine: true,
            text: trimmed,
            sentAt: now,
        };

        state = {
            conversations: state.conversations
                .map((c) =>
                    c.id === conversationId
                        ? { ...c, lastMessage: trimmed, lastMessageAt: now, unreadCount: 0 }
                        : c,
                )
                .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()),
            messages: [...state.messages, newMessage],
        };
        emit();
    }, []);

    return {
        conversations: snapshot.conversations,
        messages: snapshot.messages,
        unreadCount: getTotalUnreadCount(snapshot.conversations),
        selectConversation,
        sendMessage,
    };
}

export function getMessagesForConversation(conversationId: string, messages: ChatMessage[]): ChatMessage[] {
    return messages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
}

export function formatMessageTime(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatMessageTimestamp(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function getParticipantInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}
