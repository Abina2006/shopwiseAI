/**
 * Smart URL Sanitizer & Store Link Generator
 * Ensures all Flipkart, Amazon, Meesho, Myntra, and Croma links open cleanly without referrer or query format errors.
 */

export function sanitizeStoreUrl(rawUrl, productName = '', sellerName = '') {
  if (!rawUrl && !productName) return '#';

  // If already a clean product page link (e.g. /p/itm... on Flipkart or /dp/... on Amazon)
  if (rawUrl && (rawUrl.includes('/p/itm') || rawUrl.includes('/dp/') || rawUrl.includes('/gp/'))) {
    return rawUrl;
  }

  // Determine seller
  const seller = (sellerName || (rawUrl && rawUrl.includes('flipkart') ? 'Flipkart' : rawUrl && rawUrl.includes('amazon') ? 'Amazon' : rawUrl && rawUrl.includes('meesho') ? 'Meesho' : rawUrl && rawUrl.includes('myntra') ? 'Myntra' : rawUrl && rawUrl.includes('croma') ? 'Croma' : '')).toLowerCase();

  // Extract clean keyword query from product name or URL
  let query = productName;
  if (!query && rawUrl) {
    try {
      const urlObj = new URL(rawUrl);
      query = urlObj.searchParams.get('q') || urlObj.searchParams.get('k') || '';
    } catch {
      query = rawUrl;
    }
  }

  // Clean the query: remove parentheses, brackets, special characters, tech specs
  const cleanKeywords = (query || '')
    .replace(/\(.*?\)/g, '') // remove text in brackets e.g. (128GB, Natural Titanium)
    .replace(/\[.*?\]/g, '')
    .replace(/Pack of \d+ x \d+g/gi, '')
    .replace(/[^\w\s-]/g, ' ') // remove special chars like commas, quotes, ampersands
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 5) // keep first 5 most relevant words
    .join(' ');

  const encodedQuery = encodeURIComponent(cleanKeywords);

  if (seller.includes('flipkart')) {
    return `https://www.flipkart.com/search?q=${encodedQuery}`;
  }
  if (seller.includes('amazon')) {
    return `https://www.amazon.in/s?k=${encodedQuery}`;
  }
  if (seller.includes('meesho')) {
    return `https://www.meesho.com/search?q=${encodedQuery}`;
  }
  if (seller.includes('myntra')) {
    return `https://www.myntra.com/${cleanKeywords.toLowerCase().replace(/\s+/g, '-')}`;
  }
  if (seller.includes('croma')) {
    return `https://www.croma.com/searchB?q=${encodedQuery}`;
  }

  return rawUrl || `https://www.google.com/search?q=${encodedQuery}`;
}
