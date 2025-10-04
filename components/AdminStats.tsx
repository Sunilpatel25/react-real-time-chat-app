import React from 'react';
import { User, ActivityLog, ChatStats } from '../types';
import { UsersIcon, ChatBubbleIcon, TrendingUpIcon, ClockIcon } from './Icons';

interface AdminStatsProps {
    stats: ChatStats;
    allUsers: User[];
    recentActivity: ActivityLog[];
}

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    color: 'indigo' | 'purple' | 'pink' | 'emerald';
    trend?: {
        value: string;
        positive: boolean;
    };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color, trend }) => {
    const colorClasses = {
        indigo: {
            bg: 'from-indigo-500 to-indigo-600',
            text: 'text-indigo-600',
            lightBg: 'bg-indigo-50',
            ring: 'ring-indigo-100'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            text: 'text-purple-600',
            lightBg: 'bg-purple-50',
            ring: 'ring-purple-100'
        },
        pink: {
            bg: 'from-pink-500 to-pink-600',
            text: 'text-pink-600',
            lightBg: 'bg-pink-50',
            ring: 'ring-pink-100'
        },
        emerald: {
            bg: 'from-emerald-500 to-emerald-600',
            text: 'text-emerald-600',
            lightBg: 'bg-emerald-50',
            ring: 'ring-emerald-100'
        }
    };

    const colors = colorClasses[color];

    return (
        <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:scale-105 group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-cool-600 mb-1">{title}</p>
                    <h3 className="text-3xl font-bold font-display mb-2 bg-gradient-to-r ${colors.bg} bg-clip-text text-transparent">
                        {value}
                    </h3>
                    <p className="text-xs text-cool-500">{subtitle}</p>
                    
                    {trend && (
                        <div className={`mt-3 flex items-center gap-1 text-xs font-semibold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                {trend.positive ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                )}
                            </svg>
                            <span>{trend.value}</span>
                        </div>
                    )}
                </div>
                
                <div className={`p-3 ${colors.lightBg} rounded-xl ${colors.ring} ring-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
            </div>
        </div>
    );
};

const AdminStats: React.FC<AdminStatsProps> = ({ stats, allUsers, recentActivity }) => {
    const onlineUsers = allUsers.filter(u => u.isOnline);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    subtitle="Registered accounts"
                    icon={UsersIcon}
                    color="indigo"
                    trend={{ value: `+${stats.newUsersToday} today`, positive: true }}
                />
                
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers}
                    subtitle="Currently online"
                    icon={UsersIcon}
                    color="emerald"
                    trend={{ value: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}% online`, positive: true }}
                />
                
                <StatCard
                    title="Conversations"
                    value={stats.totalConversations}
                    subtitle="Total chats"
                    icon={ChatBubbleIcon}
                    color="purple"
                    trend={{ value: `${stats.activeConversationsToday} active today`, positive: true }}
                />
                
                <StatCard
                    title="Messages"
                    value={stats.totalMessages}
                    subtitle="All time messages"
                    icon={TrendingUpIcon}
                    color="pink"
                    trend={{ value: `${stats.messagesToday} today`, positive: true }}
                />
            </div>

            {/* Recent Activity & Online Users */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Online Users */}
                <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold font-display text-cool-800 flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            Online Users
                        </h3>
                        <span className="px-3 py-1 text-sm font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                            {onlineUsers.length} online
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {onlineUsers.length === 0 ? (
                            <div className="text-center py-8 text-cool-500">
                                <UsersIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No users online</p>
                            </div>
                        ) : (
                            onlineUsers.map((user) => (
                                <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors duration-200 group">
                                    <div className="relative">
                                        <img 
                                            src={user.avatar} 
                                            alt={user.name} 
                                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-300 ring-4 ring-emerald-50"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-glow"></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-cool-800 text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-cool-500 truncate">{user.email}</p>
                                    </div>
                                    <div className="text-xs text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                                        Active
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold font-display text-cool-800 flex items-center gap-2">
                            <ClockIcon className="w-5 h-5 text-indigo-600" />
                            Recent Activity
                        </h3>
                        <span className="px-3 py-1 text-sm font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                            Live
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-cool-500">
                                <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No recent activity</p>
                            </div>
                        ) : (
                            recentActivity.map((log) => {
                                const iconColor = {
                                    login: 'text-emerald-600 bg-emerald-50',
                                    logout: 'text-cool-600 bg-cool-50',
                                    message: 'text-indigo-600 bg-indigo-50',
                                    conversation_start: 'text-purple-600 bg-purple-50',
                                    profile_update: 'text-pink-600 bg-pink-50',
                                    user_search: 'text-blue-600 bg-blue-50'
                                }[log.type];

                                return (
                                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-indigo-50/50 transition-colors duration-200">
                                        <img 
                                            src={log.userAvatar} 
                                            alt={log.userName} 
                                            className="w-8 h-8 rounded-full object-cover border-2 border-indigo-200 mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-cool-800">
                                                <span className="font-semibold">{log.userName}</span>
                                                {' '}
                                                <span className="text-cool-600">{log.description}</span>
                                            </p>
                                            <p className="text-xs text-cool-500 mt-0.5">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className={`p-1.5 rounded-lg ${iconColor}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Activity Chart Placeholder */}
            <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern">
                <h3 className="text-lg font-bold font-display text-cool-800 mb-4 flex items-center gap-2">
                    <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
                    Activity Overview
                </h3>
                <div className="h-64 flex items-center justify-center gradient-animated rounded-xl border-2 border-dashed border-indigo-300">
                    <div className="text-center">
                        <TrendingUpIcon className="w-16 h-16 text-white mx-auto mb-3" />
                        <p className="text-white font-semibold">Activity Chart</p>
                        <p className="text-indigo-100 text-sm mt-1">Real-time analytics visualization</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStats;
