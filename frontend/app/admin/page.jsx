'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  LogOut, 
  ExternalLink, 
  Flame, 
  TrendingUp, 
  ShoppingBag, 
  Lock, 
  Key, 
  Loader2,
  BookOpen,
  PenTool,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { 
  loginAdmin, 
  adminAuth, 
  verifyAdminSession, 
  fetchAllProducts, 
  fetchAdminStats,
  fetchAllBlogs 
} from '../../lib/adminApi';
import ProductUploadForm from '../../components/admin/ProductUploadForm';
import InventoryTable from '../../components/admin/InventoryTable';
import BlogUploadForm from '../../components/admin/BlogUploadForm';
import BlogManagementTable from '../../components/admin/BlogManagementTable';
import ThemeToggle from '../../components/ThemeToggle';

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login Form
  const [loginUsername, setLoginUsername] = useState('admin@streetdrip.ai');
  const [loginPassword, setLoginPassword] = useState('dripadmin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'dashboard' | 'products' | 'add_drop' | 'blogs' | 'add_blog'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard Data
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function checkSession() {
      if (adminAuth.isAuthenticated()) {
        try {
          const verified = await verifyAdminSession();
          setIsAuthenticated(true);
          setCurrentUser(verified);
        } catch {
          adminAuth.clearSession();
          setIsAuthenticated(false);
        }
      }
      setCheckingAuth(false);
    }
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    setLoadingData(true);
    try {
      const [statsData, prodsData, blogsData] = await Promise.all([
        fetchAdminStats().catch(() => null),
        fetchAllProducts({ sort_by: 'newest' }).catch(() => []),
        fetchAllBlogs().catch(() => [])
      ]);
      setStats(statsData);
      setProducts(prodsData || []);
      setBlogs(blogsData || []);
    } catch (err) {
      console.warn('Error loading admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const u = loginUsername.trim();
      const p = loginPassword.trim();
      const res = await loginAdmin(u, p);
      setIsAuthenticated(true);
      setCurrentUser(res.user);
    } catch (err) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials or ensure backend is running.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    adminAuth.clearSession();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-void-950 text-white flex items-center justify-center font-mono">
        <div className="flex items-center gap-3 text-neon-lime text-xs">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>VERIFYING VAULT SECURITY CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  // LOGIN SCREEN (PROTECTED GATEWAY)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-void-950 text-white flex items-center justify-center p-4 bg-cyber-grid font-mono selection:bg-neon-lime selection:text-black">
        <div className="w-full max-w-md bg-void-950 border border-white/15 p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-lime via-neon-cyan to-neon-orange" />

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-neon-lime text-xs font-bold uppercase tracking-widest">
              <Lock className="w-4 h-4" />
              <span>PROTECTED GATEWAY // SECURE ACCESS</span>
            </div>
            <ThemeToggle />
          </div>

          <h1 className="text-2xl font-black uppercase text-white tracking-tight">
            STREET<span className="text-neon-lime">DRIP</span> VAULT ADMIN
          </h1>
          <p className="text-xs text-zinc-400 font-sans mt-1 mb-6">
            Ingest drops, manage affiliate endpoints, and publish essays with automated security protection.
          </p>

          {loginError && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/50 text-rose-400 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1.5">
                Admin Username / Email
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="admin@streetdrip.ai"
                className="w-full bg-void-900 border border-white/10 px-3.5 py-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>

            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1.5">
                Master Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-void-900 border border-white/10 px-3.5 py-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-neon-lime text-black font-black uppercase text-xs tracking-wider border-2 border-neon-lime hover:bg-black hover:text-neon-lime transition-all disabled:opacity-50"
            >
              {loginLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              <span>{loginLoading ? 'AUTHENTICATING...' : 'ACCESS VAULT DASHBOARD'}</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-zinc-400">
            <span className="font-bold text-white uppercase block mb-1">DEFAULT CREDENTIALS:</span>
            <div className="bg-void-900 p-2.5 border border-white/10 space-y-1 font-mono text-[11px]">
              <div className="flex justify-between items-center">
                <span>Username:</span>
                <span className="text-neon-lime font-bold">admin@streetdrip.ai</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Password:</span>
                <span className="text-neon-lime font-bold">dripadmin123</span>
              </div>
              <div className="text-[10px] text-zinc-400 pt-1">
                Also accepted: <span className="text-zinc-200 font-bold">admin</span> / <span className="text-zinc-200 font-bold">dripadmin123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                setLoginUsername('admin@streetdrip.ai');
                setLoginPassword('dripadmin123');
                setLoginLoading(true);
                setLoginError('');
                try {
                  const res = await loginAdmin('admin@streetdrip.ai', 'dripadmin123');
                  setIsAuthenticated(true);
                  setCurrentUser(res.user);
                } catch (err) {
                  setLoginError(err.message || 'Authentication failed. Please ensure the backend is running on port 8000.');
                } finally {
                  setLoginLoading(false);
                }
              }}
              className="w-full mt-3 py-2 px-3 bg-void-900 border border-neon-lime/40 text-neon-lime hover:bg-neon-lime hover:text-black font-bold uppercase text-[10px] transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Auto-Fill & Log In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD
  return (
    <div className="min-h-screen bg-void-950 text-white font-mono flex flex-col md:flex-row bg-cyber-grid">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-void-950 border-r border-white/10 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <a href="/" className="text-lg font-black tracking-tighter text-white">
                STREET<span className="text-neon-lime">DRIP</span>
              </a>
              <span className="text-[9px] bg-neon-lime/10 text-neon-lime border border-neon-lime/30 px-1.5 py-0.5 font-bold">
                ADMIN
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 uppercase truncate">
              {currentUser?.name || 'Chief Curator'}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            <div className="text-[10px] text-zinc-500 uppercase px-3 py-1 font-bold">General</div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left border transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-neon-lime text-black border-neon-lime font-black'
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-void-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="uppercase">Overview</span>
            </button>

            <div className="text-[10px] text-zinc-500 uppercase px-3 pt-3 pb-1 font-bold">Inventory Drops</div>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3 py-2 text-left border transition-all ${
                activeTab === 'products'
                  ? 'bg-neon-lime text-black border-neon-lime font-black'
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-void-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4" />
                <span className="uppercase">Manage Products</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 ${activeTab === 'products' ? 'bg-black text-neon-lime' : 'bg-void-800 text-zinc-400'}`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add_drop')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left border transition-all ${
                activeTab === 'add_drop'
                  ? 'bg-neon-lime text-black border-neon-lime font-black'
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-void-900'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="uppercase">Add New Drop</span>
            </button>

            <div className="text-[10px] text-zinc-500 uppercase px-3 pt-3 pb-1 font-bold">Street Journal</div>
            <button
              onClick={() => setActiveTab('blogs')}
              className={`w-full flex items-center justify-between px-3 py-2 text-left border transition-all ${
                activeTab === 'blogs'
                  ? 'bg-neon-lime text-black border-neon-lime font-black'
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-void-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4" />
                <span className="uppercase">Manage Blogs</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 ${activeTab === 'blogs' ? 'bg-black text-neon-lime' : 'bg-void-800 text-zinc-400'}`}>
                {blogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('add_blog')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left border transition-all ${
                activeTab === 'add_blog'
                  ? 'bg-neon-lime text-black border-neon-lime font-black'
                  : 'border-transparent text-zinc-300 hover:text-white hover:bg-void-900'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span className="uppercase">Write New Blog</span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2 text-xs">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime transition-all"
          >
            <span className="text-[11px] uppercase">View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-2 bg-void-900 border border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500 transition-all text-[11px] uppercase"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="p-4 md:px-8 border-b border-white/10 bg-void-950/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-neon-lime animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              VAULT CONTROL // {activeTab.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={loadDashboardData}
              disabled={loadingData}
              className="flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`w-3 h-3 ${loadingData ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">SYNC ALL</span>
            </button>
            <ThemeToggle />
            <span className="text-[11px] text-neon-lime bg-neon-lime/10 px-2 py-0.5 border border-neon-lime/30 font-bold">
              VAULT SECURED
            </span>
          </div>
        </header>

        <div className="p-4 md:p-8 flex-1">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-void-950 border border-white/10 p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 uppercase">
                    <span>Products In Vault</span>
                    <ShoppingBag className="w-4 h-4 text-neon-lime" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.total_products || products.length}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Active streetwear pieces</div>
                </div>

                <div className="bg-void-950 border border-white/10 p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 uppercase">
                    <span>Street Journal Essays</span>
                    <BookOpen className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.total_blogs || blogs.length}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Published editorials</div>
                </div>

                <div className="bg-void-950 border border-white/10 p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 uppercase">
                    <span>Brand Labels</span>
                    <Flame className="w-4 h-4 text-neon-orange" />
                  </div>
                  <div className="text-3xl font-black text-white">{stats?.total_brands || 6}</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Nike, Zara, Bewakoof, Levi's</div>
                </div>

                <div className="bg-void-950 border border-white/10 p-5">
                  <div className="flex items-center justify-between text-zinc-400 text-xs mb-2 uppercase">
                    <span>Avg Vault Price</span>
                    <span className="text-neon-lime font-bold">$</span>
                  </div>
                  <div className="text-3xl font-black text-neon-lime">
                    ${stats?.avg_price ? stats.avg_price.toFixed(2) : '68.50'}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-1">Across all staples</div>
                </div>
              </div>

              {/* Two Column Quick Access */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Products */}
                <div className="bg-void-950 border border-white/10 p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <span className="font-bold uppercase text-xs text-white">LATEST DROPS</span>
                    <button onClick={() => setActiveTab('products')} className="text-neon-lime text-[11px] hover:underline uppercase">View All</button>
                  </div>
                  <div className="space-y-2.5">
                    {products.slice(0, 4).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-2.5 bg-void-900 border border-white/5 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={p.image_url} alt="" className="w-8 h-8 object-cover bg-black" />
                          <div className="font-bold text-white uppercase truncate max-w-[200px]">{p.name}</div>
                        </div>
                        <span className="font-bold text-neon-lime">${p.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Blogs */}
                <div className="bg-void-950 border border-white/10 p-6">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <span className="font-bold uppercase text-xs text-white">LATEST ESSAYS</span>
                    <button onClick={() => setActiveTab('blogs')} className="text-neon-lime text-[11px] hover:underline uppercase">View All</button>
                  </div>
                  <div className="space-y-2.5">
                    {blogs.slice(0, 4).map(b => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 bg-void-900 border border-white/5 text-xs">
                        <div className="flex items-center gap-3">
                          <img src={b.cover_image} alt="" className="w-8 h-8 object-cover bg-black" />
                          <div className="font-bold text-white uppercase truncate max-w-[220px]">{b.title}</div>
                        </div>
                        <span className="text-[10px] text-zinc-400">{b.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
                    INVENTORY & AFFILIATE MANAGEMENT
                  </h2>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Update prices, test affiliate destination links, and remove discontinued drops.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_drop')}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-lime text-black font-black uppercase text-xs"
                >
                  <PlusCircle className="w-4 h-4 fill-black" />
                  <span>ADD DROP</span>
                </button>
              </div>

              <InventoryTable
                products={products}
                onProductUpdated={(u) => setProducts(prev => prev.map(p => p.id === u.id ? u : p))}
                onProductDeleted={(id) => setProducts(prev => prev.filter(p => p.id !== id))}
                onRefresh={loadDashboardData}
              />
            </div>
          )}

          {/* TAB 3: ADD NEW PRODUCT DROP */}
          {activeTab === 'add_drop' && (
            <ProductUploadForm
              onSuccess={(newProduct) => {
                setProducts(prev => [newProduct, ...prev]);
                setActiveTab('products');
              }}
            />
          )}

          {/* TAB 4: MANAGE BLOGS */}
          {activeTab === 'blogs' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
                    STREET JOURNAL EDITORIAL ARCHIVE
                  </h2>
                  <p className="text-xs text-zinc-400 font-sans mt-0.5">
                    Manage essays, edit content, and review published streetwear culture articles.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('add_blog')}
                  className="flex items-center gap-2 px-4 py-2 bg-neon-lime text-black font-black uppercase text-xs"
                >
                  <PenTool className="w-4 h-4" />
                  <span>WRITE ESSAY</span>
                </button>
              </div>

              <BlogManagementTable
                blogs={blogs}
                onBlogUpdated={(u) => setBlogs(prev => prev.map(b => b.id === u.id ? u : b))}
                onBlogDeleted={(id) => setBlogs(prev => prev.filter(b => b.id !== id))}
                onRefresh={loadDashboardData}
              />
            </div>
          )}

          {/* TAB 5: WRITE NEW BLOG */}
          {activeTab === 'add_blog' && (
            <BlogUploadForm
              onSuccess={(newBlog) => {
                setBlogs(prev => [newBlog, ...prev]);
                setActiveTab('blogs');
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}
