import React, { useState, useEffect } from 'react';
import { User, Conversation } from '../types';
import ConversationListItem from './ConversationListItem';
import { SearchIcon, LogoutIcon, EditIcon } from './Icons';
import { searchUsers } from '../services/mockApi';

interface SidebarProps {
    currentUser: User;
    conversations: Conversation[];
    onSelectConversation: (conversation: Conversation) => void;
    activeConversationId?: string | null;
    onLogout: () => void;
    onStartNewConversation: (user: User) => void;
    onOpenProfileEdit?: () => void;
}

const UserSearchResultItem: React.FC<{ user: User; onSelect: (user: User) => void }> = ({ user, onSelect }) => (
    <div 
        onClick={() => onSelect(user)} 
        className="flex items-center p-3 sm:p-4 mx-2 my-1 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-teal-50 hover:to-blue-50 transition-all duration-200 transform active:scale-98 hover:shadow-sm group"
    >
        <div className="relative flex-shrink-0">
            <img src={user.avatar} alt={user.name} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 ring-gray-200 group-hover:ring-teal-300 transition-all duration-200" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-gray-300 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0 ml-3 sm:ml-4">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-teal-600 transition-colors">{user.name}</p>
            <p className="text-xs text-gray-500 group-hover:text-teal-500 transition-colors">Tap to start chat</p>
        </div>
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <svg className="w-5 h-5 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </div>
);


const Sidebar: React.FC<SidebarProps> = ({ currentUser, conversations, onSelectConversation, activeConversationId, onLogout, onStartNewConversation, onOpenProfileEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const searchDelay = setTimeout(() => {
            searchUsers(searchTerm, currentUser.id).then(users => {
                setSearchResults(users);
                setIsSearching(false);
            });
        }, 300);

        return () => clearTimeout(searchDelay);
    }, [searchTerm, currentUser.id]);

    const handleSelectUser = (user: User) => {
        onStartNewConversation(user);
        setSearchTerm('');
        setSearchResults([]);
    }

    const filteredConversations = conversations.filter(conv =>
        conv.otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const conversationUserIds = new Set(conversations.map(c => c.otherUser?.id));
    const newChatResults = searchResults.filter(user => !conversationUserIds.has(user.id));

    return (
        <div className="flex flex-col w-full h-full bg-gradient-to-b from-white to-gray-50">
            {/* Header with modern gradient - Mobile optimized */}
            <div className="flex items-center justify-between flex-shrink-0 p-4 sm:p-5 bg-gradient-to-r from-teal-500 to-teal-600 shadow-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="relative group flex-shrink-0">
                        <img 
                            src={currentUser.avatar} 
                            alt={currentUser.name} 
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 sm:border-3 border-white shadow-md ring-2 ring-teal-300 transition-transform duration-200 group-hover:scale-105" 
                        />
                        {onOpenProfileEdit && (
                            <button
                                onClick={onOpenProfileEdit}
                                title="Edit Profile"
                                className="absolute -bottom-1 -right-1 p-1 sm:p-1.5 bg-white text-teal-600 rounded-full hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white shadow-md transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                                <EditIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                        )}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-white drop-shadow-sm truncate">{currentUser.name}</span>
                </div>
                <button 
                    onClick={onLogout} 
                    title="Logout" 
                    className="p-2 sm:p-2.5 text-white rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
                >
                    <LogoutIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Modern Search Bar - Mobile optimized */}
            <div className="p-3 sm:p-4 bg-white border-b border-gray-100">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search or start new chat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white transition-all duration-200 placeholder-gray-400"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {searchTerm ? (
                     <>
                        {filteredConversations.length > 0 && <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chats</div>}
                        {filteredConversations.map(conversation => (
                            <ConversationListItem
                                key={conversation.id}
                                conversation={conversation}
                                isActive={conversation.id === activeConversationId}
                                onSelect={() => onSelectConversation(conversation)}
                            />
                        ))}

                        {isSearching && (
                            <div className="flex items-center justify-center p-8">
                                <div className="flex items-center space-x-2 text-gray-500">
                                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Searching...</span>
                                </div>
                            </div>
                        )}
                        
                        {!isSearching && newChatResults.length > 0 && <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">New Chat</div>}
                        {newChatResults.map(user => (
                            <UserSearchResultItem key={user.id} user={user} onSelect={handleSelectUser} />
                        ))}
                     </>
                ) : (
                    <>
                        {conversations.length > 0 ? (
                            conversations.map(conversation => (
                                <ConversationListItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={conversation.id === activeConversationId}
                                    onSelect={() => onSelectConversation(conversation)}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 mb-3 sm:mb-4 text-gray-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600">No conversations yet</p>
                                <p className="text-xs text-gray-400 mt-1 px-4">Search for users to start chatting</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;