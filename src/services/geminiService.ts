import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY_V2 || import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY_V2 || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function searchBusinesses(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for businesses matching: "${query}". Return the results as a JSON array of objects. Each object MUST have the following properties: "name" (string), "address" (string), "phone" (string, optional), "website" (string, optional), "email" (string, optional). Do not include any markdown formatting, just the raw JSON array. If you cannot find any, return an empty array [].`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text;
    if (!text) return [];
    
    try {
      // Extract JSON array using regex to handle extra text/citations from Maps grounding
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const results = JSON.parse(match[0]);
        return Array.isArray(results) ? results : [];
      }
      console.warn('No JSON array found in response:', text);
      return [];
    } catch (e) {
      console.error('Failed to parse search results:', e, text);
      return [];
    }
  } catch (error: any) {
    console.error('Error searching businesses:', error);
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("Gemini API Quota Exceeded. Please wait a minute and try again, or check your billing details in Google AI Studio.");
    }
    throw error;
  }
}

export async function generateOutreachMessage(
  leadName: string,
  leadDetails: string,
  tone: 'formal' | 'friendly' | 'premium',
  context: string
) {
  try {
    const prompt = `
      Write a personalized outreach message for a business named "${leadName}".
      Business Details: ${leadDetails}
      Tone: ${tone}
      Context/Goal: ${context}
      
      The message should be concise, professional, and persuasive. 
      Do not include subject lines if it's for WhatsApp, but keep it structured so it can be used for email or WhatsApp.
      Just return the message content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error('Error generating message:', error);
    throw error;
  }
}
