import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './icons/DownloadIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { HdIcon } from './icons/HdIcon';
import { Spinner } from './Spinner';
import { MagnifyingGlassIcon } from './icons/MagnifyingGlassIcon';
import { ImageModal } from './ImageModal';

interface ResultDisplayProps {
  originalImages: string[];
  generatedImages: string[];
  clothingDescription: string;
  onTryAnother: () => void;
  onGenerateVariation: (prompt: string) => void;
  onUpscale: (index: number) => Promise<void>;
  upscalingStatus: { [key: number]: boolean };
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
    originalImages, 
    generatedImages, 
    clothingDescription, 
    onTryAnother, 
    onGenerateVariation,
    onUpscale,
    upscalingStatus
}) => {
  const [showVariationInput, setShowVariationInput] = useState(false);
  const [variationPrompt, setVariationPrompt] = useState(clothingDescription);
  const [upscaledIndices, setUpscaledIndices] = useState<Set<number>>(new Set());
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  useEffect(() => {
    // If the core description changes (e.g. after a variation is generated), update the local prompt
    setVariationPrompt(clothingDescription);
    // Reset upscaled status if a variation is generated
    setUpscaledIndices(new Set());
  }, [clothingDescription, generatedImages]);

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtual-try-on-${index + 1}${upscaledIndices.has(index) ? '-HD' : ''}.png`;
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
      setShowVariationInput(false);
    }
  };

  const handleUpscaleClick = async (index: number) => {
    await onUpscale(index);
    setUpscaledIndices(prev => new Set(prev).add(index));
  };
  
  const handleCloseModal = () => {
    setViewingIndex(null);
  };

  const isBatchResult = generatedImages.length > 1;

  return (
    <>
      {isBatchResult ? (
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Generated Outfits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {generatedImages.map((generatedImg, index) => {
                  const isUpscaling = upscalingStatus[index];
                  const isUpscaled = upscaledIndices.has(index);
                  return (
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
                          <div className="grid grid-cols-3 items-center gap-2 text-sm">
                              <button
                                  onClick={() => setViewingIndex(index)}
                                  className="flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50"
                              >
                                  <MagnifyingGlassIcon className="w-5 h-5" />
                                  View
                              </button>
                              <button
                                  onClick={() => handleDownload(generatedImg, index)}
                                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
                              >
                                  <DownloadIcon className="w-5 h-5" />
                                  Save
                              </button>
                              <button
                                  onClick={() => handleUpscaleClick(index)}
                                  disabled={isUpscaling || isUpscaled}
                                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-3 rounded-lg"
                              >
                                  {isUpscaling ? <Spinner /> : <HdIcon className="w-5 h-5" />}
                                  {isUpscaling ? '' : isUpscaled ? 'HD ✓' : 'To HD'}
                              </button>
                          </div>
                      </div>
                  );
              })}
          </div>
          <div className="mt-12 flex items-center justify-center">
              <button
                onClick={onTryAnother}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50"
              >
                Try Another Outfit on These Models
              </button>
          </div>
        </div>
      ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-400">Original</h2>
                <img src={originalImages[0]} alt="Original model" className="rounded-xl shadow-2xl w-full object-contain" />
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">New Outfit</h2>
                <img src={generatedImages[0]} alt="Generated with new outfit" className="rounded-xl shadow-2xl w-full object-contain" />
              </div>
            </div>
            
            {showVariationInput && (
              <div className="max-w-2xl mx-auto my-8 p-4 bg-gray-800/50 rounded-xl">
                <label htmlFor="variation-prompt" className="block text-sm font-medium text-indigo-400 mb-2">
                  Describe the variation you want to see:
                </label>
                <textarea
                  id="variation-prompt"
                  rows={3}
                  value={variationPrompt}
                  onChange={(e) => setVariationPrompt(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="e.g., 'Same dress, but make it blue', 'Change the jacket to leather'"
                />
                <button
                  onClick={handleVariationSubmit}
                  disabled={!variationPrompt.trim()}
                  className="flex mt-3 items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                >
                  <SparklesIcon />
                  Generate Now
                </button>
              </div>
            )}

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setViewingIndex(0)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50"
              >
                <MagnifyingGlassIcon />
                View Details
              </button>
              <button
                onClick={() => handleDownload(generatedImages[0], 0)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50"
              >
                <DownloadIcon />
                Download Image
              </button>
              <button
                onClick={() => handleUpscaleClick(0)}
                disabled={upscalingStatus[0] || upscaledIndices.has(0)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                {upscalingStatus[0] ? <Spinner /> : <HdIcon />}
                {upscalingStatus[0] ? 'Upscaling...' : (upscaledIndices.has(0) ? 'Upscaled ✓' : 'Upscale to HD')}
              </button>
              <button
                onClick={handleVariationClick}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
              >
                <RefreshIcon />
                {showVariationInput ? 'Cancel Variation' : 'Generate Variation'}
              </button>
              <button
                onClick={onTryAnother}
                className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-gray-500/50"
              >
                Try Another Outfit
              </button>
            </div>
          </div>
      )}
      <ImageModal
        isOpen={viewingIndex !== null}
        onClose={handleCloseModal}
        originalImage={viewingIndex !== null ? originalImages[viewingIndex] : ''}
        generatedImage={viewingIndex !== null ? generatedImages[viewingIndex] : ''}
      />
    </>
  );
};
