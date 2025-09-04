import React from 'react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage: string;
  generatedImage: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, originalImage, generatedImage }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-6xl p-6 relative overflow-y-auto max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close image viewer"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-gray-400">Original</h2>
            <img src={originalImage} alt="Original model" className="rounded-xl w-full h-auto object-contain max-h-[80vh]" />
          </div>
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfit</h2>
            <img src={generatedImage} alt="Generated with new outfit" className="rounded-xl w-full h-auto object-contain max-h-[80vh]" />
          </div>
        </div>
      </div>
    </div>
  );
};
