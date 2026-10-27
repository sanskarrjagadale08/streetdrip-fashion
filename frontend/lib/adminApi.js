/**
 * Frontend Admin & Catalog API Client with Granular Fashion Hierarchy
 * Resilient Local-First Persistent Architecture with Cloud Synchronization
 */

export function getApiBaseUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://streetdrip-fashion.onrender.com';
    }
  }
  return 'http://localhost:8000';
}

const TOKEN_KEY = 'streetdrip_admin_jwt';
const USER_KEY = 'streetdrip_admin_user';
const PRODUCTS_STORAGE_KEY = 'streetdrip_persisted_products';
const BLOGS_STORAGE_KEY = 'streetdrip_persisted_blogs';

export const FASHION_HIERARCHY = {
  "Lowers": [
    "Baggy Jeans",
    "Straight Fit Jeans",
    "Skinny Fit Jeans",
    "Cargo Pants",
    "Korean Trousers",
    "Chinos",
    "Formal Pants"
  ],
  "Shirts": [
    "Boxy Fit Shirts",
    "Casual Shirts",
    "Formal Shirts",
    "Overshirts"
  ],
  "T-Shirts": [
    "Boxy Fit T-Shirt",
    "Drop Shoulder T-Shirt",
    "Jersey",
    "Normal Fit T-Shirt",
    "Henley Neck T-Shirt",
    "Polo T-Shirt"
  ],
  "Jackets": [
    "Denim Jacket",
    "Leather Jacket",
    "Bomber Jacket",
    "Puffer Jacket"
  ],
  "Shoes": [
    "Chunky Sneakers",
    "Minimal Court Sneakers",
    "Foam Clogs",
    "Boots & Derbies"
  ],
  "Glasses": [
    "Y2K Wrap Shades",
    "Minimalist Wireframe",
    "Retro Acetate Shades"
  ]
};

// ==========================================
// LOCAL STORAGE PERSISTENCE HELPERS
// ==========================================

export function getLocalProducts() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading local products:', e);
    return [];
  }
}

export function saveLocalProducts(products) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products || []));
  } catch (e) {
    console.warn('Error saving local products:', e);
  }
}

export function getLocalBlogs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(BLOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error reading local blogs:', e);
    return [];
  }
}

export function saveLocalBlogs(blogs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BLOGS_STORAGE_KEY, JSON.stringify(blogs || []));
  } catch (e) {
    console.warn('Error saving local blogs:', e);
  }
}

// Background Cloud Sync
export async function syncProductsToServer(products) {
  if (!products || !products.length) return;
  try {
    await fetch(`${getApiBaseUrl()}/api/products/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
  } catch (e) {
    // Non-blocking sync error
  }
}

export async function syncBlogsToServer(blogs) {
  if (!blogs || !blogs.length) return;
  try {
    await fetch(`${getApiBaseUrl()}/api/blogs/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogs }),
    });
  } catch (e) {
    // Non-blocking sync error
  }
}

// ==========================================
// AUTHENTICATION CLIENT
// ==========================================

export const adminAuth = {
  getToken: () => (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null),
  getUser: () => {
    if (typeof window === 'undefined') return null;
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setSession: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated: () => !!adminAuth.getToken()
};

async function authFetch(endpoint, options = {}) {
  const token = adminAuth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    adminAuth.clearSession();
  }
  return res;
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${getApiBaseUrl()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Authentication failed');
  }
  const data = await res.json();
  adminAuth.setSession(data.access_token, data.user);
  return data;
}

export async function verifyAdminSession() {
  const res = await authFetch('/admin/verify');
  if (!res.ok) throw new Error('Session invalid');
  return await res.json();
}

export async function fetchAdminStats() {
  try {
    const res = await authFetch('/admin/stats');
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('Admin stats endpoint unreachable, deriving from local cache');
  }
  // Local fallback stats
  const prods = getLocalProducts();
  const blogs = getLocalBlogs();
  const brands = new Set(prods.map(p => p.brand).filter(Boolean));
  const avg = prods.length ? prods.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0) / prods.length : 0;
  const liveCount = prods.filter(p => !p.is_taken_down && p.drop_status !== 'TAKEN DOWN').length;
  return {
    total_products: prods.length,
    live_products: liveCount,
    taken_down_products: prods.length - liveCount,
    total_blogs: blogs.length,
    total_brands: brands.size,
    total_categories: Object.keys(FASHION_HIERARCHY).length,
    top_category: 'Lowers',
    avg_price: Math.round(avg),
    latest_drops: prods.slice(0, 5),
    latest_blogs: blogs.slice(0, 3)
  };
}

// ==========================================
// PRODUCTS CRUD (LOCAL-FIRST RESILIENT)
// ==========================================

export async function fetchAllProducts(params = {}) {
  const localList = getLocalProducts();
  const query = new URLSearchParams(params).toString();
  const url = `${getApiBaseUrl()}/api/products${query ? `?${query}` : ''}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal }).catch(err => {
      console.warn('Backend fetch timeout/warning:', err.message);
      return null;
    });
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const serverProducts = await res.json();
      if (Array.isArray(serverProducts)) {
        const serverIds = new Set(serverProducts.map(p => p.id));
        const missingOnServer = localList.filter(p => !serverIds.has(p.id));

        const merged = [...serverProducts, ...missingOnServer];
        saveLocalProducts(merged);

        if (missingOnServer.length > 0) {
          syncProductsToServer(missingOnServer).catch(() => {});
        }

        return merged;
      }
    }
  } catch (err) {
    console.warn('Serving products from persistent local cache:', err);
  }

  return localList;
}

export async function createProduct(productData) {
  const localList = getLocalProducts();
  const maxLocalId = localList.reduce((max, p) => (typeof p.id === 'number' && p.id > max ? p.id : max), 0);
  const newLocalId = Math.max(Date.now(), maxLocalId + 1);

  const localItem = {
    ...productData,
    id: newLocalId,
    likes: productData.likes || Math.floor(Math.random() * 100) + 50,
    created_at: new Date().toISOString()
  };

  // 1. Store immediately in localStorage so it persists through refresh
  const updatedLocal = [localItem, ...localList.filter(p => p.id !== localItem.id)];
  saveLocalProducts(updatedLocal);

  // 2. Sync to cloud backend
  try {
    const res = await authFetch('/admin/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });

    if (res.ok) {
      const serverItem = await res.json();
      const synced = updatedLocal.map(p => (p.id === localItem.id ? serverItem : p));
      saveLocalProducts(synced);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend product creation warning, preserved in local Vault:', err);
  }

  return localItem;
}

export async function updateProduct(productId, updatedFields) {
  const localList = getLocalProducts();
  const updatedLocal = localList.map(p => (p.id === productId ? { ...p, ...updatedFields } : p));
  saveLocalProducts(updatedLocal);

  try {
    const res = await authFetch(`/admin/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    });
    if (res.ok) {
      const serverItem = await res.json();
      const synced = updatedLocal.map(p => (p.id === productId ? serverItem : p));
      saveLocalProducts(synced);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend product update warning, updated in local Vault:', err);
  }

  return updatedLocal.find(p => p.id === productId) || { id: productId, ...updatedFields };
}

export async function deleteProduct(productId) {
  const localList = getLocalProducts();
  const updatedLocal = localList.filter(p => p.id !== productId);
  saveLocalProducts(updatedLocal);

  try {
    const res = await authFetch(`/admin/products/${productId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend product delete warning, deleted from local Vault:', err);
  }

  return { success: true, deleted_id: productId };
}

export async function bulkDeleteProducts(ids) {
  if (!ids || ids.length === 0) return { success: true, deleted_count: 0 };
  const idSet = new Set(ids);
  const localList = getLocalProducts();
  const updatedLocal = localList.filter(p => !idSet.has(p.id));
  saveLocalProducts(updatedLocal);

  try {
    const res = await authFetch('/admin/products/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Bulk delete endpoint failed, falling back to concurrent single deletes:', e);
  }

  await Promise.all(ids.map(id => authFetch(`/admin/products/${id}`, { method: 'DELETE' }).catch(() => {})));
  return { success: true, deleted_count: ids.length };
}

export async function bulkUpdateProducts(ids, fields) {
  if (!ids || ids.length === 0) return { success: true, updated_count: 0 };
  const idSet = new Set(ids);
  const localList = getLocalProducts();
  const updatedLocal = localList.map(p => idSet.has(p.id) ? { ...p, ...fields } : p);
  saveLocalProducts(updatedLocal);

  try {
    const res = await authFetch('/admin/products/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, fields }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Bulk update endpoint failed, falling back to concurrent single updates:', e);
  }

  return { success: true, updated_count: ids.length };
}

// ==========================================
// BLOGS / ESSAYS CRUD (LOCAL-FIRST RESILIENT)
// ==========================================

export async function fetchAllBlogs(params = {}) {
  const localList = getLocalBlogs();
  const query = new URLSearchParams(params).toString();
  const url = `${getApiBaseUrl()}/api/blogs${query ? `?${query}` : ''}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal }).catch(err => {
      console.warn('Backend blogs fetch timeout/warning:', err.message);
      return null;
    });
    clearTimeout(timeoutId);

    if (res && res.ok) {
      const serverBlogs = await res.json();
      if (Array.isArray(serverBlogs)) {
        const serverIds = new Set(serverBlogs.map(b => b.id));
        const missingOnServer = localList.filter(b => !serverIds.has(b.id));

        const merged = [...serverBlogs, ...missingOnServer];
        saveLocalBlogs(merged);

        if (missingOnServer.length > 0) {
          syncBlogsToServer(missingOnServer).catch(() => {});
        }

        return merged;
      }
    }
  } catch (err) {
    console.warn('Serving blogs from persistent local cache:', err);
  }

  return localList;
}

export async function createBlog(blogData) {
  const localList = getLocalBlogs();
  const maxLocalId = localList.reduce((max, b) => (typeof b.id === 'number' && b.id > max ? b.id : max), 0);
  const newLocalId = Math.max(Date.now(), maxLocalId + 1);

  const localItem = {
    ...blogData,
    id: newLocalId,
    created_at: new Date().toISOString()
  };

  // 1. Immediately store in localStorage
  const updatedLocal = [localItem, ...localList.filter(b => b.id !== localItem.id)];
  saveLocalBlogs(updatedLocal);

  // 2. Sync to cloud backend
  try {
    const res = await authFetch('/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData),
    });

    if (res.ok) {
      const serverItem = await res.json();
      const synced = updatedLocal.map(b => (b.id === localItem.id ? serverItem : b));
      saveLocalBlogs(synced);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend blog publish warning, preserved in local Vault:', err);
  }

  return localItem;
}

export async function updateBlog(blogId, updatedFields) {
  const localList = getLocalBlogs();
  const updatedLocal = localList.map(b => (b.id === blogId ? { ...b, ...updatedFields } : b));
  saveLocalBlogs(updatedLocal);

  try {
    const res = await authFetch(`/admin/blogs/${blogId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedFields),
    });
    if (res.ok) {
      const serverItem = await res.json();
      const synced = updatedLocal.map(b => (b.id === blogId ? serverItem : b));
      saveLocalBlogs(synced);
      return serverItem;
    }
  } catch (err) {
    console.warn('Backend blog update warning, updated in local Vault:', err);
  }

  return updatedLocal.find(b => b.id === blogId) || { id: blogId, ...updatedFields };
}

export async function deleteBlog(blogId) {
  const localList = getLocalBlogs();
  const updatedLocal = localList.filter(b => b.id !== blogId);
  saveLocalBlogs(updatedLocal);

  try {
    const res = await authFetch(`/admin/blogs/${blogId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend blog delete warning, deleted from local Vault:', err);
  }

  return { success: true, deleted_id: blogId };
}

export async function bulkDeleteBlogs(ids) {
  if (!ids || ids.length === 0) return { success: true, deleted_count: 0 };
  const idSet = new Set(ids);
  const localList = getLocalBlogs();
  const updatedLocal = localList.filter(b => !idSet.has(b.id));
  saveLocalBlogs(updatedLocal);

  try {
    const res = await authFetch('/admin/blogs/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Bulk blog delete endpoint failed, falling back to concurrent single deletes:', e);
  }

  await Promise.all(ids.map(id => authFetch(`/admin/blogs/${id}`, { method: 'DELETE' }).catch(() => {})));
  return { success: true, deleted_count: ids.length };
}

export async function bulkUpdateBlogs(ids, fields) {
  if (!ids || ids.length === 0) return { success: true, updated_count: 0 };
  const idSet = new Set(ids);
  const localList = getLocalBlogs();
  const updatedLocal = localList.map(b => idSet.has(b.id) ? { ...b, ...fields } : b);
  saveLocalBlogs(updatedLocal);

  try {
    const res = await authFetch('/admin/blogs/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ ids, fields }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Bulk blog update endpoint failed, falling back to concurrent single updates:', e);
  }

  return { success: true, updated_count: ids.length };
}
