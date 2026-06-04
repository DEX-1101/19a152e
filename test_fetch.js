import { fetchCards } from './src/lib/api.js';

// Monkey patch global fetch to fail on api.github.com/repos/
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (url.toString().startsWith('https://api.github.com/repos/DEX-1101')) {
    return { ok: false, status: 403, json: async () => ({ message: "rate limited" }) };
  }
  return originalFetch(url, options);
};

fetchCards('cards', true).then(d => console.log('cards', d.length));
fetchCards('CommonCards', true).then(d => console.log('CommonCards', d.length));
fetchCards('MonsterCard', true).then(d => console.log('MonsterCard', d.length));
fetchCards('OtherCard', true).then(d => console.log('OtherCard', d.length));
