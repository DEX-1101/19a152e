import { CardData } from '../types';

// We fetch directly from GitHub's repo contents API to see immediately added files

export async function checkGameVersion(): Promise<string | null> {
  try {
    const res = await fetch(`https://raw.githubusercontent.com/DEX-1101/19a152e/main/version.json?t=${Date.now()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.version) {
        return data.version.toString();
      }
    }
  } catch (e) {
    console.warn("Version check failed", e);
  }
  return null;
}

export async function fetchCards(folderName = 'cards', forceRefresh = false): Promise<CardData[]> {
  const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const CACHE_KEY = `card_guesser_cards_cache_${folderName}`;

  const IMAGE_BASE_URL = `https://dex-1101.github.io/19a152e/${folderName}`;

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
        imageUrl: `${IMAGE_BASE_URL}/${encodeURIComponent(name)}`,
      }));
      
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
      } catch (e) {}
      
      return parsed;
    }
    return null;
  };

  const GITHUB_API_URL = `https://api.github.com/repos/DEX-1101/19a152e/contents/${folderName}`;
  const timestamp = forceRefresh ? `?t=${Date.now()}` : '';
  const timestampUrl = `${GITHUB_API_URL}${timestamp}`;
  
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
    // 2. Try proxying GitHub API via CodeTabs to bypass IP Rate Limits
    console.log(`Falling back to CodeTabs API Proxy for ${folderName}...`);
    const proxyApiUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(timestampUrl)}`;
    const res2 = await fetch(proxyApiUrl);
    if (res2.ok) {
      const data = await res2.json();
      if (Array.isArray(data)) {
        const result = processNamesArray(data.map((f: any) => f.name));
        if (result) return result;
      }
    }
  } catch (e) { console.warn("CodeTabs API Proxy error:", e); }

  try {
    // 3. Try proxy web scraping to bypass REST Rate Limits (HTML Regex Parsing)
    console.log(`Falling back to CodeTabs Web Scraper for ${folderName}...`);
    const repoTreeUrl = `https://github.com/DEX-1101/19a152e/tree/main/${folderName}${timestamp}`;
    const proxyHtmlUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(repoTreeUrl)}`;
    const res3 = await fetch(proxyHtmlUrl);
    if (res3.ok) {
      const text = await res3.text();
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
    // 4. Fallback to jsDelivr Directory Index HTML
    console.log(`Falling back to jsDelivr Directory Index HTML for ${folderName}...`);
    const cdnDirUrl = `https://cdn.jsdelivr.net/gh/DEX-1101/19a152e@main/${folderName}/${forceRefresh ? `?t=${Date.now()}` : ''}`;
    const res4 = await fetch(cdnDirUrl);
    if (res4.ok) {
      const text = await res4.text();
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
    // 5. Fallback to jsDelivr v1 API (Often cached for a few days, last resort)
    console.log(`Falling back to jsDelivr v1 Data API for ${folderName}...`);
    const JSDELIVR_API_URL = 'https://data.jsdelivr.com/v1/package/gh/DEX-1101/19a152e@main';
    const res5 = await fetch(JSDELIVR_API_URL);
    if (res5.ok) {
      const data = await res5.json();
      const cardsDir = data.files?.find((f: any) => f.type === 'directory' && f.name === folderName);
      if (cardsDir && Array.isArray(cardsDir.files)) {
        const result = processNamesArray(cardsDir.files.map((f: any) => f.name));
        if (result) return result;
      }
    }
  } catch (e) { console.warn("jsDelivr Data API error:", e); }

  console.warn(`All fetches failed or no valid cards found for ${folderName} (It may be empty or failed).`);
  
  if (forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          console.log(`Fallback to local storage cache for ${folderName} after forced fetch failure`);
          return parsedCache;
        }
      }
    } catch (e) { console.warn("Failed to read from local storage during fallback:", e); }
  }
  
  return [];
}
