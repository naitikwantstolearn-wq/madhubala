
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ProgressBar } from './components/ProgressBar';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AppState, MimeType } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateTryOnImage } from './services/geminiService';
import { ClothingInput } from './components/ClothingInput';

const ESTIMATED_GENERATION_TIME_SECONDS = 45;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelImages, setModelImages] = useState<File[]>([]);
  const [clothingImage, setClothingImage] = useState<File | null>(null);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const progressIntervalRef = useRef<number | null>(null);

  const [modelUploaderKey, setModelUploaderKey] = useState(Date.now());
  const [clothingUploaderKey, setClothingUploaderKey] = useState(Date.now() + 1);

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearProgressInterval();
      originalImageUrls.forEach(URL.revokeObjectURL);
    }
  }, [originalImageUrls]);

  const handleModelImageUpload = useCallback((files: File[]) => {
    originalImageUrls.forEach(URL.revokeObjectURL);
    setModelImages(files);
    setOriginalImageUrls(files.map(file => URL.createObjectURL(file)));
  }, [originalImageUrls]);

  const handleClothingImageUpload = useCallback((files: File[]) => {
    setClothingImage(files[0] || null);
  }, []);
  
  const handleGenerateClick = async () => {
    if (modelImages.length === 0 || (!clothingImage && !clothingDescription.trim())) {
      setError('Please upload at least one model image and provide either a clothing image or a description.');
      return;
    }

    setAppState(AppState.LOADING);
    setError(null);
    setGeneratedImageUrls([]);
    setProgress(0);

    // Start progress timer
    const totalSteps = ESTIMATED_GENERATION_TIME_SECONDS * 10;
    let currentStep = 0;
    progressIntervalRef.current = window.setInterval(() => {
        currentStep++;
        const newProgress = Math.min(99, Math.round((currentStep / totalSteps) * 100));
        setProgress(newProgress);
    }, 100);

    try {
        let clothingInput: { data: string; mimeType: MimeType } | null = null;
        if (clothingImage) {
            const clothingMimeType = clothingImage.type as MimeType;
            if (!['image/png', 'image/jpeg'].includes(clothingMimeType)) {
                 throw new Error('Please ensure the clothing file is a PNG or JPEG image.');
            }
            const clothingBase64 = await fileToBase64(clothingImage);
            clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
        }

        const generationPromises = modelImages.map(async (modelImg, index) => {
            setProgressMessage(`Processing model ${index + 1} of ${modelImages.length}...`);
            const modelMimeType = modelImg.type as MimeType;
            if (!['image/png', 'image/jpeg'].includes(modelMimeType)) {
                console.warn(`Skipping invalid model file type: ${modelImg.name}`);
                return null;
            }
            const modelBase64 = await fileToBase64(modelImg);
            const modelInput = { data: modelBase64, mimeType: modelMimeType };
            return generateTryOnImage(modelInput, clothingInput, clothingDescription);
        });

        const settledResults = await Promise.allSettled(generationPromises);
        
        const results = settledResults
          .filter(res => res.status === 'fulfilled' && res.value)
          .map(res => `data:image/png;base64,${(res as PromiseFulfilledResult<string>).value}`);

        if (results.length === 0) {
            throw new Error("No images could be generated. Please check your inputs or the console for details.");
        }

        setGeneratedImageUrls(results);
        setAppState(AppState.SUCCESS);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(`Generation failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    } finally {
        clearProgressInterval();
        setProgress(100);
        setProgressMessage('');
    }
  };
  
  const handleGenerateVariation = async (variationPrompt: string) => {
    if (modelImages.length !== 1) return;

    setAppState(AppState.LOADING);
    setError(null);
    setProgress(0);
    setProgressMessage('Generating a new variation...');

    const totalSteps = ESTIMATED_GENERATION_TIME_SECONDS * 10;
    let currentStep = 0;
    progressIntervalRef.current = window.setInterval(() => {
        currentStep++;
        const newProgress = Math.min(99, Math.round((currentStep / totalSteps) * 100));
        setProgress(newProgress);
    }, 100);
    
    try {
        const modelImage = modelImages[0];
        const modelMimeType = modelImage.type as MimeType;
        const modelBase64 = await fileToBase64(modelImage);
        const modelInput = { data: modelBase64, mimeType: modelMimeType };

        let clothingInput: { data: string; mimeType: MimeType } | null = null;
        if (clothingImage) {
            const clothingMimeType = clothingImage.type as MimeType;
            const clothingBase64 = await fileToBase64(clothingImage);
            clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
        }
        
        const resultBase64 = await generateTryOnImage(
            modelInput,
            clothingInput,
            variationPrompt, // Use the new prompt from user
            true // isVariation flag
        );
        setGeneratedImageUrls([`data:image/png;base64,${resultBase64}`]);
        setClothingDescription(variationPrompt); // Update description to the new one
        setAppState(AppState.SUCCESS);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error(err);
        setError(`Generation failed: ${errorMessage}`);
        setAppState(AppState.ERROR);
    } finally {
        clearProgressInterval();
        setProgress(100);
        setProgressMessage('');
    }
  };


  const handleReset = () => {
    setAppState(AppState.IDLE);
    setModelImages([]);
    setClothingImage(null);
    setClothingDescription('');
    originalImageUrls.forEach(URL.revokeObjectURL);
    setOriginalImageUrls([]);
    setGeneratedImageUrls([]);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setModelUploaderKey(Date.now());
    setClothingUploaderKey(Date.now() + 1);
  };
  
  const handleTryAnotherOutfit = () => {
    setAppState(AppState.IDLE);
    // Keep the model images
    setGeneratedImageUrls([]);
    setClothingImage(null);
    setClothingDescription('');
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setClothingUploaderKey(Date.now());
  };

  const isGenerating = appState === AppState.LOADING;
  const canGenerate = modelImages.length > 0 && (clothingImage || clothingDescription.trim() !== '');

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {appState !== AppState.SUCCESS ? (
          <>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
                <h2 className="text-xl font-semibold text-indigo-400">1. Upload Model(s)</h2>
                <ImageUploader key={modelUploaderKey} onImageUpload={handleModelImageUpload} disabled={isGenerating} aspectClass="aspect-[3/4]" multiple />
              </div>
              <div className="flex flex-col gap-6 p-6 bg-gray-800/50 rounded-2xl shadow-xl">
                <h2 className="text-xl font-semibold text-indigo-400">2. Provide Outfit</h2>
                <p className="text-sm text-gray-400 -mt-4">Upload an image, write a description, or both!</p>
                <ImageUploader key={clothingUploaderKey} onImageUpload={handleClothingImageUpload} disabled={isGenerating} aspectClass="aspect-square" />
                <ClothingInput value={clothingDescription} onChange={(e) => setClothingDescription(e.target.value)} disabled={isGenerating} />
              </div>
            </div>
            <div className="max-w-4xl mx-auto mt-8">
              {isGenerating ? (
                 <ProgressBar 
                    progress={progress} 
                    message={progressMessage} 
                    duration={ESTIMATED_GENERATION_TIME_SECONDS}
                 />
              ) : (
                <button
                  onClick={handleGenerateClick}
                  disabled={!canGenerate || isGenerating}
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
                >
                    <SparklesIcon />
                    <span>Generate New Outfit{modelImages.length > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <ResultDisplay
            originalImages={originalImageUrls}
            generatedImages={generatedImageUrls}
            clothingDescription={clothingDescription}
            onTryAnother={handleTryAnotherOutfit}
            onGenerateVariation={handleGenerateVariation}
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
