import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated && !loading) {
            const timer = setTimeout(() => {
                navigate('/app/dashboard', { replace: true });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (!password || password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsSubmitting(true);

        try {
            await login(email, password);
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Login</h1>
                    <p className="mt-2 text-sm text-gray-600">Sign in to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field pl-10"
                                placeholder="you@example.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field pl-10"
                                placeholder="Enter your password"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <LoadingSpinner size="small" />
                        ) : (
                            <>
                                <LogIn className="h-5 w-5 mr-2 inline" />
                                Sign In
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
