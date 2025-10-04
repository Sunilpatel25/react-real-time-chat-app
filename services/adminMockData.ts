import { ActivityLog, User, Conversation, Message } from '../types';

// Generate mock activity logs
export const generateMockActivityLogs = (
    users: User[],
    conversations: Conversation[],
    messages: Message[]
): ActivityLog[] => {
    const logs: ActivityLog[] = [];
    const now = Date.now();

    // Generate login/logout activities
    users.forEach((user, index) => {
        // Login activity
        logs.push({
            id: `log-login-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            type: 'login',
            description: 'logged in',
            timestamp: now - (index * 3600000) // Stagger by hours
        });

        // Some logout activities
        if (!user.isOnline) {
            logs.push({
                id: `log-logout-${user.id}`,
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                type: 'logout',
                description: 'logged out',
                timestamp: now - (index * 1800000) // Stagger by 30 mins
            });
        }
    });

    // Generate message activities
    messages.forEach((message, index) => {
        const sender = users.find(u => u.id === message.senderId);
        if (sender) {
            const conversation = conversations.find(c => c.id === message.conversationId);
            const recipient = conversation?.otherUser;
            
            logs.push({
                id: `log-message-${message.id}`,
                userId: sender.id,
                userName: sender.name,
                userAvatar: sender.avatar,
                type: 'message',
                description: message.image ? 'sent an image' : 'sent a message',
                timestamp: message.timestamp,
                metadata: {
                    conversationId: message.conversationId,
                    messageId: message.id,
                    recipientName: recipient?.name
                }
            });
        }
    });

    // Generate conversation start activities
    conversations.forEach((conv, index) => {
        if (conv.members.length >= 2) {
            const user1 = users.find(u => u.id === conv.members[0]);
            const user2 = users.find(u => u.id === conv.members[1]);
            
            if (user1 && user2) {
                logs.push({
                    id: `log-conv-${conv.id}`,
                    userId: user1.id,
                    userName: user1.name,
                    userAvatar: user1.avatar,
                    type: 'conversation_start',
                    description: 'started a conversation',
                    timestamp: conv.createdAt || now - (index * 7200000),
                    metadata: {
                        conversationId: conv.id,
                        recipientName: user2.name
                    }
                });
            }
        }
    });

    // Generate some profile update activities
    users.slice(0, 3).forEach((user, index) => {
        logs.push({
            id: `log-profile-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            type: 'profile_update',
            description: 'updated their profile',
            timestamp: now - (index * 5400000) // Stagger by 1.5 hours
        });
    });

    // Generate some user search activities
    users.slice(0, 5).forEach((user, index) => {
        logs.push({
            id: `log-search-${user.id}`,
            userId: user.id,
            userName: user.name,
            userAvatar: user.avatar,
            type: 'user_search',
            description: 'searched for users',
            timestamp: now - (index * 1200000) // Stagger by 20 mins
        });
    });

    // Sort by timestamp descending
    return logs.sort((a, b) => b.timestamp - a.timestamp);
};

// Add role property to users
export const enhanceUsersForAdmin = (users: User[]): User[] => {
    return users.map((user, index) => ({
        ...user,
        role: index === 0 ? 'admin' : 'user',
        joinedAt: user.joinedAt || Date.now() - (index * 86400000), // Stagger by days
        lastSeen: user.isOnline ? Date.now() : Date.now() - (index * 3600000)
    }));
};

// Add createdAt to conversations
export const enhanceConversationsForAdmin = (conversations: Conversation[]): Conversation[] => {
    return conversations.map((conv, index) => ({
        ...conv,
        createdAt: conv.createdAt || Date.now() - (index * 86400000)
    }));
};
