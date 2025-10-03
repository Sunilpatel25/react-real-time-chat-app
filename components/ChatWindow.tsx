
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
}

const ChatWindow: React.FC<ChatWindowProps> = ({ activeConversation, currentUser, messages, onSendMessage, onBack, isTyping, onTyping }) => {
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);

    const { otherUser } = activeConversation;

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
                };
            } else {
                onSendMessage({ text: inputText });
                setInputText('');
            }
        }
    };

    if (!otherUser) {
        return <div className="flex items-center justify-center w-full h-full">Loading chat...</div>;
    }

    return (
        <div className="flex flex-col w-full h-screen bg-gray-50">
            {/* Header with gradient - Mobile optimized */}
            <div className="flex items-center justify-between flex-shrink-0 p-3 sm:p-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 shadow-sm safe-top">
                <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <button 
                        onClick={onBack} 
                        className="mr-0.5 sm:mr-1 p-2 rounded-full hover:bg-gray-100 transition-all active:scale-95 md:hidden flex-shrink-0"
                    >
                        <BackArrowIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="relative flex-shrink-0">
                        <img 
                            src={otherUser.avatar} 
                            alt={otherUser.name} 
                            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-2 ring-teal-200 object-cover"
                        />
                        {otherUser.isOnline && (
                            <span className="absolute bottom-0 right-0 block w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm sm:text-base font-semibold text-gray-800 truncate">{otherUser.name}</p>
                        <p className={`text-xs font-medium transition-colors duration-300 ${
                            isTyping ? 'text-teal-500' : otherUser.isOnline ? 'text-green-500' : 'text-gray-400'
                        }`}>
                            {isTyping ? (
                                <span className="flex items-center">
                                    <span className="inline-flex space-x-1 mr-1">
                                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                        <span className="w-1 h-1 bg-teal-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                                    </span>
                                    typing...
                                </span>
                            ) : (otherUser.isOnline ? 'Online' : 'Offline')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    <button className="p-2 text-gray-600 rounded-full hover:bg-gray-100 transition-all hover:scale-110 active:scale-95">
                        <MoreVertIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>

            {/* Messages with modern background - Mobile optimized */}
            <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 custom-scrollbar">
                <div className="space-y-2 sm:space-y-3">
                    {messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} isSender={msg.senderId === currentUser.id} />
                    ))}
                </div>
                <div ref={messagesEndRef} />
            </div>

            {/* Modern Input Area - Mobile optimized */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shadow-lg safe-bottom">
                {imagePreview && (
                    <div className="relative inline-block mb-2 sm:mb-3">
                        <img src={imagePreview} alt="Preview" className="object-cover w-24 h-24 sm:w-28 sm:h-28 rounded-xl shadow-md border-2 border-gray-200" />
                        <button 
                            onClick={cancelImage}
                            className="absolute -top-2 -right-2 p-1.5 text-white bg-red-500 rounded-full hover:bg-red-600 shadow-lg transition-all hover:scale-110 active:scale-95"
                            aria-label="Remove image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-2 sm:p-2.5 text-gray-500 rounded-full hover:bg-teal-50 hover:text-teal-600 transition-all hover:scale-110 active:scale-95 flex-shrink-0"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 sm:py-3 text-sm bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder-gray-400"
                    />
                    <button 
                        type="submit" 
                        className="p-2.5 sm:p-3 text-white bg-gradient-to-r from-teal-500 to-teal-600 rounded-full hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        disabled={!inputText.trim() && !imageFile}
                    >
                        <SendIcon className="w-5 h-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;