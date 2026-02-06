import { GoogleGenAI, Type } from "@google/genai";
import { SCRAPER_SYSTEM_INSTRUCTION, ESTATE_GUARD_SYSTEM_INSTRUCTION } from "../constants";
import { PropertySchema, AgentSettings } from "../types";

const hydrateInstruction = (settings: AgentSettings) => {
  return ESTATE_GUARD_SYSTEM_INSTRUCTION
    .replace(/{BUSINESS_NAME}/g, settings.businessName || "our agency")
    .replace(/{BUSINESS_ADDRESS}/g, settings.businessAddress || "our hq")
    .replace(/{SPECIALTIES}/g, settings.specialties?.join(", ") || "Luxury Real Estate");
};

export const parsePropertyData = async (input: string, apiKey: string): Promise<PropertySchema> => {
  const ai = new GoogleGenAI({ apiKey });
  const isUrl = input.trim().startsWith('http');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `DATA SOURCE: "${input}"

COMMAND:
1. Extract ALL available property details.
2. If this is a URL, visit the page and find: Address, Full Price, Bedroom count, Bathroom count, Square Footage, and a 2-3 sentence descriptive summary.
3. ADHERE TO THE GROUNDING PROTOCOL: If any field (like Price or Sq Ft) is not explicitly found, set it to 0. If Bed/Bath is missing, set to null.
4. DO NOT HALLUCINATE OR GUESS.`,
    config: {
      systemInstruction: SCRAPER_SYSTEM_INSTRUCTION,
      tools: isUrl ? [{ googleSearch: {} }] : undefined,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          property_id: { type: Type.STRING },
          status: { type: Type.STRING },
          tier: { type: Type.STRING },
          category: { type: Type.STRING },
          visibility_protocol: {
            type: Type.OBJECT,
            properties: {
              public_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
              gated_fields: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          listing_details: {
            type: Type.OBJECT,
            properties: {
              address: { type: Type.STRING },
              price: { type: Type.NUMBER },
              video_tour_url: { type: Type.STRING },
              key_stats: {
                type: Type.OBJECT,
                properties: {
                  bedrooms: { type: Type.NUMBER },
                  bathrooms: { type: Type.NUMBER },
                  sq_ft: { type: Type.NUMBER },
                  lot_size: { type: Type.STRING }
                }
              },
              hero_narrative: { type: Type.STRING }
            }
          },
          deep_data: { type: Type.OBJECT, properties: {} },
          agent_notes: {
            type: Type.OBJECT,
            properties: {
              motivation: { type: Type.STRING },
              showing_instructions: { type: Type.STRING }
            }
          }
        },
        required: ["property_id", "listing_details"]
      }
    }
  });

  try {
    const text = response.text || '{}';
    const cleanedJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanedJson) as PropertySchema;
    
    // Ensure property_id exists
    if (!data.property_id) {
      data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    }
    // Set default status if missing
    if (!data.status) data.status = 'Active';
    // Set default category
    if (!data.category) data.category = 'Residential';
    
    return data;
  } catch (e: any) {
    console.error("Scraper Error:", e);
    // Bubble up the actual error message (e.g. Quota Exceeded, API Key Invalid)
    throw new Error(`Sync failed: ${e.message || "Unknown error"}`);
  }
};

export const chatWithGuard = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  propertyContext: PropertySchema,
  settings: AgentSettings
) => {
  const ai = new GoogleGenAI({ apiKey: settings.apiKey || process.env.API_KEY || '' });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE (ONLY USE THIS DATA):\n${JSON.stringify(propertyContext, null, 2)}`,
    }
  });

  const lastUserMsg = history[history.length - 1].parts[0].text;
  const response = await chat.sendMessage({ message: lastUserMsg });
  return response.text;
};

export const transcribeAudio = async (base64Audio: string, apiKey: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'audio/pcm;rate=16000', data: base64Audio } },
        { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
      ]
    }
  });
  return response.text || "";
};