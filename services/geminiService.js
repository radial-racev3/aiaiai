import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = "AIzaSyBAnKFv0b874M5ofplpPMDLWWPSGdt4Kjg";

const getGenAIClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

const generateAnswer = async (prompt, history) => {
  try {
    const ai = getGenAIClient();
    
    // Combine the previous chat history with the new user prompt
    const contents = [...history, { role: 'user', parts: [{ text: prompt }] }];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating answer:", error);
    return "Sorry, I couldn't process that request. Please try again.";
  }
};

const generateImage = async (prompt) => {
  try {
    const ai = getGenAIClient();
    
    // Use Imagen 4 model for high-quality image generation and to avoid Flash Image quota limits.
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      // Return as JPEG data URI
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

// Expose functions to global window object for other scripts to use
window.geminiService = {
  generateAnswer,
  generateImage
};

console.log("Gemini Service initialized");