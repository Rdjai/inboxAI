import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
const AUTH_EXPIRED_MESSAGE_KEY = 'auth_expired_message';

const decodeJwtPayload = (token) => {
    try {
        const [, payload] = String(token || '').split('.');
        if (!payload) return null;
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(normalized));
    } catch (error) {
        return null;
    }
};

const clearStoredAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false); // For login/register operations

    // Check authentication on mount
    useEffect(() => {
        const expiredMessage = sessionStorage.getItem(AUTH_EXPIRED_MESSAGE_KEY);
        if (expiredMessage) {
            toast.error(expiredMessage);
            sessionStorage.removeItem(AUTH_EXPIRED_MESSAGE_KEY);
        }

        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            const storedExpiresAt = localStorage.getItem('tokenExpiresAt');

            if (token && storedUser) {
                try {
                    const decoded = decodeJwtPayload(token);
                    const tokenExpiresAt = storedExpiresAt || (decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null);

                    if (tokenExpiresAt && new Date(tokenExpiresAt).getTime() <= Date.now()) {
                        clearStoredAuth();
                        setUser(null);
                        sessionStorage.setItem(AUTH_EXPIRED_MESSAGE_KEY, 'Your session expired. Please sign in again.');
                        setLoading(false);
                        return;
                    }

                    // Parse stored user
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    if (tokenExpiresAt) {
                        localStorage.setItem('tokenExpiresAt', tokenExpiresAt);
                    }

                    // Verify token with backend by loading profile
                    try {
                        const profileRes = await authAPI.getProfile();
                        const profileData = profileRes?.data || profileRes;
                        if (profileData?.success && profileData?.data) {
                            setUser(profileData.data);
                            localStorage.setItem('user', JSON.stringify(profileData.data));
                        }
                    } catch (error) {
                        console.log('Token verification failed, clearing auth');
                        clearStoredAuth();
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Failed to parse stored user:', error);
                    clearStoredAuth();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        setIsLoading(true);
        try {
            console.log('🔐 [AuthContext] Logging in with:', { email, password });

            // Format email
            const formattedEmail = email.toLowerCase().trim();

            const response = await authAPI.login({
                email: formattedEmail,
                password
            });

            console.log('🔐 [AuthContext] Login response:', response);

            // Check if response has data property or is the data itself
            const responseData = response.data || response;
            const payload = responseData?.data || responseData;
            const token = payload?.token || responseData?.token;
            const userData = payload?.user || responseData?.user;
            const tokenExpiresAt = payload?.expiresAt || responseData?.expiresAt || (decodeJwtPayload(token)?.exp ? new Date(decodeJwtPayload(token).exp * 1000).toISOString() : null);

            if (responseData?.success !== false && token && userData) {

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                if (tokenExpiresAt) {
                    localStorage.setItem('tokenExpiresAt', tokenExpiresAt);
                }
                setUser(userData);

                toast.success('✅ Login successful!', { duration: 2000 });
                return {
                    success: true,
                    user: userData,
                    token: token
                };
            } else {
                const errorMsg = responseData?.error || responseData?.message || 'Login failed';
                toast.error(`❌ ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            console.error('🔐 [AuthContext] Login error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Login failed';
            toast.error(`❌ ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (userData) => {
        setIsLoading(true);
        try {
            console.log('📝 [AuthContext] Registering user:', userData);

            const response = await authAPI.register(userData);
            console.log('📝 [AuthContext] Register response:', response);

            const responseData = response.data || response;
            const payload = responseData?.data || responseData;
            const token = payload?.token || responseData?.token;
            const userData = payload?.user || responseData?.user;
            const tokenExpiresAt = payload?.expiresAt || responseData?.expiresAt || (decodeJwtPayload(token)?.exp ? new Date(decodeJwtPayload(token).exp * 1000).toISOString() : null);

            if (responseData?.success !== false && token && userData) {

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                if (tokenExpiresAt) {
                    localStorage.setItem('tokenExpiresAt', tokenExpiresAt);
                }
                setUser(userData);

                toast.success('✅ Registration successful!', { duration: 2000 });
                return {
                    success: true,
                    user: userData,
                    token: token
                };
            } else {
                const errorMsg = responseData.error || responseData.message || 'Registration failed';
                toast.error(`❌ ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            console.error('📝 [AuthContext] Register error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Registration failed';
            toast.error(`❌ ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearStoredAuth();
        setUser(null);
        toast.success('Logged out successfully', { duration: 2000 });
        // Let components handle navigation via useEffect
    };

    const updateProfile = async (updates) => {
        try {
            const response = await authAPI.updateProfile(updates);
            const responseData = response.data || response;
            const payload = responseData?.data || responseData;

            if (responseData.success && payload) {
                setUser(payload);
                localStorage.setItem('user', JSON.stringify(payload));
                toast.success('✅ Profile updated successfully!', { duration: 2000 });
                return {
                    success: true,
                    user: payload
                };
            } else {
                const errorMsg = responseData.error || responseData.message || 'Failed to update profile';
                toast.error(`❌ ${errorMsg}`);
                return {
                    success: false,
                    error: errorMsg
                };
            }
        } catch (error) {
            console.error('📝 [AuthContext] Update profile error:', error);
            const errorMsg = error.response?.data?.error || error.message || 'Failed to update profile';
            toast.error(`❌ ${errorMsg}`);
            return {
                success: false,
                error: errorMsg
            };
        }
    };

    const value = {
        user,
        loading, // Initial loading state
        isLoading, // Login/register loading state
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isReviewer: user?.role === 'reviewer',
        isAgent: user?.role === 'agent',
    };

    console.log('🔄 AuthContext rendered:', {
        isAuthenticated: !!user,
        loading,
        isLoading,
        user: user?.email
    });

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
