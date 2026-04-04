import React, { createContext, useContext, useState, useEffect } from 'react';
import { OrderProvider } from './OrderContext';
import { authApi, contactApi } from '../services/api';

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
      { id: '4', title: 'Asesoría',       desc: 'Te ayudamos a encontrar las cartas que necesitas para tu colección o deck.', active: true },
    ],
  },

  contact: {
    title:    'Contáctanos',
    subtitle: '¿Tienes preguntas? Estamos aquí para ayudarte.',
    whatsapp: '+52 (123) 456-7890',
    email:    'hola@adventuretcg.com',
    address:  'Tu ciudad, México.',
    mapLat:   19.4326,
    mapLng:   -99.1332,
  },

  footer: {
    description: 'Tu destino para cartas coleccionables. Pokémon, Yu-Gi-Oh!, Magic y más.',
    copyright:   'Adventure TCG. Todos los derechos reservados.',
  },
};

const defaultBlogPosts = [
  {
    id: 'post-1',
    title:     'Tendencias de Diseño Web para 2024',
    excerpt:   'Descubre los estilos visuales y arquitecturas tecnológicas que dominarán la industria digital este año.',
    content:   'A medida que entramos en un nuevo año, el panorama del diseño web continúa evolucionando rápidamente. Las interfaces oscuras (Dark Mode), el minimalismo funcional y las micro-interacciones suaves ya no son opcionales, sino expectativas estándar de los usuarios premium.\n\nEn este artículo exploraremos cómo la Tipografía Fluida y los Diseños Glassmórficos están dominando el espacio tecnológico, proporcionando experiencias de usuario (UX) inmersivas que retienen por más tiempo a los clientes potenciales.\n\nEl glassmorfismo avanzado utiliza fondos semi-transparentes con desenfoque de fondo, creando una jerarquía visual impresionante especialmente cuando se superpone en fondos fotográficos profundos.',
    author:    'Admin',
    date:      'Oct 12, 2023',
    image:     null,
    tags:      'diseño web, tendencias, UI/UX',
    published: true,
  },
  {
    id: 'post-2',
    title:     'Cómo optimizar tu SEO Local',
    excerpt:   'Estrategias probadas para hacer que tu negocio aparezca primero en las búsquedas de Google Maps de tu ciudad.',
    content:   'El SEO local es fundamental para cualquier negocio que atienda a clientes en una zona geográfica específica. Aparecer en los primeros resultados de Google Maps puede marcar la diferencia entre tener o no tener clientes.\n\nEn esta guía aprenderás a optimizar tu perfil de Google Business, cómo conseguir reseñas auténticas de clientes, y las palabras clave locales que debes incluir en tu sitio web para dominar tu mercado local.',
    author:    'Equipo Marketing',
    date:      'Oct 05, 2023',
    image:     null,
    tags:      'SEO, marketing local, Google',
    published: true,
  },
  {
    id: 'post-3',
    title:     'La importancia de un panel autogestionable',
    excerpt:   'Por qué depender de un programador para cada cambio de texto es algo del pasado y cómo un CMS ahorra costos.',
    content:   'En el mundo empresarial moderno, la agilidad es clave. Tener que esperar días o semanas para que un programador actualice el texto de tu landing page es una desventaja competitiva seria.\n\nLos paneles de administración modernos permiten a cualquier persona del equipo actualizar contenido, imágenes, precios y más, sin tocar una sola línea de código. Esto reduce costos, aumenta la velocidad de respuesta al mercado y empodera a tu equipo.',
    author:    'Admin',
    date:      'Sep 28, 2023',
    image:     null,
    tags:      'CMS, administración, negocios',
    published: true,
  },
];

const defaultPages = [
  { id: 'home', name: 'Inicio', path: '/', active: true, isCustom: false },
  { id: 'sellados', name: 'Productos', path: '/productos', active: true, isCustom: false },
  { id: 'cards', name: 'Cartas Sueltas', path: '/catalogo', active: true, isCustom: false },
  { id: 'orders', name: 'Mis Pedidos', path: '/mis-pedidos', active: true, isCustom: false },
  { id: 'contact', name: 'Contacto', path: '/contacto', active: true, isCustom: false },
];

const defaultProducts = [
  { id: 'prod-1', name: 'Foco LED 12W', description: 'Foco LED luz fría, alto rendimiento y bajo consumo. Ideal para interiores y exteriores techados.', price: '$45.00', image: null, active: true },
  { id: 'prod-2', name: 'Cable Calibre 12 THW', description: 'Rollo de cable de cobre de 100m. Resistente al calor y humedad. Colores disponibles: rojo, negro, verde y blanco.', price: '$1,250.00', image: null, active: true },
  { id: 'prod-3', name: 'Centro de Carga 2 Polos', description: 'Centro de carga QO para montaje de sobreponer, incluye zapatas principales.', price: '$220.00', image: null, active: true },
  { id: 'prod-4', name: 'Contacto Duplex con Placa', description: 'Contacto polarizado en color blanco, diseño moderno y fácil instalación.', price: '$35.00', image: null, active: true },
];

const defaultTheme = {
  accentPrimary:   '#f59e0b',
  accentSecondary: '#d97706',
  accentGold:      '#f59e0b',
  bgPrimary:       '#050505',
  bgSecondary:     '#0a0a0d',
  bgTertiary:      '#111116',
  textPrimary:     '#ffffff',
  textSecondary:   '#a1a1aa',
  navbarColor:     '#0a0a0d',
  cardBg:          '#0f0f14',
  textNavbarPrimary:   '#ffffff',
  textNavbarSecondary: '#a1a1aa',
  textCardPrimary:     '#ffffff',
  textCardSecondary:   '#a1a1aa',
  newsletterBg:    'linear-gradient(135deg, #f59e0b, #d97706)',
};

const defaultImages = {
  logo:      null,
  heroBg:    null,
  aboutHero: null,
  portfolio: [null, null, null, null, null, null],
};

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
  root.style.setProperty('--accent-glow',       `${theme.accentPrimary}66`);
  root.style.setProperty('--bg-primary',        theme.bgPrimary);
  root.style.setProperty('--bg-secondary',      theme.bgSecondary);
  root.style.setProperty('--bg-tertiary',       theme.bgTertiary);
  root.style.setProperty('--text-primary',      theme.textPrimary);
  root.style.setProperty('--text-secondary',    theme.textSecondary);

  root.style.setProperty('--text-navbar-primary',   theme.textNavbarPrimary || theme.textPrimary);
  root.style.setProperty('--text-navbar-secondary', theme.textNavbarSecondary || theme.textSecondary);
  root.style.setProperty('--text-card-primary',     theme.textCardPrimary || theme.textPrimary);
  root.style.setProperty('--text-card-secondary',   theme.textCardSecondary || theme.textSecondary);
  root.style.setProperty('--newsletter-bg',         theme.newsletterBg || 'linear-gradient(135deg, #f59e0b, #d97706)');

  const navColor = theme.navbarColor || theme.bgSecondary;
  root.style.setProperty('--nav-bg',      navColor + 'e6');
  root.style.setProperty('--nav-menu-bg', navColor + 'fa');

  const card = theme.cardBg || theme.bgSecondary;
  root.style.setProperty('--glass-bg', card);

  const isLight = theme.bgPrimary > '#888888';
  root.style.setProperty('--glass-border',
    isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.09)');
}

const SiteContext = createContext(null);

export const SiteProvider = ({ children }) => {
  const [content, setContent] = useState(() => {
    try {
      const saved = localStorage.getItem(CONTENT_KEY);
      if (saved) return deepMerge(defaultContent, JSON.parse(saved));
    } catch { }
    return defaultContent;
  });

  const [images, setImages] = useState(() => {
    try {
      const saved = localStorage.getItem(IMAGES_KEY);
      if (saved) return { ...defaultImages, ...JSON.parse(saved) };
    } catch { }
    return defaultImages;
  });

  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return { ...defaultTheme, ...JSON.parse(saved) };
    } catch { }
    return defaultTheme;
  });

  const [blogPosts, setBlogPosts] = useState(() => {
    try {
      const saved = localStorage.getItem(BLOG_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultBlogPosts;
  });

  const [pages, setPages] = useState(() => {
    try {
      const saved = localStorage.getItem(PAGES_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultPages;
  });

  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem(PRODS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return defaultProducts;
  });

  const [analytics, setAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem(ANALYTICS_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return {
      whatsapp_clicks: 0,
      visits_simulated: [120, 150, 200, 180, 250, 310, 290]
    };
  });

  const [inbox, setInbox] = useState(() => {
    try {
      const saved = localStorage.getItem(INBOX_KEY);
      if (saved) return JSON.parse(saved);
    } catch { }
    return [];
  });

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
  useEffect(() => { loadMessages(); }, []);

  const updateContent = (path, value) => {
    setContent(prev => {
      const next = deepMerge({}, prev);
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateServiceCard = (index, field, value) => {
    setContent(prev => {
      const next = deepMerge({}, prev);
      next.services.cards[index][field] = value;
      return next;
    });
  };

  const moveServiceCard = (index, direction) => {
    setContent(prev => {
      const next = deepMerge({}, prev);
      next.services.cards = moveArrayItem(next.services.cards, index, direction);
      return next;
    });
  };

  const createBlogPost = () => {
    const newPost = {
      id:        `post-${Date.now()}`,
      title:     'Nuevo Artículo',
      excerpt:   'Escribe aquí un resumen del artículo...',
      content:   'Escribe el contenido completo del artículo aquí...',
      author:    'Admin',
      date:      new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }),
      image:     null,
      tags:      '',
      published: false,
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
    setBlogPosts(prev => {
      const original = prev.find(p => p.id === id);
      if (!original) return prev;
      const copy = { ...original, id: `post-${Date.now()}`, title: `${original.title} (copia)`, published: false };
      return [copy, ...prev];
    });
  };

  const createPage = () => {
    const newPage = {
      id:          `page-${Date.now()}`,
      name:        'Nueva Página',
      path:        `/nueva-pagina-${Date.now().toString().slice(-4)}`,
      active:      false,
      isCustom:    true,
      pageTitle:   'Título de tu nueva página',
      pageSubtitle:'Describe brevemente de qué trata esta página.',
      pageText:    'Escribe aquí todo lo que quieras contar. Puedes presionar "Enter" para crear nuevos párrafos.',
      pageImage:   null
    };
    setPages(prev => [...prev, newPage]);
    return newPage.id;
  };

  const updatePage = (id, field, value) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const deletePage = (id) => {
    setPages(prev => prev.filter(p => p.id !== id));
  };

  const movePage = (index, direction) => {
    setPages(prev => moveArrayItem(prev, index, direction));
  };

  const createProduct = () => {
    const newProduct = {
      id:          `prod-${Date.now()}`,
      name:        'Nuevo Producto',
      description: 'Descripción breve del producto.',
      price:       '$0.00',
      image:       null,
      active:      true
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

  const moveProduct = (index, direction) => {
    setProducts(prev => moveArrayItem(prev, index, direction));
  };

  const trackAnalytics = (event) => {
    setAnalytics(prev => {
      const next = { ...prev };
      if (event === 'whatsapp') next.whatsapp_clicks = (next.whatsapp_clicks || 0) + 1;
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const login = async (email, pass) => {
    if (import.meta.env.VITE_USE_API === 'true') {
      const result = await authApi.adminLogin(email, pass);
      if (result.success) {
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
        setUser({ email, isAdmin: true });
        return true;
      }
      return false;
    } else {
      const storedPass = localStorage.getItem(ADMIN_PASS_KEY) || 'admin123';
      if (pass === storedPass) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem('auth_token', 'local-admin-token');
        setIsAuthenticated(true);
        setUser({ email, isAdmin: true });
        return true;
      }
      return false;
    }
  };

  const logout = async () => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tcg_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const changePassword = async (oldPass, newPass) => {
    const storedPass = localStorage.getItem(ADMIN_PASS_KEY) || 'admin123';
    if (oldPass === storedPass) {
      localStorage.setItem(ADMIN_PASS_KEY, newPass);
      return true;
    }
    return false;
  };

  const addMessage = async (msg) => {
    try {
      const newMsg = await contactApi.send(msg);
      setInbox(prev => [{ ...newMsg, createdAt: newMsg.createdAt }, ...prev]);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const markMessageRead = async (id) => {
    try {
      await contactApi.markRead(id);
      setInbox(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await contactApi.delete(id);
      setInbox(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const messages = await contactApi.getAll();
      setInbox(messages);
      localStorage.setItem(INBOX_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error loading messages:', error);
      const saved = localStorage.getItem(INBOX_KEY);
      if (saved) setInbox(JSON.parse(saved));
    }
  };

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

  const createCampaign = () => {
    const newCampaign = {
      id: `camp-${Date.now()}`,
      name: 'Nueva Campaña',
      discountPercent: 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      bannerText: '¡Oferta Especial!',
      bannerColor: '#f59e0b',
      selectedProducts: [],
    };
    setCampaigns(prev => {
      const updated = [newCampaign, ...prev];
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
      return updated;
    });
    return newCampaign.id;
  };

  const updateCampaign = (id, field, value) => {
    setCampaigns(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, [field]: value } : c);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCampaign = (id) => {
    setCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id);
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(updated));
      return updated;
    });
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
      
      localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
      localStorage.setItem(IMAGES_KEY,  JSON.stringify(images));
      localStorage.setItem(THEME_KEY,   JSON.stringify(theme));
      localStorage.setItem(BLOG_KEY,    JSON.stringify(blogPosts));
      localStorage.setItem(PAGES_KEY,   JSON.stringify(pages));
      localStorage.setItem(PRODS_KEY,   JSON.stringify(products));
      localStorage.setItem(ANALYTICS_KEY,JSON.stringify(analytics));
      localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
      
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
      campaigns, createCampaign, updateCampaign, deleteCampaign,
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

export const useSite = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite must be used inside SiteProvider');
  return ctx;
};

export { defaultContent, defaultTheme };
