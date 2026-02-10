import { GoogleGenAI, Type } from "@google/genai";
import { SCRAPER_SYSTEM_INSTRUCTION, ESTATE_GUARD_SYSTEM_INSTRUCTION } from "../constants";
import { PropertySchema, AgentSettings, PropertyTier } from "../types";

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
const cleanJsonResponse = (text: string): any => {
  try {
    // 1. Direct parse attempt
    return JSON.parse(text);
  } catch (e) {
    // 2. Extract block between first { and last }
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e2) {
        console.warn("[EstateGuard] Nested JSON parse failed:", e2);
      }
    }
    throw new Error(`JSON_PARSE_FAILURE: The response was not valid JSON. Raw: ${text.slice(0, 100)}...`);
  }
};

const getApiKey = (manualKey?: string) => {
  if (manualKey) {
    console.log("[EstateGuard-v1.1.8] Using manual API key from Identity Settings.");
    return manualKey;
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey) {
    console.log("[EstateGuard-v1.1.8] Using system environment VITE_GEMINI_API_KEY.");
    return envKey;
  }
  console.warn("[EstateGuard-v1.1.8] NO API KEY DETECTED. AI functionality will be limited to resilient fallbacks.");
  return "";
};

// --- PROPERTY DATA SCRAPER ---
const getClient = (manualKey?: string, version: 'v1' | 'v1beta' = 'v1') => {
  const apiKey = getApiKey(manualKey);
  return new GoogleGenAI({ apiKey, apiVersion: version });
};

// --- PROPERTY DATA SCRAPER ---
let lastScrapedHtml = ""; // Local state to avoid window reliance if possible

const extractBasicMetadata = (html: string): Partial<PropertySchema> => {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1>([^<]+)<\/h1>/i);
  const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || 
                       html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);

  const address = titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || "Unrecognized Property";
  const image_url = ogImageMatch?.[1] || imgMatch?.[1] || "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80";

  return {
    property_id: `EG-QUOTA-${Math.floor(Math.random() * 1000)}`,
    category: 'Residential',
    transaction_type: 'Sale',
    status: 'Active',
    tier: PropertyTier.STANDARD,
    visibility_protocol: { public_fields: ['address', 'image_url'], gated_fields: [] },
    listing_details: {
      address,
      price: 0,
      image_url,
      key_stats: {
        sq_ft: 0,
        lot_size: "Unknown"
      },
      hero_narrative: "INTELLIGENCE SYNC PAUSED: Your Gemini API quota has been reached. Basic metadata was recovered from the URL, but deep analysis requires a quota reset (60s) or a higher tier key."
    },
    agent_notes: {
      motivation: "Quota Reached during sync.",
      showing_instructions: "AI analysis pending quota reset."
    }
  };
};

export const parsePropertyData = async (input: string, manualKey?: string): Promise<PropertySchema> => {
  let client = getClient(manualKey, 'v1');
  
  const isUrl = input.trim().startsWith('http');
  let processedInput = input;
  let processingNote = "";

  if (isUrl) {
    try {
        console.log("[EstateGuard-v1.1.8] Ingestion active. Target: URL");
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(input.trim())}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
            const scrapedText = await response.text();
            console.log(`[EstateGuard-v1.1.8] URL scraped. Raw length: ${scrapedText.length}`);
            processedInput = scrapedText.slice(0, 30000); 
            processingNote = `(Analysis based on content scraped from URL: ${input})`;
            lastScrapedHtml = scrapedText;
        }
    } catch (e) {
        console.warn("[EstateGuard-v1.1.8] Proxy failed, falling back to URL-only analysis.");
    }
  } else {
    console.log("[EstateGuard-v1.1.8] Ingestion active. Target: Text");
  }

  const tryGenerate = async (modelName: string, apiVer: 'v1' | 'v1beta' = 'v1') => {
    try {
      const activeClient = getClient(manualKey, apiVer);
      const response = await activeClient.models.generateContent({
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
                      lot_size: { type: Type.STRING },
                      zoning: { type: Type.STRING },
                      topography: { type: Type.STRING },
                      utilities_available: { type: Type.ARRAY, items: { type: Type.STRING } },
                      access_type: { type: Type.STRING },
                      cap_rate: { type: Type.NUMBER },
                      occupancy_pct: { type: Type.NUMBER },
                      annual_revenue: { type: Type.NUMBER }
                    }
                  },
                  hero_narrative: { type: Type.STRING }
                }
              },
              deep_data: {
                type: Type.OBJECT,
                properties: {
                   lease_terms: {
                     type: Type.OBJECT,
                     properties: {
                       duration: { type: Type.STRING },
                       deposit: { type: Type.NUMBER },
                       utilities: { type: Type.STRING }
                     }
                   }
                }
              },
              ai_training: {
                type: Type.OBJECT,
                properties: {
                  proximityWaterfront: { type: Type.STRING },
                  commuteTime: { type: Type.STRING },
                  schools: { type: Type.STRING },
                  hospitals: { type: Type.STRING },
                  supermarkets: { type: Type.STRING },
                  neighborhood_vibe: { type: Type.STRING },
                  investment_potential: { type: Type.STRING },
                  agent_insider_tips: { type: Type.STRING }
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
              }
            },
            required: ["property_id", "listing_details"]
          }
        } as any 
      });
      return response;
    } catch (e: any) {
      console.warn(`[EstateGuard-v1.1.8] Failed: ${modelName} on ${apiVer}. Error: ${e.message}`);
      throw e;
    }
  };

  let result;
  try {
    console.log("[EstateGuard-v1.1.8] Stage 1: Trying v1/gemini-2.0-flash...");
    result = await tryGenerate('gemini-2.0-flash', 'v1');
  } catch (e: any) {
    try {
        console.log("[EstateGuard-v1.1.8] Stage 2: Trying v1/gemini-2.5-flash...");
        result = await tryGenerate('gemini-2.5-flash', 'v1');
    } catch (e2: any) {
        try {
            console.log("[EstateGuard-v1.1.8] Stage 3: Trying v1beta/gemini-1.5-flash...");
            result = await tryGenerate('gemini-1.5-flash', 'v1beta');
        } catch (e3: any) {
            console.error("[EstateGuard-v1.1.8] ALL STAGES FAILED.");
            if (isUrl && lastScrapedHtml) {
                console.warn("[EstateGuard-v1.1.8] Falling back to basic metadata extraction due to AI failure.");
                return extractBasicMetadata(lastScrapedHtml) as PropertySchema;
            }
            throw e3;
        }
    }
  }

  try {
    // RESILIENT PARSING: uses cleanJsonResponse to strip markdown/extra text
    const data = cleanJsonResponse((result as any).value || result.text || '{}');
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    if (!data.status) data.status = 'Active';
    if (!data.category) data.category = 'Residential';
    if (!data.transaction_type) data.transaction_type = 'Sale';
    return data;
  } catch (e: any) {
    console.error("[EstateGuard-v1.1.8] Processing Error:", e);
    const msg = e.message || "Unknown error";
    
    // 1. QUOTA DETECTION
    const isQuotaError = msg.includes("429") || msg.toLowerCase().includes("quota");
    if (isQuotaError) {
        if (isUrl && lastScrapedHtml) return extractBasicMetadata(lastScrapedHtml) as PropertySchema;
        throw new Error("INTELLIGENCE QUOTA EXCEEDED: The Gemini API is currently rate-limited. Please wait 60 seconds.");
    }

    // 2. MODEL ACCESS DETECTION
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      throw new Error(`API CONFIG ERROR: The requested model was not found. Please ensure your API key has access to standard Flash models.`);
    }

    // 3. PARSING FALLBACK
    if (msg.includes("JSON_PARSE_FAILURE") && isUrl && lastScrapedHtml) {
        console.warn("[EstateGuard] Falling back to basic metadata due to malformed AI response.");
        return extractBasicMetadata(lastScrapedHtml) as PropertySchema;
    }
    
    throw new Error(`Intelligence Sync Failed: ${msg}`);
  }
};

export const chatWithGuard = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  propertyContext: PropertySchema,
  settings: AgentSettings
) => {
  const client = getClient(settings.apiKey, 'v1');
  const response = await client.models.generateContent({
    model: 'gemini-2.5-flash',
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
    model: 'gemini-2.5-flash',
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