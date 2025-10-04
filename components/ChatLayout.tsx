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
    isTyping: boolean;
    onTyping: (action: 'start' | 'stop') => void;
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
    isTyping,
    onTyping,
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
        <div className="flex h-screen antialiased text-cool-800 overflow-hidden bg-gradient-to-br from-indigo-50/30 via-purple-50/20 to-pink-50/30">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-1/3 lg:w-1/4 border-r border-indigo-100/50 backdrop-blur-sm">
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

            {/* Mobile: show sidebar when chat not open */}
            {!showChatOnMobile && (
            <div className="md:hidden w-full h-full">
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
            )}

            {/* Chat area */}
            <div className="flex-1 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/20 overflow-hidden">
            {activeConversation ? (
                <div className={`${showChatOnMobile ? 'block' : 'hidden'} md:block h-full`}>
                <ChatWindow
                    activeConversation={activeConversation}
                    currentUser={currentUser}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    onBack={() => setShowChatOnMobile(false)}
                    isTyping={isTyping}
                    onTyping={onTyping}
                />
                </div>
            ) : (
                <div className="hidden md:flex items-center justify-center h-full p-6 sm:p-8">
                <div className="text-center space-y-6 max-w-md animate-fadeIn">
                    <div className="flex justify-center">
                    <div className="relative group">
                        <div className="absolute -inset-2 gradient-indigo rounded-full opacity-75 blur-lg animate-pulse"></div>
                        <div className="relative p-6 sm:p-8 gradient-indigo rounded-full shadow-glow-purple">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        </div>
                    </div>
                    </div>
                    <div className="space-y-3">
                    <h3 className="text-2xl sm:text-3xl font-bold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent neon-glow">Welcome to Your Chat</h3>
                    <p className="text-sm sm:text-base text-cool-600 leading-relaxed px-4 font-medium">
                        Select a conversation from the sidebar or search for users to start a new chat.
                    </p>
                    </div>
                    <div className="pt-4 flex flex-col items-center gap-4">
                    <div className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-indigo-700 glass-indigo rounded-full border-2 border-indigo-200 shadow-modern hover:shadow-glow transition-all duration-300 hover:scale-105 cursor-default">
                        <svg className="w-5 h-5 mr-2 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Start messaging now!
                    </div>
                    <div className="flex items-center gap-3 text-xs text-cool-500">
                        <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span>Secure</span>
                        </div>
                        <div className="w-1 h-1 bg-cool-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <span>Fast</span>
                        </div>
                        <div className="w-1 h-1 bg-cool-300 rounded-full"></div>
                        <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <span>Modern</span>
                        </div>
                    </div>
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
        </div>
    );
};

export default ChatLayout;
