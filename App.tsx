
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ClothingInput } from './components/ClothingInput';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AppState, MimeType } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateTryOnImage } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [clothingPrompt, setClothingPrompt] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleModelImageUpload = useCallback((file: File) => {
    setModelImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
  }, []);

  const handleGenerateClick = async () => {
    if (!modelImage || !clothingPrompt) {
      setError('Please upload a model image and describe the clothing.');
      return;
    }

    setAppState(AppState.LOADING);
    setError(null);

    try {
      const mimeType = modelImage.type as MimeType;
      if (mimeType !== 'image/png' && mimeType !== 'image/jpeg') {
        throw new Error('Please upload a PNG or JPEG image.');
      }
      const base64Image = await fileToBase64(modelImage);
      
      const resultBase64 = await generateTryOnImage(base64Image, mimeType, clothingPrompt);
      setGeneratedImageUrl(`data:image/png;base64,${resultBase64}`);
      setAppState(AppState.SUCCESS);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(`Generation failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setGeneratedImageUrl('');
    setClothingPrompt('');
    setError(null);
  };
  
  const handleTryAnotherOutfit = () => {
    setAppState(AppState.IDLE);
    setGeneratedImageUrl('');
    setClothingPrompt('');
    setError(null);
  };

  const isGenerating = appState === AppState.LOADING;

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {appState !== AppState.SUCCESS ? (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold text-indigo-400">1. Upload Model Image</h2>
              <ImageUploader onImageUpload={handleModelImageUpload} disabled={isGenerating} />
            </div>
            <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
              <h2 className="text-xl font-semibold text-indigo-400">2. Describe Clothing</h2>
              <ClothingInput 
                value={clothingPrompt} 
                onChange={(e) => setClothingPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerateClick}
                disabled={!modelImage || !clothingPrompt || isGenerating}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
              >
                {isGenerating ? (
                  <>
                    <Spinner />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon />
                    <span>Generate New Outfit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <ResultDisplay
            originalImage={originalImageUrl}
            generatedImage={generatedImageUrl}
            onTryAnother={handleTryAnotherOutfit}
          />
        )}
        {error && (
            <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
                <p>{error}</p>
                <button onClick={handleReset} className="mt-2 text-sm font-semibold underline hover:text-white">
                  Start Over
                </button>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
