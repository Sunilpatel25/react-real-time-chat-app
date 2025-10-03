import React from 'react';
import { Conversation, User } from '../types';

interface ConversationListItemProps {
    conversation: Conversation;
    isActive: boolean;
    onSelect: () => void;
}

const ConversationListItem: React.FC<ConversationListItemProps> = ({ conversation, isActive, onSelect }) => {
    const { otherUser } = conversation;

    if (!otherUser) {
        return null; // or a loading skeleton
    }

    const truncate = (text: string, length: number) => {
        return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const lastMessageText = () => {
        if (!conversation.lastMessage) return 'No messages yet';
        const { text, image } = conversation.lastMessage;
        if (text) return truncate(text, 30);
        if (image) return '📷 Photo';
        return '...';
    };

    return (
        <div
            onClick={onSelect}
            className={`flex items-center p-3 sm:p-4 mx-2 my-1 cursor-pointer rounded-xl transition-all duration-200 transform active:scale-[0.98] hover:shadow-md ${
                isActive 
                    ? 'bg-gradient-to-r from-teal-50 to-blue-50 shadow-sm border-l-4 border-teal-500' 
                    : 'hover:bg-gray-50'
            }`}
        >
            <div className="relative flex-shrink-0">
                <img 
                    src={otherUser.avatar} 
                    alt={otherUser.name} 
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover transition-all duration-200 ${
                        isActive ? 'ring-2 ring-teal-400' : 'ring-2 ring-gray-200'
                    }`}
                />
                {otherUser.isOnline && (
                    <span className="absolute bottom-0 right-0 block w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
                )}
            </div>
            <div className="flex-1 min-w-0 ml-3 sm:ml-4">
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                    <p className={`text-sm sm:text-base font-semibold truncate ${
                        isActive ? 'text-teal-700' : 'text-gray-800'
                    }`}>
                        {otherUser.name}
                    </p>
                    <p className={`text-xs flex-shrink-0 ml-2 ${
                        isActive ? 'text-teal-600 font-medium' : 'text-gray-500'
                    }`}>
                        {conversation.lastMessage ? new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                </div>
                <div className="flex items-center">
                    <p className={`text-xs sm:text-sm truncate flex-1 ${
                        isActive ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                        {lastMessageText()}
                    </p>
                    {conversation.lastMessage && conversation.lastMessage.status !== 'read' && (
                        <span className="flex-shrink-0 w-2 h-2 ml-2 bg-teal-500 rounded-full"></span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConversationListItem;