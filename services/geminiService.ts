import { GoogleGenAI, Modality } from "@google/genai";
import { MimeType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ImageInput {
  data: string;
  mimeType: MimeType;
}

/**
 * Generates a new image by applying a clothing item from one image to a person in another.
 * @param modelImage The model's image.
 * @param clothingImage The clothing item's image.
 * @param description An optional text description to guide the AI.
 * @returns A promise that resolves to the base64 encoded string of the generated image.
 */
export const generateTryOnImage = async (
  modelImage: ImageInput,
  clothingImage: ImageInput,
  description: string,
): Promise<string> => {
  try {
    let prompt = `Take the clothing item from the second image and realistically place it onto the person in the first image. It is critical to preserve the person's face, hair, body shape, and skin tone. The background of the first image must also remain unchanged. Only replace the existing clothing.`;

    if (description.trim()) {
      prompt = `Take the clothing item from the second image and realistically place it onto the person in the first image, using the following description as a guide: "${description}". It is critical to preserve the person's face, hair, body shape, and skin tone. The background of the first image must also remain unchanged. Only replace the existing clothing.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: modelImage.data,
              mimeType: modelImage.mimeType,
            },
          },
          {
            inlineData: {
                data: clothingImage.data,
                mimeType: clothingImage.mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });
    
    // Find the image part in the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData) {
      return imagePart.inlineData.data;
    } else {
      // Check for text part which might contain an explanation for failure
      const textPart = response.candidates?.[0]?.content?.parts?.find(part => part.text);
      if (textPart && textPart.text) {
          throw new Error(`The AI could not generate an image. Reason: ${textPart.text}`);
      }
      throw new Error("Image generation failed: No image data was returned by the API.");
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during image generation.");
  }
};