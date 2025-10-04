import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Conversation, Message, ActivityLog } from './types';
import * as api from './services/mockApi';
import { SOCKET_URL } from './config';
import LoginScreen from './components/LoginScreen';
import ChatLayout from './components/ChatLayout';
import AdminDashboard from './components/AdminDashboard';
import AdminSetup from './components/AdminSetup';
import { generateMockActivityLogs, enhanceUsersForAdmin, enhanceConversationsForAdmin } from './services/adminMockData';

// Assuming io is globally available from the script tag in index.html
declare const io: any;

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [typingConversations, setTypingConversations] = useState<Set<string>>(new Set());
    const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(false);
    const [showAdminSetup, setShowAdminSetup] = useState<boolean>(false);
    
    // Admin data
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allConversations, setAllConversations] = useState<Conversation[]>([]);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);


    const socket = useRef<any>(null);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = api.getToken();
            if (token) {
                try {
                    const currentUser = await api.getProfile();
                    setUser(currentUser);
                    // Automatically open admin dashboard if user is admin
                    if (currentUser.role === 'admin') {
                        setShowAdminDashboard(true);
                    }
                } catch (err) {
                    console.error('Auth check failed', err);
                    api.logout(); // Clear invalid token
                }
            }
            setIsAuthLoading(false);
        };
        checkLoggedIn();
    }, []);
    
    const markConversationAsRead = useCallback((conversation: Conversation) => {
        if (!socket.current || !conversation.otherUser || !user) return;
        
        socket.current.emit('markAsRead', {
            conversationId: conversation.id,
            receiverId: conversation.otherUser.id,
        });

        // Also update backend
        api.markMessagesAsRead(conversation.id).catch(err => console.error("Failed to mark as read on backend", err));

    }, [user]);

    // Effect for Socket Connection and general listeners
    useEffect(() => {
        if (user) {
            // Connect to the backend server, which now also hosts the socket server
            socket.current = io(SOCKET_URL);
            socket.current.emit('addUser', user.id);
            
            socket.current.on('getUsers', (users: {userId: string}[]) => {
                setOnlineUsers(users.map(u => u.userId));
            });

            socket.current.on('typingStart', ({ conversationId }: { conversationId: string }) => {
                setTypingConversations(prev => new Set(prev).add(conversationId));
            });

            socket.current.on('typingStop', ({ conversationId }: { conversationId: string }) => {
                setTypingConversations(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(conversationId);
                    return newSet;
                });
            });
            
            return () => {
                if (socket.current) {
                    socket.current.disconnect();
                }
            };
        }
    }, [user]);

    // Effect for listeners dependent on the active conversation
    useEffect(() => {
        if (!socket.current) return;

        const handleReceiveMessage = (message: Message) => {
            setConversations(prev => {
                const convoIndex = prev.findIndex(c => c.id === message.conversationId);
                if (convoIndex > -1) {
                    const updatedConvo = { ...prev[convoIndex], lastMessage: message };
                    const restConvos = prev.filter(c => c.id !== message.conversationId);
                    return [updatedConvo, ...restConvos].sort((a,b) => new Date(b.lastMessage?.timestamp || 0).getTime() - new Date(a.lastMessage?.timestamp || 0).getTime());
                }
                return prev;
            });
            
            if (message.conversationId === activeConversation?.id) {
                setMessages(prev => [...prev, message]);
                if (activeConversation) {
                    markConversationAsRead(activeConversation);
                }
            }
        };

        const handleMessagesRead = ({ conversationId }: { conversationId: string }) => {
            if (activeConversation?.id === conversationId) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.senderId === user?.id && msg.status !== 'read'
                            ? { ...msg, status: 'read' }
                            : msg
                    )
                );
            }

            setConversations(prev =>
                prev.map(c => {
                    if (c.id === conversationId && c.lastMessage && c.lastMessage.senderId === user?.id) {
                        return { ...c, lastMessage: { ...c.lastMessage, status: 'read' as const } };
                    }
                    return c;
                })
            );
        };

        socket.current.on('receiveMessage', handleReceiveMessage);
        socket.current.on('messagesRead', handleMessagesRead);

        return () => {
            socket.current.off('receiveMessage', handleReceiveMessage);
            socket.current.off('messagesRead', handleMessagesRead);
        };
    }, [user, activeConversation, markConversationAsRead]);


    const fetchConversations = useCallback(async (currentUser: User) => {
        try {
            const userConversations = await api.getConversations(currentUser.id);
            setConversations(userConversations);
        } catch (err) {
            setError('Failed to load conversations.');
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchConversations(user);
        }
    }, [user, fetchConversations]);

    // Update online status when onlineUsers list or conversations change
    useEffect(() => {
        setConversations(prev =>
            prev.map(conv => {
                if (conv.otherUser) {
                    return {
                        ...conv,
                        otherUser: {
                            ...conv.otherUser,
                            isOnline: onlineUsers.includes(conv.otherUser.id),
                        },
                    };
                }
                return conv;
            })
        );
    }, [onlineUsers, conversations.length]); // Re-run when conversations are first loaded

    const handleLoginSuccess = ({ user: loggedInUser, token }: { user: User, token: string }) => {
        api.setToken(token);
        setUser(loggedInUser);
        // Automatically open admin dashboard if user is admin
        if (loggedInUser.role === 'admin') {
            setShowAdminDashboard(true);
        }
    };

    const handleLogout = () => {
        if (socket.current) {
            socket.current.disconnect();
        }
        api.logout();
        setUser(null);
        setActiveConversation(null);
        setConversations([]);
        setMessages([]);
        setShowAdminDashboard(false);
        setShowAdminSetup(false);
    };

    const handleSelectConversation = async (conversation: Conversation) => {
        setActiveConversation(conversation);
        try {
            const conversationMessages = await api.getMessages(conversation.id);
            setMessages(conversationMessages);
            markConversationAsRead(conversation);
        } catch (err) {
            setError('Failed to load messages.');
        }
    };
    
    const handleSendMessage = async (payload: { text: string; image?: string }) => {
        if (!user || !activeConversation || !socket.current) return;
        if (!payload.text && !payload.image) return;

        const receiverId = activeConversation.otherUser?.id;
        if (!receiverId) return;
        
        const tempMessage: Message = {
            id: `temp-${Date.now()}`,
            conversationId: activeConversation.id,
            senderId: user.id,
            text: payload.text,
            image: payload.image,
            timestamp: Date.now(),
            status: 'sent',
        };

        // Emit message via socket. The backend will handle saving it and broadcasting.
        socket.current.emit('sendMessage', {
            senderId: user.id,
            receiverId: receiverId,
            text: payload.text,
            image: payload.image,
            conversationId: activeConversation.id,
        });

        // Optimistic UI update
        setMessages(prev => [...prev, tempMessage]);
        setConversations(prev =>
            prev.map(c => c.id === activeConversation.id ? { ...c, lastMessage: tempMessage } : c)
               .sort((a, b) => (b.lastMessage?.timestamp ?? 0) - (a.lastMessage?.timestamp ?? 0))
        );
    };
    
    const handleStartNewConversation = async (otherUser: User) => {
        if (!user) return;
        try {
            const conversation = await api.findOrCreateConversation(user.id, otherUser.id);
            const existing = conversations.find(c => c.id === conversation.id);

            if (existing) {
                handleSelectConversation(existing);
            } else {
                // Fetch full conversation details to get the otherUser object populated
                const userConversations = await api.getConversations(user.id);
                setConversations(userConversations);
                const newDetailedConversation = userConversations.find(c => c.id === conversation.id);
                if (newDetailedConversation) {
                    handleSelectConversation(newDetailedConversation);
                }
            }
        } catch (err) {
            setError('Failed to start a new conversation.');
        }
    };
    
    const handleTyping = useCallback((action: 'start' | 'stop') => {
        if (!socket.current || !activeConversation || !activeConversation.otherUser) return;
        
        const eventName = action === 'start' ? 'typingStart' : 'typingStop';
        
        socket.current.emit(eventName, {
            conversationId: activeConversation.id,
            receiverId: activeConversation.otherUser.id,
        });
    }, [activeConversation]);

    const handleUpdateProfile = async (data: { name: string; avatar: string }) => {
        if (!user) return;
        try {
            const updatedUser = await api.updateProfile(user.id, data);
            setUser(prevUser => (prevUser ? { ...prevUser, ...updatedUser } : null));
        } catch (err) {
            setError("Failed to update profile.");
            console.error(err);
        }
    };

    // Admin functions
    const fetchAdminData = useCallback(async () => {
        try {
            // Fetch all users (in real app, this would be an admin-only API call)
            const users = await api.getAllUsers();
            const enhancedUsers = enhanceUsersForAdmin(users);
            setAllUsers(enhancedUsers);

            // Fetch all conversations (admin-only)
            const allConvs: Conversation[] = [];
            for (const u of users) {
                const userConvs = await api.getConversations(u.id);
                userConvs.forEach(conv => {
                    if (!allConvs.find(c => c.id === conv.id)) {
                        allConvs.push(conv);
                    }
                });
            }
            const enhancedConvs = enhanceConversationsForAdmin(allConvs);
            setAllConversations(enhancedConvs);

            // Fetch all messages (admin-only)
            const allMsgs: Message[] = [];
            for (const conv of allConvs) {
                const convMsgs = await api.getMessages(conv.id);
                allMsgs.push(...convMsgs);
            }
            setAllMessages(allMsgs);

            // Generate activity logs
            const logs = generateMockActivityLogs(enhancedUsers, enhancedConvs, allMsgs);
            setActivityLogs(logs);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        }
    }, []);

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchAdminData();
        }
    }, [user, fetchAdminData]);

    const handleToggleAdminDashboard = () => {
        setShowAdminDashboard(prev => !prev);
    };

    const handleShowAdminSetup = () => {
        setShowAdminSetup(true);
    };

    const handleAdminCreated = () => {
        setShowAdminSetup(false);
        // Optionally refresh the page or show a success message
        window.location.reload();
    };

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-200">
                <div className="text-xl font-semibold">Authenticating...</div>
            </div>
        );
    }

    // Show Admin Setup if requested
    if (showAdminSetup) {
        return <AdminSetup onAdminCreated={handleAdminCreated} />;
    }

    if (!user) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} onShowAdminSetup={handleShowAdminSetup} />;
    }

    // Show Admin Dashboard if user is admin and toggle is on
    if (user.role === 'admin' && showAdminDashboard) {
        return (
            <AdminDashboard
                currentUser={user}
                allUsers={allUsers}
                allConversations={allConversations}
                allMessages={allMessages}
                activityLogs={activityLogs}
                onLogout={() => {
                    handleLogout();
                    setShowAdminDashboard(false);
                }}
                onRefreshData={fetchAdminData}
            />
        );
    }

    return (
        <>
            {/* Admin Toggle Button */}
            {user.role === 'admin' && (
                <button
                    onClick={handleToggleAdminDashboard}
                    className="fixed top-4 right-4 z-50 px-4 py-2 gradient-indigo text-white rounded-xl font-semibold shadow-modern-lg hover:shadow-glow transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-2"
                    title="Open Admin Dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Admin
                </button>
            )}
            
            <ChatLayout
                currentUser={user}
                conversations={conversations}
                activeConversation={activeConversation}
                messages={messages}
                onSelectConversation={handleSelectConversation}
                onSendMessage={handleSendMessage}
                onLogout={handleLogout}
                onStartNewConversation={handleStartNewConversation}
                onUpdateProfile={handleUpdateProfile}
                isTyping={activeConversation ? typingConversations.has(activeConversation.id) : false}
                onTyping={handleTyping}
            />
        </>
    );
};

export default App;
