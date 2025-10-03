import { User, Conversation, Message } from '../types';
import { API_BASE_URL } from '../config';

let authToken: string | null = localStorage.getItem('chat-token');

const apiFetch = async (url: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, { ...options, headers });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
        throw new Error(errorData.message || 'API request failed');
    }

    return response.json();
};

export const setToken = (token: string) => {
    authToken = token;
    localStorage.setItem('chat-token', token);
};

export const getToken = (): string | null => {
    return authToken;
};

export const logout = () => {
    authToken = null;
    localStorage.removeItem('chat-token');
    localStorage.removeItem('chat-user');
};

export const login = (email: string): Promise<{ user: User, token: string }> => {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: 'password' }), // NOTE: Using a dummy password as we don't have a password field
    });
};

export const register = (name: string, email: string): Promise<{ user: User, token: string }> => {
    return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password: 'password' }), // NOTE: Using a dummy password
    });
};

export const getProfile = (): Promise<User> => {
    return apiFetch('/auth/profile');
}

export const updateProfile = (userId: string, data: { name?: string; avatar?: string }): Promise<User> => {
    return apiFetch(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
};

export const findUserById = (userId: string): Promise<User> => {
    return apiFetch(`/users/${userId}`);
};

export const getConversations = (userId: string): Promise<Conversation[]> => {
    return apiFetch(`/conversations/${userId}`);
};

export const getMessages = (conversationId: string): Promise<Message[]> => {
    return apiFetch(`/messages/${conversationId}`);
};

// sendMessage is now handled by sockets, but a REST endpoint could also exist.
// For this app, we rely on the socket for message creation.

export const searchUsers = (query: string, currentUserId: string): Promise<User[]> => {
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}&currentUserId=${currentUserId}`);
};

export const findOrCreateConversation = (userId1: string, userId2: string): Promise<Conversation> => {
    return apiFetch('/conversations/find', {
        method: 'POST',
        body: JSON.stringify({ userId1, userId2 }),
    });
};

export const markMessagesAsRead = (conversationId: string): Promise<{ success: boolean }> => {
    return apiFetch('/messages/read', {
        method: 'POST',
        body: JSON.stringify({ conversationId })
    })
}