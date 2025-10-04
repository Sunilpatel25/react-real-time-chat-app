import React, { useState } from 'react';
import { User } from '../types';
import { login, register } from '../services/mockApi';
import { LogoIcon } from './Icons';

interface LoginScreenProps {
    onLoginSuccess: (data: { user: User, token: string }) => void;
    onShowAdminSetup?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onShowAdminSetup }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('sunil@gmail.com');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            if (isLoginView) {
                const data = await login(email);
                onLoginSuccess(data);
            } else {
                const data = await register(name, email);
                onLoginSuccess(data);
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen gradient-animated p-4">
            <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 glass rounded-3xl shadow-modern-xl border border-white/20 transform transition-all animate-slideUp">
                <div className="text-center">
                    <div className="flex justify-center mx-auto mb-4 sm:mb-6">
                        <div className="p-3 sm:p-4 gradient-indigo rounded-2xl shadow-glow transform transition-all hover:scale-110 hover:rotate-12 duration-300">
                            <LogoIcon className="text-white w-10 h-10 sm:w-12 sm:h-12" />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold font-display bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {isLoginView ? 'Welcome Back!' : 'Create Account'}
                    </h2>
                    <p className="mt-2 sm:mt-3 text-sm text-cool-600 px-2">
                        {isLoginView ? "Sign in to continue chatting" : "Join us and start connecting"}
                    </p>
                    <p className="mt-2 text-sm text-cool-500 px-2">
                        {isLoginView ? "Don't have an account? " : "Already have an account? "}
                        <button 
                            onClick={() => setIsLoginView(!isLoginView)} 
                            className="font-semibold text-indigo-600 hover:text-purple-600 transition-colors hover:underline"
                        >
                            {isLoginView ? 'Create one' : 'Sign in'}
                        </button>
                    </p>
                </div>
                <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
                    {!isLoginView && (
                        <div className="transform transition-all duration-300">
                            <label htmlFor="name" className="block text-sm font-semibold text-cool-700 mb-2">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="relative block w-full px-4 py-2.5 sm:py-3 text-gray-900 placeholder-cool-400 border-2 border-indigo-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300 text-base"
                                placeholder="John Doe"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email-address" className="block text-sm font-semibold text-cool-700 mb-2">Email Address</label>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="relative block w-full px-4 py-2.5 sm:py-3 text-gray-900 placeholder-cool-400 border-2 border-indigo-200 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-indigo-300 text-base"
                            placeholder="you@example.com"
                        />
                    </div>
                    {error && (
                        <div className="flex items-center p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 animate-shake">
                            <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="break-words">{error}</span>
                        </div>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="relative flex justify-center items-center w-full px-4 py-2.5 sm:py-3 text-base font-semibold text-white gradient-indigo rounded-xl hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-modern-lg transition-all transform hover:scale-[1.02] active:scale-95"
                        >
                            {isLoading ? (
                                <span className="flex items-center">
                                    <svg className="w-5 h-5 mr-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                isLoginView ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </div>
                </form>

                {/* Admin Setup Link */}
                {onShowAdminSetup && (
                    <div className="text-center pt-4 border-t border-white/20">
                        <button
                            onClick={onShowAdminSetup}
                            className="text-sm text-indigo-600 hover:text-indigo-500 font-semibold transition-colors flex items-center justify-center mx-auto gap-2 hover:scale-105 transform duration-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Setup Admin Account
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
