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
        <div className="flex h-screen antialiased text-gray-800 overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden md:flex md:w-1/3 lg:w-1/4 border-r border-gray-200">
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
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
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
                        <div className="text-center space-y-4 max-w-md">
                            <div className="flex justify-center">
                                <div className="p-5 sm:p-6 bg-gradient-to-br from-teal-100 to-blue-100 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 sm:w-20 sm:h-20 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Welcome to your Chat</h3>
                            <p className="text-sm sm:text-base text-gray-500 leading-relaxed px-4">
                                Select a conversation from the sidebar or search for users to start a new chat.
                            </p>
                            <div className="pt-4">
                                <div className="inline-flex items-center px-4 py-2 text-sm text-teal-700 bg-teal-50 rounded-full border border-teal-200">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Start messaging now!
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
