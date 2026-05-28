import { CardData } from '../types';

// We fetch directly from GitHub's repo contents API to see immediately added files

export async function fetchCards(folderName = 'cards', forceRefresh = false): Promise<CardData[]> {
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const CACHE_KEY = `card_guesser_cards_cache_${folderName}`;

  const JSDELIVR_CDN_BASE = `https://cdn.jsdelivr.net/gh/DEX-1101/19a152e@main/${folderName}`;

  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          console.log(`Loaded ${folderName} from local storage cache`);
          return parsedCache;
        }
      }
    } catch (e) {
      console.warn("Failed to read from local storage:", e);
    }
  }

  const decodeHtmlEntities = (text: string) => {
    return text.replace(/&#x27;/g, "'")
               .replace(/&amp;/g, "&")
               .replace(/&lt;/g, "<")
               .replace(/&gt;/g, ">")
               .replace(/&quot;/g, '"');
  };

  const processNamesArray = (names: string[]) => {
    const validNames = names.filter(name => name && validExtensions.some(ext => name.toLowerCase().endsWith(ext)));
    
    if (validNames.length > 0) {
      const parsed = validNames.map(name => ({
        originalName: name,
        name: name.replace(/\.[^/.]+$/, ""),
        imageUrl: `${JSDELIVR_CDN_BASE}/${encodeURIComponent(name)}`,
      }));
      
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      } catch (e) {}
      
      return parsed;
    }
    return null;
  };

  const GITHUB_API_URL = `https://api.github.com/repos/DEX-1101/19a152e/contents/${folderName}`;
  const timestampUrl = forceRefresh ? `${GITHUB_API_URL}?t=${Date.now()}` : GITHUB_API_URL;
  
  try {
    // 1. Try directly from GitHub API for real-time updates
    console.log(`Fetching from GitHub API for ${folderName}...`);
    const res1 = await fetch(timestampUrl);
    if (res1.ok) {
      const data = await res1.json();
      if (Array.isArray(data)) {
        const result = processNamesArray(data.map((f: any) => f.name));
        if (result) return result;
      }
    }
  } catch (e) { console.warn("GitHub API fetch error:", e); }

  try {
    // 2. Try proxy web scraping to bypass REST Rate Limits
    console.log(`Falling back to CodeTabs Web Scraper for ${folderName}...`);
    const repoTreeUrl = `https://github.com/DEX-1101/19a152e/tree/main/${folderName}`;
    const proxyHtmlUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(repoTreeUrl)}`;
    const res2 = await fetch(proxyHtmlUrl);
    if (res2.ok) {
      const text = await res2.text();
      // Scrape <a title="Filename.png"> elements from github UI
      const matches = text.match(/title=\"([^\"]+\.(?:png|jpg|jpeg|webp|gif))\"/gi);
      if (matches) {
        const extractedNames = Array.from(new Set(matches)).map(m => {
          const nameMatch = m.match(/title=\"(.*)\"/i);
          return nameMatch ? decodeHtmlEntities(nameMatch[1]) : "";
        });
        const result = processNamesArray(extractedNames);
        if (result) return result;
      }
    }
  } catch (e) { console.warn("CodeTabs Web Scraper error:", e); }

  try {
    // 3. Fallback to jsDelivr Directory Index HTML
    console.log(`Falling back to jsDelivr Directory Index HTML for ${folderName}...`);
    const cdnDirUrl = `https://cdn.jsdelivr.net/gh/DEX-1101/19a152e@main/${folderName}/`;
    const res3 = await fetch(cdnDirUrl);
    if (res3.ok) {
      const text = await res3.text();
      // Scrape href="/gh/.../...png" from JSDelivr UI
      const matches = text.match(/href=\"([^\"]+\.(?:png|jpg|jpeg|webp|gif))\"/gi);
      if (matches) {
        const extractedNames = Array.from(new Set(matches)).map(m => {
          const parts = m.split('/');
          const name = parts[parts.length - 1].replace(/"$/, '');
          return decodeURIComponent(name);
        });
        const result = processNamesArray(extractedNames);
        if (result) return result;
      }
    }
  } catch (e) { console.warn("jsDelivr HTML Scraper error:", e); }

  try {
    // 4. Fallback to jsDelivr v1 API (Often cached for a few days, last resort)
    console.log(`Falling back to jsDelivr v1 Data API for ${folderName}...`);
    const JSDELIVR_API_URL = 'https://data.jsdelivr.com/v1/package/gh/DEX-1101/19a152e@main';
    const res4 = await fetch(JSDELIVR_API_URL);
    if (res4.ok) {
      const data = await res4.json();
      const cardsDir = data.files?.find((f: any) => f.type === 'directory' && f.name === folderName);
      if (cardsDir && Array.isArray(cardsDir.files)) {
        const result = processNamesArray(cardsDir.files.map((f: any) => f.name));
        if (result) return result;
      }
    }
  } catch (e) { console.warn("jsDelivr Data API error:", e); }

  console.warn(`All fetches failed or no valid cards found for ${folderName} (It may be empty or failed).`);
  return [];
}
