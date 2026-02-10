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
  // Only use manual key if it looks like a real Google AI key
  const cleanedManual = manualKey?.trim() || "";
  const isJunk = ["null", "undefined", "[object object]", ""].includes(cleanedManual.toLowerCase());
  
  if (!isJunk && cleanedManual.length > 5 && cleanedManual.startsWith("AIza")) {
    console.log("[EstateGuard-v1.1.8] Using VALID manual API key from Identity Settings.");
    return cleanedManual;
  }
  
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.length > 5) {
    console.log("[EstateGuard-v1.1.8] Using system environment VITE_GEMINI_API_KEY.");
    return envKey;
  }
  
  console.warn("[EstateGuard-v1.1.8] NO VALID KEY DETECTED. Proceeding with Resilient Fallback.");
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
  // PRIORITY 1: Look for hero/featured images
  const heroMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) || 
                    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i) ||
                    html.match(/<link[^>]+rel="image_src"[^>]+href="([^"]+)"/i);
  
  // PRIORITY 2: Look for large images in content, avoiding small icons/logos
  const allImages = Array.from(html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi))
    .map(match => match[1])
    .filter(src => !src.includes('logo') && !src.includes('icon') && !src.includes('avatar'));

  const address = titleMatch?.[1]?.split('|')?.[0]?.trim() || h1Match?.[1]?.trim() || "Unrecognized Property";
  const image_url = heroMatch?.[1] || allImages[0] || "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&q=80";

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
        console.log("[EstateGuard-v1.1.8] Ingestion active. Target: URL (via Jina.ai)");
        // Use Jina.ai Reader for robust client-side scraping without a backend proxy
        const scrapeUrl = `https://r.jina.ai/${input.trim()}`;
        const response = await fetch(scrapeUrl);
        if (response.ok) {
            const scrapedText = await response.text();
            console.log(`[EstateGuard-v1.1.8] URL scraped. Raw length: ${scrapedText.length}`);
            processedInput = scrapedText.slice(0, 40000); // 40k chars limit
            processingNote = `(Analysis based on Jina.ai extraction of: ${input})`;
            
            // Try to extract a title from markdown (first # header)
            const titleMatch = scrapedText.match(/^#\s+(.+)$/m);
            const discoveredTitle = titleMatch ? titleMatch[1] : `Property at ${new URL(input).hostname}`;

            // Store pseudo-HTML for fallback metadata extraction
            lastScrapedHtml = `<h1>${discoveredTitle}</h1><p>${scrapedText.slice(0, 500)}...</p>`; 
        } else {
             throw new Error(`Jina.ai returned ${response.status}`);
        }
    } catch (e) {
        console.warn("[EstateGuard-v1.1.8] Scraping failed, falling back to URL-only analysis.", e);
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
            text: `DATA SOURCE: "${processedInput}"\n\n${processingNote}\n\nCOMMAND:\n1. Extract ALL available property details.\n2. LOOK HARDER FOR SPECS: Bed, Bath, Sq Ft, Price.\n3. TRANSACTION TYPE: Detect if 'Rent', 'Lease' or 'Sale'.\n4. ADHERE TO THE GROUNDING PROTOCOL.\n5. DO NOT HALLUCINATE.\n6. IMPORTANT: Return ONLY a raw JSON object. No conversational text, no markdown headers.` 
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
        console.log("[EstateGuard-v1.1.9] Stage 2: Trying gemini-1.5-flash...");
        result = await tryGenerate('gemini-1.5-flash', 'v1beta');
    } catch (e2: any) {
        try {
            console.log("[EstateGuard-v1.1.9] Stage 3: Retry gemini-1.5-flash (Legacy)...");
            result = await tryGenerate('gemini-1.5-flash', 'v1beta');
        } catch (e3: any) {
            try {
                console.log("[EstateGuard-v1.1.9] Stage 4: Trying gemini-pro (v1.0 Stable)...");
                result = await tryGenerate('gemini-pro', 'v1');
            } catch (e4: any) {
            } catch (e4: any) {
                console.error("[EstateGuard-v1.1.9] ALL STAGES FAILED.");
                
                // Fallback 1: URL Metadata extraction
                if (isUrl && lastScrapedHtml) {
                    console.warn("[EstateGuard-v1.1.8] Falling back to basic metadata extraction due to AI failure.");
                    return extractBasicMetadata(lastScrapedHtml) as PropertySchema;
                }
                
                // Fallback 2: Raw Text Encapsulation (Offline Mode)
                if (!isUrl && processedInput.length > 10) {
                     console.warn("[EstateGuard] Activate Offline Ingestion Protocol.");
                     return {
                        property_id: `EG-OFFLINE-${Math.floor(Math.random() * 1000)}`,
                        category: 'Residential',
                        transaction_type: 'Sale',
                        status: 'Active',
                        tier: PropertyTier.STANDARD,
                        visibility_protocol: { public_fields: ['address', 'hero_narrative'], gated_fields: [] },
                        listing_details: {
                          address: "Manual Ingestion (AI Offline)",
                          price: 0,
                          image_url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80",
                          key_stats: { sq_ft: 0, lot_size: "Unknown" },
                          hero_narrative: processedInput // Save the raw text so user doesn't lose it
                        },
                        agent_notes: {
                          motivation: "AI Services Unavailable - Manual Processing Required",
                          showing_instructions: "See raw data in description."
                        }
                      } as PropertySchema;
                }

                throw e4;
            }
        }
    }
  }

  try {
    // Stage 0: Basic check - if it looks like markdown code block, extract from middle
    let rawText = (result as any).value || result.text || '{}';
    if (rawText.includes("```")) {
      const blockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (blockMatch) rawText = blockMatch[1].trim();
    }

    // Stage 1: cleanJsonResponse handles nested curly braces extraction
    const data = cleanJsonResponse(rawText);
    
    // Stage 2: Structural Hardening (Prevent UI Crashes)
    if (!data.property_id) data.property_id = `EG-${Math.floor(Math.random() * 1000)}`;
    if (!data.status) data.status = 'Active';
    if (!data.category) data.category = 'Residential';
    if (!data.tier) data.tier = 'Standard';
    if (!data.transaction_type) data.transaction_type = 'Sale';
    
    if (!data.listing_details) {
      data.listing_details = {
        address: "New Asset",
        price: 0,
        hero_narrative: "Scraping complete. Analysis required.",
        key_stats: { bedrooms: 0, bathrooms: 0, sq_ft: 0 }
      };
    } else {
      // Deep merge with defaults for listing_details
      data.listing_details.key_stats = {
        bedrooms: data.listing_details.key_stats?.bedrooms || 0,
        bathrooms: data.listing_details.key_stats?.bathrooms || 0,
        sq_ft: data.listing_details.key_stats?.sq_ft || 0
      };
    }

    if (!data.visibility_protocol) {
      data.visibility_protocol = { public_fields: [], gated_fields: [] };
    } else {
      data.visibility_protocol.public_fields = data.visibility_protocol.public_fields || [];
      data.visibility_protocol.gated_fields = data.visibility_protocol.gated_fields || [];
    }

    return data as PropertySchema;
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
    model: 'gemini-1.5-flash',
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