
import { GoogleGenAI } from "@google/genai";
import { Equipment } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getLabAssistantInsights(prompt: string, equipmentList: Equipment[]) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert AI Lab Assistant for a research equipment portal.
    Current available equipment: ${JSON.stringify(equipmentList.map(e => ({ name: e.name, category: e.category, hours: e.totalUsageHours })))}
    Your goal is to provide:
    1. Recommendations for equipment based on research descriptions.
    2. Maintenance predictions based on total usage hours (high usage > 3000 hours needs inspection).
    3. Research workflow suggestions.
    Keep answers concise, technical, and helpful.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I'm having trouble connecting to the research knowledge base right now. Please try again later.";
  }
}
