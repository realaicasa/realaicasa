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
    console.log("[EstateGuard-v1.1.9] Using VALID manual API key from Identity Settings.");
    return cleanedManual;
  }
  
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (envKey && envKey.length > 5) {
    console.log("[EstateGuard-v1.1.9] Using system environment VITE_GEMINI_API_KEY.");
    return envKey;
  }
  
  console.warn("[EstateGuard-v1.1.9] NO VALID KEY DETECTED. Proceeding with Resilient Fallback.");
  return "";
};

// --- PROPERTY DATA SCRAPER ---
const getClient = (manualKey?: string, version: 'v1' | 'v1beta' = 'v1') => {
  const apiKey = getApiKey(manualKey);
  return new GoogleGenAI({ apiKey, apiVersion: version });
};

// --- PROPERTY DATA SCRAPER ---
let lastScrapedHtml = ""; // Local state to avoid window reliance if possible

const extractBasicMetadata = (html: string, fallbackImageUrl?: string) => {
      // Regex Parsing Engine
      const priceMatch = html.match(/\$([\d,]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
      
      const bedMatch = html.match(/(\d+)\s*(?:bed|bd|bedroom)/i);
      const beds = bedMatch ? parseInt(bedMatch[1]) : 0;
      
      const bathMatch = html.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
      const baths = bathMatch ? parseFloat(bathMatch[1]) : 0;
      
      const sqftMatch = html.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq|square)\.?\s*(?:ft|feet)/i);
      const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : 0;

      // Address Extraction
      let finalAddress = "Imported Listing";
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const addressMatch = html.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Square|Sq|Way)[^,\n<]*/i);
      
      if (addressMatch) {
          finalAddress = addressMatch[0];
      } else if (titleMatch) {
          finalAddress = titleMatch[1].split('|')[0].trim();
      }

      // Image Extraction
      const imgMatch = html.match(/<meta property="og:image" content="(.*?)"/i) || html.match(/<img[^>]+src=["'](.*?)["']/i);
      const finalImage = fallbackImageUrl || (imgMatch ? imgMatch[1] : "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80");

      return {
        property_id: `EG-QUOTA-${Math.floor(Math.random() * 1000)}`,
        category: 'Residential',
        transaction_type: 'Sale',
        status: 'Active',
        tier: PropertyTier.STANDARD,
        visibility_protocol: { public_fields: ['address', 'image_url', 'hero_narrative'], gated_fields: [] },
        listing_details: {
            address: finalAddress,
            hero_narrative: "AI LIMIT REACHED: Generated via Offline Regex Protocol. " + (html.length > 200 ? html.substring(0, 300) + "..." : html),
            image_url: finalImage,
            price,
            key_stats: { 
                sq_ft: sqft, 
                lot_size: "Unknown",
                bedrooms: beds,
                bathrooms: baths
            }
        },
        amenities: { general: html.toLowerCase().includes('pool') ? ['Pool'] : [] },
        seo: {
            meta_title: `Luxury Property for Sale | ${finalAddress}`,
            meta_description: `Discover this stunning property at ${finalAddress}. Features ${beds} beds, ${baths} baths, and premium amenities. Schedule a viewing today.`
        },
        deep_data: {},
        agent_notes: { motivation: "", showing_instructions: "" }
      } as any;
  };

export const parsePropertyData = async (input: string, manualKey?: string, fallbackImageUrl?: string): Promise<PropertySchema> => {
  let client = getClient(manualKey, 'v1');
  
  const isUrl = input.trim().startsWith('http');
  let processedInput = input;
  let processingNote = "";

  if (isUrl) {
    try {
        console.log("[EstateGuard-v1.1.9] Ingestion active. Target: URL (via Jina.ai)");
        // Use Jina.ai Reader for robust client-side scraping without a backend proxy
        const scrapeUrl = `https://r.jina.ai/${input.trim()}`;
        const response = await fetch(scrapeUrl);
        if (response.ok) {
            const scrapedText = await response.text();
            console.log(`[EstateGuard-v1.1.9] URL scraped. Raw length: ${scrapedText.length}`);
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
        console.warn("[EstateGuard-v1.1.9] Scraping failed, falling back to URL-only analysis.", e);
    }
  } else {
    console.log("[EstateGuard-v1.1.9] Ingestion active. Target: Text");
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
      console.warn(`[EstateGuard-v1.1.9] Failed: ${modelName} on ${apiVer}. Error: ${e.message}`);
      throw e;
    }
  };

  let result;
  try {
    console.log("[EstateGuard-v1.1.9] Stage 1: Trying gemini-1.5-flash (Stable)...");
    result = await tryGenerate('gemini-1.5-flash', 'v1');
  } catch (e: any) {
    try {
        console.log("[EstateGuard-v1.1.9] Stage 2: Trying gemini-2.0-flash-exp...");
        result = await tryGenerate('gemini-2.0-flash-exp', 'v1');
    } catch (e2: any) {
        try {
            console.log("[EstateGuard-v1.1.9] Stage 3: Retry gemini-1.5-flash (Legacy)...");
            result = await tryGenerate('gemini-1.5-flash', 'v1beta');
        } catch (e3: any) {
            try {
                console.log("[EstateGuard-v1.1.9] Stage 4: Trying gemini-pro (v1.0 Stable)...");
                result = await tryGenerate('gemini-pro', 'v1');
            } catch (e4: any) {
                console.warn("[EstateGuard-v1.1.9] ALL AI STAGES FAILED. Switching to Offline Protocol.");
                
                // Fallback 1: URL Metadata extraction
                if (isUrl && lastScrapedHtml) {
                    console.warn("[EstateGuard-v1.1.9] Falling back to basic metadata extraction due to AI failure.");
                    return extractBasicMetadata(lastScrapedHtml, fallbackImageUrl) as PropertySchema;
                }
                
                // Fallback 2: Raw Text Encapsulation (Offline Mode)
                if (!isUrl && processedInput.length > 10) {
                     console.warn("[EstateGuard] Activate Offline Ingestion Protocol.");
                     
                     // Regex Parsing Engine
                     const priceMatch = processedInput.match(/\$([\d,]+)/);
                     const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 0;
                     
                     const bedMatch = processedInput.match(/(\d+)\s*(?:bed|bd|bedroom)/i);
                     const beds = bedMatch ? parseInt(bedMatch[1]) : 0;
                     
                     const bathMatch = processedInput.match(/(\d+(?:\.\d+)?)\s*(?:bath|ba|bathroom)/i);
                     const baths = bathMatch ? parseFloat(bathMatch[1]) : 0;

                     const sqftMatch = processedInput.match(/(\d{1,3}(?:,\d{3})*)\s*(?:sq|square)\.?\s*(?:ft|feet)/i);
                     const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, '')) : 0;

                     // Address Extraction
                     let address = "Manual Ingestion (AI Offline)";
                     const addressMatch = processedInput.match(/\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl|Square|Sq|Way)[^,\n]*/i);
                     if (addressMatch) {
                        address = addressMatch[0];
                     } else {
                        address = processedInput.substring(0, 50).split('\n')[0];
                     }

                     return {
                        property_id: `EG-OFFLINE-${Math.floor(Math.random() * 1000)}`,
                        category: 'Residential',
                        transaction_type: 'Sale',
                        status: 'Active',
                        tier: PropertyTier.STANDARD,
                        visibility_protocol: { public_fields: ['address', 'hero_narrative', 'image_url'], gated_fields: [] },
                        listing_details: {
                          address,
                          price,
                          image_url: fallbackImageUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80",
                          key_stats: { 
                              sq_ft: sqft, 
                              lot_size: "Unknown", 
                              bedrooms: beds, 
                              bathrooms: baths 
                          },
                          hero_narrative: processedInput // Save the raw text so user doesn't lose it
                        },
                        agent_notes: {
                          motivation: "AI Services Unavailable - Manual Processing Required",
                          showing_instructions: "See raw data in description."
                        },
                        amenities: { general: processedInput.toLowerCase().includes('pool') ? ['Pool'] : [] },
                        seo: {
                            meta_title: `Exclusive Listing | ${address}`,
                            meta_description: `Explore this exceptional property at ${address}. Offered at $${price.toLocaleString()}. Contact us for details.`
                        },
                        deep_data: {}
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

    // Auto-SEO Fallback if AI missed it
    if (!data.seo) {
        data.seo = {
            meta_title: `Premium Real Estate | ${data.listing_details.address}`,
            meta_description: `View details for ${data.listing_details.address}. ${data.listing_details.key_stats.bedrooms} Bed, ${data.listing_details.key_stats.bathrooms} Bath. Request a private tour.`
        };
    }

    return data as PropertySchema;
  } catch (e: any) {
    // console.error("[EstateGuard-v1.1.9] Processing Error:", e); // Squelch noise
    const msg = e.message || "Unknown error";
    
    // 1. QUOTA DETECTION
    const isQuotaError = msg.includes("429") || msg.toLowerCase().includes("quota");
    if (isQuotaError) {
        if (isUrl && lastScrapedHtml) return extractBasicMetadata(lastScrapedHtml, fallbackImageUrl) as PropertySchema;
        throw new Error("INTELLIGENCE QUOTA EXCEEDED: The Gemini API is currently rate-limited. Please wait 60 seconds.");
    }

    // 2. MODEL ACCESS DETECTION
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      throw new Error(`API CONFIG ERROR: The requested model was not found. Please ensure your API key has access to standard Flash models.`);
    }

    // 3. PARSING FALLBACK
    if (msg.includes("JSON_PARSE_FAILURE") && isUrl && lastScrapedHtml) {
        console.warn("[EstateGuard] Falling back to basic metadata due to malformed AI response.");
        return extractBasicMetadata(lastScrapedHtml, fallbackImageUrl) as PropertySchema;
    }
    
    throw new Error(`Intelligence Sync Failed: ${msg}`);
  }
};

export const chatWithGuard = async (
  history: { role: 'user' | 'model'; parts: { text: string }[] }[],
  propertyContext: PropertySchema,
  settings: AgentSettings
) => {
  try {
    const client = getClient(settings.apiKey, 'v1');
    const response = await client.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: history,
      config: {
        system_instruction: `${hydrateInstruction(settings)}\n\nAUTHENTIC PROPERTY DATABASE:\n${JSON.stringify(propertyContext, null, 2)}`
      } as any
    });

    return response.text;
  } catch (err: any) {
    console.error("[EstateGuard] chatWithGuard Connectivity Error:", err);
    throw err;
  }
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