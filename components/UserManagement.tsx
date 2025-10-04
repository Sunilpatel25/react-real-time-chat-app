import React, { useState } from 'react';
import { User, ActivityLog } from '../types';
import { SearchIcon, EyeIcon, BanIcon, TrashIcon } from './Icons';

interface UserManagementProps {
    users: User[];
    activityLogs: ActivityLog[];
}

const UserManagement: React.FC<UserManagementProps> = ({ users, activityLogs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline'>('all');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'online' && user.isOnline) ||
                            (filterStatus === 'offline' && !user.isOnline);
        return matchesSearch && matchesStatus;
    });

    const getUserActivityCount = (userId: string) => {
        return activityLogs.filter(log => log.userId === userId).length;
    };

    const getUserLastActivity = (userId: string) => {
        const userLogs = activityLogs.filter(log => log.userId === userId);
        if (userLogs.length === 0) return null;
        return Math.max(...userLogs.map(log => log.timestamp));
    };

    const formatLastSeen = (timestamp: number | undefined) => {
        if (!timestamp) return 'Never';
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header & Filters */}
            <div className="glass rounded-2xl p-6 border border-indigo-100/50 shadow-modern">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            User Management
                        </h2>
                        <p className="text-sm text-cool-600 mt-1">{filteredUsers.length} users found</p>
                    </div>
                    
                    <div className="flex gap-2">
                        {['all', 'online', 'offline'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`
                                    px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200
                                    ${filterStatus === status
                                        ? 'gradient-indigo text-white shadow-modern'
                                        : 'bg-cool-100 text-cool-700 hover:bg-cool-200'
                                    }
                                `}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cool-400" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 glass-indigo border-2 border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 text-base"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="glass rounded-2xl border border-indigo-100/50 shadow-modern overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="gradient-indigo text-white">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold">User</th>
                                <th className="px-6 py-4 text-left text-sm font-bold">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-bold">Activity</th>
                                <th className="px-6 py-4 text-left text-sm font-bold">Last Seen</th>
                                <th className="px-6 py-4 text-left text-sm font-bold">Joined</th>
                                <th className="px-6 py-4 text-right text-sm font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="text-cool-500">
                                            <SearchIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p className="text-sm font-semibold">No users found</p>
                                            <p className="text-xs mt-1">Try adjusting your search or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user, index) => (
                                    <tr 
                                        key={user.id}
                                        className="hover:bg-indigo-50/50 transition-colors duration-200 animate-slideUp"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img 
                                                        src={user.avatar} 
                                                        alt={user.name} 
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-200 ring-4 ring-indigo-50"
                                                    />
                                                    {user.isOnline && (
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-glow"></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-cool-800">{user.name}</p>
                                                    <p className="text-xs text-cool-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`
                                                inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                                                ${user.isOnline 
                                                    ? 'bg-emerald-100 text-emerald-700' 
                                                    : 'bg-cool-100 text-cool-700'
                                                }
                                            `}>
                                                <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-cool-400'}`}></div>
                                                {user.isOnline ? 'Online' : 'Offline'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-full bg-cool-100 rounded-full h-2 max-w-[100px]">
                                                    <div 
                                                        className="gradient-indigo h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min((getUserActivityCount(user.id) / 50) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-semibold text-cool-600 whitespace-nowrap">
                                                    {getUserActivityCount(user.id)} acts
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-cool-600">
                                                {formatLastSeen(user.lastSeen || getUserLastActivity(user.id))}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-cool-600">
                                                {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                    title="View details"
                                                >
                                                    <EyeIcon />
                                                </button>
                                                <button
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                    title="Suspend user"
                                                >
                                                    <BanIcon />
                                                </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                                    title="Delete user"
                                                >
                                                    <TrashIcon />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4"
                    onClick={() => setSelectedUser(null)}
                >
                    <div 
                        className="glass rounded-3xl shadow-modern-xl w-full max-w-2xl p-6 sm:p-8 space-y-6 transform transition-all animate-scaleIn max-h-[90vh] overflow-y-auto border border-indigo-200/50 neon-border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <img 
                                        src={selectedUser.avatar} 
                                        alt={selectedUser.name} 
                                        className="w-20 h-20 rounded-full object-cover border-4 border-indigo-200 ring-4 ring-indigo-50 shadow-glow"
                                    />
                                    {selectedUser.isOnline && (
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-3 border-white shadow-glow"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold font-display text-cool-800">{selectedUser.name}</h3>
                                    <p className="text-sm text-cool-600">{selectedUser.email}</p>
                                    <span className={`
                                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mt-2
                                        ${selectedUser.isOnline 
                                            ? 'bg-emerald-100 text-emerald-700' 
                                            : 'bg-cool-100 text-cool-700'
                                        }
                                    `}>
                                        <div className={`w-2 h-2 rounded-full ${selectedUser.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-cool-400'}`}></div>
                                        {selectedUser.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="text-cool-400 hover:text-indigo-600 focus:outline-none transition-all hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-indigo-50/50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-indigo p-4 rounded-xl">
                                <p className="text-xs text-cool-600 mb-1">Total Activity</p>
                                <p className="text-2xl font-bold text-indigo-600">{getUserActivityCount(selectedUser.id)}</p>
                            </div>
                            <div className="glass-indigo p-4 rounded-xl">
                                <p className="text-xs text-cool-600 mb-1">Last Seen</p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {formatLastSeen(selectedUser.lastSeen || getUserLastActivity(selectedUser.id))}
                                </p>
                            </div>
                            <div className="glass-indigo p-4 rounded-xl">
                                <p className="text-xs text-cool-600 mb-1">Joined</p>
                                <p className="text-sm font-semibold text-pink-600">
                                    {selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <div className="glass-indigo p-4 rounded-xl">
                                <p className="text-xs text-cool-600 mb-1">User ID</p>
                                <p className="text-xs font-mono font-semibold text-cool-700 truncate">{selectedUser.id}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button className="flex-1 px-4 py-3 gradient-indigo text-white rounded-xl font-bold font-display hover:shadow-glow transition-all duration-200 hover:scale-105 active:scale-95">
                                View Activity
                            </button>
                            <button className="px-4 py-3 border-2 border-cool-300 text-cool-700 rounded-xl font-bold font-display hover:bg-cool-50 transition-all duration-200 hover:scale-105 active:scale-95">
                                Suspend
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
