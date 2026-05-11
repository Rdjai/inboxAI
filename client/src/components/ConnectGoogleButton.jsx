// components/ConnectGoogleButton.jsx
import React from 'react';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { emailAccountsAPI } from '../services/api';

const ConnectGoogleButton = () => {
    const handleConnectGoogle = async () => {
        try {
            const response = await emailAccountsAPI.getGoogleOAuthUrl();
            const oauthUrl = response?.data?.url;
            if (!oauthUrl) {
                throw new Error('Unable to initialize Google OAuth');
            }
            window.location.href = oauthUrl;
        } catch (error) {
            toast.error(error.message || 'Failed to connect Gmail');
        }
    };

    return (
        <button
            onClick={handleConnectGoogle}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
        >
            <Mail className="h-5 w-5 mr-2" />
            Connect Your Gmail Account
        </button>
    );
};

export default ConnectGoogleButton;