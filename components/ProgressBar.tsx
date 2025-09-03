
import React, { useState, useEffect } from 'react';

interface ProgressBarProps {
    progress: number;
    message: string;
    duration: number; // in seconds
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message, duration }) => {
    const [timeLeft, setTimeLeft] = useState(duration);

    useEffect(() => {
        if (progress < 100) {
            const newTimeLeft = Math.round(duration * (1 - progress / 100));
            setTimeLeft(newTimeLeft);
        } else {
            setTimeLeft(0);
        }
    }, [progress, duration]);

    return (
        <div className="w-full bg-gray-700 rounded-full p-1.5 shadow-inner">
            <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-8 rounded-full transition-all duration-300 ease-out flex items-center justify-center"
                style={{ width: `${Math.max(5, progress)}%` }}
            >
                <span className="text-sm font-bold text-white shadow-sm">
                    {progress < 100 ? `${progress}%` : 'Complete!'}
                </span>
            </div>
            <div className="text-center text-sm text-gray-300 mt-2">
                <p>{message || (progress < 100 ? 'Generating...' : 'Finished!')}</p>
                {progress > 0 && progress < 100 && (
                     <p className="text-xs text-gray-400">Estimated time remaining: ~{timeLeft}s</p>
                )}
            </div>
        </div>
    );
};
