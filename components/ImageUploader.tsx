
import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null | undefined) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setImagePreview(URL.createObjectURL(file));
      onImageUpload(file);
    } else {
      // Basic error handling for non-image files
      alert('Please upload a valid image file (JPG or PNG).');
    }
  }, [onImageUpload]);

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
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, [disabled, handleFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
        disabled={disabled}
      />
      {imagePreview ? (
        <div className="relative group">
          <img src={imagePreview} alt="Model preview" className="w-full h-auto rounded-lg object-cover aspect-[3/4]" />
          <div 
            onClick={handleClick}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg cursor-pointer">
            Click to change image
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`w-full aspect-[3/4] border-2 border-dashed rounded-lg flex flex-col justify-center items-center text-center p-4 transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-indigo-500'} ${disabled ? 'cursor-not-allowed bg-gray-800' : 'cursor-pointer bg-gray-900/50'}`}
        >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-2" />
          <p className="text-gray-400">
            <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">PNG or JPG</p>
        </div>
      )}
    </div>
  );
};
