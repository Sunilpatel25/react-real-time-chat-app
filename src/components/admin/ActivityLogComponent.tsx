import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ActivityLog, User } from '../../types';
import { SearchIcon, ClockIcon } from '../shared/Icons';

interface ActivityLogProps {
    logs: ActivityLog[];
    users: User[];
}

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

const ActivityLogComponent: React.FC<ActivityLogProps> = ({ logs, users }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<ActivityLog['type'] | 'all'>('all');
    const [dateRange, setDateRange] = useState<'today' | 'yesterday' | 'last7' | 'last30' | 'all'>('all');
    const [showStats, setShowStats] = useState(true);

    // Debounce search term to prevent excessive re-renders
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Memoize sorted logs to prevent re-sorting on every render
    const sortedLogs = useMemo(() => 
        [...logs].sort((a, b) => b.timestamp - a.timestamp),
        [logs]
    );

    // Date range filtering - memoized for performance
    const filterByDateRange = useCallback((timestamp: number) => {
        const now = new Date();
        const logDate = new Date(timestamp);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        switch (dateRange) {
            case 'today':
                return logDate >= today;
            case 'yesterday':
                return logDate >= yesterday && logDate < today;
            case 'last7':
                const week = new Date(today);
                week.setDate(week.getDate() - 7);
                return logDate >= week;
            case 'last30':
                const month = new Date(today);
                month.setDate(month.getDate() - 30);
                return logDate >= month;
            default:
                return true;
        }
    }, [dateRange]);

    // Memoize filtered logs to prevent recalculation on every render
    const filteredLogs = useMemo(() => {
        return sortedLogs.filter(log => {
            const matchesSearch = log.userName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                                log.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
            const matchesType = filterType === 'all' || log.type === filterType;
            const matchesDate = filterByDateRange(log.timestamp);
            return matchesSearch && matchesType && matchesDate;
        });
    }, [sortedLogs, debouncedSearchTerm, filterType, filterByDateRange]);

    // Activity statistics - memoized
    const stats = useMemo(() => ({
        total: filteredLogs.length,
        login: filteredLogs.filter(l => l.type === 'login').length,
        logout: filteredLogs.filter(l => l.type === 'logout').length,
        message: filteredLogs.filter(l => l.type === 'message').length,
        conversation: filteredLogs.filter(l => l.type === 'conversation_start').length,
        profile: filteredLogs.filter(l => l.type === 'profile_update').length,
        search: filteredLogs.filter(l => l.type === 'user_search').length,
    }), [filteredLogs]);

    // Most active users - memoized
    const topUsers = useMemo(() => {
        const userActivity = filteredLogs.reduce((acc, log) => {
            acc[log.userId] = (acc[log.userId] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(userActivity)
            .sort(([, countA], [, countB]) => (countB as number) - (countA as number))
            .slice(0, 5)
            .map(([userId, count]) => ({
                userId,
                userName: logs.find(l => l.userId === userId)?.userName || 'Unknown',
                count
            }));
    }, [filteredLogs, logs]);

    // Export functionality - memoized callback
    const exportActivityLog = useCallback(() => {
        const csvHeader = 'Timestamp,User,Activity Type,Description,Metadata\n';
        const csvRows = filteredLogs.map(log => {
            const timestamp = new Date(log.timestamp).toISOString();
            const metadata = log.metadata ? JSON.stringify(log.metadata).replace(/,/g, ';') : '';
            return `${timestamp},"${log.userName}",${log.type},"${log.description}","${metadata}"`;
        }).join('\n');
        
        const csv = csvHeader + csvRows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [filteredLogs]);

    // Flatten logs for virtual list - memoized
    const flattenedLogs = useMemo(() => {
        const result: Array<{ type: 'date' | 'log', date?: string, log?: ActivityLog, count?: number }> = [];
        const groupedLogs = filteredLogs.reduce((groups, log) => {
            const date = new Date(log.timestamp).toLocaleDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(log);
            return groups;
        }, {} as Record<string, ActivityLog[]>);

        Object.entries(groupedLogs).forEach(([date, dayLogs]) => {
            const logsForDay = dayLogs as ActivityLog[];
            result.push({ type: 'date', date, count: logsForDay.length });
            logsForDay.forEach(log => {
                result.push({ type: 'log', log });
            });
        });
        
        return result;
    }, [filteredLogs]);

    // Simple virtualization: only render visible items + buffer
    const ITEMS_PER_PAGE = 20;
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load more items when scrolling near bottom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
            
            // Load more when scrolled 80% down
            if (scrollPercentage > 0.8 && visibleCount < flattenedLogs.length) {
                setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, flattenedLogs.length));
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => container.removeEventListener('scroll', handleScroll);
    }, [visibleCount, flattenedLogs.length]);

    // Reset visible count when filters change
    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [debouncedSearchTerm, filterType, dateRange]);

    // Get visible logs
    const visibleLogs = useMemo(() => 
        flattenedLogs.slice(0, visibleCount),
        [flattenedLogs, visibleCount]
    );

    // Render a single log row - memoized
    const renderLogRow = useCallback((item: typeof flattenedLogs[0], index: number) => {
        
        if (item.type === 'date') {
            return (
                <div key={`date-${item.date}`} className="px-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-2.5 glass-indigo rounded-xl shadow-modern border border-indigo-200/50">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-indigo-900">{item.date}</p>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-bold">
                                    {item.count}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 h-px bg-gradient-to-r from-indigo-300 via-purple-300 to-transparent"></div>
                    </div>
                </div>
            );
        }

        const log = item.log!;
        const colors = getActivityColor(log.type);
        const time = formatTimestamp(log.timestamp);
        const isRecent = new Date().getTime() - log.timestamp < 300000; // 5 minutes

        return (
            <div key={log.id} className="px-4 py-1 relative pl-12">
                {/* Timeline Dot */}
                <div className={`absolute left-10 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${colors.icon} border-2 border-white shadow-lg ${isRecent ? 'animate-pulse' : ''}`}></div>

                <div className={`glass rounded-xl p-4 border ${colors.border} shadow-modern hover:shadow-modern-lg transition-all duration-200 hover:scale-[1.01] group relative`}>
                    {/* Recent Activity Indicator */}
                    {isRecent && (
                        <div className="absolute top-2 right-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                    )}

                    <div className="flex items-start gap-4">
                        {/* Avatar with Online Status */}
                        <div className="relative flex-shrink-0">
                            <img
                                src={log.userAvatar}
                                alt={log.userName}
                                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 ring-4 ring-indigo-50 group-hover:ring-indigo-100 transition-all"
                            />
                            {isRecent && (
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-cool-900">
                                        <span className="text-indigo-700">{log.userName}</span>
                                        <span className="font-normal text-cool-600 ml-1">{log.description}</span>
                                    </p>
                                    {log.metadata?.recipientName && (
                                        <p className="text-xs text-cool-500 mt-1 flex items-center gap-1">
                                            💬 with <span className="font-semibold text-cool-700">{log.metadata.recipientName}</span>
                                        </p>
                                    )}
                                </div>
                                <div className={`p-2.5 rounded-lg ${colors.icon} flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                                    {getActivityIcon(log.type)}
                                </div>
                            </div>

                            {/* Activity Meta Info */}
                            <div className="flex items-center gap-3 text-xs text-cool-500 flex-wrap">
                                <span className="flex items-center gap-1 font-medium">
                                    <ClockIcon className="w-3.5 h-3.5" />
                                    <span title={time.fullDate} className="text-cool-600">
                                        {time.timeAgo}
                                    </span>
                                </span>
                                <span className="text-cool-300">•</span>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${activityTypes.find(t => t.value === log.type)?.color} shadow-sm`}>
                                    {log.type.replace('_', ' ').toUpperCase()}
                                </span>
                                {log.metadata?.conversationId && (
                                    <>
                                        <span className="text-cool-300">•</span>
                                        <span className="font-mono text-cool-500 bg-cool-100 px-2 py-0.5 rounded">
                                            ID: {log.metadata.conversationId.slice(0, 8)}
                                        </span>
                                    </>
                                )}
                                {isRecent && (
                                    <>
                                        <span className="text-cool-300">•</span>
                                        <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                            </span>
                                            LIVE
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, []);

    const activityTypes: { value: ActivityLog['type'] | 'all'; label: string; color: string }[] = [
        { value: 'all', label: 'All', color: 'bg-cool-100 text-cool-700' },
        { value: 'login', label: 'Login', color: 'bg-emerald-100 text-emerald-700' },
        { value: 'logout', label: 'Logout', color: 'bg-cool-100 text-cool-700' },
        { value: 'message', label: 'Message', color: 'bg-indigo-100 text-indigo-700' },
        { value: 'conversation_start', label: 'New Chat', color: 'bg-purple-100 text-purple-700' },
        { value: 'profile_update', label: 'Profile', color: 'bg-pink-100 text-pink-700' },
        { value: 'user_search', label: 'Search', color: 'bg-blue-100 text-blue-700' }
    ];

    const getActivityIcon = (type: ActivityLog['type']) => {
        const icons = {
            login: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
            ),
            logout: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            ),
            message: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            ),
            conversation_start: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            profile_update: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            user_search: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            )
        };
        return icons[type];
    };

    const getActivityColor = (type: ActivityLog['type']) => {
        const colors = {
            login: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
            logout: { bg: 'bg-cool-50', border: 'border-cool-200', text: 'text-cool-700', icon: 'bg-cool-100 text-cool-600' },
            message: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: 'bg-indigo-100 text-indigo-600' },
            conversation_start: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
            profile_update: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: 'bg-pink-100 text-pink-600' },
            user_search: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' }
        };
        return colors[type];
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        let timeAgo = '';
        if (minutes < 1) timeAgo = 'Just now';
        else if (minutes < 60) timeAgo = `${minutes}m ago`;
        else if (hours < 24) timeAgo = `${hours}h ago`;
        else if (days < 7) timeAgo = `${days}d ago`;
        else timeAgo = date.toLocaleDateString();

        return {
            timeAgo,
            fullDate: date.toLocaleString()
        };
    };

    // Group logs by date
    const groupedLogs = filteredLogs.reduce((groups, log) => {
        const date = new Date(log.timestamp).toLocaleDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(log);
        return groups;
    }, {} as Record<string, ActivityLog[]>);

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Stats Toggle */}
            <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Activity Log
                        </h2>
                        <p className="text-sm text-cool-600 mt-1">{filteredLogs.length} activities in selected period</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="px-4 py-2 rounded-xl font-semibold text-sm gradient-indigo text-white shadow-modern hover:scale-105 transition-all duration-200"
                        >
                            {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
                        </button>
                        <button
                            onClick={exportActivityLog}
                            className="px-4 py-2 rounded-xl font-semibold text-sm gradient-purple text-white shadow-modern hover:scale-105 transition-all duration-200"
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>

                {/* Statistics Panel */}
                {showStats && (
                    <div className="mb-6 animate-slideDown">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
                            <div className="glass-emerald rounded-xl p-4 border border-emerald-200/50 shadow-modern">
                                <p className="text-xs font-semibold text-emerald-700 mb-1">Logins</p>
                                <p className="text-2xl font-bold text-emerald-900">{stats.login}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border border-rose-200/50 shadow-modern">
                                <p className="text-xs font-semibold text-rose-700 mb-1">Logouts</p>
                                <p className="text-2xl font-bold text-rose-900">{stats.logout}</p>
                            </div>
                            <div className="glass-indigo rounded-xl p-4 border border-indigo-200/50 shadow-modern">
                                <p className="text-xs font-semibold text-indigo-700 mb-1">Messages</p>
                                <p className="text-2xl font-bold text-indigo-900">{stats.message}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border border-purple-200/50 shadow-modern">
                                <p className="text-xs font-semibold text-purple-700 mb-1">Conversations</p>
                                <p className="text-2xl font-bold text-purple-900">{stats.conversation}</p>
                            </div>
                            <div className="glass rounded-xl p-4 border border-sky-200/50 shadow-modern">
                                <p className="text-xs font-semibold text-sky-700 mb-1">Profile Updates</p>
                                <p className="text-2xl font-bold text-sky-900">{stats.profile}</p>
                            </div>
                        </div>

                        {/* Top Active Users */}
                        {topUsers.length > 0 && (
                            <div className="glass rounded-xl p-4 border border-indigo-200/50 shadow-modern">
                                <h3 className="text-sm font-bold text-indigo-900 mb-3">🏆 Most Active Users</h3>
                                <div className="space-y-2">
                                    {topUsers.map((user, index) => (
                                        <div key={user.userId} className="flex items-center gap-3">
                                            <span className={`text-lg ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}`}>
                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤'}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-semibold text-cool-900">{user.userName}</span>
                                                    <span className="text-xs font-bold text-indigo-700">{user.count} activities</span>
                                                </div>
                                                <div className="h-2 bg-cool-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full gradient-indigo rounded-full transition-all duration-500"
                                                        style={{ width: `${((user.count as number) / (topUsers[0].count as number)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search & Date Range */}
                <div className="space-y-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cool-400" />
                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass-indigo border-2 border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 text-base"
                        />
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {[
                            { value: 'today', label: '📅 Today', icon: '📅' },
                            { value: 'yesterday', label: '⏮️ Yesterday', icon: '⏮️' },
                            { value: 'last7', label: '📊 Last 7 Days', icon: '📊' },
                            { value: 'last30', label: '📈 Last 30 Days', icon: '📈' },
                            { value: 'all', label: '🌐 All Time', icon: '🌐' },
                        ].map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setDateRange(range.value as typeof dateRange)}
                                className={`
                                    px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200
                                    ${dateRange === range.value
                                        ? 'gradient-purple text-white shadow-modern scale-105'
                                        : 'glass border border-purple-200/50 text-purple-700 hover:scale-105'
                                    }
                                `}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Activity Type Filter */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {activityTypes.map((type) => (
                            <button
                                key={type.value}
                                onClick={() => setFilterType(type.value)}
                                className={`
                                    px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200
                                    ${filterType === type.value
                                        ? 'gradient-indigo text-white shadow-modern scale-105'
                                        : `${type.color} hover:scale-105`
                                    }
                                `}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Activity Timeline with Infinite Scroll */}
            <div 
                ref={containerRef}
                className="relative max-h-[800px] overflow-y-auto custom-scrollbar"
            >
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-purple-300 to-pink-300 z-0"></div>

                {flattenedLogs.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center border border-indigo-100/50 shadow-modern">
                        <ClockIcon className="w-16 h-16 mx-auto mb-4 text-cool-400 opacity-50" />
                        <p className="text-lg font-bold text-cool-700 mb-2">No activities found</p>
                        <p className="text-sm text-cool-500">Try adjusting your search, date range, or filters</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {visibleLogs.map((item, index) => renderLogRow(item, index))}
                        {visibleCount < flattenedLogs.length && (
                            <div className="text-center py-4">
                                <div className="inline-block px-6 py-3 bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-sm animate-pulse">
                                    Loading {flattenedLogs.length - visibleCount} more...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogComponent;
