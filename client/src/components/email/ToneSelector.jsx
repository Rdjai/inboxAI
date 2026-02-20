import React from 'react';
import { Sparkles } from 'lucide-react';

const TONES = [
    {
        id: 'formal',
        label: 'Formal',
        description: 'Professional and respectful',
        icon: '👔',
        color: 'blue'
    },
    {
        id: 'casual',
        label: 'Casual',
        description: 'Friendly and relaxed',
        icon: '😊',
        color: 'green'
    },
    {
        id: 'professional',
        label: 'Professional',
        description: 'Business-appropriate',
        icon: '💼',
        color: 'purple'
    }
];

const ToneSelector = ({ selectedTone, onToneChange, onApplyTone, isApplying = false }) => {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                    Reply Tone
                </label>
                {selectedTone && (
                    <button
                        onClick={onApplyTone}
                        disabled={isApplying}
                        className="flex items-center space-x-1 px-3 py-1 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                    >
                        <Sparkles className="h-3 w-3" />
                        <span>{isApplying ? 'Applying...' : 'Apply Tone'}</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {TONES.map((tone) => (
                    <button
                        key={tone.id}
                        type="button"
                        onClick={() => onToneChange(tone.id)}
                        className={`
                            relative p-4 rounded-lg border-2 transition-all
                            ${selectedTone === tone.id
                                ? `border-${tone.color}-500 bg-${tone.color}-50 shadow-md`
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }
                        `}
                    >
                        <div className="flex flex-col items-center space-y-2">
                            <span className="text-2xl">{tone.icon}</span>
                            <div className="text-center">
                                <p className={`font-semibold text-sm ${selectedTone === tone.id ? `text-${tone.color}-700` : 'text-gray-900'
                                    }`}>
                                    {tone.label}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {tone.description}
                                </p>
                            </div>
                        </div>
                        {selectedTone === tone.id && (
                            <div className={`absolute top-2 right-2 h-5 w-5 bg-${tone.color}-500 rounded-full flex items-center justify-center`}>
                                <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {selectedTone && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                        <span className="font-semibold">Selected:</span> {TONES.find(t => t.id === selectedTone)?.label} tone
                        {onApplyTone && ' - Click "Apply Tone" to adjust your message'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ToneSelector;
