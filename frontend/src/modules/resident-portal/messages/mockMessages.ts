'use client';

export type ChatMessage = {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    isMine: boolean;
    text: string;
    sentAt: string;
};

export type Conversation = {
    id: string;
    participantName: string;
    participantRole: string;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    online?: boolean;
};

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000).toISOString();

export const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: 'conv_manager',
        participantName: 'Priya Sharma',
        participantRole: 'Property Manager',
        lastMessage: 'The AGM minutes are now available in Documents.',
        lastMessageAt: minutesAgo(25),
        unreadCount: 1,
        online: true,
    },
    {
        id: 'conv_maintenance',
        participantName: 'Maintenance Desk',
        participantRole: 'Facilities Team',
        lastMessage: 'Your ticket REQ-20418 is in progress. ETA 2 hours.',
        lastMessageAt: hoursAgo(2),
        unreadCount: 0,
        online: true,
    },
    {
        id: 'conv_security',
        participantName: 'Security Office',
        participantRole: 'Community Security',
        lastMessage: 'Visitor pass for Rahul Mehta is approved.',
        lastMessageAt: hoursAgo(5),
        unreadCount: 0,
    },
    {
        id: 'conv_billing',
        participantName: 'Billing Support',
        participantRole: 'Accounts Team',
        lastMessage: 'Receipt for April maintenance has been generated.',
        lastMessageAt: daysAgo(1),
        unreadCount: 0,
    },
];

export const MOCK_MESSAGES: ChatMessage[] = [
    {
        id: 'm1',
        conversationId: 'conv_manager',
        senderId: 'manager',
        senderName: 'Priya Sharma',
        isMine: false,
        text: 'Hi! Welcome to the resident portal. Let me know if you need anything.',
        sentAt: daysAgo(3),
    },
    {
        id: 'm2',
        conversationId: 'conv_manager',
        senderId: 'resident',
        senderName: 'You',
        isMine: true,
        text: 'Thank you! I had a question about the upcoming community meeting.',
        sentAt: daysAgo(3),
    },
    {
        id: 'm3',
        conversationId: 'conv_manager',
        senderId: 'manager',
        senderName: 'Priya Sharma',
        isMine: false,
        text: 'The AGM is scheduled for next Saturday at 10 AM in the clubhouse.',
        sentAt: daysAgo(2),
    },
    {
        id: 'm4',
        conversationId: 'conv_manager',
        senderId: 'manager',
        senderName: 'Priya Sharma',
        isMine: false,
        text: 'The AGM minutes are now available in Documents.',
        sentAt: minutesAgo(25),
    },
    {
        id: 'm5',
        conversationId: 'conv_maintenance',
        senderId: 'maintenance',
        senderName: 'Maintenance Desk',
        isMine: false,
        text: 'We received your water leakage complaint REQ-20418.',
        sentAt: hoursAgo(4),
    },
    {
        id: 'm6',
        conversationId: 'conv_maintenance',
        senderId: 'resident',
        senderName: 'You',
        isMine: true,
        text: 'Thanks. Is someone coming today?',
        sentAt: hoursAgo(3),
    },
    {
        id: 'm7',
        conversationId: 'conv_maintenance',
        senderId: 'maintenance',
        senderName: 'Maintenance Desk',
        isMine: false,
        text: 'Your ticket REQ-20418 is in progress. ETA 2 hours.',
        sentAt: hoursAgo(2),
    },
    {
        id: 'm8',
        conversationId: 'conv_security',
        senderId: 'security',
        senderName: 'Security Office',
        isMine: false,
        text: 'Visitor pass for Rahul Mehta is approved. Valid today 2 PM – 8 PM.',
        sentAt: hoursAgo(5),
    },
    {
        id: 'm9',
        conversationId: 'conv_billing',
        senderId: 'billing',
        senderName: 'Billing Support',
        isMine: false,
        text: 'Receipt for April maintenance has been generated. You can download it from Billing.',
        sentAt: daysAgo(1),
    },
];

export function getInitialConversations(): Conversation[] {
    return MOCK_CONVERSATIONS.map((c) => ({ ...c }));
}

export function getInitialMessages(): ChatMessage[] {
    return MOCK_MESSAGES.map((m) => ({ ...m }));
}

export function getTotalUnreadCount(conversations: Conversation[]): number {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}
