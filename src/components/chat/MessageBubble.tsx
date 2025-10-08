
import React from 'react';
import { Message } from '../../types';
import { DoneIcon, DoneAllIcon } from '../shared/Icons';

interface MessageBubbleProps {
    message: Message;
    isSender: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isSender }) => {
    const alignment = isSender ? 'items-end' : 'items-start';
    const bubbleColor = isSender 
        ? 'gradient-primary text-white shadow-modern' 
        : 'bg-white text-neutral-800 shadow-modern border border-primary-100';
    const bubbleRadius = isSender ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md';

    const renderStatus = () => {
        if (!isSender) return null;
        switch (message.status) {
            case 'sent':
                return <DoneIcon className="w-4 h-4 ml-1 text-primary-100" />;
            case 'delivered':
                return <DoneAllIcon className="w-4 h-4 ml-1 text-primary-100" />;
            case 'read':
                return <DoneAllIcon className="w-4 h-4 ml-1 text-secondary-200" />;
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
                
                {/* Admin Edit Badge */}
                {message.isEdited && message.lastEditedBy && (
                    <div className="flex items-center gap-1 mt-1.5 px-2 py-1 bg-accent-100/90 text-accent-700 rounded-full text-xs font-medium shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        <span>Edited by Admin</span>
                    </div>
                )}
                
                {/* Flag Badge */}
                {message.isFlagged && (
                    <div className="flex items-center gap-1 mt-1.5 px-2 py-1 bg-accent-100/90 text-accent-700 rounded-full text-xs font-medium shadow-sm">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
                        </svg>
                        <span>Flagged</span>
                    </div>
                )}
                
                <div className="flex items-center self-end mt-1 space-x-1">
                    <span className={`text-xs ${isSender ? 'text-white/80' : 'text-neutral-400'}`}>
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {renderStatus()}
                </div>
            </div>
        </div>
    );
};

// Custom comparison function to prevent unnecessary re-renders
// Only re-render if message content, status, or admin flags change
const arePropsEqual = (prevProps: MessageBubbleProps, nextProps: MessageBubbleProps) => {
    return (
        prevProps.message.id === nextProps.message.id &&
        prevProps.message.text === nextProps.message.text &&
        prevProps.message.image === nextProps.message.image &&
        prevProps.message.status === nextProps.message.status &&
        prevProps.message.isEdited === nextProps.message.isEdited &&
        prevProps.message.isFlagged === nextProps.message.isFlagged &&
        prevProps.isSender === nextProps.isSender
    );
};

export default React.memo(MessageBubble, arePropsEqual);