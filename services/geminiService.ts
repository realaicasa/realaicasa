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
const getClient = (manualKey?: string, version: 'v1' | 'v1beta' = 'v1') => {
  const apiKey = getApiKey(manualKey);
  return new GoogleGenAI({ apiKey, apiVersion: version });
};

// --- PROPERTY DATA SCRAPER ---
export const parsePropertyData = async (input: string, manualKey?: string): Promise<PropertySchema> => {
  let client = getClient(manualKey, 'v1');
  
  const isUrl = input.trim().startsWith('http');
  let processedInput = input;
  let processingNote = "";

  if (isUrl) {
    try {
        console.log("[EstateGuard-v1.1.7] Ingestion active. Target: URL");
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(input.trim())}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const scrapedText = await response.text();
            console.log(`[EstateGuard-v1.1.7] URL scraped. Raw length: ${scrapedText.length}`);
            processedInput = scrapedText.slice(0, 30000); 
            processingNote = `(Analysis based on content scraped from URL: ${input})`;
        }
    } catch (e) {
        console.warn("[EstateGuard-v1.1.7] Proxy failed, falling back to URL-only analysis.");
    }
  } else {
    console.log("[EstateGuard-v1.1.7] Ingestion active. Target: Text");
  }

  const tryGenerate = async (modelName: string, apiVer: 'v1' | 'v1beta' = 'v1') => {
    try {
      const activeClient = getClient(manualKey, apiVer);
      return await activeClient.models.generateContent({
        model: modelName, 
        contents: [{ 
          role: 'user', 
          parts: [{ 
            text: `DATA SOURCE: "${processedInput}"\n\n${processingNote}\n\nCOMMAND:\n1. Extract ALL available property details.\n2. LOOK HARDER FOR SPECS: Bed, Bath, Sq Ft, Price.\n3. TRANSACTION TYPE: Detect if 'Rent', 'Lease' or 'Sale'.\n4. ADHERE TO THE GROUNDING PROTOCOL.\n5. DO NOT HALLUCINATE.` 
          }] 
        }],
        config: {
          system_instruction: SCRAPER_SYSTEM_INSTRUCTION,
          response_mime_type: "application/json",
          response_schema: {
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
              }
            },
            required: ["property_id", "listing_details"]
          }
        } as any // Cast to any to bypass potential SDK type strictness while forcing snake_case
      });
    } catch (e: any) {
      console.warn(`[EstateGuard-v1.1.6] Failed: ${modelName} on ${apiVer}. Error: ${e.message}`);
      throw e;
    }
  };

  let result;
  try {
    console.log("[EstateGuard-v1.1.7] Stage 1: Trying v1/gemini-2.0-flash...");
    result = await tryGenerate('gemini-2.0-flash', 'v1');
  } catch (e: any) {
    try {
        console.log("[EstateGuard-v1.1.7] Stage 2: Trying v1beta/gemini-2.0-flash...");
        result = await tryGenerate('gemini-2.0-flash', 'v1beta');
    } catch (e2: any) {
        try {
            console.log("[EstateGuard-v1.1.7] Stage 3: Trying v1beta/gemini-1.5-flash...");
            result = await tryGenerate('gemini-1.5-flash', 'v1beta');
        } catch (e3: any) {
            console.error("[EstateGuard-v1.1.7] ALL STAGES FAILED.");
            throw e3;
        }
    }
  }

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
    console.error("[EstateGuard-v1.1.7] Scraper Error:", e);
    const msg = e.message || "Unknown error";
    
    // Specific status code detection for 429 (Quota)
    const isQuotaError = msg.includes("429") || msg.toLowerCase().includes("too many requests") || msg.toLowerCase().includes("quota");
    if (isQuotaError) {
        throw new Error("INTELLIGENCE QUOTA EXCEEDED: The Gemini API is currently rate-limited. Please wait 60 seconds or upgrade your API tier.");
    }

    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      throw new Error(`API CONFIG ERROR: Gemini model not found. Please ensure your API key has access to 'gemini-2.0-flash' or 'gemini-1.5-flash'.`);
    }
    throw new Error(`Sync failed: ${msg}`);
  }
};

export const chatWithGuard = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  propertyContext: PropertySchema,
  settings: AgentSettings
) => {
  const client = getClient(settings.apiKey, 'v1');
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: history,
    config: {
      system_instruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
    } as any
  });

  return response.text;
};

export const transcribeAudio = async (base64Audio: string, manualKey?: string): Promise<string> => {
  const client = getClient(manualKey, 'v1');
  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
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