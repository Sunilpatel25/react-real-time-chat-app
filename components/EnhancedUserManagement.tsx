import React, { useState, useMemo } from 'react';
import { User } from '../types';

interface EnhancedUserManagementProps {
    allUsers: User[];
    onMakeAdmin: (userId: string) => void;
    onRemoveAdmin: (userId: string) => void;
    onDeleteUser: (userId: string) => void;
}

const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({
    allUsers,
    onMakeAdmin,
    onRemoveAdmin,
    onDeleteUser,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
    const [segmentFilter, setSegmentFilter] = useState<'all' | 'new' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'email' | 'joinedAt'>('joinedAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const getJoinedAt = (user: User): number | null => {
        const raw = user.joinedAt ?? (user as unknown as { createdAt?: number | string | Date })?.createdAt ?? null;
        if (!raw) return null;
        if (typeof raw === 'number') return raw;
        if (typeof raw === 'string') {
            const parsed = Date.parse(raw);
            return Number.isNaN(parsed) ? null : parsed;
        }
        return (raw as Date).getTime();
    };

    const filteredUsers = useMemo(() => {
        const lowerSearch = searchQuery.toLowerCase();
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const matchesSegment = (user: User) => {
            if (segmentFilter === 'all') return true;
            const joinedAt = getJoinedAt(user);
            if (segmentFilter === 'new') {
                return joinedAt !== null && joinedAt >= sevenDaysAgo;
            }
            if (segmentFilter === 'inactive') {
                const lastSeen = user.lastSeen ?? joinedAt ?? 0;
                return lastSeen < thirtyDaysAgo;
            }
            return true;
        };

        const matchesStatus = (user: User) => {
            if (statusFilter === 'all') return true;
            return statusFilter === 'online' ? user.isOnline : !user.isOnline;
        };

        const list = allUsers
            .filter(user => {
                const matchesSearch = user.name.toLowerCase().includes(lowerSearch) ||
                    user.email.toLowerCase().includes(lowerSearch);
                const matchesRole = filterRole === 'all' || user.role === filterRole;
                return matchesSearch && matchesRole && matchesStatus(user) && matchesSegment(user);
            })
            .sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'email':
                        comparison = a.email.localeCompare(b.email);
                        break;
                    case 'joinedAt':
                    default: {
                        const joinedA = getJoinedAt(a) ?? 0;
                        const joinedB = getJoinedAt(b) ?? 0;
                        comparison = joinedA - joinedB;
                        break;
                    }
                }
                return sortOrder === 'asc' ? comparison : -comparison;
            });

        return list;
    }, [allUsers, searchQuery, filterRole, statusFilter, segmentFilter, sortBy, sortOrder]);

    const stats = useMemo(() => {
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const totalOnline = allUsers.filter(user => user.isOnline).length;
        const totalAdmins = allUsers.filter(user => user.role === 'admin').length;
        const totalNew = allUsers.filter(user => {
            const joinedAt = getJoinedAt(user);
            return joinedAt !== null && joinedAt >= sevenDaysAgo;
        }).length;
        const totalInactive = allUsers.filter(user => {
            const lastSeen = user.lastSeen ?? getJoinedAt(user) ?? 0;
            return lastSeen && lastSeen < sevenDaysAgo;
        }).length;

        return {
            totalUsers: allUsers.length,
            online: totalOnline,
            admins: totalAdmins,
            newThisWeek: totalNew,
            inactive: totalInactive,
        };
    }, [allUsers]);

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Role', 'Created At'];
        const rows = filteredUsers.map(user => [
            user.name,
            user.email,
            user.role || 'user',
            (() => {
                const joinedAt = getJoinedAt(user);
                return joinedAt ? new Date(joinedAt).toLocaleDateString() : 'N/A';
            })()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const formatRelativeTime = (timestamp?: number | null) => {
        if (!timestamp) return 'No activity yet';
        const diff = Date.now() - timestamp;
        if (diff < 60 * 1000) return 'Just now';
        if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
        if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const formatJoinedDate = (user: User) => {
        const joinedAt = getJoinedAt(user);
        if (!joinedAt) return 'Unknown';
        return new Date(joinedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const segmentOptions = [
        {
            value: 'all' as const,
            label: 'All users',
            description: `${stats.totalUsers} total`,
            icon: '🌐'
        },
        {
            value: 'new' as const,
            label: 'New this week',
            description: `${stats.newThisWeek} joined`,
            icon: '✨'
        },
        {
            value: 'inactive' as const,
            label: 'Needs attention',
            description: `${stats.inactive} inactive`,
            icon: '🛠️'
        },
    ];

    const sortOptions: Array<{ value: string; label: string }> = [
        { value: 'joinedAt-desc', label: 'Newest' },
        { value: 'joinedAt-asc', label: 'Oldest' },
        { value: 'name-asc', label: 'Name A-Z' },
        { value: 'name-desc', label: 'Name Z-A' },
        { value: 'email-asc', label: 'Email A-Z' },
        { value: 'email-desc', label: 'Email Z-A' },
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Snapshot metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="card-modern gradient-indigo text-white p-6 shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-indigo-100">Total users</span>
                        <span className="text-2xl">👥</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.totalUsers}</div>
                    <p className="text-sm text-indigo-100/80 mt-2">Complete directory across the platform</p>
                </div>
                <div className="card-modern bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-6 shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-emerald-100">Online now</span>
                        <span className="text-2xl">🟢</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.online}</div>
                    <p className="text-sm text-emerald-100/80 mt-2">Actively connected in the last minute</p>
                </div>
                <div className="card-modern bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white p-6 shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-purple-100">Admins</span>
                        <span className="text-2xl">👑</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.admins}</div>
                    <p className="text-sm text-purple-100/80 mt-2">Team members with elevated privileges</p>
                </div>
                <div className="card-modern bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-6 shadow-modern-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm uppercase tracking-wide text-blue-100">New this week</span>
                        <span className="text-2xl">✨</span>
                    </div>
                    <div className="mt-4 text-4xl font-bold">{stats.newThisWeek}</div>
                    <p className="text-sm text-blue-100/80 mt-2">Fresh registrations in the last 7 days</p>
                </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-2xl p-6 border border-indigo-100/40 shadow-modern">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
                    <div className="w-full xl:max-w-lg relative">
                        <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-cool-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m0 0A7 7 0 105.8 5.8a7 7 0 0010 10z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, email, or ID..."
                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/80 backdrop-blur border border-indigo-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-200/60 transition-all duration-200 text-sm"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                        <div className="flex bg-white/80 backdrop-blur rounded-xl border border-indigo-100 overflow-hidden">
                            {(['all', 'admin', 'user'] as const).map(role => (
                                <button
                                    key={role}
                                    onClick={() => setFilterRole(role)}
                                    className={`px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                        filterRole === role
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'text-indigo-600 hover:bg-indigo-50'
                                    }`}
                                >
                                    {role === 'all' ? 'All roles' : role === 'admin' ? 'Admins' : 'Users'}
                                </button>
                            ))}
                        </div>

                        <div className="flex bg-white/80 backdrop-blur rounded-xl border border-indigo-100 overflow-hidden">
                            {(['all', 'online', 'offline'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
                                        statusFilter === status
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                                            : 'text-emerald-600 hover:bg-emerald-50'
                                    }`}
                                >
                                    {status === 'all' ? 'Status: Any' : status === 'online' ? '🟢 Online' : '⚪ Offline'}
                                </button>
                            ))}
                        </div>

                        <select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                                const [newSortBy, newSortOrder] = e.target.value.split('-');
                                setSortBy(newSortBy as typeof sortBy);
                                setSortOrder(newSortOrder as typeof sortOrder);
                            }}
                            className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-indigo-100 bg-white/80 backdrop-blur focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/60 transition-all duration-200"
                        >
                            {sortOptions.map(option => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>

                        <div className="flex bg-white/80 backdrop-blur rounded-xl border border-indigo-100 overflow-hidden">
                            {(['grid', 'table'] as const).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                                        viewMode === mode
                                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md'
                                            : 'text-purple-600 hover:bg-purple-50'
                                    }`}
                                >
                                    {mode === 'grid' ? '🗂️ Cards' : '📋 Table'}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={exportToCSV}
                            className="px-4 py-2.5 text-sm font-semibold rounded-xl gradient-indigo text-white shadow-modern hover:shadow-modern-lg transition-transform duration-200 hover:scale-[1.03] active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16l-3-3m3 3l3-3m-3 3V4m7 12v2a2 2 0 01-2 2H7a2 2 0 01-2-2v-2" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-5">
                    {segmentOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setSegmentFilter(option.value)}
                            className={`px-4 py-3 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 ${
                                segmentFilter === option.value
                                    ? 'border-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-modern'
                                    : 'border-indigo-100 bg-white/80 text-indigo-600 hover:bg-indigo-50'
                            }`}
                        >
                            <span className="text-2xl leading-none">{option.icon}</span>
                            <span>
                                <span className="block text-sm font-semibold">{option.label}</span>
                                <span className={`text-xs font-medium ${segmentFilter === option.value ? 'text-white/80' : 'text-indigo-500/80'}`}>
                                    {option.description}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-4 text-xs text-cool-500 font-medium">
                    Displaying <span className="text-indigo-600 font-semibold">{filteredUsers.length}</span> of <span className="text-indigo-600 font-semibold">{stats.totalUsers}</span> users
                </div>
            </div>

            {/* Users presentation */}
            {filteredUsers.length === 0 ? (
                <div className="glass rounded-2xl p-16 text-center border border-indigo-100/50 shadow-modern">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-bold text-cool-800">No users match the current filters</h3>
                    <p className="text-sm text-cool-600 mt-2">Adjust the search, role, or status filters to discover more members.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredUsers.map((user, index) => {
                        const joinedLabel = formatJoinedDate(user);
                        const lastSeenLabel = user.isOnline ? 'Online now' : formatRelativeTime(user.lastSeen ?? getJoinedAt(user));
                        return (
                            <div
                                key={user.id}
                                className="glass rounded-2xl p-5 border border-indigo-100/50 shadow-modern hover:shadow-modern-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] relative overflow-hidden animate-slideUp group"
                                style={{ animationDelay: `${index * 0.04}s` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-lg"
                                            />
                                            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-cool-300'}`}></span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-bold text-cool-900">{user.name}</h4>
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    {user.role === 'admin' ? 'Admin' : 'Member'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-cool-600">{user.email}</p>
                                            <p className="text-xs text-cool-500 mt-1">ID: {user.id.slice(0, 8)}...</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-semibold text-cool-500">Joined</div>
                                        <div className="text-sm font-bold text-indigo-600">{joinedLabel}</div>
                                        <div className="text-xs text-cool-500 mt-1">{lastSeenLabel}</div>
                                    </div>
                                </div>

                                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-cool-600">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            {user.isOnline ? 'Active session' : 'Offline' }
                                        </span>
                                        <span className="w-px h-4 bg-cool-200"></span>
                                        <span className="font-medium">Role: {user.role === 'admin' ? 'Administrator' : 'Member'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {user.role !== 'admin' ? (
                                            <button
                                                onClick={() => onMakeAdmin(user.id)}
                                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                                            >
                                                Promote
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onRemoveAdmin(user.id)}
                                                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                                            >
                                                Revoke
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                                    onDeleteUser(user.id);
                                                }
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="glass rounded-2xl border border-indigo-100/50 overflow-hidden shadow-modern">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-cool-500">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-cool-500">Contact</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-cool-500">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-cool-500">Joined</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wide text-cool-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50">
                                {filteredUsers.map((user, index) => {
                                    const joinedAt = formatJoinedDate(user);
                                    const lastSeen = user.isOnline ? 'Online now' : formatRelativeTime(user.lastSeen ?? getJoinedAt(user));
                                    return (
                                        <tr key={user.id} className="hover:bg-indigo-50/60 transition-colors duration-150">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border-2 border-white shadow" />
                                                    <div>
                                                        <div className="font-semibold text-cool-800">{user.name}</div>
                                                        <div className="text-xs text-cool-500">ID: {user.id.slice(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-cool-700">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-semibold">
                                                    <span className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500' : 'bg-cool-300'}`}></span>
                                                    {lastSeen}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-indigo-600">{joinedAt}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {user.role !== 'admin' ? (
                                                        <button
                                                            onClick={() => onMakeAdmin(user.id)}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-md transition-all"
                                                        >
                                                            Promote
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => onRemoveAdmin(user.id)}
                                                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:shadow-md transition-all"
                                                        >
                                                            Revoke
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                                                                onDeleteUser(user.id);
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-md transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedUserManagement;
