import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Globe, Database, Key } from 'lucide-react';

const Settings = () => {
    const [settings, setSettings] = useState({
        notifications: true,
        autoApprove: false,
        aiConfidence: 0.8,
        timezone: 'UTC',
        language: 'en',
    });

    const handleToggle = (key) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSliderChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const settingSections = [
        {
            title: 'General',
            icon: <SettingsIcon className="h-5 w-5" />,
            settings: [
                {
                    key: 'timezone',
                    label: 'Timezone',
                    type: 'select',
                    value: settings.timezone,
                    options: ['UTC', 'EST', 'PST', 'GMT', 'IST'],
                },
                {
                    key: 'language',
                    label: 'Language',
                    type: 'select',
                    value: settings.language,
                    options: ['en', 'es', 'fr', 'de', 'ja'],
                },
            ],
        },
        {
            title: 'Notifications',
            icon: <Bell className="h-5 w-5" />,
            settings: [
                {
                    key: 'notifications',
                    label: 'Email Notifications',
                    type: 'toggle',
                    value: settings.notifications,
                    description: 'Receive email notifications for important events',
                },
                {
                    key: 'autoApprove',
                    label: 'Auto-approve Low Risk',
                    type: 'toggle',
                    value: settings.autoApprove,
                    description: 'Automatically approve emails with high AI confidence',
                },
            ],
        },
        {
            title: 'AI Settings',
            icon: <Shield className="h-5 w-5" />,
            settings: [
                {
                    key: 'aiConfidence',
                    label: 'AI Confidence Threshold',
                    type: 'slider',
                    value: settings.aiConfidence,
                    min: 0.5,
                    max: 1,
                    step: 0.05,
                    description: 'Minimum confidence score for auto-classification',
                },
            ],
        },
        {
            title: 'Security',
            icon: <Key className="h-5 w-5" />,
            settings: [
                {
                    key: 'twoFactor',
                    label: 'Two-Factor Authentication',
                    type: 'toggle',
                    value: false,
                    description: 'Add an extra layer of security to your account',
                },
            ],
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-2">Configure your InboxAI preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Settings Navigation */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-6">
                        <nav className="space-y-2">
                            {settingSections.map((section) => (
                                <a
                                    key={section.title}
                                    href={`#${section.title.toLowerCase()}`}
                                    className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900"
                                >
                                    <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center">
                                        {section.icon}
                                    </div>
                                    <span className="font-medium">{section.title}</span>
                                </a>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Settings Content */}
                <div className="lg:col-span-2 space-y-6">
                    {settingSections.map((section) => (
                        <div key={section.title} id={section.title.toLowerCase()} className="card">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    {section.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{section.title}</h2>
                                    <p className="text-gray-600">Configure {section.title.toLowerCase()} settings</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {section.settings.map((setting) => (
                                    <div key={setting.key} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="font-medium text-gray-900">
                                                    {setting.label}
                                                </label>
                                                {setting.type === 'slider' && (
                                                    <span className="text-primary-600 font-medium">
                                                        {(setting.value * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                            {setting.description && (
                                                <p className="text-sm text-gray-500 mb-3">
                                                    {setting.description}
                                                </p>
                                            )}

                                            {setting.type === 'toggle' && (
                                                <button
                                                    onClick={() => handleToggle(setting.key)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full ${setting.value ? 'bg-primary-600' : 'bg-gray-300'
                                                        }`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${setting.value ? 'translate-x-6' : 'translate-x-1'
                                                        }`} />
                                                </button>
                                            )}

                                            {setting.type === 'select' && (
                                                <select
                                                    value={setting.value}
                                                    onChange={(e) => handleSliderChange(setting.key, e.target.value)}
                                                    className="select-field max-w-xs"
                                                >
                                                    {setting.options.map((option) => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            {setting.type === 'slider' && (
                                                <div className="max-w-xs">
                                                    <input
                                                        type="range"
                                                        min={setting.min}
                                                        max={setting.max}
                                                        step={setting.step}
                                                        value={setting.value}
                                                        onChange={(e) => handleSliderChange(setting.key, parseFloat(e.target.value))}
                                                        className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                                                    />
                                                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                        <span>Low</span>
                                                        <span>High</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Danger Zone */}
                    <div className="card border-2 border-red-200">
                        <div className="flex items-center space-x-3 mb-6">
                            <div className="h-10 w-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <Database className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-red-800">Danger Zone</h2>
                                <p className="text-red-600">Irreversible and destructive actions</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-red-800">Delete All Data</h4>
                                    <p className="text-sm text-red-600 mt-1">
                                        Permanently delete all emails and settings
                                    </p>
                                </div>
                                <button className="btn-danger">
                                    Delete All
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                <div>
                                    <h4 className="font-medium text-red-800">Deactivate Account</h4>
                                    <p className="text-sm text-red-600 mt-1">
                                        Temporarily deactivate your account
                                    </p>
                                </div>
                                <button className="btn-danger">
                                    Deactivate
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;