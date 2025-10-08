import React, { useState } from 'react';
import { User, Conversation, Message } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import ProfileEditModal from './ProfileEditModal';
import { BackArrowIcon } from './Icons';

interface ChatLayoutProps {
    currentUser: User;
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    onSelectConversation: (conversation: Conversation) => void;
    onSendMessage: (payload: { text: string; image?: string }) => void;
    onLogout: () => void;
    onStartNewConversation: (user: User) => void;
    onUpdateProfile: (data: { name: string; avatar: string }) => void;
    onClearActiveConversation?: () => void;
    onViewProfile?: (user: User) => void;
    onBlockUser?: (user: User) => void;
    onReportUser?: (user: User) => void;
    isTyping: boolean;
    onTyping: (action: 'start' | 'stop') => void;
    socket?: React.MutableRefObject<any>;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
    currentUser,
    conversations,
    activeConversation,
    messages,
    onSelectConversation,
    onSendMessage,
    onLogout,
    onStartNewConversation,
    onUpdateProfile,
    onClearActiveConversation,
    onViewProfile,
    onBlockUser,
    onReportUser,
    isTyping,
    onTyping,
    socket,
}) => {
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [showProfileEditModal, setShowProfileEditModal] = useState(false);

    const handleConversationSelect = (conversation: Conversation) => {
        onSelectConversation(conversation);
        setShowChatOnMobile(true);
    };

    const handleStartNewChat = (user: User) => {
        onStartNewConversation(user);
        setShowChatOnMobile(true);
    }

    const handleProfileEdit = () => {
        setShowProfileEditModal(true);
    };

    const handleProfileSave = (data: { name: string; avatar: string }) => {
        onUpdateProfile(data);
        setShowProfileEditModal(false);
    };

    return (
        <div className="flex h-screen antialiased text-gray-800 overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/40 relative">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-96 h-96 bg-secondary-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-accent-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Desktop sidebar with enhanced glass effect */}
            <div className="hidden md:flex md:w-[360px] lg:w-[380px] relative z-10">
                <div className="w-full bg-white/80 backdrop-blur-xl border-r border-primary-200/50 shadow-2xl shadow-primary-500/10">
                    <Sidebar
                        currentUser={currentUser}
                        conversations={conversations}
                        onSelectConversation={handleConversationSelect}
                        activeConversationId={activeConversation?.id ?? null}
                        onLogout={onLogout}
                        onStartNewConversation={handleStartNewChat}
                        onOpenProfileEdit={handleProfileEdit}
                    />
                </div>
            </div>

            {/* Mobile: show sidebar when chat not open */}
            {!showChatOnMobile && (
                <div className="md:hidden w-full h-full relative z-10">
                    <div className="w-full h-full bg-white/90 backdrop-blur-lg">
                        <Sidebar
                            currentUser={currentUser}
                            conversations={conversations}
                            onSelectConversation={handleConversationSelect}
                            activeConversationId={activeConversation?.id ?? null}
                            onLogout={onLogout}
                            onStartNewConversation={handleStartNewChat}
                            onOpenProfileEdit={handleProfileEdit}
                        />
                    </div>
                </div>
            )}

            {/* Chat area with modern gradient */}
            <div className="flex-1 relative z-10 overflow-hidden">
                {activeConversation ? (
                    <div className={`${showChatOnMobile ? 'block' : 'hidden'} md:block h-full bg-gradient-to-b from-white/60 via-primary-50/30 to-secondary-50/40 backdrop-blur-sm`}>
                        <ChatWindow
                            activeConversation={activeConversation}
                            currentUser={currentUser}
                            messages={messages}
                            onSendMessage={onSendMessage}
                            onBack={() => setShowChatOnMobile(false)}
                            onBackToDashboard={onClearActiveConversation}
                            onViewProfile={onViewProfile}
                            onBlockUser={onBlockUser}
                            onReportUser={onReportUser}
                            isTyping={isTyping}
                            onTyping={onTyping}
                            socket={socket}
                        />
                    </div>
                ) : (
                    <div className="hidden md:flex items-center justify-center h-full p-8 relative">
                        {/* Decorative elements */}
                        <div className="absolute inset-0 overflow-hidden opacity-30">
                            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full filter blur-3xl animate-pulse"></div>
                            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                        </div>

                        {/* Main content */}
                        <div className="text-center space-y-8 max-w-lg relative z-10">
                            {/* Icon with animated gradient border */}
                            <div className="flex justify-center">
                                <div className="relative group">
                                    {/* Animated gradient ring */}
                                    <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full opacity-75 blur-lg group-hover:opacity-100 transition-opacity duration-500 animate-spin-slow"></div>
                                    
                                    {/* Icon container */}
                                    <div className="relative p-8 bg-gradient-to-br from-primary-600 via-secondary-600 to-accent-600 rounded-full shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Title with gradient text */}
                            <div className="space-y-4">
                                <h1 className="text-5xl font-black bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent animate-gradient-x">
                                    Welcome Back!
                                </h1>
                                <p className="text-xl text-neutral-600 font-medium leading-relaxed">
                                    Select a conversation to continue chatting
                                </p>
                                <p className="text-base text-neutral-500 max-w-md mx-auto">
                                    or search for users to start a new conversation
                                </p>
                            </div>

                            {/* Action cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                                <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-primary-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">Messages</h3>
                                    <p className="text-sm text-gray-600">View all chats</p>
                                </div>

                                <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-secondary-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">New Chat</h3>
                                    <p className="text-sm text-gray-600">Start chatting</p>
                                </div>

                                <div className="group p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-accent-100 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer">
                                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-success-500 rounded-xl flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform duration-300">
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-1">Search</h3>
                                    <p className="text-sm text-gray-600">Find users</p>
                                </div>
                            </div>

                            {/* Features badges */}
                            <div className="flex flex-wrap items-center justify-center gap-3 pt-6">
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-100 shadow-md text-sm font-semibold text-primary-700">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                    </svg>
                                    End-to-End Encrypted
                                </span>
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-secondary-100 shadow-md text-sm font-semibold text-secondary-700">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                    </svg>
                                    Real-Time Messaging
                                </span>
                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-accent-100 shadow-md text-sm font-semibold text-accent-700">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                        <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                                    </svg>
                                    Modern UI
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Edit Modal */}
            {showProfileEditModal && (
                <ProfileEditModal
                    currentUser={currentUser}
                    onSave={handleProfileSave}
                    onClose={() => setShowProfileEditModal(false)}
                />
            )}

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 3s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ChatLayout;
