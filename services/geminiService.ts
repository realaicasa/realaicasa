import { GoogleGenAI, Type } from "@google/genai";
import { SCRAPER_SYSTEM_INSTRUCTION, ESTATE_GUARD_SYSTEM_INSTRUCTION } from "../constants";
import { PropertySchema, AgentSettings } from "../types";

// --- SYSTEM INSTRUCTION HYDRATION ---
const hydrateInstruction = (settings: AgentSettings) => {
  return ESTATE_GUARD_SYSTEM_INSTRUCTION
    .replace(/{BUSINESS_NAME}/g, settings.businessName || "our agency")
    .replace(/{BUSINESS_ADDRESS}/g, settings.businessAddress || "our hq")
    .replace(/{SPECIALTIES}/g, settings.specialties?.join(", ") || "Luxury Real Estate")
    .replace(/{AWARDS}/g, settings.awards || "Top Rated Agency")
    .replace(/{MARKETING_STRATEGY}/g, settings.marketingStrategy || "Client-first approach")
    .replace(/{TEAM_MEMBERS}/g, settings.teamMembers || "Our elite team of specialists");
};

// --- SECURE API KEY RESOLVER ---
const getApiKey = (manualKey?: string) => {
  // Use a fallback to process.env or similar if import.meta.env is problematic in lint
  return manualKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
};

// --- PROPERTY DATA SCRAPER ---
export const parsePropertyData = async (input: string, manualKey?: string): Promise<PropertySchema> => {
  const apiKey = getApiKey(manualKey);
  const client = new GoogleGenAI({ apiKey });
  
  const isUrl = input.trim().startsWith('http');
  let processedInput = input;
  let processingNote = "";

  if (isUrl) {
    try {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(input.trim())}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const scrapedText = await response.text();
            processedInput = scrapedText.slice(0, 50000); 
            processingNote = `(Analysis based on content scraped from URL: ${input})`;
        }
    } catch (e) {
        console.warn("[Ingestion] Proxy failed, falling back to URL-only analysis.");
    }
  }

  const result = await client.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [{ 
      role: 'user', 
      parts: [{ 
        text: `DATA SOURCE: "${processedInput}"\n\n${processingNote}\n\nCOMMAND:\n1. Extract ALL available property details.\n2. LOOK HARDER FOR SPECS: Bed, Bath, Sq Ft, Price.\n3. TRANSACTION TYPE: Detect if 'Rent', 'Lease' or 'Sale'.\n4. ADHERE TO THE GROUNDING PROTOCOL.\n5. DO NOT HALLUCINATE.` 
      }] 
    }],
    config: {
      systemInstruction: SCRAPER_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          property_id: { type: Type.STRING },
          status: { type: Type.STRING },
          tier: { type: Type.STRING },
          category: { type: Type.STRING },
          transaction_type: { type: Type.STRING },
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
              image_url: { type: Type.STRING },
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
          deep_data: { 
            type: Type.OBJECT, 
            properties: {
                appraisal: { type: Type.STRING },
                notes: { type: Type.STRING }
            } 
          },
          agent_notes: {
            type: Type.OBJECT,
            properties: {
              motivation: { type: Type.STRING },
              showing_instructions: { type: Type.STRING }
            }
          },
          amenities: {
            type: Type.OBJECT,
            properties: {
              pool: { type: Type.BOOLEAN },
              garage: { type: Type.BOOLEAN },
              wifi: { type: Type.BOOLEAN },
              laundry: { type: Type.BOOLEAN },
              pets_allowed: { type: Type.BOOLEAN },
              gym: { type: Type.BOOLEAN },
              security: { type: Type.BOOLEAN }
            }
          },
          seo: {
            type: Type.OBJECT,
            properties: {
              meta_title: { type: Type.STRING },
              meta_description: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          }
        },
        required: ["property_id", "listing_details"]
      }
    }
  });

  try {
    // In @google/genai v2, if json requested, the parsed object is in result.value
    // Fallback to manual parse if value is missing
    const data = (result as any).value || JSON.parse(result.text || '{}');
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    if (!data.status) data.status = 'Active';
    if (!data.category) data.category = 'Residential';
    if (!data.transaction_type) data.transaction_type = 'Sale';
    return data;
  } catch (e: any) {
    console.error("Scraper Error:", e);
    throw new Error(`Sync failed: ${e.message || "Unknown error"}`);
  }
};

export const chatWithGuard = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  propertyContext: PropertySchema,
  settings: AgentSettings
) => {
  const apiKey = getApiKey(settings.apiKey);
  const client = new GoogleGenAI({ apiKey });

  const response = await client.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: history,
    config: {
      systemInstruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
    }
  });

  return response.text;
};

export const transcribeAudio = async (base64Audio: string, manualKey?: string): Promise<string> => {
  const apiKey = getApiKey(manualKey);
  const client = new GoogleGenAI({ apiKey });
  
  const response = await client.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'audio/mp3', data: base64Audio } },
          { text: "STRICT TRANSCRIPTION: Convert this voice note to text without additions." }
        ]
      }
    ]
  });
  
  return response.text || "";
};