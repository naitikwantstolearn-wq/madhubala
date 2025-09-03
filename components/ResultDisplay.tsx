
import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface ResultDisplayProps {
  originalImages: string[];
  generatedImages: string[];
  clothingDescription: string;
  onTryAnother: () => void;
  onGenerateVariation: (prompt: string) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ originalImages, generatedImages, clothingDescription, onTryAnother, onGenerateVariation }) => {
  const [showVariationInput, setShowVariationInput] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState(clothingDescription);

  useEffect(() => {
    // If the core description changes (e.g. after a variation is generated), update the local prompt
    setVariationPrompt(clothingDescription);
  }, [clothingDescription]);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtual-try-on-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVariationClick = () => {
    setShowVariationInput(!showVariationInput);
  };
  
  const handleVariationSubmit = () => {
    if (variationPrompt.trim()) {
      onGenerateVariation(variationPrompt);
    }
  };

  const isBatchResult = generatedImages.length > 1;

  if (isBatchResult) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Generated Outfits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {generatedImages.map((generatedImg, index) => (
                <div key={index} className="flex flex-col gap-4 p-4 bg-gray-800/50 rounded-2xl shadow-xl">
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                           <h3 className="text-sm font-semibold text-gray-400 mb-2 text-center">Original</h3>
                           <img src={originalImages[index]} alt={`Original model ${index + 1}`} className="rounded-xl w-full object-contain" />
                       </div>
                        <div>
                           <h3 className="text-sm font-semibold text-indigo-400 mb-2 text-center">New Outfit</h3>
                           <img src={generatedImg} alt={`Generated outfit ${index + 1}`} className="rounded-xl w-full object-contain" />
                       </div>
                    </div>
                    <button
                        onClick={() => handleDownload(generatedImg, index)}
                        className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
                    >
                        <DownloadIcon />
                        Download
                    </button>
                </div>
            ))}
        </div>
        <div className="mt-12 flex items-center justify-center">
            <button
              onClick={onTryAnother}
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50"
            >
              Try Another Outfit on These Models
            </button>
        </div>
      </div>
    );
  }

  // Single result view
  const singleGeneratedImage = generatedImages[0];
  const singleOriginalImage = originalImages[0];
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-400">Original</h2>
          <img src={singleOriginalImage} alt="Original model" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfit</h2>
          <img src={singleGeneratedImage} alt="Generated with new outfit" className="rounded-xl shadow-2xl w-full object-contain" />
        </div>
      </div>
      
      {showVariationInput && (
        <div className="max-w-2xl mx-auto my-8 p-4 bg-gray-800/50 rounded-xl animate-fade-in">
          <label htmlFor="variation-prompt" className="block text-sm font-medium text-indigo-400 mb-2">
            Describe the variation you want to see:
          </label>
          <textarea
            id="variation-prompt"
            rows={3}
            value={variationPrompt}
            onChange={(e) => setVariationPrompt(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200 resize-none"
            placeholder="e.g., 'Same dress, but make it blue', 'Change the jacket to leather'"
          />
          <button
            onClick={handleVariationSubmit}
            disabled={!variationPrompt.trim()}
            className="flex mt-3 items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
          >
            <SparklesIcon />
            Generate Now
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
        <button
          onClick={() => handleDownload(singleGeneratedImage, 0)}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
        >
          <DownloadIcon />
          Download Image
        </button>
        <button
          onClick={handleVariationClick}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
        >
          <RefreshIcon />
          {showVariationInput ? 'Cancel Variation' : 'Generate Variation'}
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
