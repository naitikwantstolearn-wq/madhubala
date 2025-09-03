
import React from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface ResultDisplayProps {
  originalImage: string;
  generatedImages: string[];
  onTryAnother: () => void;
  onGenerateVariation: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImage, generatedImages, onTryAnother, onGenerateVariation }) => {
  
  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtual-try-on-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
    
  const isBatchResult = generatedImages.length > 1;

  if (isBatchResult) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-400 sticky top-24">Original</h2>
            <img src={originalImage} alt="Original model" className="rounded-xl shadow-2xl w-full object-contain sticky top-36" />
          </div>
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfits ({generatedImages.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {generatedImages.map((image, index) => (
                <div key={index} className="relative group flex flex-col items-center gap-3">
                  <img src={image} alt={`Generated outfit ${index + 1}`} className="rounded-xl shadow-2xl w-full object-contain" />
                  <button
                    onClick={() => handleDownload(image, index)}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
                  >
                    <DownloadIcon />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 flex items-center justify-center">
            <button
              onClick={onTryAnother}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50"
            >
              Try Another Outfit
            </button>
        </div>
      </div>
    );
  }

  // Single result view
  const singleGeneratedImage = generatedImages[0];
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-400">Original</h2>
          <img src={originalImage} alt="Original model" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfit</h2>
          <img src={singleGeneratedImage} alt="Generated with new outfit" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
      </div>
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => handleDownload(singleGeneratedImage, 0)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
        >
          <DownloadIcon />
          Download Image
        </button>
        <button
          onClick={onGenerateVariation}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
        >
          <RefreshIcon />
          Generate Variation
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
