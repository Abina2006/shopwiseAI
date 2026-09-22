/**
 * Wishlist Storage & Synchronization Helper for ShopWise AI
 *
 * Supports:
 * - LocalStorage persistence surviving page refresh for all users
 * - PostgreSQL backend sync (/api/wishlist) when authenticated or available
 * - Custom event dispatch ('shopwise_wishlist_updated') to sync state across components
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Get active storage key based on current user ID
 */
export function getWishlistKey(userId = null) {
  return `shopwise_wishlist_${userId || 'guest'}`;
}

/**
 * Read current wishlist items from localStorage
 */
export function getLocalWishlist(userId = null) {
  try {
    const raw = localStorage.getItem(getWishlistKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a product is in the wishlist
 */
export function isProductWishlisted(productId, userId = null) {
  if (!productId) return false;
  const list = getLocalWishlist(userId);
  return list.some(item => item.productId === productId || item.id === productId);
}

/**
 * Toggle a product in the wishlist (Add if not present, Remove if present)
 * @param {Object} product
 * @param {string|null} userId
 * @param {number|null} currentPrice
 * @param {string|null} platform
 * @returns {Promise<boolean>} returns true if now added, false if removed
 */
export async function toggleWishlist(product, userId = null, currentPrice = null, platform = null) {
  if (!product) return false;
  const productId = product.id || product.productId;
  const key = getWishlistKey(userId);
  const currentList = getLocalWishlist(userId);
  const exists = currentList.some(item => (item.productId || item.id) === productId);

  const priceVal = currentPrice || (product.listings?.[0]?.price ? parseFloat(product.listings[0].price) : (product.price || 0));
  const storeVal = platform || product.listings?.[0]?.sellerName || product.platform || 'Store';

  if (exists) {
    // Remove
    const updated = currentList.filter(item => (item.productId || item.id) !== productId);
    localStorage.setItem(key, JSON.stringify(updated));

    // Try background delete from server
    fetch(`${API_BASE}/wishlist/${productId}?userId=${userId || ''}`, {
      method: 'DELETE'
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('shopwise_wishlist_updated', { detail: { productId, added: false } }));
    return false;
  } else {
    // Add
    const newItem = {
      id: productId,
      productId: productId,
      product_name: product.name || product.product_name,
      name: product.name || product.product_name,
      brand: product.brand || 'Generic',
      category: product.category || 'General',
      imageUrl: product.imageUrl || product.image_url || '',
      image_url: product.imageUrl || product.image_url || '',
      current_price: priceVal,
      savedPrice: priceVal,
      platform: storeVal,
      product_url: product.product_url || product.listings?.[0]?.sellerUrl || '',
      date_added: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      listings: product.listings || []
    };

    const updated = [newItem, ...currentList];
    localStorage.setItem(key, JSON.stringify(updated));

    // Try background sync to PostgreSQL API
    fetch(`${API_BASE}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        userId: userId || undefined,
        savedPrice: priceVal,
        platform: storeVal
      })
    }).catch(() => {});

    window.dispatchEvent(new CustomEvent('shopwise_wishlist_updated', { detail: { productId, added: true } }));
    return true;
  }
}
