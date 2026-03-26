import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function searchBusinesses(query: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for businesses matching: "${query}". Return the results as a JSON array of objects. Each object MUST have the following properties: "name" (string), "address" (string), "phone" (string, optional), "website" (string, optional), "email" (string, optional). Do not include any markdown formatting, just the raw JSON array. If you cannot find any, return an empty array [].`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    let text = response.text;
    if (!text) return [];
    
    try {
      // Remove markdown code block formatting if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const results = JSON.parse(text);
      return Array.isArray(results) ? results : [];
    } catch (e) {
      console.error('Failed to parse search results:', e);
      return [];
    }
  } catch (error) {
    console.error('Error searching businesses:', error);
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
