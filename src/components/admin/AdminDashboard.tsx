import React, { useState, useEffect } from 'react';
import { User, ActivityLog, ChatStats, Conversation, Message } from '../../types';
import AdminStats from './AdminStats';
import UserManagement from './UserManagement';
import ChatMonitor from './ChatMonitor';
import QuickChatView from '../chat/QuickChatView';
import ActivityLogComponent from './ActivityLogComponent';
import EnhancedAdminStats from './EnhancedAdminStats';
import EnhancedUserManagement from './EnhancedUserManagement';
import SystemHealth from './SystemHealth';
import { DashboardIcon, UsersIcon, ChatBubbleIcon, ActivityIcon, RefreshIcon } from '../shared/Icons';
import { adminApi } from '../../services/api/adminApi';

interface AdminDashboardProps {
    currentUser: User;
    allUsers: User[];
    allConversations: Conversation[];
    allMessages: Message[];
    activityLogs: ActivityLog[];
    onLogout: () => void;
    onRefreshData: () => void;
}

type TabType = 'overview' | 'users' | 'chats' | 'activity' | 'analytics' | 'reports' | 'settings';

const AdminDashboard: React.FC<AdminDashboardProps> = ({
    currentUser,
    allUsers,
    allConversations,
    allMessages,
    activityLogs,
    onLogout,
    onRefreshData
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: 'success' | 'warning' | 'error'}>>([]);
    const [chatViewMode, setChatViewMode] = useState<'quick' | 'full'>('quick');
    
    // Settings state
    const [settings, setSettings] = useState({
        userRegistration: true,
        messageModeration: false,
        emailNotifications: true,
        twoFactorAuth: false,
        sessionTimeout: '1 hour',
        maintenanceMode: false,
        autoBackup: true,
        darkMode: false
    });

    const [stats, setStats] = useState<ChatStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalConversations: 0,
        totalMessages: 0,
        messagesToday: 0,
        newUsersToday: 0,
        activeConversationsToday: 0
    });

    useEffect(() => {
        calculateStats();
    }, [allUsers, allConversations, allMessages]);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('adminSettings', JSON.stringify(settings));
    }, [settings]);

    const calculateStats = () => {
        const now = Date.now();
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const activeUsers = allUsers.filter(u => u.isOnline).length;
        const messagesToday = allMessages.filter(m => m.timestamp >= todayStart).length;
        const newUsersToday = allUsers.filter(u => u.joinedAt && u.joinedAt >= todayStart).length;
        const activeConversationsToday = allConversations.filter(
            c => c.lastMessage && c.lastMessage.timestamp >= todayStart
        ).length;

        setStats({
            totalUsers: allUsers.length,
            activeUsers,
            totalConversations: allConversations.length,
            totalMessages: allMessages.length,
            messagesToday,
            newUsersToday,
            activeConversationsToday
        });
    };

    // Analytics calculations
    const getAnalytics = () => {
        const last7Days = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);

        const messagesLast7Days = allMessages.filter(m => m.timestamp >= last7Days).length;
        const messagesLast30Days = allMessages.filter(m => m.timestamp >= last30Days).length;
        
        const avgMessagesPerDay = messagesLast7Days / 7;
        const avgMessagesPerUser = allMessages.length / Math.max(allUsers.length, 1);
        
        const mostActiveUsers = allUsers
            .map(user => ({
                ...user,
                messageCount: allMessages.filter(m => m.senderId === user._id).length
            }))
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, 5);

        const peakHours = Array.from({ length: 24 }, (_, hour) => {
            const count = allMessages.filter(m => {
                const msgHour = new Date(m.timestamp).getHours();
                return msgHour === hour;
            }).length;
            return { hour, count };
        }).sort((a, b) => b.count - a.count).slice(0, 3);

        return {
            messagesLast7Days,
            messagesLast30Days,
            avgMessagesPerDay: avgMessagesPerDay.toFixed(1),
            avgMessagesPerUser: avgMessagesPerUser.toFixed(1),
            mostActiveUsers,
            peakHours,
            totalUserGrowth: ((allUsers.length - stats.newUsersToday) / Math.max(allUsers.length, 1) * 100).toFixed(1),
            messageGrowth: ((messagesLast7Days - messagesLast30Days / 4) / Math.max(messagesLast30Days / 4, 1) * 100).toFixed(1)
        };
    };

    const addNotification = (message: string, type: 'success' | 'warning' | 'error') => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Report Generation Functions
    const downloadCSV = (data: string, filename: string) => {
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadJSON = (data: any, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generateUserReport = () => {
        // CSV Format
        const headers = ['ID', 'Name', 'Email', 'Role', 'Online Status', 'Joined Date', 'Message Count'];
        const rows = allUsers.map(user => {
            const messageCount = allMessages.filter(m => m.senderId === user._id).length;
            const joinedDate = user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A';
            return [
                user._id,
                user.name,
                user.email,
                user.role || 'user',
                user.isOnline ? 'Online' : 'Offline',
                joinedDate,
                messageCount
            ].join(',');
        });
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `user-report-${timestamp}.csv`);
        
        addNotification('User report downloaded successfully', 'success');
    };

    const generateMessageReport = () => {
        const analytics = getAnalytics();
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const messagesPerConversation = allConversations.map(conv => {
            const msgCount = allMessages.filter(m => m.conversationId === conv._id).length;
            return { conversationId: conv._id, messageCount: msgCount };
        });

        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalMessages: allMessages.length,
                messagesToday: allMessages.filter(m => m.timestamp >= todayStart).length,
                messagesLast7Days: analytics.messagesLast7Days,
                messagesLast30Days: analytics.messagesLast30Days,
                averageMessagesPerDay: analytics.avgMessagesPerDay,
                averageMessagesPerUser: analytics.avgMessagesPerUser
            },
            messagesPerConversation,
            peakHours: analytics.peakHours,
            mostActiveUsers: analytics.mostActiveUsers.map(u => ({
                id: u._id,
                name: u.name,
                email: u.email,
                messageCount: u.messageCount
            }))
        };

        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(reportData, `message-report-${timestamp}.json`);
        
        addNotification('Message report downloaded successfully', 'success');
    };

    const generateActivityReport = () => {
        // CSV Format
        const headers = ['Timestamp', 'User ID', 'User Name', 'Action', 'Details'];
        const rows = activityLogs.map(log => {
            const user = allUsers.find(u => u._id === log.userId);
            const timestamp = new Date(log.timestamp).toLocaleString();
            return [
                timestamp,
                log.userId,
                user?.name || 'Unknown',
                log.action,
                log.details || ''
            ].map(field => `"${field}"`).join(',');
        });
        
        const csvContent = [headers.join(','), ...rows].join('\n');
        const timestamp = new Date().toISOString().split('T')[0];
        downloadCSV(csvContent, `activity-report-${timestamp}.csv`);
        
        addNotification('Activity report downloaded successfully', 'success');
    };

    const generateAnalyticsReport = () => {
        const analytics = getAnalytics();
        const todayStart = new Date().setHours(0, 0, 0, 0);

        const reportData = {
            generatedAt: new Date().toISOString(),
            userStatistics: {
                totalUsers: allUsers.length,
                activeUsers: allUsers.filter(u => u.isOnline).length,
                newUsersToday: stats.newUsersToday,
                usersWithMessages: new Set(allMessages.map(m => m.senderId)).size
            },
            messageStatistics: {
                totalMessages: allMessages.length,
                messagesToday: stats.messagesToday,
                messagesLast7Days: analytics.messagesLast7Days,
                messagesLast30Days: analytics.messagesLast30Days,
                averageMessagesPerDay: parseFloat(analytics.avgMessagesPerDay),
                averageMessagesPerUser: parseFloat(analytics.avgMessagesPerUser)
            },
            conversationStatistics: {
                totalConversations: allConversations.length,
                activeConversationsToday: stats.activeConversationsToday,
                averageMessagesPerConversation: (allMessages.length / Math.max(allConversations.length, 1)).toFixed(2)
            },
            topPerformers: {
                mostActiveUsers: analytics.mostActiveUsers.map(u => ({
                    id: u._id,
                    name: u.name,
                    email: u.email,
                    messageCount: u.messageCount
                })),
                peakActivityHours: analytics.peakHours
            },
            activityBreakdown: {
                totalActivities: activityLogs.length,
                activitiesToday: activityLogs.filter(log => log.timestamp >= todayStart).length,
                activityTypes: activityLogs.reduce((acc, log) => {
                    acc[log.action] = (acc[log.action] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>)
            }
        };

        const timestamp = new Date().toISOString().split('T')[0];
        downloadJSON(reportData, `analytics-report-${timestamp}.json`);
        
        addNotification('Comprehensive analytics report downloaded', 'success');
    };

    // Settings handlers
    const handleSettingChange = (key: keyof typeof settings, value: boolean | string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSaveSettings = () => {
        // Save to localStorage (already done via useEffect)
        // Here you would also send to backend API
        console.log('Settings saved:', settings);
        addNotification('Settings saved successfully', 'success');
        
        // Show which settings are enabled
        const enabledSettings = Object.entries(settings)
            .filter(([_, value]) => value === true)
            .map(([key, _]) => key);
        
        if (enabledSettings.length > 0) {
            setTimeout(() => {
                addNotification(`${enabledSettings.length} features enabled`, 'success');
            }, 1000);
        }
    };

    const handleResetSettings = () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = {
                userRegistration: true,
                messageModeration: false,
                emailNotifications: true,
                twoFactorAuth: false,
                sessionTimeout: '1 hour',
                maintenanceMode: false,
                autoBackup: true,
                darkMode: false
            };
            setSettings(defaultSettings);
            addNotification('Settings reset to defaults', 'warning');
        }
    };

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: DashboardIcon },
        { id: 'users' as TabType, label: 'Users', icon: UsersIcon },
        { id: 'chats' as TabType, label: 'Chats', icon: ChatBubbleIcon },
        { id: 'activity' as TabType, label: 'Activity', icon: ActivityIcon },
        { 
            id: 'analytics' as TabType, 
            label: 'Analytics', 
            icon: () => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        { 
            id: 'reports' as TabType, 
            label: 'Reports', 
            icon: () => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        { 
            id: 'settings' as TabType, 
            label: 'Settings', 
            icon: () => (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30">
            {/* Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map(notif => (
                    <div
                        key={notif.id}
                        className={`px-4 py-3 rounded-xl shadow-modern-lg backdrop-blur-sm transform transition-all duration-300 ${
                            notif.type === 'success' ? 'bg-green-500/90 text-white' :
                            notif.type === 'warning' ? 'bg-yellow-500/90 text-white' :
                            'bg-red-500/90 text-white'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {notif.type === 'success' && <span>✅</span>}
                            {notif.type === 'warning' && <span>⚠️</span>}
                            {notif.type === 'error' && <span>❌</span>}
                            <span className="font-semibold">{notif.message}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 shadow-2xl border-b border-blue-800/50">
                <div className="px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-glow">
                                <DashboardIcon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold font-display text-white neon-glow">
                                    Admin Dashboard
                                </h1>
                                <p className="text-indigo-100 text-sm mt-0.5">
                                    Welcome back, {currentUser.name}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onRefreshData}
                                className="p-2.5 glass-indigo rounded-xl text-white hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 shadow-modern"
                                title="Refresh data"
                            >
                                <RefreshIcon className="w-5 h-5" />
                            </button>
                            
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 glass-indigo rounded-xl text-white font-semibold hover:bg-white/20 transition-all duration-200 hover:scale-105 active:scale-95 shadow-modern flex items-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-100/50 shadow-modern">
                <div className="px-4 sm:px-6 lg:px-8">
                    <nav className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex items-center gap-2 px-5 py-4 font-semibold font-display transition-all duration-200 border-b-3 whitespace-nowrap
                                        ${isActive 
                                            ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                                            : 'border-transparent text-cool-600 hover:text-indigo-600 hover:bg-indigo-50/30'
                                        }
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{tab.label}</span>
                                    {tab.id === 'users' && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-full">
                                            {allUsers.length}
                                        </span>
                                    )}
                                    {tab.id === 'chats' && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-purple-100 text-purple-700 rounded-full">
                                            {allConversations.length}
                                        </span>
                                    )}
                                    {tab.id === 'activity' && (
                                        <span className="px-2 py-0.5 text-xs font-bold bg-pink-100 text-pink-700 rounded-full">
                                            {activityLogs.length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
                    {activeTab === 'overview' && (
                        <>
                            <SystemHealth 
                                allUsers={allUsers}
                                allMessages={allMessages}
                                allConversations={allConversations}
                            />
                            <EnhancedAdminStats 
                                allUsers={allUsers}
                                allMessages={allMessages}
                                allConversations={allConversations}
                            />
                        </>
                    )}
                    
                    {activeTab === 'users' && (
                        <EnhancedUserManagement 
                            allUsers={allUsers}
                            onMakeAdmin={async (userId) => {
                                try {
                                    // Find user by ID to get email
                                    const user = allUsers.find(u => u.id === userId);
                                    if (!user) {
                                        addNotification('User not found', 'error');
                                        return;
                                    }

                                    // Call API to make admin
                                    await adminApi.makeAdmin(user.email);
                                    
                                    // Refresh data to get updated user list
                                    onRefreshData();
                                    addNotification('User promoted to admin successfully', 'success');
                                } catch (error) {
                                    console.error('Failed to make admin:', error);
                                    addNotification('Failed to promote user to admin', 'error');
                                }
                            }}
                            onRemoveAdmin={async (userId) => {
                                try {
                                    // Find user by ID to get email
                                    const user = allUsers.find(u => u.id === userId);
                                    if (!user) {
                                        addNotification('User not found', 'error');
                                        return;
                                    }

                                    // Call API to remove admin
                                    await adminApi.removeAdmin(user.email);
                                    
                                    // Refresh data to get updated user list
                                    onRefreshData();
                                    addNotification('Admin privileges removed successfully', 'warning');
                                } catch (error) {
                                    console.error('Failed to remove admin:', error);
                                    addNotification('Failed to remove admin privileges', 'error');
                                }
                            }}
                            onDeleteUser={async (userId) => {
                                try {
                                    // Call API to delete user
                                    await adminApi.deleteUser(userId);
                                    
                                    // Refresh data to get updated user list
                                    onRefreshData();
                                    addNotification('User deleted successfully', 'success');
                                } catch (error) {
                                    console.error('Failed to delete user:', error);
                                    addNotification('Failed to delete user', 'error');
                                }
                            }}
                        />
                    )}
                    
                    {activeTab === 'chats' && (
                        <div className="space-y-4">
                            {/* Chat View Toggle */}
                            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100/50 shadow-modern">
                                <div>
                                    <h2 className="text-xl font-bold text-cool-800 flex items-center gap-2">
                                        <ChatBubbleIcon className="w-5 h-5 text-indigo-600" />
                                        Chat Management
                                    </h2>
                                    <p className="text-sm text-cool-600 mt-1">
                                        Monitor conversations and messaging activity
                                    </p>
                                </div>
                                <div className="flex bg-indigo-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setChatViewMode('quick')}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                                            chatViewMode === 'quick'
                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                : 'text-indigo-600 hover:text-indigo-700'
                                        }`}
                                    >
                                        Quick View
                                    </button>
                                    <button
                                        onClick={() => setChatViewMode('full')}
                                        className={`px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
                                            chatViewMode === 'full'
                                                ? 'bg-white text-indigo-700 shadow-sm'
                                                : 'text-indigo-600 hover:text-indigo-700'
                                        }`}
                                    >
                                        Full Monitor
                                    </button>
                                </div>
                            </div>

                            {/* Chat Content */}
                            {chatViewMode === 'quick' ? (
                                <QuickChatView
                                    conversations={allConversations}
                                    messages={allMessages}
                                    users={allUsers}
                                    onViewFullChat={() => setChatViewMode('full')}
                                />
                            ) : (
                                <ChatMonitor
                                    conversations={allConversations}
                                    messages={allMessages}
                                    users={allUsers}
                                />
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'activity' && (
                        <ActivityLogComponent 
                            logs={activityLogs}
                            users={allUsers}
                        />
                    )}
                    
                    {activeTab === 'analytics' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-cool-800">Analytics & Insights</h2>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-lg font-semibold">7 Days</button>
                                    <button className="px-3 py-1.5 text-sm bg-cool-100 text-cool-600 rounded-lg hover:bg-cool-200">30 Days</button>
                                    <button className="px-3 py-1.5 text-sm bg-cool-100 text-cool-600 rounded-lg hover:bg-cool-200">All Time</button>
                                </div>
                            </div>
                            
                            {/* Key Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="card-modern gradient-indigo p-6 text-white transform hover:scale-105 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-4xl">📊</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+12%</span>
                                    </div>
                                    <div className="text-3xl font-bold">{getAnalytics().avgMessagesPerDay}</div>
                                    <div className="text-indigo-100 mt-1">Avg Messages/Day</div>
                                    <div className="text-xs text-indigo-200 mt-2">↑ vs last week</div>
                                </div>
                                <div className="card-modern gradient-purple p-6 text-white transform hover:scale-105 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-4xl">💬</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">+8%</span>
                                    </div>
                                    <div className="text-3xl font-bold">{getAnalytics().avgMessagesPerUser}</div>
                                    <div className="text-purple-100 mt-1">Avg Messages/User</div>
                                    <div className="text-xs text-purple-200 mt-2">↑ engagement up</div>
                                </div>
                                <div className="card-modern bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white transform hover:scale-105 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-4xl">📈</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">7d</span>
                                    </div>
                                    <div className="text-3xl font-bold">{getAnalytics().messagesLast7Days}</div>
                                    <div className="text-green-100 mt-1">Messages (7 days)</div>
                                    <div className="text-xs text-green-200 mt-2">last week total</div>
                                </div>
                                <div className="card-modern bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white transform hover:scale-105 transition-all duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-4xl">🔥</span>
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">30d</span>
                                    </div>
                                    <div className="text-3xl font-bold">{getAnalytics().messagesLast30Days}</div>
                                    <div className="text-orange-100 mt-1">Messages (30 days)</div>
                                    <div className="text-xs text-orange-200 mt-2">monthly total</div>
                                </div>
                            </div>

                            {/* Growth & Engagement Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center text-white text-2xl">
                                            👥
                                        </div>
                                        <div>
                                            <div className="text-sm text-cool-600">User Growth</div>
                                            <div className="text-2xl font-bold text-cool-800">{stats.newUsersToday}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-green-600 font-semibold">+{stats.newUsersToday} today</span>
                                        <span className="text-cool-500">• New signups</span>
                                    </div>
                                </div>

                                <div className="card-modern p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center text-white text-2xl">
                                            ⚡
                                        </div>
                                        <div>
                                            <div className="text-sm text-cool-600">Engagement Rate</div>
                                            <div className="text-2xl font-bold text-cool-800">{((stats.activeUsers / Math.max(allUsers.length, 1)) * 100).toFixed(1)}%</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-purple-600 font-semibold">{stats.activeUsers} active</span>
                                        <span className="text-cool-500">• Online now</span>
                                    </div>
                                </div>

                                <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center text-white text-2xl">
                                            💬
                                        </div>
                                        <div>
                                            <div className="text-sm text-cool-600">Active Chats</div>
                                            <div className="text-2xl font-bold text-cool-800">{stats.activeConversationsToday}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-green-600 font-semibold">{stats.messagesToday} msgs</span>
                                        <span className="text-cool-500">• Today</span>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Chart Representation */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    📈 Message Activity Chart (24 Hours)
                                </h3>
                                <div className="space-y-2">
                                    {Array.from({ length: 24 }, (_, hour) => {
                                        const count = allMessages.filter(m => new Date(m.timestamp).getHours() === hour).length;
                                        const maxCount = Math.max(...Array.from({ length: 24 }, (_, h) => 
                                            allMessages.filter(m => new Date(m.timestamp).getHours() === h).length
                                        ), 1);
                                        const percentage = (count / maxCount) * 100;
                                        return (
                                            <div key={hour} className="flex items-center gap-3">
                                                <div className="w-12 text-sm text-cool-600 font-semibold">
                                                    {hour.toString().padStart(2, '0')}:00
                                                </div>
                                                <div className="flex-1 bg-cool-100 rounded-full h-8 relative overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                                                        style={{ width: `${percentage}%` }}
                                                    >
                                                        {count > 0 && (
                                                            <span className="text-white text-xs font-bold">{count}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="w-16 text-right text-sm text-cool-500">
                                                    {percentage.toFixed(0)}%
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Most Active Users */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    🏆 Top 5 Most Active Users
                                </h3>
                                <div className="space-y-3">
                                    {getAnalytics().mostActiveUsers.map((user, index) => {
                                        const totalMessages = allMessages.length;
                                        const userPercentage = ((user.messageCount / totalMessages) * 100).toFixed(1);
                                        return (
                                            <div key={user._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                            {user.name}
                                                            {user.isOnline && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                                                        </div>
                                                        <div className="text-sm text-cool-500">{user.email}</div>
                                                        <div className="mt-1 bg-cool-200 rounded-full h-2 w-full max-w-xs">
                                                            <div 
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full"
                                                                style={{ width: `${userPercentage}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-3xl font-bold text-indigo-600">{user.messageCount}</div>
                                                    <div className="text-xs text-cool-500">messages</div>
                                                    <div className="text-xs text-indigo-600 font-semibold">{userPercentage}%</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Peak Hours */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    ⏰ Peak Activity Hours
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {getAnalytics().peakHours.map((peak, index) => (
                                        <div key={peak.hour} className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:border-purple-400 transition-all">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="text-5xl">
                                                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-4xl font-bold text-purple-600">
                                                        {peak.hour.toString().padStart(2, '0')}:00
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center mt-4">
                                                <div className="text-2xl font-bold text-cool-800">{peak.count}</div>
                                                <div className="text-sm text-cool-600">messages sent</div>
                                                <div className="text-xs text-purple-600 font-semibold mt-1">
                                                    {((peak.count / allMessages.length) * 100).toFixed(1)}% of total
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* User Activity Distribution */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="card-modern p-6">
                                    <h3 className="text-lg font-bold text-cool-800 mb-4">👤 User Activity Distribution</h3>
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Very Active (20+ msgs)', count: allUsers.filter(u => allMessages.filter(m => m.senderId === u._id).length >= 20).length, color: 'bg-green-500' },
                                            { label: 'Active (10-19 msgs)', count: allUsers.filter(u => { const c = allMessages.filter(m => m.senderId === u._id).length; return c >= 10 && c < 20; }).length, color: 'bg-blue-500' },
                                            { label: 'Moderate (5-9 msgs)', count: allUsers.filter(u => { const c = allMessages.filter(m => m.senderId === u._id).length; return c >= 5 && c < 10; }).length, color: 'bg-yellow-500' },
                                            { label: 'Low (1-4 msgs)', count: allUsers.filter(u => { const c = allMessages.filter(m => m.senderId === u._id).length; return c >= 1 && c < 5; }).length, color: 'bg-orange-500' },
                                            { label: 'Inactive (0 msgs)', count: allUsers.filter(u => allMessages.filter(m => m.senderId === u._id).length === 0).length, color: 'bg-cool-400' }
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                                                <div className="flex-1 text-sm text-cool-700">{item.label}</div>
                                                <div className="font-bold text-cool-800">{item.count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card-modern p-6">
                                    <h3 className="text-lg font-bold text-cool-800 mb-4">💬 Conversation Stats</h3>
                                    <div className="space-y-4">
                                        <div className="p-3 bg-indigo-50 rounded-xl">
                                            <div className="text-sm text-cool-600">Total Conversations</div>
                                            <div className="text-2xl font-bold text-indigo-600">{allConversations.length}</div>
                                        </div>
                                        <div className="p-3 bg-purple-50 rounded-xl">
                                            <div className="text-sm text-cool-600">Avg Messages/Conversation</div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {(allMessages.length / Math.max(allConversations.length, 1)).toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="p-3 bg-pink-50 rounded-xl">
                                            <div className="text-sm text-cool-600">Active Today</div>
                                            <div className="text-2xl font-bold text-pink-600">{stats.activeConversationsToday}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* System Health Indicators */}
                            <div className="card-modern p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    💚 System Health Score
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">✅</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {((stats.activeUsers / Math.max(allUsers.length, 1)) * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-sm text-cool-600">User Activity</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">💬</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {stats.messagesToday}
                                        </div>
                                        <div className="text-sm text-cool-600">Messages Today</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">🔥</div>
                                        <div className="text-2xl font-bold text-orange-600">
                                            {getAnalytics().avgMessagesPerDay}
                                        </div>
                                        <div className="text-sm text-cool-600">Daily Average</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-4xl mb-2">⭐</div>
                                        <div className="text-2xl font-bold text-purple-600">
                                            {allUsers.length > 0 ? 'Excellent' : 'N/A'}
                                        </div>
                                        <div className="text-sm text-cool-600">Overall Status</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-cool-800">Reports & Exports</h2>
                                <div className="text-sm text-cool-600 bg-cool-100 px-3 py-1 rounded-full">
                                    📅 {new Date().toLocaleDateString()}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* User Report */}
                                <div className="card-modern p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-cool-800">User Report</h3>
                                            <p className="text-sm text-cool-500">Export all user data (CSV)</p>
                                        </div>
                                        <div className="text-2xl font-bold text-indigo-600">{allUsers.length}</div>
                                    </div>
                                    <div className="mb-4 text-xs text-cool-600 space-y-1">
                                        <div>✓ User details & contact info</div>
                                        <div>✓ Online status & activity</div>
                                        <div>✓ Message counts & statistics</div>
                                    </div>
                                    <button 
                                        onClick={generateUserReport}
                                        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download CSV
                                    </button>
                                </div>

                                {/* Message Report */}
                                <div className="card-modern p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-purple-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-cool-800">Message Report</h3>
                                            <p className="text-sm text-cool-500">Export message statistics (JSON)</p>
                                        </div>
                                        <div className="text-2xl font-bold text-purple-600">{allMessages.length}</div>
                                    </div>
                                    <div className="mb-4 text-xs text-cool-600 space-y-1">
                                        <div>✓ Message analytics & trends</div>
                                        <div>✓ Peak activity hours</div>
                                        <div>✓ Most active users</div>
                                    </div>
                                    <button 
                                        onClick={generateMessageReport}
                                        className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download JSON
                                    </button>
                                </div>

                                {/* Activity Report */}
                                <div className="card-modern p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-pink-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-cool-800">Activity Report</h3>
                                            <p className="text-sm text-cool-500">Export activity logs (CSV)</p>
                                        </div>
                                        <div className="text-2xl font-bold text-pink-600">{activityLogs.length}</div>
                                    </div>
                                    <div className="mb-4 text-xs text-cool-600 space-y-1">
                                        <div>✓ Complete activity timeline</div>
                                        <div>✓ User actions & events</div>
                                        <div>✓ Audit trail details</div>
                                    </div>
                                    <button 
                                        onClick={generateActivityReport}
                                        className="w-full px-4 py-2.5 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download CSV
                                    </button>
                                </div>

                                {/* Analytics Report */}
                                <div className="card-modern p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-cool-800">Analytics Report</h3>
                                            <p className="text-sm text-cool-500">Comprehensive analytics (JSON)</p>
                                        </div>
                                        <div className="text-lg font-bold text-green-600">📊</div>
                                    </div>
                                    <div className="mb-4 text-xs text-cool-600 space-y-1">
                                        <div>✓ Complete system analytics</div>
                                        <div>✓ Performance metrics</div>
                                        <div>✓ Growth & engagement data</div>
                                    </div>
                                    <button 
                                        onClick={generateAnalyticsReport}
                                        className="w-full px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-semibold"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download JSON
                                    </button>
                                </div>
                            </div>

                            {/* Report Info */}
                            <div className="card-modern p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-indigo-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-cool-800 mb-2">📄 About Reports</h3>
                                        <div className="text-sm text-cool-700 space-y-2">
                                            <p>• <strong>CSV files</strong> can be opened in Excel, Google Sheets, or any spreadsheet application</p>
                                            <p>• <strong>JSON files</strong> contain structured data perfect for further processing or import</p>
                                            <p>• All reports include current data snapshot with timestamp</p>
                                            <p>• Reports are generated instantly and downloaded to your device</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="card-modern p-4 text-center">
                                    <div className="text-2xl font-bold text-indigo-600">{allUsers.length}</div>
                                    <div className="text-sm text-cool-600 mt-1">Total Users</div>
                                </div>
                                <div className="card-modern p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{allMessages.length}</div>
                                    <div className="text-sm text-cool-600 mt-1">Total Messages</div>
                                </div>
                                <div className="card-modern p-4 text-center">
                                    <div className="text-2xl font-bold text-pink-600">{activityLogs.length}</div>
                                    <div className="text-sm text-cool-600 mt-1">Activity Logs</div>
                                </div>
                                <div className="card-modern p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{allConversations.length}</div>
                                    <div className="text-sm text-cool-600 mt-1">Conversations</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-cool-800">System Settings</h2>
                                <button
                                    onClick={handleResetSettings}
                                    className="px-4 py-2 bg-cool-200 text-cool-700 rounded-xl hover:bg-cool-300 transition-all flex items-center gap-2 text-sm font-semibold"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Reset to Defaults
                                </button>
                            </div>
                            
                            {/* General Settings */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    ⚙️ General Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                User Registration
                                                {settings.userRegistration && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Allow new users to register accounts</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={settings.userRegistration}
                                                onChange={(e) => handleSettingChange('userRegistration', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Message Moderation
                                                {settings.messageModeration && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Enable automatic message filtering and content moderation</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.messageModeration}
                                                onChange={(e) => handleSettingChange('messageModeration', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Email Notifications
                                                {settings.emailNotifications && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Send email notifications to users for important events</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.emailNotifications}
                                                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Auto Backup
                                                {settings.autoBackup && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Automatically backup data daily at midnight</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.autoBackup}
                                                onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Security Settings */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    🔒 Security Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Two-Factor Authentication
                                                {settings.twoFactorAuth && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Require 2FA for all admin accounts</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.twoFactorAuth}
                                                onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>
                                    
                                    <div className="p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="font-semibold text-cool-800 mb-2 flex items-center gap-2">
                                            Session Timeout
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{settings.sessionTimeout}</span>
                                        </div>
                                        <div className="text-sm text-cool-500 mb-3">Automatically log out inactive users after specified time</div>
                                        <select 
                                            value={settings.sessionTimeout}
                                            onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl border border-cool-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                        >
                                            <option value="15 minutes">15 minutes</option>
                                            <option value="30 minutes">30 minutes</option>
                                            <option value="1 hour">1 hour</option>
                                            <option value="2 hours">2 hours</option>
                                            <option value="4 hours">4 hours</option>
                                            <option value="1 day">1 day</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* System Settings */}
                            <div className="card-modern p-6">
                                <h3 className="text-xl font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    🖥️ System Settings
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Maintenance Mode
                                                {settings.maintenanceMode && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Enable maintenance mode to prevent user access</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.maintenanceMode}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        if (confirm('Are you sure you want to enable maintenance mode? Users will not be able to access the system.')) {
                                                            handleSettingChange('maintenanceMode', true);
                                                        }
                                                    } else {
                                                        handleSettingChange('maintenanceMode', false);
                                                    }
                                                }}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
                                        </label>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-cool-50 rounded-xl hover:bg-cool-100 transition-all">
                                        <div className="flex-1">
                                            <div className="font-semibold text-cool-800 flex items-center gap-2">
                                                Dark Mode
                                                {settings.darkMode && <span className="text-xs bg-gray-700 text-white px-2 py-0.5 rounded-full">Active</span>}
                                            </div>
                                            <div className="text-sm text-cool-500">Enable dark theme for admin dashboard</div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={settings.darkMode}
                                                onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-cool-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-cool-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-700"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Summary */}
                            <div className="card-modern p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                                <h3 className="text-lg font-bold text-cool-800 mb-4 flex items-center gap-2">
                                    📊 Settings Summary
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-white rounded-xl">
                                        <div className="text-2xl font-bold text-green-600">
                                            {Object.values(settings).filter(v => v === true).length}
                                        </div>
                                        <div className="text-xs text-cool-600 mt-1">Enabled</div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl">
                                        <div className="text-2xl font-bold text-cool-600">
                                            {Object.values(settings).filter(v => v === false).length}
                                        </div>
                                        <div className="text-xs text-cool-600 mt-1">Disabled</div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl">
                                        <div className="text-2xl font-bold text-indigo-600">
                                            {settings.sessionTimeout}
                                        </div>
                                        <div className="text-xs text-cool-600 mt-1">Timeout</div>
                                    </div>
                                    <div className="text-center p-3 bg-white rounded-xl">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {settings.maintenanceMode ? '🔧' : '✅'}
                                        </div>
                                        <div className="text-xs text-cool-600 mt-1">System</div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-cool-600">
                                    💾 Settings are automatically saved
                                </div>
                                <button 
                                    onClick={handleSaveSettings}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
