
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Conversation, User, Message } from '../types';
import MessageBubble from './MessageBubble';
import { SendIcon, MoreVertIcon, BackArrowIcon, PaperclipIcon } from './Icons';

interface ChatWindowProps {
    activeConversation: Conversation;
    currentUser: User;
    messages: Message[];
    onSendMessage: (payload: { text: string; image?: string }) => void;
    onBack: () => void;
    isTyping: boolean;
    onTyping: (action: 'start' | 'stop') => void;
    socket?: React.MutableRefObject<any>;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ activeConversation, currentUser, messages, onSendMessage, onBack, isTyping, onTyping, socket }) => {
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    const { otherUser } = activeConversation;
    
    // Check if current user is admin
    const isAdmin = currentUser.role === 'admin';

    const handleTypingEvent = useCallback((action: 'start' | 'stop') => {
        if (action === 'start' && !isTypingRef.current) {
            onTyping('start');
            isTypingRef.current = true;
        } else if (action === 'stop' && isTypingRef.current) {
            onTyping('stop');
            isTypingRef.current = false;
        }
    }, [onTyping]);

    useEffect(() => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (inputText) {
            handleTypingEvent('start');
            typingTimeoutRef.current = window.setTimeout(() => handleTypingEvent('stop'), 2000);
        } else {
            handleTypingEvent('stop');
        }
        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [inputText, handleTypingEvent]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const cancelImage = () => {
        setImageFile(null);
        if(imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        handleTypingEvent('stop');

        if (inputText.trim() || imageFile) {
            if (imageFile) {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = () => {
                    onSendMessage({ text: inputText, image: reader.result as string });
                    cancelImage();
                    setInputText('');
                    setReplyingTo(null);
                };
            } else {
                onSendMessage({ text: inputText });
                setInputText('');
                setReplyingTo(null);
            }
        }
    };

    // Message action handlers
    const handleMessageSelect = (messageId: string) => {
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
            }
            return newSet;
        });
    };

    const handleEditMessage = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
            setEditingMessageId(message.id);
            setEditText(message.text);
        }
        setContextMenu(null);
    };

    const handleSaveEdit = () => {
        if (editText.trim() && editingMessageId && socket?.current) {
            const message = messages.find(m => m.id === editingMessageId);
            
            // Emit admin edit event via Socket.IO
            socket.current.emit('adminEditMessage', {
                messageId: editingMessageId,
                text: editText.trim(),
                editedBy: currentUser.id,
                conversationId: message?.conversationId,
                isAdmin: isAdmin
            });
            
            console.log('✏️ Admin editing message:', editingMessageId);
            setEditingMessageId(null);
            setEditText('');
        }
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
        setEditText('');
    };

    const handleDeleteMessage = (messageId: string) => {
        if (socket?.current) {
            const message = messages.find(m => m.id === messageId);
            
            // Emit admin delete event via Socket.IO
            socket.current.emit('adminDeleteMessage', {
                messageId: messageId,
                deletedBy: currentUser.id,
                conversationId: message?.conversationId,
                isAdmin: isAdmin
            });
            
            console.log('🗑️ Admin deleting message:', messageId);
        }
        
        setContextMenu(null);
        setSelectedMessages(prev => {
            const newSet = new Set(prev);
            newSet.delete(messageId);
            return newSet;
        });
    };

    const handleCopyMessage = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
            navigator.clipboard.writeText(message.text);
        }
        setContextMenu(null);
    };

    const handleReplyMessage = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
            setReplyingTo(message);
        }
        setContextMenu(null);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
    };

    const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
        e.preventDefault();
        
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuWidth = 200; // Approximate menu width
        const menuHeight = 300; // Approximate menu height
        
        let x = e.clientX;
        let y = e.clientY;
        
        // Adjust position if menu would go off-screen
        if (x + menuWidth > viewportWidth) {
            x = viewportWidth - menuWidth - 10;
        }
        if (y + menuHeight > viewportHeight) {
            y = viewportHeight - menuHeight - 10;
        }
        
        // Ensure menu doesn't go off left or top
        x = Math.max(10, x);
        y = Math.max(10, y);
        
        setContextMenu({ messageId, x, y });
    };

    const handleDeleteSelected = () => {
        selectedMessages.forEach(id => handleDeleteMessage(id));
        setSelectedMessages(new Set());
    };

    const handleClearSelection = () => {
        setSelectedMessages(new Set());
    };

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    if (!otherUser) {
        return <div className="flex items-center justify-center w-full h-full">Loading chat...</div>;
    }

    return (
        <div className="flex flex-col w-full h-screen bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(100 116 139) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* Modern Header with Glass Effect */}
            <div className="relative z-10 flex items-center justify-between flex-shrink-0 p-4 sm:p-5 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm safe-top">
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    {/* Back Button with hover effect */}
                    <button 
                        onClick={onBack} 
                        className="mr-1 p-2.5 rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 active:scale-95 md:hidden flex-shrink-0 group"
                    >
                        <BackArrowIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                    </button>
                    
                    {/* Avatar with animated ring */}
                    <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                        <img 
                            src={otherUser.avatar} 
                            alt={otherUser.name} 
                            className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full ring-2 ring-white object-cover shadow-lg"
                        />
                        {otherUser.isOnline && (
                            <span className="absolute bottom-0 right-0 flex w-3.5 h-3.5 sm:w-4 sm:h-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 border-2 border-white shadow-lg"></span>
                            </span>
                        )}
                    </div>
                    
                    {/* User Info with better typography */}
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{otherUser.name}</p>
                            {isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                                    </svg>
                                    ADMIN
                                </span>
                            )}
                        </div>
                        <p className={`text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                            isTyping ? 'text-indigo-600' : otherUser.isOnline ? 'text-green-600' : 'text-gray-400'
                        }`}>
                            {isTyping ? (
                                <span className="flex items-center gap-1.5">
                                    <span className="inline-flex space-x-0.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                    </span>
                                    typing...
                                </span>
                            ) : (otherUser.isOnline ? 'Active now' : 'Offline')}
                        </p>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                    {selectedMessages.size > 0 ? (
                        <>
                            <span className="text-sm font-semibold text-indigo-600 mr-2">
                                {selectedMessages.size} selected
                            </span>
                            <button 
                                onClick={handleDeleteSelected}
                                className="p-2.5 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-300 hover:scale-110 active:scale-95"
                                title="Delete selected"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button 
                                onClick={handleClearSelection}
                                className="p-2.5 text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-110 active:scale-95"
                                title="Clear selection"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="p-2.5 text-gray-600 rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 transition-all duration-300 hover:scale-110 active:scale-95">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                            <button className="p-2.5 text-gray-600 rounded-xl hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 transition-all duration-300 hover:scale-110 active:scale-95">
                                <MoreVertIcon className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Messages Area with Enhanced Background */}
            <div className="relative flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                {/* Decorative gradient orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full filter blur-3xl opacity-50 animate-blob"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
                
                {/* Messages */}
                <div className="relative space-y-3 sm:space-y-4">
                    {messages.map((msg) => {
                        const isSelected = selectedMessages.has(msg.id);
                        const isEditing = editingMessageId === msg.id;
                        const isSender = msg.senderId === currentUser.id;

                        return (
                            <div 
                                key={msg.id}
                                className={`relative group transition-all duration-300 ${isSelected ? 'scale-[0.98]' : ''}`}
                                onClick={() => selectedMessages.size > 0 && handleMessageSelect(msg.id)}
                                onContextMenu={(e) => (isSender || isAdmin) && handleContextMenu(e, msg.id)}
                            >
                                {/* Selection Checkbox */}
                                {(selectedMessages.size > 0 || isSelected) && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleMessageSelect(msg.id);
                                            }}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                                                isSelected 
                                                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 border-indigo-500 scale-110' 
                                                    : 'bg-white border-gray-300 hover:border-indigo-400 hover:scale-110'
                                            }`}
                                        >
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Quick Action Button (shown on hover for sender's messages or admin) */}
                                {(isSender || isAdmin) && selectedMessages.size === 0 && !isEditing && (
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleContextMenu(e as any, msg.id);
                                            }}
                                            className="p-2 bg-white rounded-full shadow-lg hover:shadow-xl border border-gray-200 hover:border-indigo-300 transition-all duration-300 hover:scale-110"
                                        >
                                            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                {/* Edit Mode */}
                                {isEditing ? (
                                    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[70%] bg-white rounded-2xl shadow-xl border-2 border-indigo-400 p-4 space-y-3">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full min-h-[80px] p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                                autoFocus
                                            />
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all"
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <MessageBubble 
                                        message={msg} 
                                        isSender={isSender}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
                <div ref={messagesEndRef} />

                {/* Context Menu */}
                {contextMenu && (
                    <>
                        {/* Backdrop for mobile */}
                        <div 
                            className="fixed inset-0 z-40 md:hidden"
                            onClick={(e) => {
                                e.stopPropagation();
                                setContextMenu(null);
                            }}
                        />
                        
                        <div
                            className={`fixed rounded-2xl shadow-2xl py-2 min-w-[220px] z-50 animate-fadeIn overflow-hidden ${
                                isAdmin 
                                    ? 'bg-gradient-to-br from-amber-50 via-white to-amber-50 border-2 border-amber-300/50' 
                                    : 'bg-white border border-gray-200/80'
                            }`}
                            style={{ 
                                top: `${contextMenu.y}px`, 
                                left: `${contextMenu.x}px`,
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Admin Badge */}
                            {isAdmin && (
                                <div className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-1.022 0l-1.735-.992a1 1 0 01-.372-1.364z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs font-bold text-white uppercase tracking-wider">Admin Controls</span>
                                </div>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReplyMessage(contextMenu.messageId);
                                }}
                                className="w-full px-4 py-3 text-left text-sm md:text-base hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:text-indigo-600 active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="font-medium">Reply</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditMessage(contextMenu.messageId);
                                }}
                                className={`w-full px-4 py-3 text-left text-sm md:text-base transition-all duration-200 flex items-center space-x-3 active:scale-[0.98] ${
                                    isAdmin 
                                        ? 'hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 text-gray-700 hover:text-amber-700' 
                                        : 'hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 text-gray-700 hover:text-indigo-600'
                                }`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="font-medium">Edit{isAdmin ? ' (Admin)' : ''}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyMessage(contextMenu.messageId);
                                }}
                                className="w-full px-4 py-3 text-left text-sm md:text-base hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:text-indigo-600 active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="font-medium">Copy</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMessageSelect(contextMenu.messageId);
                                }}
                                className="w-full px-4 py-3 text-left text-sm md:text-base hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 text-gray-700 hover:text-indigo-600 active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                <span className="font-medium">Select</span>
                            </button>
                            
                            {/* Admin-only options */}
                            {isAdmin && (
                                <>
                                    <hr className="my-1 border-amber-200" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const message = messages.find(m => m.id === contextMenu.messageId);
                                            if (message) {
                                                console.log('Admin viewing message details:', message);
                                                alert(`Message Details:\nID: ${message.id}\nSender: ${message.senderId}\nTime: ${new Date(message.timestamp).toLocaleString()}\nStatus: ${message.status}`);
                                            }
                                            setContextMenu(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm md:text-base hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 flex items-center space-x-3 text-amber-700 hover:text-amber-800 active:scale-[0.98]"
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">View Details</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const message = messages.find(m => m.id === contextMenu.messageId);
                                            if (message && socket?.current) {
                                                const reason = prompt('Please provide a reason for flagging this message:');
                                                if (reason && reason.trim()) {
                                                    socket.current.emit('adminFlagMessage', {
                                                        messageId: contextMenu.messageId,
                                                        flaggedBy: currentUser.id,
                                                        flagReason: reason.trim(),
                                                        conversationId: message.conversationId,
                                                        isAdmin: isAdmin
                                                    });
                                                    console.log('🚩 Admin flagging message:', contextMenu.messageId);
                                                } else if (reason !== null) {
                                                    alert('Flag reason is required');
                                                }
                                            }
                                            setContextMenu(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-sm md:text-base hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-200 flex items-center space-x-3 text-amber-700 hover:text-amber-800 active:scale-[0.98]"
                                    >
                                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                        <span className="font-medium">Flag Message</span>
                                    </button>
                                </>
                            )}
                            
                            <hr className={`my-1 ${isAdmin ? 'border-amber-200' : 'border-gray-200'}`} />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMessage(contextMenu.messageId);
                                }}
                                className={`w-full px-4 py-3 text-left text-sm md:text-base hover:bg-red-50 transition-all duration-200 flex items-center space-x-3 text-red-600 hover:text-red-700 active:scale-[0.98] ${
                                    isAdmin ? 'font-semibold' : ''
                                }`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span className="font-medium">Delete{isAdmin ? ' (Admin)' : ''}</span>
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Ultra Modern Input Area with Glass Effect */}
            <div className="relative z-10 p-4 sm:p-5 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 shadow-2xl safe-bottom">
                {/* Reply Preview */}
                {replyingTo && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-lg flex items-start justify-between animate-fadeIn">
                        <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                <span className="text-xs font-semibold text-indigo-600">
                                    Replying to {replyingTo.senderId === currentUser.id ? 'yourself' : activeConversation.user.name}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">{replyingTo.text}</p>
                        </div>
                        <button
                            onClick={handleCancelReply}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Image Preview with Enhanced Design */}
                {imagePreview && (
                    <div className="relative inline-block mb-3 sm:mb-4 group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition-opacity"></div>
                        <img src={imagePreview} alt="Preview" className="relative object-cover w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-xl border-2 border-white" />
                        <button 
                            onClick={cancelImage}
                            className="absolute -top-2 -right-2 p-2 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-full hover:from-red-600 hover:to-pink-600 shadow-lg transition-all hover:scale-110 active:scale-95"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                
                {/* Input Form with Modern Design */}
                <form onSubmit={handleSend} className="flex items-end space-x-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    
                    {/* Attachment Button */}
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="flex-shrink-0 p-3 text-gray-600 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Text Input with Glass Effect */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type your message..."
                            className="w-full px-5 py-3.5 text-sm sm:text-base bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-400 focus:from-white focus:to-indigo-50 transition-all duration-300 placeholder-gray-400 shadow-sm focus:shadow-md"
                        />
                    </div>
                    
                    {/* Send Button with Gradient Animation */}
                    <button 
                        type="submit" 
                        className="flex-shrink-0 p-3.5 text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
                        disabled={!inputText.trim() && !imageFile}
                    >
                        <SendIcon className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                    </button>
                </form>
            </div>

            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(20px, -50px) scale(1.1); }
                    50% { transform: translate(-20px, 20px) scale(0.9); }
                    75% { transform: translate(50px, 50px) scale(1.05); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-blob {
                    animation: blob 10s infinite;
                }
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(to bottom, rgb(99 102 241), rgb(168 85 247));
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(to bottom, rgb(79 70 229), rgb(147 51 234));
                }
            `}</style>
        </div>
    );
};

export default ChatWindow;