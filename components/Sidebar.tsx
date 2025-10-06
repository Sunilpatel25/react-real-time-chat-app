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
        className="flex items-center p-3 sm:p-4 mx-2 my-1 cursor-pointer rounded-xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 transition-all duration-200 transform active:scale-98 hover:shadow-modern group"
    >
        <div className="relative flex-shrink-0">
            <img src={user.avatar} alt={user.name} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 ring-primary-200 group-hover:ring-primary-400 transition-all duration-200" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-secondary-300 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1 min-w-0 ml-3 sm:ml-4">
            <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary-600 transition-colors">{user.name}</p>
            <p className="text-xs text-neutral-500 group-hover:text-primary-500 transition-colors">Tap to start chat</p>
        </div>
        <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    </div>
);


const Sidebar: React.FC<SidebarProps> = ({ currentUser, conversations, onSelectConversation, activeConversationId, onLogout, onStartNewConversation, onOpenProfileEdit }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTheme, setShowTheme] = useState(false);
    
    // Settings state
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [showOnlineStatus, setShowOnlineStatus] = useState(true);
    const [autoDownload, setAutoDownload] = useState(false);
    
    // Theme state - Load from localStorage
    const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved as 'light' | 'dark' | 'auto') || 'light';
    });
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Apply theme on mount and when selectedTheme changes
    useEffect(() => {
        const applyTheme = () => {
            let shouldBeDark = false;
            
            if (selectedTheme === 'dark') {
                shouldBeDark = true;
            } else if (selectedTheme === 'auto') {
                shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }
            
            setIsDarkMode(shouldBeDark);
            document.documentElement.classList.toggle('dark', shouldBeDark);
            localStorage.setItem('theme', selectedTheme);
        };

        applyTheme();

        // Listen for system theme changes when in auto mode
        if (selectedTheme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => {
                setIsDarkMode(e.matches);
                document.documentElement.classList.toggle('dark', e.matches);
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [selectedTheme]);

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
        <div className="flex flex-col w-full h-full bg-gradient-to-b from-white via-primary-50/30 to-secondary-50/30">
            {/* Header with modern gradient - Mobile optimized */}
            <div className="flex items-center justify-between flex-shrink-0 p-4 sm:p-5 gradient-primary shadow-modern-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="relative group flex-shrink-0">
                        <div className="relative">
                            <img 
                                src={currentUser.avatar} 
                                alt={currentUser.name} 
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white shadow-lg ring-2 ring-white/50 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl" 
                            />
                           
                        </div>
                    </div>
                    <span className="text-base sm:text-lg font-bold font-display text-white drop-shadow-sm truncate">{currentUser.name}</span>
                </div>
                
                {/* Three Dot Menu */}
                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        title="Menu" 
                        className="p-2 sm:p-2.5 text-white rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <>
                            {/* Backdrop to close menu */}
                            <div 
                                className="fixed inset-0 z-20" 
                                onClick={() => setShowMenu(false)}
                            />
                            
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden z-30 animate-scaleIn">
                                {onOpenProfileEdit && (
                                    <button
                                        onClick={() => {
                                            onOpenProfileEdit();
                                            setShowMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 transition-colors duration-200 group"
                                    >
                                        <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                                            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">Edit Profile</p>
                                            <p className="text-xs text-neutral-500">Update your information</p>
                                        </div>
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowSettings(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary-50 transition-colors duration-200 group"
                                >
                                    <div className="p-2 bg-secondary-100 rounded-lg group-hover:bg-secondary-200 transition-colors">
                                        <svg className="w-4 h-4 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Settings</p>
                                        <p className="text-xs text-neutral-500">Preferences & privacy</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        setShowTheme(true);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent-50 transition-colors duration-200 group"
                                >
                                    <div className="p-2 bg-accent-100 rounded-lg group-hover:bg-accent-200 transition-colors">
                                        <svg className="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-800">Theme</p>
                                        <p className="text-xs text-neutral-500">Customize appearance</p>
                                    </div>
                                </button>

                                <div className="border-t border-neutral-200 my-1"></div>

                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        onLogout();
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors duration-200 group"
                                >
                                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-red-600">Logout</p>
                                        <p className="text-xs text-red-400">Sign out of your account</p>
                                    </div>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Modern Search Bar - Mobile optimized */}
            <div className="p-3 sm:p-4 glass-primary border-b border-primary-100">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-primary-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search or start new chat..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full py-2.5 sm:py-3 pl-10 sm:pl-12 pr-4 text-sm bg-white border border-primary-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-neutral-400"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {searchTerm ? (
                     <>
                        {filteredConversations.length > 0 && <div className="px-4 py-2 text-xs font-semibold text-primary-600 uppercase tracking-wide">Chats</div>}
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
                                    <div className="w-4 h-4 border-2 border-secondary-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm">Searching...</span>
                                </div>
                            </div>
                        )}
                        
                        {!isSearching && newChatResults.length > 0 && <div className="px-4 py-2 text-xs font-semibold text-secondary-600 uppercase tracking-wide">New Chat</div>}
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
                                <div className="p-4 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full mb-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-neutral-700">No conversations yet</p>
                                <p className="text-xs text-neutral-500 mt-1 px-4">Search for users to start chatting</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4" onClick={() => setShowSettings(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Notifications Toggle */}
                            <div className="flex items-center justify-between p-4 bg-secondary-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-secondary-100 rounded-lg">
                                        <svg className="w-5 h-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Notifications</p>
                                        <p className="text-xs text-neutral-500">Enable push notifications</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setNotifications(!notifications)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-secondary-500' : 'bg-neutral-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : ''}`}></div>
                                </button>
                            </div>

                            {/* Sound Toggle */}
                            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-100 rounded-lg">
                                        <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Sound</p>
                                        <p className="text-xs text-neutral-500">Message notification sounds</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSoundEnabled(!soundEnabled)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-primary-500' : 'bg-neutral-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-6' : ''}`}></div>
                                </button>
                            </div>

                            {/* Online Status Toggle */}
                            <div className="flex items-center justify-between p-4 bg-accent-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent-100 rounded-lg">
                                        <svg className="w-5 h-5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Show Online Status</p>
                                        <p className="text-xs text-neutral-500">Let others see when you're online</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowOnlineStatus(!showOnlineStatus)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${showOnlineStatus ? 'bg-accent-500' : 'bg-neutral-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showOnlineStatus ? 'translate-x-6' : ''}`}></div>
                                </button>
                            </div>

                            {/* Auto Download Toggle */}
                            <div className="flex items-center justify-between p-4 bg-neutral-100 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-neutral-200 rounded-lg">
                                        <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">Auto Download</p>
                                        <p className="text-xs text-neutral-500">Download media automatically</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAutoDownload(!autoDownload)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${autoDownload ? 'bg-primary-500' : 'bg-neutral-300'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${autoDownload ? 'translate-x-6' : ''}`}></div>
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowSettings(false)}
                            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Theme Modal */}
            {showTheme && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4" onClick={() => setShowTheme(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Theme</h2>
                                <p className="text-xs text-neutral-500 mt-1">
                                    Current: {selectedTheme === 'auto' ? `Auto (${isDarkMode ? 'Dark' : 'Light'})` : selectedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                                </p>
                            </div>
                            <button onClick={() => setShowTheme(false)} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Light Theme */}
                            <button
                                onClick={() => {
                                    setSelectedTheme('light');
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                                    selectedTheme === 'light' 
                                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]' 
                                        : 'border-neutral-200 hover:border-primary-300 hover:scale-[1.01]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg transition-transform ${
                                        selectedTheme === 'light' ? 'scale-110' : ''
                                    }`}>
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-800">Light Mode</p>
                                        <p className="text-xs text-neutral-500">Bright and clean interface</p>
                                    </div>
                                    {selectedTheme === 'light' && (
                                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center animate-scaleIn">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Dark Theme */}
                            <button
                                onClick={() => {
                                    setSelectedTheme('dark');
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                                    selectedTheme === 'dark' 
                                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]' 
                                        : 'border-neutral-200 hover:border-primary-300 hover:scale-[1.01]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg transition-transform ${
                                        selectedTheme === 'dark' ? 'scale-110' : ''
                                    }`}>
                                        <svg className="w-6 h-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-800">Dark Mode</p>
                                        <p className="text-xs text-neutral-500">Easy on the eyes at night</p>
                                    </div>
                                    {selectedTheme === 'dark' && (
                                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center animate-scaleIn">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>

                            {/* Auto Theme */}
                            <button
                                onClick={() => {
                                    setSelectedTheme('auto');
                                }}
                                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                                    selectedTheme === 'auto' 
                                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-[1.02]' 
                                        : 'border-neutral-200 hover:border-primary-300 hover:scale-[1.01]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg transition-transform ${
                                        selectedTheme === 'auto' ? 'scale-110' : ''
                                    }`}>
                                        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold text-gray-800">Auto (System)</p>
                                        <p className="text-xs text-neutral-500">
                                            Matches device • Currently {isDarkMode ? 'Dark' : 'Light'}
                                        </p>
                                    </div>
                                    {selectedTheme === 'auto' && (
                                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center animate-scaleIn">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </button>
                        </div>

                        {/* Info Banner */}
                        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                            <div className="flex gap-2">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs text-blue-700">
                                    Theme changes apply instantly. Your preference is saved automatically.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                setShowTheme(false);
                                // Optional: Show confirmation
                                setTimeout(() => {
                                    // You could add a toast notification here
                                }, 100);
                            }}
                            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sidebar;