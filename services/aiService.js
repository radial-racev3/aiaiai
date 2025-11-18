
import { GoogleGenAI } from "@google/genai";

console.log("lime.ai Service Initializing...");

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

// Expose functions to global window object for other scripts to use
window.geminiService = {
  generateAnswer
};

console.log("lime.ai Service attached to window");
