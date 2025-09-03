
import React from 'react';

interface ClothingInputProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    disabled: boolean;
}

export const ClothingInput: React.FC<ClothingInputProps> = ({ value, onChange, disabled }) => {
    return (
        <div className="w-full">
            <label htmlFor="clothing-prompt" className="block text-sm font-medium text-gray-400 mb-2">
                Describe the new outfit. Be descriptive for best results!
            </label>
            <textarea
                id="clothing-prompt"
                rows={5}
                value={value}
                onChange={onChange}
                disabled={disabled}
                placeholder="e.g., 'a red silk dress with long sleeves', 'a blue denim jacket over a white t-shirt', 'a futuristic silver space suit'"
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none disabled:bg-gray-700 disabled:cursor-not-allowed"
            />
        </div>
    );
};
