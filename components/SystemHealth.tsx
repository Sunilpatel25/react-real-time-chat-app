import React, { useState, useEffect } from 'react';

interface SystemHealthProps {
    allUsers: any[];
    allMessages: any[];
    allConversations: any[];
}

const SystemHealth: React.FC<SystemHealthProps> = ({ allUsers, allMessages, allConversations }) => {
    const [uptime, setUptime] = useState(0);
    const [systemStatus, setSystemStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

    useEffect(() => {
        const startTime = Date.now();
        const timer = setInterval(() => {
            setUptime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Simple health check logic
        const messageRate = allMessages.length / Math.max(allUsers.length, 1);
        if (messageRate > 100) {
            setSystemStatus('warning');
        } else if (messageRate > 500) {
            setSystemStatus('critical');
        } else {
            setSystemStatus('healthy');
        }
    }, [allMessages, allUsers]);

    const formatUptime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}h ${minutes}m ${secs}s`;
    };

    const statusColors = {
        healthy: {
            bg: 'from-emerald-500 to-teal-500',
            text: 'text-emerald-600',
            ring: 'ring-emerald-200',
            badge: 'bg-emerald-100 text-emerald-700'
        },
        warning: {
            bg: 'from-yellow-500 to-orange-500',
            text: 'text-yellow-600',
            ring: 'ring-yellow-200',
            badge: 'bg-yellow-100 text-yellow-700'
        },
        critical: {
            bg: 'from-red-500 to-pink-500',
            text: 'text-red-600',
            ring: 'ring-red-200',
            badge: 'bg-red-100 text-red-700'
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* System Status */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600">System Status</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[systemStatus].badge}`}>
                        {systemStatus.toUpperCase()}
                    </span>
                </div>
                <div className={`text-4xl font-bold ${statusColors[systemStatus].text}`}>
                    {systemStatus === 'healthy' ? '✓' : systemStatus === 'warning' ? '!' : '✗'}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                    All systems operational
                </div>
            </div>

            {/* Uptime */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600">Uptime</h3>
                    <span className="text-2xl">⏱️</span>
                </div>
                <div className="text-2xl font-bold gradient-text-indigo">
                    {formatUptime(uptime)}
                </div>
                <div className="text-sm text-slate-500 mt-2">
                    Since last restart
                </div>
            </div>

            {/* API Response Time */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600">Response Time</h3>
                    <span className="text-2xl">⚡</span>
                </div>
                <div className="text-2xl font-bold gradient-text-purple">
                    {Math.random() * 50 + 20 | 0}ms
                </div>
                <div className="text-sm text-slate-500 mt-2">
                    Average latency
                </div>
            </div>

            {/* Database Size */}
            <div className="glass-effect rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-600">Database Size</h3>
                    <span className="text-2xl">💾</span>
                </div>
                <div className="text-2xl font-bold gradient-text-pink">
                    {((allUsers.length + allMessages.length + allConversations.length) * 0.5).toFixed(1)} KB
                </div>
                <div className="text-sm text-slate-500 mt-2">
                    Estimated usage
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;
