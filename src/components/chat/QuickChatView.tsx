import React, { useMemo } from 'react';
import { Conversation, Message, User } from '../../types';
import { ChatBubbleIcon } from '../shared/Icons';

interface QuickChatViewProps {
    conversations: Conversation[];
    messages: Message[];
    users: User[];
    onViewFullChat?: () => void;
}

const QuickChatView: React.FC<QuickChatViewProps> = ({
    conversations = [],
    messages = [],
    users = [],
    onViewFullChat
}) => {
    const getUserById = (userId: string) => {
        return users.find(u => u.id === userId);
    };

    const getConversationParticipants = (conv: Conversation) => {
        return conv.members.map(id => getUserById(id)).filter(u => u !== undefined) as User[];
    };

    const quickStats = useMemo(() => {

        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const lastHour = now - (60 * 60 * 1000);

        const messagesToday = messages.filter(m => m.timestamp >= todayStart).length;
        const messagesLastHour = messages.filter(m => m.timestamp >= lastHour).length;

        const activeConversations = conversations.filter(conv => {
            const convMessages = messages.filter(m => m.conversationId === conv.id);
            const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
            return lastMessage && (now - lastMessage.timestamp) <= (5 * 60 * 1000); // Active in last 5 minutes
        }).length;

        const onlineUsers = users.filter(u => u.isOnline).length;

        return {
            messagesToday,
            messagesLastHour,
            activeConversations,
            onlineUsers,
            totalConversations: conversations.length
        };
    }, [conversations, messages, users]);

    // Recent conversations (last 5)
    const recentConversations = useMemo(() => {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        const result = conversations
            .map(conv => {
                const participants = getConversationParticipants(conv);
                const convMessages = messages.filter(m => m.conversationId === conv.id);
                const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
                const messagesLast24h = convMessages.filter(m => m.timestamp >= twentyFourHoursAgo).length;

                return {
                    conv,
                    participants,
                    lastMessage,
                    messagesLast24h,
                    onlineCount: participants.filter(p => p.isOnline).length,
                    lastActive: lastMessage ? lastMessage.timestamp : null
                };
            })
            .filter(item => item.lastMessage) // Only show conversations with messages
            .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0))
            .slice(0, 5); // Show only top 5 recent

        return result;
    }, [conversations, messages, users]);

    const formatTime = (timestamp: number) => {
        const now = new Date();
        const messageTime = new Date(timestamp);
        const diff = now.getTime() - messageTime.getTime();
        const hours = Math.floor(diff / 3600000);

        if (hours < 24) {
            return messageTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return messageTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-4">

            {/* Quick Stats Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-cool-800 flex items-center gap-2">
                        <ChatBubbleIcon className="w-5 h-5 text-indigo-600" />
                        Quick Chat Overview
                    </h3>
                    {onViewFullChat && (
                        <button
                            onClick={onViewFullChat}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                        >
                            View Full →
                        </button>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/70 rounded-lg p-3 text-center border border-indigo-100/30">
                        <div className="text-xl font-bold text-indigo-600">{quickStats.messagesToday}</div>
                        <div className="text-xs text-cool-600">Today</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 text-center border border-indigo-100/30">
                        <div className="text-xl font-bold text-emerald-600">{quickStats.messagesLastHour}</div>
                        <div className="text-xs text-cool-600">Last Hour</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 text-center border border-indigo-100/30">
                        <div className="text-xl font-bold text-purple-600">{quickStats.activeConversations}</div>
                        <div className="text-xs text-cool-600">Active</div>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 text-center border border-indigo-100/30">
                        <div className="text-xl font-bold text-pink-600">{quickStats.onlineUsers}</div>
                        <div className="text-xs text-cool-600">Online</div>
                    </div>
                </div>
            </div>

            {/* Recent Conversations */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100/50 shadow-modern">
                <h4 className="text-md font-semibold text-cool-800 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Recent Activity ({recentConversations.length})
                </h4>

                <div className="space-y-2">
                    {recentConversations.length === 0 ? (
                        <div className="text-center py-6 text-cool-500">
                            <ChatBubbleIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No recent conversations</p>
                            <p className="text-xs mt-1">Messages will appear here as they come in</p>
                        </div>
                    ) : (
                        recentConversations.map((item) => (
                            <div
                                key={item.conv.id}
                                className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg border border-indigo-100/30 hover:bg-indigo-50/70 transition-colors cursor-pointer"
                            >
                                {/* Participant Avatars */}
                                <div className="flex -space-x-1">
                                    {item.participants.slice(0, 2).map((user) => (
                                        <img
                                            key={user.id}
                                            src={user.avatar || '/default-avatar.png'}
                                            alt={user.name}
                                            className="w-6 h-6 rounded-full border border-white"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/default-avatar.png';
                                            }}
                                        />
                                    ))}
                                    {item.participants.length > 2 && (
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 border border-white flex items-center justify-center">
                                            <span className="text-xs text-indigo-600 font-bold">
                                                +{item.participants.length - 2}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Conversation Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-cool-800 truncate">
                                        {item.participants.map(u => u.name).join(', ') || 'Unknown Users'}
                                    </p>
                                    {item.lastMessage && (
                                        <p className="text-xs text-cool-600 truncate">
                                            {item.lastMessage.image ? '📷 Image' : (item.lastMessage.text || 'No message text')}
                                        </p>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="text-right text-xs text-cool-500">
                                    <div>{item.messagesLast24h} msgs</div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                        {item.onlineCount} online
                                    </div>
                                </div>

                                {/* Time */}
                                <div className="text-xs text-cool-500">
                                    {item.lastActive ? formatTime(item.lastActive) : 'No activity'}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* View More Link */}
                {recentConversations.length >= 5 && onViewFullChat && (
                    <div className="text-center mt-3 pt-3 border-t border-indigo-100/50">
                        <button
                            onClick={onViewFullChat}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                        >
                            View all {quickStats.totalConversations} conversations →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickChatView;