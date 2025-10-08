import React, { useState, useRef } from 'react';
import { User } from '@types';

interface ProfileEditModalProps {
    currentUser: User;
    onSave: (data: { name: string; avatar: string }) => void;
    onClose: () => void;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ currentUser, onSave, onClose }) => {
    const [name, setName] = useState(currentUser.name);
    const [avatarPreview, setAvatarPreview] = useState<string>(currentUser.avatar);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, avatar: avatarPreview });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-fadeIn p-4" onClick={onClose}>
            <div className="glass rounded-3xl shadow-modern-xl w-full max-w-md p-6 sm:p-8 space-y-4 sm:space-y-6 transform transition-all animate-scaleIn max-h-[90vh] overflow-y-auto border border-indigo-200/50 neon-border" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 gradient-indigo rounded-lg flex items-center justify-center shadow-glow">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent neon-glow">Edit Profile</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-cool-400 hover:text-indigo-600 focus:outline-none transition-all hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-indigo-50/50"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <div className="flex flex-col items-center space-y-3 sm:space-y-4 p-6 rounded-2xl glass-indigo">
                        <div className="relative group">
                            <div className="absolute -inset-1 gradient-indigo rounded-full opacity-75 group-hover:opacity-100 blur-sm transition-all duration-500 animate-pulse"></div>
                            <img 
                                src={avatarPreview} 
                                alt="Avatar preview" 
                                className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-glow-purple group-hover:border-indigo-100 transition-all duration-300 ring-4 ring-indigo-100/50" 
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-2.5 sm:p-3 gradient-indigo rounded-full text-white hover:shadow-glow focus:outline-none focus:ring-4 focus:ring-indigo-300/50 shadow-modern transition-all duration-200 hover:scale-110 active:scale-95 group-hover:animate-bounce"
                                aria-label="Change avatar"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-indigo-700">Upload Profile Picture</p>
                            <p className="text-xs text-cool-600 px-2">Click the edit icon to choose an image</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="name" className="flex items-center gap-2 text-sm font-semibold text-cool-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                            </svg>
                            Display Name
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-3 sm:py-3.5 pl-11 glass-indigo border-2 border-indigo-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all duration-200 hover:border-indigo-300 text-base font-medium shadow-modern"
                                placeholder="Enter your name"
                            />
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-5 py-3 sm:py-3.5 border-2 border-cool-300 rounded-xl text-cool-700 font-bold font-display hover:bg-cool-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cool-400 transition-all duration-200 hover:border-cool-400 hover:shadow-modern active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-5 py-3 sm:py-3.5 gradient-indigo text-white rounded-xl font-bold font-display hover:shadow-glow focus:outline-none focus:ring-4 focus:ring-indigo-300/50 shadow-modern-lg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                            </svg>
                            <span className="relative z-10">Save Changes</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditModal;