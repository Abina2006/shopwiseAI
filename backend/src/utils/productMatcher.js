/**
 * Product Matcher & Specification Normalizer for ShopWise AI
 *
 * Prevents false product grouping across marketplaces by comparing:
 * - Brand
 * - Model number / Core Model Name
 * - Storage (e.g. 128GB vs 256GB vs 512GB vs 1TB)
 * - RAM (e.g. 8GB vs 12GB vs 16GB vs 24GB)
 * - Model Tier / Suffix (e.g. Pro, Pro Max, Plus, Ultra, Air, Mini, Lite)
 * - Chipset / Generation (e.g. M1, M2, M3, M4, Gen 3)
 * - Size / Volume (e.g. 14-inch, 55-inch, 44mm, 1 Litre, 500g, 4kg)
 */

/**
 * Extract technical specifications and variants from a product title string
 * @param {string} title
 * @returns {Object}
 */
export function extractProductSpecs(title) {
  if (!title || typeof title !== 'string') {
    return { storage: null, ram: null, tier: null, generation: null, size: null, raw: '' };
  }

  const clean = title.toLowerCase();

  // Storage: 32GB, 64GB, 128GB, 256GB, 512GB, 1TB, 2TB
  const storageMatch = clean.match(/\b(32\s*gb|64\s*gb|128\s*gb|256\s*gb|512\s*gb|1\s*tb|2\s*tb)\b/i);
  const storage = storageMatch ? storageMatch[1].replace(/\s+/g, '').toUpperCase() : null;

  // RAM: 4GB, 6GB, 8GB, 12GB, 16GB, 24GB, 32GB RAM
  const ramMatch = clean.match(/\b(4\s*gb|6\s*gb|8\s*gb|12\s*gb|16\s*gb|24\s*gb|32\s*gb)\s*(?:ram|unified\s*memory)\b/i) ||
                   clean.match(/(?:,\s*|\/\s*)(4\s*gb|6\s*gb|8\s*gb|12\s*gb|16\s*gb|24\s*gb)\b/i);
  const ram = ramMatch ? ramMatch[1].replace(/\s+/g, '').toUpperCase() : null;

  // Model Tier: Pro Max, Pro, Plus, Ultra, Mini, Lite, Slim, FE, SE
  let tier = null;
  if (/\bpro\s*max\b/i.test(clean)) tier = 'PRO_MAX';
  else if (/\bpro\b/i.test(clean)) tier = 'PRO';
  else if (/\bplus\b/i.test(clean)) tier = 'PLUS';
  else if (/\bultra\b/i.test(clean)) tier = 'ULTRA';
  else if (/\bmini\b/i.test(clean)) tier = 'MINI';
  else if (/\blite\b/i.test(clean)) tier = 'LITE';
  else if (/\bslim\b/i.test(clean)) tier = 'SLIM';

  // Chipset / Generation: M1, M2, M3, M4, 13th Gen, 14th Gen
  let generation = null;
  const chipMatch = clean.match(/\b(m[1-4]|gen\s*[1-4]|1[2-4]th\s*gen)\b/i);
  if (chipMatch) generation = chipMatch[1].replace(/\s+/g, '').toUpperCase();

  // Screen / Size / Weight
  let size = null;
  const sizeMatch = clean.match(/\b(\d+(?:\.\d+)?\s*(?:inch|\"|cm|mm|litre|ltr|kg|gm|g))\b/i);
  if (sizeMatch) size = sizeMatch[1].replace(/\s+/g, '').toLowerCase();

  return { storage, ram, tier, generation, size, raw: title };
}

/**
 * Check if two products are compatible matches (same product, same specs)
 * @param {Object} productA { name, brand }
 * @param {Object} productB { name, brand }
 * @returns {boolean}
 */
export function areProductsMatching(productA, productB) {
  if (!productA?.name || !productB?.name) return false;

  const brandA = (productA.brand || '').trim().toLowerCase();
  const brandB = (productB.brand || '').trim().toLowerCase();

  // Brand check: if both exist and differ significantly, not a match
  if (brandA && brandB && brandA !== 'generic' && brandB !== 'generic' && brandA !== brandB) {
    // Check if one contains the other (e.g. "Apple" in "Apple Inc.")
    if (!brandA.includes(brandB) && !brandB.includes(brandA)) {
      return false;
    }
  }

  const specsA = extractProductSpecs(productA.name);
  const specsB = extractProductSpecs(productB.name);

  // 1. Storage Incompatibility Check
  // e.g. "iPhone 15 128GB" vs "iPhone 15 256GB" -> MUST NOT MATCH
  if (specsA.storage && specsB.storage && specsA.storage !== specsB.storage) {
    return false;
  }

  // 2. RAM Incompatibility Check
  // e.g. "MacBook 8GB" vs "MacBook 24GB" -> MUST NOT MATCH
  if (specsA.ram && specsB.ram && specsA.ram !== specsB.ram) {
    return false;
  }

  // 3. Model Tier Incompatibility Check
  // e.g. "iPhone 15" vs "iPhone 15 Pro" vs "iPhone 15 Pro Max" -> MUST NOT MATCH
  if (specsA.tier !== specsB.tier) {
    return false;
  }

  // 4. Chipset / Generation Check
  // e.g. "MacBook Air M2" vs "MacBook Air M3" -> MUST NOT MATCH
  if (specsA.generation && specsB.generation && specsA.generation !== specsB.generation) {
    return false;
  }

  // 5. Size Incompatibility Check (if both have specified sizes)
  if (specsA.size && specsB.size && specsA.size !== specsB.size) {
    return false;
  }

  // 6. Token Overlap on Core Product Model Name
  const cleanTokensA = cleanCoreTokens(productA.name);
  const cleanTokensB = cleanCoreTokens(productB.name);

  const setA = new Set(cleanTokensA);
  const setB = new Set(cleanTokensB);

  const intersection = cleanTokensA.filter(t => setB.has(t)).length;
  const union = new Set([...cleanTokensA, ...cleanTokensB]).size;

  const similarity = union === 0 ? 0 : intersection / union;

  // Threshold of 0.45 on core tokens when all technical specifications match
  return similarity >= 0.45;
}

/**
 * Filter noise tokens from product names to compare core identity
 * @param {string} name
 * @returns {string[]}
 */
function cleanCoreTokens(name) {
  const noise = new Set([
    'for', 'with', 'and', 'the', 'in', 'of', 'on', 'a', 'an', 'to',
    'compatible', 'official', 'original', 'fast', 'smart', 'new', 'latest',
    'edition', 'series', 'brand', 'black', 'white', 'grey', 'silver', 'blue',
    'pack', 'pcs', 'piece', 'set', 'offer', 'best'
  ]);

  return (name || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !noise.has(t));
}
