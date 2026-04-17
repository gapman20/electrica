import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderProvider } from './OrderContext';
import { authApi, contactApi, cmsApi, campaignApi } from '../services/api';

const AUTH_KEY = 'is_authenticated';
const ADMIN_PASS_KEY = 'admin_password';

const defaultContent = {
  siteName:  'Adventure',
  tagline:   'Tu destino para cartas coleccionables.',
  ctaButton: 'Contáctanos',

  seo: {
    title:       'Adventure | Cartas Coleccionables',
    description: 'Tu destino para cartas coleccionables. Pokémon, Yu-Gi-Oh!, Magic: The Gathering, Digimon y más.',
    keywords:    'cartas coleccionables, Pokémon, Yu-Gi-Oh!, Magic, Digimon, Dragon Ball, One Piece, Lorcana, TCG',
  },

  social: {
    instagram: 'https://instagram.com/',
    youtube:   'https://youtube.com/',
    facebook:  'https://facebook.com/',
    tiktok:    '',
    linkedin:  '',
  },

  whatsappFloat: {
    number:  '+521234567890',
    message: 'Hola! Vi su página web y me gustaría solicitar más información.',
  },

  home: {
    badge:              'TIENDA TCG #1',
    title:              'Tu Destino para',
    titleAccent:        'Cartas Coleccionables',
    subtitle:           'Encuentra las mejores cartas de Pokémon, Yu-Gi-Oh!, Magic: The Gathering, Digimon, Dragon Ball, One Piece y más. Productos sellados y cartas sueltas.',
    ctaText:            'Ver Catálogo',
    ctaSecondary:       'Productos Sellados',
    featuresTitle:      '¿Por qué elegirnos?',
    featuresSubtitle:   'Ofrecemos la mejor experiencia de compra para coleccionistas y jugadores de TCG.',
    ctaSectionTitle:    '¿Listo para tu próxima carta?',
    ctaSectionSubtitle: 'Explora nuestro catálogo y encuentra esa carta que necesitas.',
  },

  about: {
    title:      'Sobre Nosotros',
    subtitle:   'Tu tienda de confianza para cartas coleccionables.',
    misionTitle:'Nuestra Misión',
    misionText: 'Brindar a los coleccionistas y jugadores de TCG acceso a la mejor selección de cartas, con servicio excepcional y precios justos.',
    visionTitle:'Nuestra Visión',
    visionText: 'Ser la tienda de cartas coleccionables más confiable y completa, ofreciendo una experiencia de compra excepcional para toda la comunidad TCG.',
  },

  services: {
    title:    'Nuestros Servicios',
    subtitle: 'Todo lo que necesitas para tu pasión por las cartas.',
    cards: [
      { id: '1', title: 'Cartas Sueltas',  desc: 'Amplio catálogo de cartas individuales de Pokémon, Yu-Gi-Oh!, Magic, Digimon y más.', active: true },
      { id: '2', title: 'Productos Sellados', desc: 'Booster Boxes, ETBs, Decks, Bundles y más. Siempre en preventa.', active: true },
      { id: '3', title: 'Preventas',    desc: 'Sé el primero en conseguir los nuevos sets. Preventas disponibles para todos los juegos.', active: true },
    ]
  },

  contact: {
    title:    'Contáctanos',
    subtitle: '¿Tienes alguna pregunta? ¿Necesitas ayuda para encontrar una carta específica?',
    email:    'contacto@adventure.com',
    phone:    '+52 123 456 7890',
    address:  'Ciudad de México, México',
    hours:    'Lun-Sáb: 10am - 8pm',
  },

  footer: {
    copyright: '© 2024 Adventure. Todos los derechos reservados.',
    disclaimer: 'Pokémon © 1995-2024 Nintendo/Creatures Inc./GAME FREAK inc. Magic: The Gathering © Wizards of the Coast. Yu-Gi-Oh! © Konami.',
  },
};

const defaultImages = {
  logo:          null,
  heroBg:        null,
  aboutHero:     null,
  aboutImage1:   null,
  aboutImage2:   null,
  aboutImage3:   null,
  contactHero:   null,
  blogHero:      null,
  fallbackImages: [],
};

const defaultTheme = {
  accentPrimary:   '#f59e0b', // Gold/amber
  accentSecondary:  '#d97706', // Darker gold
  bgPrimary:       '#0f172a', // Dark blue/black
  bgSecondary:     '#1e293b', // Slate
  bgGlass:         'rgba(30, 41, 59, 0.7)',
  textPrimary:     '#f8fafc',
  textSecondary:   '#94a3b8',
  success:         '#10b981',
  error:           '#ef4444',
};

const defaultBlogPosts = [];
const defaultPages = [];
const defaultProducts = [];
const defaultAnalytics = { visits: 0, orders: 0 };

// Keys for localStorage
const CONTENT_KEY = 'site_content_v1';
const IMAGES_KEY  = 'site_images_v1';
const THEME_KEY   = 'site_theme_v1';
const BLOG_KEY    = 'site_blog_v1';
const PAGES_KEY   = 'site_pages_v1';
const PRODS_KEY   = 'site_products_v1';
const ANALYTICS_KEY = 'site_analytics_v1';
const INBOX_KEY   = 'site_inbox_v1';
const CAMPAIGNS_KEY = 'site_campaigns_v1';

const defaultCampaigns = [
  {
    id: 'camp-default',
    name: 'Oferta de Lanzamiento',
    discountPercent: 15,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: false,
    bannerText: '¡Oferta de Lanzamiento!',
    bannerColor: '#ef4444',
    selectedProducts: [],
  },
];

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function moveArrayItem(arr, index, direction) {
  const newArr = [...arr];
  if (direction === 'up' && index > 0) {
    [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
  } else if (direction === 'down' && index < newArr.length - 1) {
    [newArr[index + 1], newArr[index]] = [newArr[index], newArr[index + 1]];
  }
  return newArr;
}

function applyTheme(theme) {
  const root = document.documentElement;

  root.style.setProperty('--accent-primary',   theme.accentPrimary);
  root.style.setProperty('--accent-secondary',  theme.accentSecondary);
  root.style.setProperty('--accent-gold',       theme.accentPrimary);
  root.style.setProperty('--accent-gradient',   `linear-gradient(135deg, ${theme.accentPrimary}, ${theme.accentSecondary})`);

  root.style.setProperty('--bg-primary',   theme.bgPrimary);
  root.style.setProperty('--bg-secondary', theme.bgSecondary);
  root.style.setProperty('--bg-glass',     theme.bgGlass);
  root.style.setProperty('--glass-bg',     theme.bgGlass);
  root.style.setProperty('--glass-border', 'rgba(255,255,255,0.1)');

  root.style.setProperty('--text-primary', theme.textPrimary);
  root.style.setProperty('--text-secondary', theme.textSecondary);

  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-error',   theme.error);

  // Legacy support
  root.style.setProperty('--bg-dark', theme.bgPrimary);
}

export const SiteContext = createContext();

export const useSite = () => useContext(SiteContext);

export const SiteProvider = ({ children }) => {
  // Content state (site text/values)
  const [content, setContent] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTENT_KEY);
      if (saved) return deepMerge(defaultContent, JSON.parse(saved));
    } catch { }
    return defaultContent;
  });

  // Images state (base64)
  const [images, setImages] = useState(() => {
    try {
      const saved = localStorage.getItem(IMAGES_KEY);
      if (saved) return { ...defaultImages, ...JSON.parse(saved) };
    } catch { }
    return defaultImages;
  });

  // Theme state
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return { ...defaultTheme, ...JSON.parse(saved) };
    } catch { }
    return defaultTheme;
  });

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState(() => {
    try {
      const saved = localStorage.getItem(BLOG_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Pages state
  const [pages, setPages] = useState(() => {
    try {
      const saved = localStorage.getItem(PAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Products state (for quick stats)
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Analytics state
  const [analytics, setAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem(ANALYTICS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultAnalytics;
  });

  // Inbox state
  const [inbox, setInbox] = useState(() => {
    try {
      const saved = localStorage.getItem(INBOX_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

  // Campaigns state - Load from API first, fallback to localStorage
  const [campaigns, setCampaigns] = useState(() => {
    try {
      const saved = localStorage.getItem(CAMPAIGNS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultCampaigns;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(AUTH_KEY) === 'true';
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { applyTheme(theme); }, [theme]);
  useEffect(() => {
    // Only load contact messages for admin users with valid tokens
    const isAdmin = (() => {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('tcg_user');

      if (!token || !savedUser) return false;

      try {
        const user = JSON.parse(savedUser);
        return user?.role === 'ADMIN';
      } catch {
        return false;
      }
    })();

    if (isAdmin) {
      loadMessages();
    }
  }, []);

  // Load campaigns from API on mount
  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const apiCampaigns = await campaignApi.getAll();
        if (apiCampaigns && apiCampaigns.length > 0) {
          setCampaigns(apiCampaigns);
          localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(apiCampaigns));
        }
      } catch (err) {
        console.warn('[SiteContext] Could not load campaigns from API, using localStorage');
      }
    };
    loadCampaigns();
  }, []);

  // Load content from CMS API on mount (if enabled)
  useEffect(() => {
    const loadFromCMS = async () => {
      if (import.meta.env.VITE_USE_API !== 'true') {
        return; // Use localStorage only
      }

      try {
        console.log('[SiteContext] Loading content from CMS API...');

        const [contentData, blogData, pagesData, themeData] = await Promise.allSettled([
          cmsApi.content.getAll(),
          cmsApi.blog.getAll(),
          cmsApi.pages.getAll(),
          cmsApi.theme.getAll()
        ]);

        // Load site content
        if (contentData.status === 'fulfilled' && contentData.value.content) {
          console.log('[SiteContext] Loaded site content from CMS');
          setContent(prev => deepMerge(prev, contentData.value.content));
        }

        // Load blog posts
        if (blogData.status === 'fulfilled' && blogData.value.posts) {
          console.log(`[SiteContext] Loaded ${blogData.value.posts.length} blog posts from CMS`);
          setBlogPosts(blogData.value.posts);
        }

        // Load pages
        if (pagesData.status === 'fulfilled' && pagesData.value.pages) {
          console.log(`[SiteContext] Loaded ${pagesData.value.pages.length} pages from CMS`);
          setPages(pagesData.value.pages);
        }

        // Load theme
        if (themeData.status === 'fulfilled' && themeData.value.theme) {
          console.log('[SiteContext] Loaded theme from CMS');
          setTheme(prev => ({ ...prev, ...themeData.value.theme }));
        }

        console.log('[SiteContext] ✅ All CMS data loaded successfully');
      } catch (err) {
        console.warn('[SiteContext] Failed to load from CMS API, using localStorage:', err);
      }
    };

    loadFromCMS();
  }, []);

  // ─── Content helpers ─────────────────────────────────────────────────────────
  const updateContent = (path, value) => {
    setContent(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const updateServiceCard = (id, field, value) => {
    setContent(prev => {
      const services = [...(prev.services?.cards || [])];
      const index = services.findIndex(c => c.id === id);
      if (index !== -1) {
        services[index] = { ...services[index], [field]: value };
      }
      return { ...prev, services: { ...prev.services, cards: services } };
    });
  };

  const moveServiceCard = (id, direction) => {
    setContent(prev => {
      const services = [...(prev.services?.cards || [])];
      const index = services.findIndex(c => c.id === id);
      if (index === -1) return prev;
      return { ...prev, services: { ...prev.services, cards: moveArrayItem(services, index, direction) } };
    });
  };

  // ─── Blog helpers ────────────────────────────────────────────────────────────
  const createBlogPost = () => {
    const newPost = {
      id: `post-${Date.now()}`,
      title: 'Nueva Entrada',
      excerpt: 'Resumen de la entrada...',
      content: 'Escribe tu contenido aquí...',
      author: content.siteName || 'Admin',
      image: null,
      tags: '',
      published: false,
      createdAt: new Date().toISOString()
    };
    setBlogPosts(prev => [newPost, ...prev]);
    return newPost.id;
  };

  const updateBlogPost = (id, field, value) => {
    setBlogPosts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteBlogPost = (id) => {
    setBlogPosts(prev => prev.filter(p => p.id !== id));
  };

  const duplicateBlogPost = (id) => {
    const post = blogPosts.find(p => p.id === id);
    if (!post) return;
    const newPost = {
      ...post,
      id: `post-${Date.now()}`,
      title: `${post.title} (copia)`,
      published: false,
      createdAt: new Date().toISOString()
    };
    setBlogPosts(prev => [newPost, ...prev]);
  };

  // ─── Pages helpers ───────────────────────────────────────────────────────────
  const createPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      name: 'Nueva Página',
      path: `/page-${Date.now()}`,
      pageTitle: 'Nueva Página',
      pageSubtitle: '',
      pageText: '',
      pageImage: null,
      active: false,
      isCustom: true,
      createdAt: new Date().toISOString()
    };
    setPages(prev => [newPage, ...prev]);
    return newPage.id;
  };

  const updatePage = (id, field, value) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePage = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const movePage = (id, direction) => {
    setPages(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index === -1) return prev;
      return moveArrayItem(prev, index, direction);
    });
  };

  // ─── Products helpers ────────────────────────────────────────────────────────
  const createProduct = () => {
    const newProduct = {
      id: `prod-${Date.now()}`,
      name: 'Nuevo Producto',
      price: 0,
      description: '',
      imageUrl: '',
      active: true,
      createdAt: new Date().toISOString()
    };
    setProducts(prev => [newProduct, ...prev]);
    return newProduct.id;
  };

  const updateProduct = (id, field, value) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const moveProduct = (id, direction) => {
    setProducts(prev => {
      const index = prev.findIndex(p => p.id === id);
      if (index === -1) return prev;
      return moveArrayItem(prev, index, direction);
    });
  };

  // ─── Analytics helpers ───────────────────────────────────────────────────────
  const trackAnalytics = (event, data = {}) => {
    setAnalytics(prev => ({
      ...prev,
      visits: prev.visits + 1,
      lastVisit: new Date().toISOString(),
      ...data
    }));
  };

  // ─── Inbox helpers ───────────────────────────────────────────────────────────
  const addMessage = (msg) => setInbox(prev => [msg, ...prev]);

  const markMessageRead = (id) => {
    setInbox(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const deleteMessage = (id) => {
    setInbox(prev => prev.filter(m => m.id !== id));
  };

  const loadMessages = async () => {
    try {
      const data = await contactApi.getAll();
      const msgs = Array.isArray(data) ? data : (data.messages || []);
      setInbox(msgs);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // ─── Campaign helpers ───────────────────────────────────────────────────────
  const getActiveCampaign = () => {
    const now = new Date();
    return campaigns.find(c => {
      if (!c.active) return false;
      const start = new Date(c.startDate);
      const end = new Date(c.endDate);
      return now >= start && now <= end;
    }) || null;
  };

  const calculateDiscountedPrice = (originalPrice, campaign, productId = null) => {
    if (!campaign) return originalPrice;
    
    const selectedProducts = campaign.selectedProducts || [];
    if (selectedProducts.length > 0 && productId && !selectedProducts.includes(productId)) {
      return originalPrice;
    }
    
    const price = typeof originalPrice === 'number' ? originalPrice : parseFloat(String(originalPrice).replace(/[^0-9.]/g, '')) || 0;
    const discount = price * (campaign.discountPercent / 100);
    return Math.round((price - discount) * 100) / 100;
  };

  const createCampaign = async () => {
    const newCampaign = {
      id: `camp-${Date.now()}`,
      name: 'Nueva Campaña',
      discountPercent: 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: false,
      bannerText: '¡Oferta Especial!',
      bannerColor: '#f59e0b',
      selectedProducts: [],
    };

    // Save to API first
    try {
      const created = await campaignApi.create(newCampaign);
      setCampaigns(prev => {
        const updated = [created, ...prev];
        localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
        return updated;
      });
      return created.id;
    } catch (err) {
      // Fallback to localStorage if API fails
      console.warn('[SiteContext] Failed to create campaign in API, saving locally');
      setCampaigns(prev => {
        const updated = [newCampaign, ...prev];
        localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
        return updated;
      });
      return newCampaign.id;
    }
  };

  const updateCampaign = async (id, field, value) => {
    // Update locally first (optimistic update)
    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Then sync to API
    try {
      await campaignApi.update(id, { [field]: value });
    } catch (err) {
      console.warn('[SiteContext] Failed to sync campaign update to API:', err);
    }
  };

  const deleteCampaign = async (id) => {
    // Remove locally first
    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Then delete from API
    try {
      await campaignApi.delete(id);
    } catch (err) {
      console.warn('[SiteContext] Failed to delete campaign from API:', err);
    }
  };

  const updateTheme = (key, value) => setTheme(prev => ({ ...prev, [key]: value }));
  const resetTheme  = () => setTheme(defaultTheme);

  const updateImage = (key, base64, index = null) => {
    setImages(prev => {
      if (index !== null) {
        const arr = [...(prev[key] || [])];
        arr[index] = base64;
        return { ...prev, [key]: arr };
      }
      return { ...prev, [key]: base64 };
    });
  };
  const removeImage = (key, index = null) => updateImage(key, null, index);

  const saveContent = async () => {
    try {
      setSaveStatus('saving');

      // Always save to localStorage as backup
      localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
      localStorage.setItem(IMAGES_KEY,  JSON.stringify(images));
      localStorage.setItem(THEME_KEY,   JSON.stringify(theme));
      localStorage.setItem(BLOG_KEY,    JSON.stringify(blogPosts));
      localStorage.setItem(PAGES_KEY,   JSON.stringify(pages));
      localStorage.setItem(PRODS_KEY,   JSON.stringify(products));
      localStorage.setItem(ANALYTICS_KEY,JSON.stringify(analytics));
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));

      // If API mode is enabled, also save to backend
      if (import.meta.env.VITE_USE_API === 'true') {
        try {
          await Promise.all([
            cmsApi.content.update(content),
            cmsApi.theme.update(theme)
          ]);

          // Sync blog posts
          for (const post of blogPosts) {
            if (post.id?.startsWith('post-')) {
              await cmsApi.blog.create(post);
            } else {
              await cmsApi.blog.update(post.id, post);
            }
          }

          // Sync pages
          for (const page of pages) {
            if (page.id?.startsWith('page-')) {
              await cmsApi.pages.create(page);
            } else {
              await cmsApi.pages.update(page.id, page);
            }
          }

          console.log('[SiteContext] Content saved to CMS API successfully');
        } catch (apiError) {
          console.warn('[SiteContext] CMS API save failed, but localStorage was updated:', apiError);
        }
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error("Error saving content:", error);
      setSaveStatus('error');
    } finally {
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const resetContent = () => {
    [CONTENT_KEY, IMAGES_KEY, THEME_KEY, BLOG_KEY, PAGES_KEY, PRODS_KEY, ANALYTICS_KEY, CAMPAIGNS_KEY].forEach(k => localStorage.removeItem(k));
    setContent(defaultContent);
    setImages(defaultImages);
    setTheme(defaultTheme);
    setBlogPosts(defaultBlogPosts);
    setPages(defaultPages);
    setProducts(defaultProducts);
    setCampaigns(defaultCampaigns);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Auth helpers
  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem('token', data.token);
      localStorage.setItem('tcg_user', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('tcg_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    return await authApi.changePassword(currentPassword, newPassword);
  };

  return (
    <SiteContext.Provider value={{
      content, updateContent, updateServiceCard, moveServiceCard,
      images,  updateImage, removeImage,
      theme,   updateTheme, resetTheme,
      blogPosts, createBlogPost, updateBlogPost, deleteBlogPost, duplicateBlogPost,
      pages, createPage, updatePage, deletePage, movePage,
      products, createProduct, updateProduct, deleteProduct, moveProduct,
      analytics, trackAnalytics,
      inbox, addMessage, markMessageRead, deleteMessage, loadMessages,
      campaigns, setCampaigns, createCampaign, updateCampaign, deleteCampaign,
      getActiveCampaign, calculateDiscountedPrice,
      isAuthenticated, login, logout, changePassword,
      saveContent, resetContent, saveStatus, loadingDb,
      user,
    }}>
      <OrderProvider>
        {children}
      </OrderProvider>
    </SiteContext.Provider>
  );
};