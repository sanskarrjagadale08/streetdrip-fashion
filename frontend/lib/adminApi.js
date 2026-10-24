/**
 * Frontend Admin & Catalog API Client with Granular Fashion Hierarchy
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'streetdrip_admin_jwt';
const USER_KEY = 'streetdrip_admin_user';

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
  const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    adminAuth.clearSession();
  }
  return res;
}

export async function loginAdmin(username, password) {
  const res = await fetch(`${API_BASE_URL}/login`, {
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
  const res = await authFetch('/admin/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return await res.json();
}

export async function fetchAllProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/products${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to load products');
  return await res.json();
}

export async function createProduct(productData) {
  const res = await authFetch('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create product');
  }
  return await res.json();
}

export async function updateProduct(productId, updatedFields) {
  const res = await authFetch(`/admin/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedFields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update product');
  }
  return await res.json();
}

export async function deleteProduct(productId) {
  const res = await authFetch(`/admin/products/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete product');
  }
  return await res.json();
}

export async function fetchAllBlogs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE_URL}/api/blogs${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error('Failed to load blog articles');
  return await res.json();
}

export async function createBlog(blogData) {
  const res = await authFetch('/admin/blogs', {
    method: 'POST',
    body: JSON.stringify(blogData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to publish blog');
  }
  return await res.json();
}

export async function updateBlog(blogId, updatedFields) {
  const res = await authFetch(`/admin/blogs/${blogId}`, {
    method: 'PUT',
    body: JSON.stringify(updatedFields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update blog');
  }
  return await res.json();
}

export async function deleteBlog(blogId) {
  const res = await authFetch(`/admin/blogs/${blogId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete blog');
  }
  return await res.json();
}
