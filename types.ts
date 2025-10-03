export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
    isOnline: boolean;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    image?: string;
    timestamp: number;
    status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
    id:string;
    members: string[];
    lastMessage: Message | null;
    otherUser?: User;
}