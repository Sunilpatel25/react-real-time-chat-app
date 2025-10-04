import React, { useMemo, useState } from 'react';
import { Conversation, Message, User } from '../types';
import { SearchIcon, EyeIcon, ChatBubbleIcon } from './Icons';

interface ChatMonitorProps {
    conversations: Conversation[];
    messages: Message[];
    users: User[];
}

const ChatMonitor: React.FC<ChatMonitorProps> = ({ conversations, messages, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'quiet' | 'highVolume'>('all');
    const [sortType, setSortType] = useState<'recent' | 'messages' | 'engagement'>('recent');

    const getUserById = (userId: string) => {
        return users.find(u => u.id === userId);
    };

    const getConversationMessages = (conversationId: string) => {
        return messages.filter(m => m.conversationId === conversationId).sort((a, b) => a.timestamp - b.timestamp);
    };

    const getConversationParticipants = (conv: Conversation) => {
        return conv.members.map(id => getUserById(id)).filter(u => u !== undefined) as User[];
    };

    const calculateAverageResponseTime = (convMessages: Message[]) => {
        let total = 0;
        let count = 0;

        for (let i = 1; i < convMessages.length; i++) {
            const prev = convMessages[i - 1];
            const current = convMessages[i];

            if (prev.senderId !== current.senderId) {
                total += current.timestamp - prev.timestamp;
                count += 1;
            }
        }

        if (count === 0) return null;
        return total / count;
    };

    const formatRelativeTime = (timestamp: number | null) => {
        if (!timestamp) return 'No activity yet';
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60 * 1000) return 'just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return '—';
        const minutes = Math.round(ms / (60 * 1000));
        if (minutes < 60) return `${minutes}m`;
        const hours = (minutes / 60).toFixed(1);
        return `${hours}h`;
    };

    const enrichedConversations = useMemo(() => {
        const now = Date.now();
        const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

        return conversations.map(conv => {
            const participants = getConversationParticipants(conv);
            const convMessages = getConversationMessages(conv.id);
            const lastMessage = convMessages.length > 0
                ? convMessages[convMessages.length - 1]
                : conv.lastMessage || null;
            const lastActive = lastMessage ? lastMessage.timestamp : null;
            const messagesLast24h = convMessages.filter(m => m.timestamp >= twentyFourHoursAgo).length;
            const attachmentCount = convMessages.filter(m => m.image).length;
            const liveThreshold = 5 * 60 * 1000;
            const quietThreshold = 6 * 60 * 60 * 1000;
            const isLive = lastActive ? (now - lastActive) <= liveThreshold : false;
            const isQuiet = lastActive ? (now - lastActive) >= quietThreshold : false;
            const avgResponseTime = calculateAverageResponseTime(convMessages);

            return {
                conv,
                participants,
                participantNames: participants.map(p => p.name).join(' '),
                convMessages,
                lastMessage,
                lastActive,
                messagesLast24h,
                attachmentCount,
                isLive,
                isQuiet,
                messageCount: convMessages.length,
                avgResponseTime,
                onlineCount: participants.filter(p => p.isOnline).length,
            };
        });
    }, [conversations, messages, users]);

    const stats = useMemo(() => {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const messagesToday = messages.filter(m => m.timestamp >= todayStart).length;
        const liveConversations = enrichedConversations.filter(c => c.isLive).length;
        const attachmentsToday = messages.filter(m => m.timestamp >= todayStart && m.image).length;
        const avgResponseSum = enrichedConversations.reduce((acc, item) => item.avgResponseTime ? acc + item.avgResponseTime : acc, 0);
        const conversationsWithResponse = enrichedConversations.filter(item => item.avgResponseTime !== null).length;

        return {
            totalConversations: enrichedConversations.length,
            messagesToday,
            liveConversations,
            attachmentsToday,
            averageResponse: conversationsWithResponse > 0 ? avgResponseSum / conversationsWithResponse : null,
        };
    }, [enrichedConversations, messages]);

    const filteredConversations = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        const statusPredicate = (item: typeof enrichedConversations[number]) => {
            if (statusFilter === 'all') return true;
            if (statusFilter === 'live') return item.isLive;
            if (statusFilter === 'quiet') return item.isQuiet;
            if (statusFilter === 'highVolume') return item.messagesLast24h >= 20;
            return true;
        };

        const sorted = enrichedConversations
            .filter(item =>
                item.participantNames.toLowerCase().includes(lowerSearch)
            )
            .filter(statusPredicate)
            .sort((a, b) => {
                switch (sortType) {
                    case 'messages':
                        return b.messageCount - a.messageCount;
                    case 'engagement':
                        return b.messagesLast24h - a.messagesLast24h;
                    case 'recent':
                    default:
                        return (b.lastActive || 0) - (a.lastActive || 0);
                }
            });

        return sorted;
    }, [enrichedConversations, searchTerm, statusFilter, sortType]);

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / 3600000);

        if (hours < 24) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Snapshot Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card-modern gradient-indigo p-6 text-white shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Live Conversations</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Now</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.liveConversations}</div>
                    <p className="text-sm text-indigo-100 mt-2">Monitoring conversations active in the last 5 minutes</p>
                </div>
                <div className="card-modern gradient-purple p-6 text-white shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Messages Today</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">24h</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.messagesToday}</div>
                    <p className="text-sm text-purple-100 mt-2">Total messages sent since midnight</p>
                </div>
                <div className="card-modern bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-white shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Avg Response</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Service level</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{formatDuration(stats.averageResponse)}</div>
                    <p className="text-sm text-emerald-100 mt-2">Average cross-participant reply time</p>
                </div>
                <div className="card-modern bg-gradient-to-br from-pink-500 to-rose-600 p-6 text-white shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold">Media Shared</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.attachmentsToday}</div>
                    <p className="text-sm text-pink-100 mt-2">Images & attachments detected</p>
                </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern space-y-5">
                <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Chat Operations Center
                        </h2>
                        <p className="text-sm text-cool-600 mt-1">{filteredConversations.length} of {stats.totalConversations} conversations • {messages.length} total messages tracked</p>
                    </div>
                    <div className="flex gap-2">
                        {['recent', 'messages', 'engagement'].map(option => (
                            <button
                                key={option}
                                onClick={() => setSortType(option as typeof sortType)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    sortType === option
                                        ? 'gradient-indigo text-white shadow-modern'
                                        : 'glass border border-indigo-200/60 text-indigo-600 hover:shadow-sm'
                                }`}
                            >
                                {option === 'recent' && 'Latest activity'}
                                {option === 'messages' && 'Most messages'}
                                {option === 'engagement' && '24h engagement'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cool-400" />
                        <input
                            type="text"
                            placeholder="Search by participant or conversation ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass-indigo border-2 border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 text-base"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
                        {([
                            { value: 'all', label: 'All chats', badge: stats.totalConversations, tone: 'glass' },
                            { value: 'live', label: 'Live now', badge: stats.liveConversations, tone: 'emerald' },
                            { value: 'quiet', label: 'Needs follow-up', badge: enrichedConversations.filter(c => c.isQuiet).length, tone: 'amber' },
                            { value: 'highVolume', label: 'High volume', badge: enrichedConversations.filter(c => c.messagesLast24h >= 20).length, tone: 'purple' },
                        ] as const).map(filter => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                    statusFilter === filter.value
                                        ? 'gradient-purple text-white shadow-modern'
                                        : 'glass border border-indigo-200/60 text-indigo-600 hover:shadow-sm'
                                }`}
                            >
                                <span>{filter.label}</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                    statusFilter === filter.value
                                        ? 'bg-white/20 text-white'
                                        : 'bg-indigo-100 text-indigo-700'
                                }`}>
                                    {filter.badge}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredConversations.length === 0 ? (
                    <div className="col-span-full glass rounded-2xl p-12 text-center border border-indigo-100/50 shadow-modern">
                        <ChatBubbleIcon className="w-16 h-16 mx-auto mb-4 text-cool-400 opacity-50" />
                        <p className="text-sm font-semibold text-cool-600">No conversations found</p>
                        <p className="text-xs text-cool-500 mt-1">Try adjusting your search</p>
                    </div>
                ) : (
                    filteredConversations.map((item, index) => {
                        const { conv, participants, convMessages, lastMessage, lastActive, messagesLast24h, attachmentCount, isLive, onlineCount, messageCount, avgResponseTime } = item;

                        return (
                            <div
                                key={conv.id}
                                className="glass rounded-2xl p-5 border border-indigo-100/50 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer group animate-slideUp relative overflow-hidden"
                                style={{ animationDelay: `${index * 0.05}s` }}
                                onClick={() => setSelectedConversation(conv)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                {/* Participants */}
                                <div className="flex items-start gap-3 mb-4 relative z-10">
                                    <div className="flex -space-x-2">
                                        {participants.slice(0, 3).map((user) => (
                                            <img
                                                key={user.id}
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-10 h-10 rounded-full object-cover border-3 border-white ring-2 ring-indigo-100 shadow-modern"
                                            />
                                        ))}
                                        {participants.length > 3 && (
                                            <div className="w-10 h-10 rounded-full gradient-indigo flex items-center justify-center text-white text-xs font-bold border-3 border-white ring-2 ring-indigo-100">
                                                +{participants.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-cool-900 text-sm truncate flex items-center gap-2">
                                            {participants.map(u => u.name).join(', ')}
                                            {isLive && (
                                                <span className="flex items-center gap-1 text-emerald-600 text-[11px] font-bold">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                    </span>
                                                    Live
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-cool-500 flex items-center gap-2 mt-1">
                                            <span>{messageCount} messages total</span>
                                            <span className="text-cool-300">•</span>
                                            <span>{messagesLast24h} in last 24h</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Last Message */}
                                {lastMessage && (
                                    <div className="glass-indigo p-3 rounded-xl mb-3">
                                        <div className="flex items-start gap-2">
                                            <img
                                                src={getUserById(lastMessage.senderId)?.avatar}
                                                alt=""
                                                className="w-6 h-6 rounded-full object-cover border-2 border-indigo-200"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-indigo-700 mb-0.5">
                                                    {getUserById(lastMessage.senderId)?.name}
                                                </p>
                                                <p className="text-xs text-cool-600 truncate">
                                                    {lastMessage.image ? '📷 Image' : lastMessage.text}
                                                </p>
                                            </div>
                                            <span className="text-[10px] text-cool-500 whitespace-nowrap">
                                                {formatRelativeTime(lastMessage.timestamp)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-3 border-t border-indigo-100/50 relative z-10">
                                    <div className="flex items-center gap-3 text-[11px] text-cool-600">
                                        <span className="flex items-center gap-1">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                            {onlineCount} online
                                        </span>
                                        <span>•</span>
                                        <span>ID: {conv.id.slice(0, 8)}</span>
                                        <span>•</span>
                                        <span>Last active {formatRelativeTime(lastActive)}</span>
                                    </div>
                                    <button
                                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedConversation(conv);
                                        }}
                                    >
                                        <EyeIcon />
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] text-cool-600 relative z-10">
                                    <div className="glass border border-indigo-100/60 rounded-lg py-2">
                                        <p className="text-sm font-bold text-indigo-600">{messagesLast24h}</p>
                                        <p>msgs/24h</p>
                                    </div>
                                    <div className="glass border border-indigo-100/60 rounded-lg py-2">
                                        <p className="text-sm font-bold text-purple-600">{attachmentCount}</p>
                                        <p>attachments</p>
                                    </div>
                                    <div className="glass border border-indigo-100/60 rounded-lg py-2">
                                        <p className="text-sm font-bold text-emerald-600">{formatDuration(avgResponseTime)}</p>
                                        <p>avg reply</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Conversation Detail Modal */}
            {selectedConversation && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4"
                    onClick={() => setSelectedConversation(null)}
                >
                    <div
                        className="glass rounded-3xl shadow-modern-xl w-full max-w-4xl h-[80vh] flex flex-col border border-indigo-200/50 neon-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-indigo-100/50">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2">
                                        {getConversationParticipants(selectedConversation).slice(0, 3).map((user) => (
                                            <img
                                                key={user.id}
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-12 h-12 rounded-full object-cover border-3 border-white ring-2 ring-indigo-100 shadow-glow"
                                            />
                                        ))}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold font-display text-cool-800">
                                            {getConversationParticipants(selectedConversation).map(u => u.name).join(', ')}
                                        </h3>
                                        <p className="text-sm text-cool-600">
                                            Conversation ID: {selectedConversation.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="text-cool-400 hover:text-indigo-600 focus:outline-none transition-all hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-indigo-50/50"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {getConversationMessages(selectedConversation.id).map((message, index) => {
                                const sender = getUserById(message.senderId);
                                if (!sender) return null;

                                return (
                                    <div
                                        key={message.id}
                                        className="flex gap-3 animate-slideUp"
                                        style={{ animationDelay: `${index * 0.02}s` }}
                                    >
                                        <img
                                            src={sender.avatar}
                                            alt={sender.name}
                                            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 ring-2 ring-indigo-50 flex-shrink-0"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="font-semibold text-sm text-cool-800">{sender.name}</span>
                                                <span className="text-xs text-cool-500">
                                                    {new Date(message.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="glass-indigo p-3 rounded-xl inline-block max-w-full">
                                                {message.image && (
                                                    <img
                                                        src={message.image}
                                                        alt="Message attachment"
                                                        className="rounded-lg mb-2 max-w-sm max-h-64 object-cover border-2 border-indigo-200"
                                                    />
                                                )}
                                                {message.text && (
                                                    <p className="text-sm text-cool-800 break-words">{message.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-indigo-100/50 glass-indigo">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-2xl font-bold text-indigo-600">{getConversationMessages(selectedConversation.id).length}</p>
                                    <p className="text-xs text-cool-600">Messages</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">{getConversationParticipants(selectedConversation).length}</p>
                                    <p className="text-xs text-cool-600">Participants</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-pink-600">
                                        {getConversationParticipants(selectedConversation).filter(u => u.isOnline).length}
                                    </p>
                                    <p className="text-xs text-cool-600">Online</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMonitor;
