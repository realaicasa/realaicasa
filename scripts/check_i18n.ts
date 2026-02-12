import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(process.cwd(), 'public/locales');
const LANGUAGES = ['en', 'es', 'fr'];

function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function auditI18n() {
  console.log("🌐 EstateGuard i18n Auditor: Checking language completeness...");
  
  const translations: Record<string, string[]> = {};
  let masterKeys: string[] = [];

  for (const lang of LANGUAGES) {
    const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Missing translation file for [${lang}]`);
      process.exit(1);
    }
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const keys = getKeys(content);
    translations[lang] = keys;
    
    if (lang === 'en') masterKeys = keys;
  }

  let inconsistencies = 0;
  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    
    const missing = masterKeys.filter(k => !translations[lang].includes(k));
    const extra = translations[lang].filter(k => !masterKeys.includes(k));
    
    if (missing.length > 0) {
      console.error(`❌ [${lang}] is missing ${missing.length} keys:`);
      missing.forEach(k => console.error(`   - ${k}`));
      inconsistencies++;
    }
    
    if (extra.length > 0) {
      console.warn(`⚠️  [${lang}] has ${extra.length} extra keys (not in EN):`);
      extra.forEach(k => console.warn(`   - ${k}`));
    }
  }

  if (inconsistencies === 0) {
    console.log("✨ ALL CLEAR: Localization keys are synchronized across all supported languages.");
  } else {
    console.log(`🚨 FOUND ${inconsistencies} LANGUAGE INCONSISTENCIES.`);
    process.exit(1);
  }
}

auditI18n();
