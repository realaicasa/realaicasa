import { parsePropertyData } from '../services/geminiService';
import fs from 'fs';
import path from 'path';

// Mock AgentSettings for testing
const MOCK_SETTINGS = {
  businessName: 'Test Agency',
  apiKey: '', // Will be loaded from env
  language: 'en',
  specialties: ['Luxury'],
  primaryColor: '#000000',
  highSecurityMode: true,
  subscriptionTier: 'Enterprise',
  monthlyPrice: 0,
  businessAddress: '123 Test St',
  contactEmail: 'test@test.com',
  contactPhone: '1234567890',
  agentCount: 1,
  conciergeIntro: 'Hello',
  theme: 'dark'
} as any;

const TEST_CASES = [
  {
    name: "Standard Residential Text",
    input: "3 Bed 2 Bath condo in Miami for $500,000. 1200 sqft. Pool included.",
    expected: {
      price: 500000,
      bedrooms: 3,
      bathrooms: 2,
      sq_ft: 1200
    }
  },
  {
    name: "Complex Commercial Listing",
    input: "Commercial high-rise at 55 Luxury Ave. $12M asking price. 50,000 sqft. 12% cap rate. Fully occupied.",
    expected: {
      price: 12000000,
      sq_ft: 50000,
      cap_rate: 12
    }
  }
];

async function runRegression() {
  console.log("🤖 EstateGuard AI Regression Suite: Starting...");
  
  // Load API Key
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const match = content.match(/VITE_GEMINI_API_KEY=(.*)/);
    if (match) MOCK_SETTINGS.apiKey = match[1].trim();
  }

  if (!MOCK_SETTINGS.apiKey) {
    console.warn("⚠️  No Gemini API key found. Testing logic only (expecting failures or fallbacks).");
  }

  let passed = 0;
  for (const tc of TEST_CASES) {
    console.log(`\nTesting: [${tc.name}]`);
    try {
      const result = await parsePropertyData(tc.input, MOCK_SETTINGS.apiKey);
      
      const stats = result.listing_details.key_stats;
      const price = result.listing_details.price;

      let tcPassed = true;
      if (tc.expected.price && price !== tc.expected.price) {
        console.error(`   ❌ Price Mismatch: Expected ${tc.expected.price}, Got ${price}`);
        tcPassed = false;
      }
      if (tc.expected.bedrooms && stats.bedrooms !== tc.expected.bedrooms) {
        console.error(`   ❌ Bedroom Mismatch: Expected ${tc.expected.bedrooms}, Got ${stats.bedrooms}`);
        tcPassed = false;
      }
      
      if (tcPassed) {
        console.log(`   ✅ PASSED`);
        passed++;
      }
    } catch (e) {
      console.error(`   ❌ FAILED with error:`, e);
    }
  }

  console.log(`\nRegression Results: ${passed}/${TEST_CASES.length} Cases Passed.`);
  if (passed < TEST_CASES.length) process.exit(1);
}

runRegression().catch(console.error);
