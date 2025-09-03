
import { GoogleGenAI, Modality } from "@google/genai";
import { MimeType } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a new image by applying a clothing description to a model's photo.
 * @param base64ImageData The base64 encoded string of the model's image.
 * @param mimeType The MIME type of the model's image.
 * @param clothingPrompt A text description of the desired clothing.
 * @returns A promise that resolves to the base64 encoded string of the generated image.
 */
export const generateTryOnImage = async (
  base64ImageData: string,
  mimeType: MimeType,
  clothingPrompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: `Please replace the clothing on the person in this image with: "${clothingPrompt}". It's very important that you do NOT change the person's face, hair, body shape, or the background. Only change the clothes.`,
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
