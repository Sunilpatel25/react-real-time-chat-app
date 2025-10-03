
import React from 'react';
import { Message } from '../types';
import { DoneIcon, DoneAllIcon } from './Icons';

interface MessageBubbleProps {
    message: Message;
    isSender: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSender }) => {
    const alignment = isSender ? 'items-end' : 'items-start';
    const bubbleColor = isSender 
        ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-md' 
        : 'bg-white text-gray-800 shadow-md border border-gray-100';
    const bubbleRadius = isSender ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';

    const renderStatus = () => {
        if (!isSender) return null;
        switch (message.status) {
            case 'sent':
                return <DoneIcon className="w-4 h-4 ml-1 text-teal-100" />;
            case 'delivered':
                return <DoneAllIcon className="w-4 h-4 ml-1 text-teal-100" />;
            case 'read':
                return <DoneAllIcon className="w-4 h-4 ml-1 text-blue-300" />;
            default:
                return null;
        }
    };

    return (
        <div className={`flex flex-col ${alignment} animate-fadeIn`}>
            <div className={`flex flex-col max-w-[85%] sm:max-w-xs md:max-w-md px-3 sm:px-4 py-2 sm:py-2.5 ${bubbleColor} ${bubbleRadius} transform transition-all hover:scale-[1.02] active:scale-[0.98]`}>
                {message.image && (
                    <img src={message.image} alt="Sent content" className="object-cover mb-2 rounded-lg max-h-48 sm:max-h-64 w-full shadow-sm" />
                )}
                {message.text && (
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                )}
                <div className="flex items-center self-end mt-1 space-x-1">
                    <span className={`text-xs ${isSender ? 'text-teal-50' : 'text-gray-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {renderStatus()}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;