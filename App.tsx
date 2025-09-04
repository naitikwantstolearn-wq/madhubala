import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { ProgressBar } from './components/ProgressBar';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { AppState, MimeType } from './types';
import { fileToBase64 } from './utils/fileUtils';
import { generateTryOnImage, upscaleImage } from './services/geminiService';
import { OutfitInput } from './components/OutfitInput';
import { PlusIcon } from './components/icons/PlusIcon';

const ESTIMATED_GENERATION_TIME_SECONDS = 45;

type Outfit = {
  image: File | null;
  description: string;
  key: number;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [modelImages, setModelImages] = useState<File[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([{ image: null, description: '', key: Date.now() }]);
  
  // This state is used to pass the last active clothing description to the result screen for the variation prompt default.
  const [activeClothingDescription, setActiveClothingDescription] = useState<string>('');
  
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [generatedImageUrls, setGeneratedImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const progressIntervalRef = useRef<number | null>(null);

  const [modelUploaderKey, setModelUploaderKey] = useState(Date.now());
  const [upscalingStatus, setUpscalingStatus] = useState<{ [key: number]: boolean }>({});

  const clearProgressInterval = () => {
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearProgressInterval();
      const uniqueUrls = [...new Set(originalImageUrls)];
      uniqueUrls.forEach(URL.revokeObjectURL);
    }
  }, [originalImageUrls]);

  const handleModelImageUpload = useCallback((files: File[]) => {
    const uniqueUrls = [...new Set(originalImageUrls)];
    uniqueUrls.forEach(URL.revokeObjectURL);
    setModelImages(files);
    // This state is for cleanup only. The display URLs are generated on-demand.
    setOriginalImageUrls(files.map(file => URL.createObjectURL(file)));
  }, [originalImageUrls]);

  const handleAddOutfit = () => {
    setOutfits(prev => [...prev, { image: null, description: '', key: Date.now() }]);
  };

  const handleRemoveOutfit = (index: number) => {
      setOutfits(prev => prev.filter((_, i) => i !== index));
  };

  const handleOutfitImageChange = (index: number, files: File[]) => {
      setOutfits(prev => {
          const newOutfits = [...prev];
          newOutfits[index] = { ...newOutfits[index], image: files[0] || null };
          return newOutfits;
      });
  };

  const handleOutfitDescriptionChange = (index: number, value: string) => {
      setOutfits(prev => {
          const newOutfits = [...prev];
          newOutfits[index] = { ...newOutfits[index], description: value };
          return newOutfits;
      });
  };

  const handleGenerateClick = async () => {
    if (modelImages.length === 0 || !outfits.some(o => o.image || o.description.trim())) {
      setError('Please upload at least one model image and provide at least one outfit (image or description).');
      return;
    }

    setAppState(AppState.LOADING);
    setError(null);
    setGeneratedImageUrls([]);
    setProgress(0);

    const generationJobs: { modelImg: File; modelImgUrl: string; outfit: Outfit }[] = [];
    const modelImageUrls = modelImages.map(file => URL.createObjectURL(file));

    modelImages.forEach((modelImg, i) => {
      for (const outfit of outfits) {
        if (outfit.image || outfit.description.trim()) {
          generationJobs.push({ modelImg, modelImgUrl: modelImageUrls[i], outfit });
        }
      }
    });

    if (generationJobs.length === 0) {
      setError('Please provide at least one valid outfit (image or description).');
      setAppState(AppState.IDLE);
      modelImageUrls.forEach(URL.revokeObjectURL);
      return;
    }

    setProgressMessage(`Preparing ${generationJobs.length} generation job(s)...`);
    
    // Start progress timer
    const totalSteps = ESTIMATED_GENERATION_TIME_SECONDS * 10;
    let currentStep = 0;
    progressIntervalRef.current = window.setInterval(() => {
        currentStep++;
        const newProgress = Math.min(99, Math.round((currentStep / totalSteps) * 100));
        setProgress(newProgress);
    }, 100);

    try {
      const generationPromises = generationJobs.map(async (job) => {
          let clothingInput: { data: string; mimeType: MimeType } | null = null;
          if (job.outfit.image) {
              const clothingMimeType = job.outfit.image.type as MimeType;
              if (!['image/png', 'image/jpeg'].includes(clothingMimeType)) {
                   throw new Error('Please ensure clothing files are PNG or JPEG images.');
              }
              const clothingBase64 = await fileToBase64(job.outfit.image);
              clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
          }

          const modelMimeType = job.modelImg.type as MimeType;
          if (!['image/png', 'image/jpeg'].includes(modelMimeType)) {
              console.warn(`Skipping invalid model file type: ${job.modelImg.name}`);
              return null;
          }
          const modelBase64 = await fileToBase64(job.modelImg);
          const modelInput = { data: modelBase64, mimeType: modelMimeType };
          return generateTryOnImage(modelInput, clothingInput, job.outfit.description);
      });

      setProgressMessage(`Generating ${generationJobs.length} new image${generationJobs.length > 1 ? 's' : ''}...`);
      const settledResults = await Promise.allSettled(generationPromises);
      
      const successfulResults = settledResults
        .map((res, index) => ({ res, job: generationJobs[index] }))
        .filter(({ res }) => res.status === 'fulfilled' && res.value);
        
      if (successfulResults.length === 0) {
          throw new Error("No images could be generated. Please check your inputs or the console for details.");
      }
      
      const finalGeneratedUrls = successfulResults.map(({ res }) => `data:image/png;base64,${(res as PromiseFulfilledResult<string>).value}`);
      const finalOriginalUrlsForDisplay = successfulResults.map(({ job }) => job.modelImgUrl);
      const successfulDescriptions = successfulResults.map(({ job }) => job.outfit.description);

      setGeneratedImageUrls(finalGeneratedUrls);
      setOriginalImageUrls(finalOriginalUrlsForDisplay);
      if(successfulDescriptions.length > 0) {
        setActiveClothingDescription(successfulDescriptions[0]);
      }
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
        // We already created the URLs for display, now we revoke the temporary ones.
        // The ones for display will be revoked on component unmount or next upload.
        modelImageUrls.forEach(URL.revokeObjectURL);
    }
  };
  
  const handleGenerateVariation = async (variationPrompt: string) => {
    if (modelImages.length !== 1 || outfits.length === 0) return;

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
        const firstOutfit = outfits[0];
        if (firstOutfit.image) {
            const clothingMimeType = firstOutfit.image.type as MimeType;
            const clothingBase64 = await fileToBase64(firstOutfit.image);
            clothingInput = { data: clothingBase64, mimeType: clothingMimeType };
        }
        
        const resultBase64 = await generateTryOnImage(
            modelInput,
            clothingInput,
            variationPrompt, // Use the new prompt from user
            true // isVariation flag
        );
        setGeneratedImageUrls([`data:image/png;base64,${resultBase64}`]);
        // Update description to the new one
        setActiveClothingDescription(variationPrompt); 
        setOutfits(prev => {
            const newOutfits = [...prev];
            if (newOutfits[0]) {
              newOutfits[0] = { ...newOutfits[0], description: variationPrompt };
            }
            return newOutfits;
        });
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

  const handleUpscaleImage = async (imageIndex: number) => {
    setUpscalingStatus(prev => ({ ...prev, [imageIndex]: true }));
    setError(null);

    try {
      const imageUrl = generatedImageUrls[imageIndex];
      const [header, base64Data] = imageUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] as MimeType | undefined;

      if (!base64Data || !mimeType || !['image/png', 'image/jpeg'].includes(mimeType)) {
        throw new Error('Could not parse image data for upscaling.');
      }

      const upscaledBase64 = await upscaleImage(base64Data, mimeType);
      const newImageUrl = `data:image/png;base64,${upscaledBase64}`;

      setGeneratedImageUrls(prevUrls => {
        const newUrls = [...prevUrls];
        newUrls[imageIndex] = newImageUrl;
        return newUrls;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upscaling.';
      console.error(err);
      setError(`Upscaling failed: ${errorMessage}`);
    } finally {
      setUpscalingStatus(prev => ({ ...prev, [imageIndex]: false }));
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setModelImages([]);
    setOutfits([{ image: null, description: '', key: Date.now() }]);
    setActiveClothingDescription('');
    originalImageUrls.forEach(URL.revokeObjectURL);
    setOriginalImageUrls([]);
    setGeneratedImageUrls([]);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setModelUploaderKey(Date.now());
    setUpscalingStatus({});
  };
  
  const handleTryAnotherOutfit = () => {
    setAppState(AppState.IDLE);
    // Keep the model images
    setGeneratedImageUrls([]);
    setOutfits([{ image: null, description: '', key: Date.now() }]);
    setActiveClothingDescription('');
    setError(null);
    setProgress(0);
    setProgressMessage('');
    setUpscalingStatus({});
  };

  const isGenerating = appState === AppState.LOADING;
  const canGenerate = modelImages.length > 0 && outfits.some(o => o.image || o.description.trim() !== '');

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
                <h2 className="text-xl font-semibold text-indigo-400">2. Provide Outfit(s)</h2>
                <p className="text-sm text-gray-400 -mt-4">Add multiple outfits to generate them all at once!</p>
                <div className="flex flex-col gap-4">
                  {outfits.map((outfit, index) => (
                    <OutfitInput
                      key={outfit.key}
                      outfit={outfit}
                      onImageChange={(files) => handleOutfitImageChange(index, files)}
                      onDescriptionChange={(e) => handleOutfitDescriptionChange(index, e.target.value)}
                      onRemove={() => handleRemoveOutfit(index)}
                      isRemoveDisabled={outfits.length <= 1}
                      disabled={isGenerating}
                      uploaderKey={outfit.key}
                    />
                  ))}
                </div>
                <button
                  onClick={handleAddOutfit}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 w-full mt-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Another Outfit
                </button>
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
                  className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-colors"
                >
                    <SparklesIcon />
                    <span>Generate New Outfit{modelImages.length * outfits.length > 1 ? 's' : ''}</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <ResultDisplay
            originalImages={originalImageUrls}
            generatedImages={generatedImageUrls}
            clothingDescription={activeClothingDescription}
            onTryAnother={handleTryAnotherOutfit}
            onGenerateVariation={handleGenerateVariation}
            onUpscale={handleUpscaleImage}
            upscalingStatus={upscalingStatus}
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
