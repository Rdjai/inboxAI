import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import AuthLayout from '../components/layout/AuthLayout';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, isAuthenticated, loading, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        console.log('Login page - Auth state:', {
            isAuthenticated,
            loading,
            isLoading,
            hasToken: !!localStorage.getItem('token'),
            user: localStorage.getItem('user')
        });
    }, [isAuthenticated, loading, isLoading]);

    useEffect(() => {
        console.log('Login useEffect check:', { isAuthenticated, loading });

        if (isAuthenticated && !loading) {
            console.log('User authenticated, redirecting to dashboard');
            const timer = setTimeout(() => {
                navigate('/app/dashboard', { replace: true });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, loading, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('[Login] Form submitted with:', { email, password });

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
            const result = await login(email, password);
            console.log('[Login] Login result:', result);

            if (result.success) {
                console.log('[Login] Login successful, user:', result.user?.email);
            } else {
                console.log('[Login] Login failed:', result.error);
            }
        } catch (error) {
            console.error('[Login] Login catch error:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    const featureContent = (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                </div>
                <h4 className="font-medium text-gray-900">AI Classification</h4>
                <p className="text-sm text-gray-600 mt-1">Smart email categorization</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <LogIn className="h-5 w-5 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900">Auto Drafting</h4>
                <p className="text-sm text-gray-600 mt-1">Instant response generation</p>
            </div>

            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">Secure</h4>
                <p className="text-sm text-gray-600 mt-1">Enterprise-grade security</p>
            </div>
        </div>
    );

    return (
        <AuthLayout sideContent={featureContent}>
            <div className="text-center mb-6 sm:mb-8">
                <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Inbox<span className="text-primary-600">AI</span></h1>
                        <p className="text-gray-600">AI Email Assistant</p>
                    </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome back</h2>
                <p className="text-sm sm:text-base text-gray-600 mt-2">Sign in to your account to continue</p>
            </div>

            <div className="card p-4 sm:p-6">
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
                                placeholder="********"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                                Remember me
                            </label>
                        </div>
                        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">
                            Forgot password?
                        </a>
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

                <div className="mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Demo Credentials:</p>
                    <div className="space-y-1 text-sm text-gray-600">
                        <p className="break-all"><span className="font-medium">Admin:</span> admin@inboxai.com / admin123</p>
                        <p className="break-all"><span className="font-medium">Reviewer:</span> reviewer@inboxai.com / reviewer123</p>
                        <p className="break-all"><span className="font-medium">Agent:</span> agent@inboxai.com / agent123</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Try any of these demo accounts</p>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </AuthLayout>
    );
};

export default Login;
