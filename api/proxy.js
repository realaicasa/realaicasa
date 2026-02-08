export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`[Proxy] Scraping URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch source: ${response.statusText}`);
    }

    const text = await response.text();
    // Return the HTML/Text content for Gemini to process
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send(text);
  } catch (error) {
    console.error(`[Proxy Error] ${error.message}`);
    res.status(500).json({ error: 'Elite Scraper encountered a localized block. Transitioning to fallback protocols.' });
  }
}
