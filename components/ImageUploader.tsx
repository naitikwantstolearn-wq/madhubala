
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (files: File[]) => void;
  disabled: boolean;
  aspectClass?: string;
  multiple?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled, aspectClass = 'aspect-[3/4]', multiple = false }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Clean up object URLs to prevent memory leaks
    return () => {
      previews.forEach(URL.revokeObjectURL);
    };
  }, [previews]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(file => 
        file.type === 'image/jpeg' || file.type === 'image/png'
      );
      
      if (validFiles.length !== files.length) {
        alert('Please upload valid image files (JPG or PNG). Invalid files were ignored.');
      }
      
      if (validFiles.length > 0) {
        previews.forEach(URL.revokeObjectURL); // Clean up old previews
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPreviews(newPreviews);
        onImageUpload(validFiles);
      }
    }
  }, [onImageUpload, previews]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  }, [disabled, handleFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  const renderContent = () => {
    if (previews.length === 1 && !multiple) {
        return (
            <div className="relative group">
                <img src={previews[0]} alt="Preview" className={`w-full h-auto rounded-lg object-cover ${aspectClass}`} />
                <div 
                    onClick={handleClick}
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg cursor-pointer"
                >
                    Click to change image
                </div>
            </div>
        )
    }
    
    if (previews.length > 0 && multiple) {
        return (
             <div
                onClick={handleClick}
                className={`w-full ${aspectClass} border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-center p-4 transition-colors duration-300 border-indigo-500 bg-gray-800/80 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
                <UploadIcon className="w-12 h-12 text-indigo-400 mb-2" />
                <p className="font-semibold text-white">{previews.length} image{previews.length > 1 ? 's' : ''} selected</p>
                <p className="text-xs text-gray-400">Click to change selection</p>
             </div>
        )
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
            className={`w-full ${aspectClass} border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-center p-4 transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-indigo-500'} ${disabled ? 'cursor-not-allowed bg-gray-800' : 'cursor-pointer bg-gray-900/50'}`}
        >
            <UploadIcon className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-gray-400">
            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG or JPG</p>
        </div>
    )
  }

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
        disabled={disabled}
        multiple={multiple}
      />
      {renderContent()}
    </div>
  );
};
