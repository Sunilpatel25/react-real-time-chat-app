import React, { useMemo } from 'react';
import { User, Message, Conversation } from '@types';

interface EnhancedAdminStatsProps {
    allUsers: User[];
    allMessages: Message[];
    allConversations: Conversation[];
}

const EnhancedAdminStats: React.FC<EnhancedAdminStatsProps> = ({ 
    allUsers, 
    allMessages, 
    allConversations 
}) => {
    // Calculate advanced statistics
    const stats = useMemo(() => {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Messages statistics
        const messages24h = allMessages.filter(m => new Date(m.timestamp) >= last24h).length;
        const messages7d = allMessages.filter(m => new Date(m.timestamp) >= last7d).length;
        const messages30d = allMessages.filter(m => new Date(m.timestamp) >= last30d).length;
        
        // User statistics
        const activeUsers24h = new Set(
            allMessages
                .filter(m => new Date(m.timestamp) >= last24h)
                .map(m => m.senderId)
        ).size;

        const activeUsers7d = new Set(
            allMessages
                .filter(m => new Date(m.timestamp) >= last7d)
                .map(m => m.senderId)
        ).size;

        // Average messages per user
        const avgMessagesPerUser = allUsers.length > 0 ? (allMessages.length / allUsers.length).toFixed(1) : '0';
        
        // Most active user
        const userMessageCount = allMessages.reduce((acc, msg) => {
            acc[msg.senderId] = (acc[msg.senderId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const mostActiveUserId = Object.entries(userMessageCount).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0];
        const mostActiveUser = allUsers.find(u => u.id === mostActiveUserId);

        // Engagement rate
        const engagementRate = allUsers.length > 0 ? ((activeUsers7d / allUsers.length) * 100).toFixed(1) : '0';

        // Messages with images
        const messagesWithImages = allMessages.filter(m => m.image).length;
        const imagePercentage = allMessages.length > 0 ? ((messagesWithImages / allMessages.length) * 100).toFixed(1) : '0';

        return {
            totalUsers: allUsers.length,
            totalMessages: allMessages.length,
            totalConversations: allConversations.length,
            messages24h,
            messages7d,
            messages30d,
            activeUsers24h,
            activeUsers7d,
            avgMessagesPerUser,
            mostActiveUser,
            mostActiveUserMessages: userMessageCount[mostActiveUserId!] || 0,
            engagementRate,
            messagesWithImages,
            imagePercentage,
        };
    }, [allUsers, allMessages, allConversations]);

    return (
        <div className="space-y-6">
            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle="Registered users"
                    icon="👥"
                    color="indigo"
                    trend={stats.activeUsers24h > 0 ? `${stats.activeUsers24h} active today` : undefined}
                />
                <StatCard
                    title="Total Messages"
                    value={stats.totalMessages.toLocaleString()}
                    subtitle="All time"
                    icon="💬"
                    color="purple"
                    trend={stats.messages24h > 0 ? `+${stats.messages24h} today` : undefined}
                />
                <StatCard
                    title="Conversations"
                    value={stats.totalConversations}
                    subtitle="Active chats"
                    icon="🔗"
                    color="pink"
                />
                <StatCard
                    title="Engagement Rate"
                    value={`${stats.engagementRate}%`}
                    subtitle="7-day active users"
                    icon="📊"
                    color="emerald"
                />
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    label="Messages (24h)"
                    value={stats.messages24h}
                    color="indigo"
                />
                <MetricCard
                    label="Messages (7d)"
                    value={stats.messages7d}
                    color="purple"
                />
                <MetricCard
                    label="Messages (30d)"
                    value={stats.messages30d}
                    color="pink"
                />
            </div>

            {/* Activity Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Activity */}
                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>👤</span>
                        User Activity
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Avg. messages per user</span>
                            <span className="text-2xl font-bold gradient-text-indigo">
                                {stats.avgMessagesPerUser}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Active users (24h)</span>
                            <span className="text-2xl font-bold gradient-text-purple">
                                {stats.activeUsers24h}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Active users (7d)</span>
                            <span className="text-2xl font-bold gradient-text-pink">
                                {stats.activeUsers7d}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Insights */}
                <div className="glass-effect rounded-2xl p-6 border border-white/20">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span>📸</span>
                        Content Insights
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Messages with images</span>
                            <span className="text-2xl font-bold gradient-text-indigo">
                                {stats.messagesWithImages}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600">Image usage rate</span>
                            <span className="text-2xl font-bold gradient-text-purple">
                                {stats.imagePercentage}%
                            </span>
                        </div>
                        {stats.mostActiveUser && (
                            <div className="pt-4 border-t border-slate-200">
                                <div className="text-sm text-slate-600 mb-2">Most Active User</div>
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={stats.mostActiveUser.avatar} 
                                        alt={stats.mostActiveUser.name}
                                        className="w-10 h-10 rounded-full ring-2 ring-indigo-100"
                                    />
                                    <div>
                                        <div className="font-semibold text-slate-800">
                                            {stats.mostActiveUser.name}
                                        </div>
                                        <div className="text-sm text-slate-500">
                                            {stats.mostActiveUserMessages} messages
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Activity Timeline
                </h3>
                <SimpleBarChart
                    data={[
                        { label: '24h', value: stats.messages24h, color: 'indigo' },
                        { label: '7d', value: stats.messages7d, color: 'purple' },
                        { label: '30d', value: stats.messages30d, color: 'pink' },
                    ]}
                />
            </div>
        </div>
    );
};

// Stat Card Component
interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: string;
    color: 'indigo' | 'purple' | 'pink' | 'emerald';
    trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, color, trend }) => {
    const colorClasses = {
        indigo: 'from-indigo-500 to-indigo-600',
        purple: 'from-purple-500 to-purple-600',
        pink: 'from-pink-500 to-pink-600',
        emerald: 'from-emerald-500 to-emerald-600',
    };

    return (
        <div className="glass-effect rounded-2xl p-6 border border-white/20 hover:shadow-modern-lg transition-all duration-300 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`text-4xl group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className={`px-3 py-1 bg-gradient-to-r ${colorClasses[color]} text-white text-sm font-semibold rounded-full`}>
                    {title}
                </div>
            </div>
            <div className="space-y-2">
                <div className="text-4xl font-bold gradient-text-indigo">
                    {value}
                </div>
                <div className="text-sm text-slate-600">
                    {subtitle}
                </div>
                {trend && (
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                        <span>↗</span>
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};

// Metric Card Component
interface MetricCardProps {
    label: string;
    value: number;
    color: 'indigo' | 'purple' | 'pink';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, color }) => {
    const colorClasses = {
        indigo: 'gradient-text-indigo',
        purple: 'gradient-text-purple',
        pink: 'gradient-text-pink',
    };

    return (
        <div className="glass-effect rounded-xl p-4 border border-white/20">
            <div className="text-sm text-slate-600 mb-1">{label}</div>
            <div className={`text-3xl font-bold ${colorClasses[color]}`}>
                {value.toLocaleString()}
            </div>
        </div>
    );
};

// Simple Bar Chart Component
interface SimpleBarChartProps {
    data: Array<{
        label: string;
        value: number;
        color: 'indigo' | 'purple' | 'pink';
    }>;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    const colorClasses = {
        indigo: 'bg-gradient-to-t from-indigo-500 to-indigo-400',
        purple: 'bg-gradient-to-t from-purple-500 to-purple-400',
        pink: 'bg-gradient-to-t from-pink-500 to-pink-400',
    };

    return (
        <div className="flex items-end justify-around gap-8 h-48">
            {data.map((item, index) => {
                const height = (item.value / maxValue) * 100;
                return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-3">
                        <div className="text-sm font-semibold text-slate-700">
                            {item.value.toLocaleString()}
                        </div>
                        <div 
                            className={`w-full ${colorClasses[item.color]} rounded-t-lg transition-all duration-500 hover:scale-105 shadow-lg`}
                            style={{ height: `${height}%`, minHeight: '20px' }}
                        />
                        <div className="text-sm font-medium text-slate-600">
                            {item.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EnhancedAdminStats;
