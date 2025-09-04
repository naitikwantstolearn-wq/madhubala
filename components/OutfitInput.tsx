import React from 'react';
import { ImageUploader } from './ImageUploader';
import { ClothingInput } from './ClothingInput';
import { TrashIcon } from './icons/TrashIcon';

interface OutfitInputProps {
  outfit: { image: File | null; description: string };
  onImageChange: (files: File[]) => void;
  onDescriptionChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onRemove: () => void;
  isRemoveDisabled: boolean;
  disabled: boolean;
  uploaderKey: number;
}

export const OutfitInput: React.FC<OutfitInputProps> = ({
  outfit,
  onImageChange,
  onDescriptionChange,
  onRemove,
  isRemoveDisabled,
  disabled,
  uploaderKey,
}) => {
  return (
    <div className="p-4 border border-gray-700 rounded-xl relative bg-gray-900/30">
      {!isRemoveDisabled && (
        <button
          onClick={onRemove}
          disabled={disabled}
          className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 rounded-full p-1.5 z-10 disabled:bg-gray-600"
          aria-label="Remove outfit"
        >
          <TrashIcon className="w-4 h-4 text-white" />
        </button>
      )}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="w-full md:w-1/3">
          <ImageUploader
            key={uploaderKey}
            onImageUpload={onImageChange}
            disabled={disabled}
            aspectClass="aspect-square"
          />
        </div>
        <div className="w-full md:w-2/3">
          <ClothingInput
            value={outfit.description}
            onChange={onDescriptionChange}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};
