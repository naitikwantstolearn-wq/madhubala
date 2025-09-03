
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { Spinner } from './components/Spinner';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AppState, MimeType } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateTryOnImage } from './services/geminiService';
import { ClothingInput } from './components/ClothingInput';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [clothingImages, setClothingImages] = useState<File[]>([]);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const [modelUploaderKey, setModelUploaderKey] = useState(Date.now());
  const [clothingUploaderKey, setClothingUploaderKey] = useState(Date.now() + 1);

  const handleModelImageUpload = useCallback((files: File[]) => {
    const file = files[0];
    if (file) {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }
      setModelImage(file);
      setOriginalImageUrl(URL.createObjectURL(file));
    }
  }, [originalImageUrl]);

  const handleClothingImageUpload = useCallback((files: File[]) => {
    setClothingImages(files);
  }, []);
  
  const handleGenerateClick = async () => {
    if (!modelImage || (clothingImages.length === 0 && !clothingDescription.trim())) {
      setError('Please upload a model image and provide either a clothing image or a description.');
      return;
    }

    setAppState(AppState.LOADING);
    setError(null);
    setGeneratedImageUrls([]);
    setProgress('Preparing images...');

    try {
      const modelMimeType = modelImage.type as MimeType;
      if (!['image/png', 'image/jpeg'].includes(modelMimeType)) {
        throw new Error('Please ensure the model file is a PNG or JPEG image.');
      }
      const modelBase64 = await fileToBase64(modelImage);
      const modelInput = { data: modelBase64, mimeType: modelMimeType };
      
      let results: string[] = [];

      if (clothingImages.length > 0) {
        // Batch mode with clothing images
        const generationPromises = clothingImages.map(async (clothingImage, index) => {
            setProgress(`Generating outfit ${index + 1} of ${clothingImages.length}...`);
            const clothingMimeType = clothingImage.type as MimeType;
            if (!['image/png', 'image/jpeg'].includes(clothingMimeType)) {
                console.warn(`Skipping invalid file type: ${clothingImage.name}`);
                return null;
            }
            const clothingBase64 = await fileToBase64(clothingImage);
            const clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
            return generateTryOnImage(modelInput, clothingInput, clothingDescription);
        });

        const settledResults = await Promise.allSettled(generationPromises);
        
        results = settledResults
          .filter(res => res.status === 'fulfilled' && res.value)
          .map(res => `data:image/png;base64,${(res as PromiseFulfilledResult<string>).value}`);

        const failures = settledResults.filter(res => res.status === 'rejected');
        if (failures.length > 0) {
          console.error(`${failures.length} generations failed.`, failures);
        }

      } else if (clothingDescription.trim()) {
        // Text-only mode
        setProgress('Generating outfit from description...');
        const resultBase64 = await generateTryOnImage(modelInput, null, clothingDescription);
        results.push(`data:image/png;base64,${resultBase64}`);
      }
      
      if (results.length === 0) {
        throw new Error("No images could be generated. Please check your inputs or the console for more details.");
      }

      setGeneratedImageUrls(results);
      setAppState(AppState.SUCCESS);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error(err);
      setError(`Generation failed: ${errorMessage}`);
      setAppState(AppState.ERROR);
    } finally {
        setProgress('');
    }
  };
  
  const handleGenerateVariation = async () => {
    if (!modelImage) return;

    setAppState(AppState.LOADING);
    setError(null);
    setProgress('Generating a new variation...');

    try {
        const modelMimeType = modelImage.type as MimeType;
        const modelBase64 = await fileToBase64(modelImage);
        const modelInput = { data: modelBase64, mimeType: modelMimeType };

        let clothingInput: { data: string; mimeType: MimeType } | null = null;
        if (clothingImages.length > 0) {
            const clothingImage = clothingImages[0];
            const clothingMimeType = clothingImage.type as MimeType;
            const clothingBase64 = await fileToBase64(clothingImage);
            clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
        }

        const resultBase64 = await generateTryOnImage(
            modelInput,
            clothingInput,
            clothingDescription,
            true // isVariation flag
        );
        setGeneratedImageUrls([`data:image/png;base64,${resultBase64}`]);
        setAppState(AppState.SUCCESS);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        console.error(err);
        setError(`Generation failed: ${errorMessage}`);
        setAppState(AppState.ERROR);
    } finally {
        setProgress('');
    }
  };


  const handleReset = () => {
    setAppState(AppState.IDLE);
    setModelImage(null);
    setClothingImages([]);
    setClothingDescription('');
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    setOriginalImageUrl('');
    setGeneratedImageUrls([]);
    setError(null);
    setProgress('');
    setModelUploaderKey(Date.now());
    setClothingUploaderKey(Date.now() + 1);
  };
  
  const handleTryAnotherOutfit = () => {
    setAppState(AppState.IDLE);
    setGeneratedImageUrls([]);
    setClothingImages([]);
    setClothingDescription('');
    setError(null);
    setProgress('');
    setClothingUploaderKey(Date.now());
  };

  const isGenerating = appState === AppState.LOADING;
  const canGenerate = modelImage && (clothingImages.length > 0 || clothingDescription.trim() !== '');

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
                <h2 className="text-xl font-semibold text-indigo-400">2. Provide Outfit(s)</h2>
                <p className="text-sm text-gray-400 -mt-4">Upload one or more images, write a description, or both!</p>
                <ImageUploader key={clothingUploaderKey} onImageUpload={handleClothingImageUpload} disabled={isGenerating} aspectClass="aspect-square" multiple />
                <ClothingInput value={clothingDescription} onChange={(e) => setClothingDescription(e.target.value)} disabled={isGenerating} />
              </div>
            </div>
            <div className="max-w-4xl mx-auto mt-8">
              <button
                onClick={handleGenerateClick}
                disabled={!canGenerate || isGenerating}
                className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50"
              >
                {isGenerating ? (
                  <>
                    <Spinner />
                    <span>{progress || 'Generating...'}</span>
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
            generatedImages={generatedImageUrls}
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
