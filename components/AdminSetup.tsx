import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

interface AdminSetupProps {
    onAdminCreated: () => void;
}

const AdminSetup: React.FC<AdminSetupProps> = ({ onAdminCreated }) => {
    const [email, setEmail] = useState('savaliyasunil25@gmail.com');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleMakeAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${API_BASE_URL}/users/make-admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Backend server is not responding correctly. Please make sure the backend is running on port 8900.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to make user admin');
            }

            setSuccess(`✅ ${data.user.name} is now an admin!`);
            setTimeout(() => {
                onAdminCreated();
            }, 2000);
        } catch (err: any) {
            // Better error messages
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                setError('❌ Cannot connect to backend server. Please make sure the backend is running on port 8900.');
            } else if (err.message.includes('not responding correctly')) {
                setError(err.message);
            } else {
                setError(err.message || 'An error occurred');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 mb-4 shadow-xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Admin Setup
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Set up your first admin user
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
                    <form onSubmit={handleMakeAdmin} className="space-y-6">
                        {/* Email Input */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                User Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
                                placeholder="Enter user email"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Enter the email of the user you want to make admin
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                <p className="text-red-600 text-sm font-medium">{error}</p>
                                {error.includes('backend') && (
                                    <div className="mt-3 text-xs text-red-500">
                                        <p className="font-semibold mb-1">To start the backend:</p>
                                        <code className="bg-red-100 px-2 py-1 rounded block">cd backend</code>
                                        <code className="bg-red-100 px-2 py-1 rounded block mt-1">node server.js</code>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                <p className="text-green-600 text-sm font-medium">{success}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !!success}
                            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Admin...
                                </span>
                            ) : success ? (
                                '✅ Admin Created!'
                            ) : (
                                '🔐 Make Admin'
                            )}
                        </button>

                        {/* Info Note */}
                        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-4">
                            <p className="text-xs text-indigo-700">
                                <strong>Note:</strong> The user must already be registered. This will promote their account to admin status.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Default Email: <span className="font-semibold text-indigo-600">savaliyasunil25@gmail.com</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                        You can change the email above to make any registered user an admin
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSetup;
