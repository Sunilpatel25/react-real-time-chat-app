export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isOnline: boolean;
    role?: 'user' | 'admin';
    lastSeen?: number;
    joinedAt?: number;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    image?: string;
    timestamp: number;
    status: 'sent' | 'delivered' | 'read';
    // Admin tracking fields
    isEdited?: boolean;
    lastEditedBy?: string;
    lastEditedAt?: number;
    isFlagged?: boolean;
    flaggedBy?: string;
    flaggedAt?: number;
    flagReason?: string;
}

export interface Conversation {
    id:string;
    members: string[];
    lastMessage: Message | null;
    otherUser?: User;
    createdAt?: number;
}

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    type: 'login' | 'logout' | 'message' | 'conversation_start' | 'profile_update' | 'user_search';
    description: string;
    timestamp: number;
    metadata?: {
        conversationId?: string;
        messageId?: string;
        recipientName?: string;
    };
}

export interface ChatStats {
    totalUsers: number;
    activeUsers: number;
    totalConversations: number;
    totalMessages: number;
    messagesToday: number;
    newUsersToday: number;
    activeConversationsToday: number;
}

export interface UserActivity {
    userId: string;
    user: User;
    messageCount: number;
    conversationCount: number;
    lastActivity: number;
    status: 'online' | 'away' | 'offline';
}