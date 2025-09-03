import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AppState, MimeType } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateTryOnImage } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const [modelUploaderKey, setModelUploaderKey] = useState(Date.now());
  const [clothingUploaderKey, setClothingUploaderKey] = useState(Date.now() + 1);

  const handleModelImageUpload = useCallback((file: File) => {
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    setModelImage(file);
    setOriginalImageUrl(URL.createObjectURL(file));
  }, [originalImageUrl]);

  const handleClothingImageUpload = useCallback((file: File) => {
    setClothingImage(file);
  }, []);

  const handleGenerateClick = async () => {
    if (!modelImage || !clothingImage) {
      setError('Please upload a model image and a clothing image.');
      return;
    }

    setAppState(AppState.LOADING);
    setError(null);

    try {
      const modelMimeType = modelImage.type as MimeType;
      const clothingMimeType = clothingImage.type as MimeType;

      if (!['image/png', 'image/jpeg'].includes(modelMimeType) || !['image/png', 'image/jpeg'].includes(clothingMimeType)) {
        throw new Error('Please ensure both uploaded files are PNG or JPEG images.');
      }

      const modelBase64 = await fileToBase64(modelImage);
      const clothingBase64 = await fileToBase64(clothingImage);
      
      const resultBase64 = await generateTryOnImage(
        { data: modelBase64, mimeType: modelMimeType },
        { data: clothingBase64, mimeType: clothingMimeType }
      );
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
    setModelImage(null);
    setClothingImage(null);
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    setOriginalImageUrl('');
    setGeneratedImageUrl('');
    setError(null);
    setModelUploaderKey(Date.now());
    setClothingUploaderKey(Date.now() + 1);
  };
  
  const handleTryAnotherOutfit = () => {
    setAppState(AppState.IDLE);
    setGeneratedImageUrl('');
    setClothingImage(null);
    setError(null);
    setClothingUploaderKey(Date.now());
  };

  const isGenerating = appState === AppState.LOADING;

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {appState !== AppState.SUCCESS ? (
          <>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
                <h2 className="text-xl font-semibold text-indigo-400">1. Upload Model Image</h2>
                <ImageUploader key={modelUploaderKey} onImageUpload={handleModelImageUpload} disabled={isGenerating} aspectClass="aspect-[3/4]" />
              </div>
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
                <h2 className="text-xl font-semibold text-indigo-400">2. Upload Clothing Image</h2>
                <ImageUploader key={clothingUploaderKey} onImageUpload={handleClothingImageUpload} disabled={isGenerating} aspectClass="aspect-square" />
              </div>
            </div>
            <div className="max-w-4xl mx-auto mt-8">
              <button
                onClick={handleGenerateClick}
                disabled={!modelImage || !clothingImage || isGenerating}
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
          </>
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