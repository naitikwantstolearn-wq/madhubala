
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  originalImage: string;
  generatedImage: string;
  onTryAnother: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, generatedImage, onTryAnother }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = 'ai-fashion-try-on.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-400">Original</h2>
          <img src={originalImage} alt="Original model" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfit</h2>
          <img src={generatedImage} alt="Generated with new outfit" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
      </div>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
        >
          <DownloadIcon />
          Download Image
        </button>
        <button
          onClick={onTryAnother}
          className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50"
        >
          Try Another Outfit
        </button>
      </div>
    </div>
  );
};
