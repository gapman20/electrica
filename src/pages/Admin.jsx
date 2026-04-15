import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSite } from '../context/SiteContext';
import { useToast } from '../components/Toast';
import ImageUploader from '../components/ImageUploader';
import scryfallApi from '../services/scryfallApi';
import tcgdexApi from '../services/tcgdexApi';
import pokemonTcgApi from '../services/pokemonTcgApi';
import pokewalletApi from '../services/pokewalletApi';
import currencyApi from '../services/currencyApi';
import api, { getGameValue, orderApi } from '../services/api';
import Swal from 'sweetalert2';
import {
  LayoutDashboard, FileText, Settings, Mail, Info,
  Save, RotateCcw, CheckCircle, AlertCircle, Eye,
  Image as ImageIcon, Palette, BarChart2, Globe,
  MessageSquare, Users, TrendingUp, Monitor,
  ToggleLeft, ToggleRight, RefreshCw, Plus, Trash2, Package,
  Columns, ArrowUp, ArrowDown, Bold, List, BarChart, Lock,
  Gamepad2, Layers, Tag, Calendar, Percent, Search,
  Truck
} from 'lucide-react';

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const showDeleteAlert = (itemType = 'este elemento') => {
  return Swal.fire({
    title: '¿Eliminar?',
    text: `¿Estás seguro de que deseas eliminar ${itemType}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
  });
};

const showSuccessAlert = (title, message) => {
  Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Aceptar',
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
    timer: 2000,
    showConfirmButton: true
  });
};

// ─── Shared input style ───────────────────────────────────────────────────────
const inputSt = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '0.95rem',
  outline: 'none', resize: 'vertical',
  transition: 'border-color 0.2s',
};
const focus = e => (e.target.style.borderColor = 'var(--accent-gold)');
const blur = e => (e.target.style.borderColor = 'var(--glass-border)');

const sectionTitle = {
  fontFamily: 'var(--font-heading)', fontSize: '1.15rem', fontWeight: '800',
  marginBottom: '2rem', paddingBottom: '1rem',
  borderBottom: '1px solid var(--glass-border)', color: 'var(--text-primary)',
  display: 'flex', alignItems: 'center', gap: '10px',
};

// ─── Reusable components ──────────────────────────────────────────────────────
const Field = ({ label, path, value, type = 'text', onChange, hint }) => (
  <div style={{ marginBottom: '1.2rem' }}>
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>
      {label}
    </label>
    {hint && <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', opacity: 0.65, marginBottom: '0.4rem' }}>{hint}</p>}
    {type === 'textarea'
      ? <textarea value={value} rows={3} onChange={e => onChange(path, e.target.value)} style={inputSt} onFocus={focus} onBlur={blur} />
      : <input type={type} value={value} onChange={e => onChange(path, e.target.value)} style={inputSt} onFocus={focus} onBlur={blur} />
    }
  </div>
);

const ColorPicker = ({ label, value, onChange, hint }) => (
  <div style={{ marginBottom: '1.4rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <input
        type="color" value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width: '52px', height: '52px', border: 'none', borderRadius: '12px', cursor: 'pointer', padding: '4px', background: 'transparent' }}
      />
    </div>
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>{label}</label>
      {hint && <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', opacity: 0.6 }}>{hint}</p>}
      <code style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontFamily: 'monospace' }}>{value}</code>
    </div>
  </div>
);

// StatCard for Dashboard
const StatCard = ({ label, val, sub, color, Icon }) => (
  <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', borderTop: `3px solid ${color}`, position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, right: 0, opacity: 0.05, transform: 'translate(20%, -20%)' }}><Icon size={120} /></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</p>
      <div style={{ width: '36px', height: '36px', background: `${color}18`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
    </div>
    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: '900', marginBottom: '0.3rem', position: 'relative', zIndex: 1 }}>{val}</h3>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
      {typeof sub === 'string' && sub.includes('+') && <TrendingUp size={12} color="#10b981" />}
      {sub}
    </p>
  </div>
);

// CSS Bar Chart Component
const SimpleBarChart = ({ data }) => {
  const max = Math.max(...data, 1);
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  
  return (
    <div style={{ padding: '2rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '1.5rem', marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '800' }}>Visitas del Sitio</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Últimos 7 días (Datos Simulados)</p>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-gold)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={14} /> +12% esta semana
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '180px', paddingTop: '20px' }}>
        {data.map((val, i) => {
          const heightPct = Math.max((val / max) * 100, 2);
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '6px 6px 0 0' }}>
                <div 
                  className="chart-bar"
                  title={`${val} visitas`}
                  style={{ 
                    width: '80%', height: `${heightPct}%`, 
                    background: i === data.length - 1 ? 'var(--accent-gold)' : 'var(--accent-gold)',
                    opacity: i === data.length - 1 ? 1 : 0.6,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.5s ease-out',
                    animation: `growUp 1s ease-out forwards ${i * 0.1}s`
                  }} 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{labels[i]}</span>
            </div>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes growUp { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); transform-origin: bottom; } }
        .chart-bar:hover { opacity: 1 !important; filter: brightness(1.2); cursor: pointer; }
      `}} />
    </div>
  );
};

// MD Toolbar
const Toolbar = ({ onFormat }) => (
  <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
    <button onClick={() => onFormat('bold')} title="Negrita" style={{ padding: '4px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}><Bold size={14} /></button>
    <button onClick={() => onFormat('list')} title="Lista" style={{ padding: '4px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}><List size={14} /></button>
  </div>
);

// Format helper
const insertFormat = (path, value, formatType, onChange) => {
  const formats = { 'bold': '**Texto Destacado**', 'list': '\\n- Punto de lista' };
  const strVal = value || '';
  onChange(path, strVal + (strVal && strVal !== '' ? ' ' : '') + formats[formatType]);
};

// ─── Sidebar Sections (with dynamic badges) ─────────────────────────────────────
const AdminSections = ({ unreadOrders, unreadMessages }) => [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
  { 
    id: 'orders', 
    label: 'Pedidos', 
    icon: <Package size={17} />,
    badge: unreadOrders > 0 ? unreadOrders : null
  },
  { 
    id: 'inbox', 
    label: 'Bandeja de Entrada', 
    icon: <Mail size={17} />,
    badge: unreadMessages > 0 ? unreadMessages : null
  },
  { id: 'sellados', label: 'Sellados', icon: <Package size={17} /> },
  { id: 'cards', label: 'Cartas Sueltas', icon: <Layers size={17} /> },
  { id: 'campaigns', label: 'Campañas Oferta', icon: <Tag size={17} /> },
  { id: 'theme', label: 'Colores & Tema', icon: <Palette size={17} /> },
  { id: 'general', label: 'General', icon: <Settings size={17} /> },
  { id: 'seo', label: 'SEO', icon: <Globe size={17} /> },
  { id: 'home', label: 'Inicio', icon: <Monitor size={17} /> },
  { id: 'about', label: 'Nosotros', icon: <Info size={17} /> },
  { id: 'blog', label: 'Blog', icon: <FileText size={17} /> },
  { id: 'contact', label: 'Contacto', icon: <Mail size={17} /> },
  { id: 'social', label: 'Redes Sociales', icon: <Globe size={17} /> },
  { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={17} /> },
  { id: 'footer', label: 'Footer', icon: <FileText size={17} /> },
  { id: 'images', label: 'Imágenes', icon: <ImageIcon size={17} /> },
];

// ─── Main Admin Component ─────────────────────────────────────────────────────
const Admin = () => {
  const {
    content, updateContent, updateServiceCard, moveServiceCard,
    images, updateImage,
    theme, updateTheme, resetTheme,
    blogPosts = [], createBlogPost, updateBlogPost, deleteBlogPost, duplicateBlogPost,
    products = [], createProduct, updateProduct, deleteProduct, moveProduct,
    analytics, trackAnalytics,
    inbox = [], markMessageRead, deleteMessage, loadMessages, logout,
    campaigns = [], createCampaign, updateCampaign, deleteCampaign,
    saveContent, resetContent, saveStatus,
  } = useSite();
  const navigate = useNavigate();
  const toast = useToast();

  const [active, setActive] = useState('dashboard');
  const [editPost, setEditPost] = useState(null);
  const [splitView, setSplitView] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Cards state for TCG card management
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [newCardId, setNewCardId] = useState(null);
  const [savingCard, setSavingCard] = useState(false);
  
  // Sellados state for sealed products
  const [sellados, setSellados] = useState([]);
  const [selladosLoading, setSelladosLoading] = useState(false);
  const [editingSellado, setEditingSellado] = useState(null);
  const [newSelladoId, setNewSelladoId] = useState(null);
  const [savingSellado, setSavingSellado] = useState(false);

  // Dashboard state
  const [dashboardPeriod, setDashboardPeriod] = useState('Hoy');
  const [dashboardOrders, setDashboardOrders] = useState([]);

  // Campaigns state
  const [editingCampaign, setEditingCampaign] = useState(null);

  // Real-time notifications state
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef(null);

  // Scryfall search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultsImages, setSearchResultsImages] = useState({});
  const [searching, setSearching] = useState(false);
  const [selectedGame, setSelectedGame] = useState('magic');
  const [exchangeRate, setExchangeRate] = useState(null);
  const searchInProgressRef = useRef(false);
  
  // Load exchange rate on mount
  useEffect(() => {
    currencyApi.getExchangeRate().then(rate => setExchangeRate(rate));
  }, []);

  // Helper to format price in MXN
  const formatPrice = (priceUSD) => {
    if (!priceUSD || priceUSD === 0) return 'Sin precio';
    const price = parseFloat(priceUSD);
    if (exchangeRate) {
      const mxn = price * exchangeRate;
      return `$${mxn.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MXN`;
    }
    return `$${price.toFixed(2)} USD`;
  };
  
  // Auto-search in external APIs as you type (1000ms debounce to avoid rate limits)
  const searchTimeoutRef = useRef(null);
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    // Don't search if already searching (prevents rate limit)
    if (searching) {
      return;
    }
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleCardSearch();
    }, 1000);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery]);
  const lastMessageId = React.useRef(null);
  const lastMessageDate = React.useRef(null);
  const lastOrderId = React.useRef(null);
  const lastOrderDate = React.useRef(null);

  // Orders state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderPage, setOrderPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ PENDING: 0, PROCESSING: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 });
  const ORDER_LIMIT = 10;

  // Load orders from API (only update if there are changes)
  const loadOrders = async (showLoading = false, customLimit = null) => {
    if (showLoading) setOrdersLoading(true);
    try {
      const params = { page: 1, limit: customLimit || ORDER_LIMIT };
      if (orderFilter !== 'all') params.status = orderFilter;
      const data = await orderApi.getAll(params);
      const newOrders = data.orders || [];
      const total = data.pagination?.total || 0;
      setOrderTotal(total);

      // Only update if there are actual changes (different length or different IDs)
      const currentIds = orders.map(o => o.id).sort().join(',');
      const newIds = newOrders.map(o => o.id).sort().join(',');

      if (currentIds !== newIds) {
        setOrders(newOrders);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      if (showLoading) setOrdersLoading(false);
    }
  };

  // Load total count for each status from the server
  const loadStatusCounts = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      const results = await Promise.all(
        statuses.map(async (status) => {
          const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/orders?page=1&limit=1&status=${status}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await resp.json();
          return [status, data.pagination?.total || 0];
        })
      );
      // Also get the grand total (all statuses)
      const allResp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/orders?page=1&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const allData = await allResp.json();
      const allTotal = allData.pagination?.total || 0;

      setStatusCounts(Object.fromEntries(results));
      setOrderTotal(orderFilter === 'all' ? allTotal : (Object.fromEntries(results)[orderFilter] || 0));
    } catch (err) {
      console.error('Error loading status counts:', err);
    }
  };

  useEffect(() => {
    if (active === 'inbox') {
      loadMessages();
    }
    if (active === 'orders' || active === 'dashboard') {
      loadOrders(true, active === 'dashboard' ? 100 : null);
      if (active === 'orders') loadStatusCounts();
    }
  }, [active, orderPage, orderFilter]);

  // Sync orders to dashboardOrders when loaded
  useEffect(() => {
    if (active === 'dashboard' && orders.length > 0) {
      setDashboardOrders(orders);
    }
  }, [orders, active]);

  // Poll badge counts every 15 seconds and show notifications when counts increase
  useEffect(() => {
    const POLL_INTERVAL = 15000; // 15 seconds - much less frequent than before
    let previousOrders = 0;
    let previousMessages = 0;

    const pollBadgeCounts = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/orders/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const stats = await response.json();
          
          // Show notification if counts increased
          if (stats.pendingOrders > previousOrders && previousOrders > 0) {
            const newOrders = stats.pendingOrders - previousOrders;
            console.log(`[Admin] 🛍️ ${newOrders} new order(s) detected`);
            
            Swal.fire({
              title: '🛍️ New Order(s)!',
              text: `${newOrders} new order(s) since last check`,
              icon: 'success',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 4000,
              background: '#10b981',
              color: '#fff'
            });
          }
          
          if (stats.unreadMessages > previousMessages && previousMessages > 0) {
            const newMessages = stats.unreadMessages - previousMessages;
            console.log(`[Admin] 📧 ${newMessages} new message(s) detected`);
            
            Swal.fire({
              title: '📧 New Message(s)!',
              text: `${newMessages} new message(s) since last check`,
              icon: 'info',
              toast: true,
              position: 'top-end',
              showConfirmButton: false,
              timer: 4000,
              background: '#3b82f6',
              color: '#fff'
            });
          }
          
          setUnreadOrders(stats.pendingOrders);
          setUnreadMessages(stats.unreadMessages);
          
          previousOrders = stats.pendingOrders;
          previousMessages = stats.unreadMessages;
        }
      } catch (error) {
        // Silently fail - will retry on next poll
      }
    };

    // Load initial counts immediately
    pollBadgeCounts();

    // Then poll every 15 seconds
    const interval = setInterval(pollBadgeCounts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Load initial badge counts
  useEffect(() => {
    const loadBadgeCounts = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/orders/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const stats = await response.json();
          setUnreadOrders(stats.pendingOrders);
          setUnreadMessages(stats.unreadMessages);
          console.log(`[Admin] Loaded badge counts: ${stats.pendingOrders} orders, ${stats.unreadMessages} messages`);
        }
      } catch (error) {
        console.error('[Admin] Error loading badge counts:', error);
      }
    };

    loadBadgeCounts();
  }, []);

  // Reset unread counters when viewing the tab
  useEffect(() => {
    if (active === 'inbox') {
      setUnreadMessages(0);
    }
    if (active === 'orders') {
      setUnreadOrders(0);
    }
  }, [active]);

  useEffect(() => {
    if (inbox.length > 0) {
      const latestMessage = inbox[0];
      if (lastMessageId.current === null) {
        lastMessageId.current = latestMessage.id;
        lastMessageDate.current = latestMessage.createdAt;
      } else if (lastMessageId.current !== latestMessage.id) {
        const currentDate = new Date(latestMessage.createdAt);
        const previousDate = lastMessageDate.current ? new Date(lastMessageDate.current) : null;
        if (!previousDate || currentDate > previousDate) {
          toast.success(`Nuevo mensaje de ${latestMessage.name}: "${latestMessage.message.substring(0, 30)}..."`);
        }
        lastMessageId.current = latestMessage.id;
        lastMessageDate.current = latestMessage.createdAt;
      }
    }
  }, [inbox.length]);

  useEffect(() => {
    if (orders.length > 0) {
      const latestOrder = orders[0];
      if (lastOrderId.current === null) {
        lastOrderId.current = latestOrder.id;
        lastOrderDate.current = latestOrder.createdAt;
      } else if (lastOrderId.current !== latestOrder.id) {
        const currentDate = new Date(latestOrder.createdAt);
        const previousDate = lastOrderDate.current ? new Date(lastOrderDate.current) : null;
        const isNew = Date.now() - currentDate.getTime() < 2 * 60 * 1000; // within 2 minutes
        if (isNew && (!previousDate || currentDate > previousDate)) {
          const total = latestOrder.total || latestOrder.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
          toast.success(`Nuevo pedido #${latestOrder.orderNumber}: $${Number(total).toLocaleString('es-MX')} MXN`);
        }
        lastOrderId.current = latestOrder.id;
        lastOrderDate.current = latestOrder.createdAt;
      }
    }
  }, [orders.length, toast]);

  const handleCardSearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) return;
    
    setSearching(true);
    setSearchResults([]);
    setSearchResultsImages({});
    
    try {
      if (selectedGame === 'pokemon') {
        // Use PokéWallet API for Pokémon only
        const result = await pokewalletApi.searchCards(searchQuery, { limit: 20 });
        const cards = result.results || [];
        setSearchResults(cards);
        
        // Load images in parallel
        if (cards.length > 0) {
          const cardIds = cards.map(c => c.id);
          const images = await pokewalletApi.getImageUrls(cardIds, 'low');
          const imageMap = {};
          images.forEach(img => {
            imageMap[img.id] = img.url;
          });
          setSearchResultsImages(imageMap);
        }
      } else if (selectedGame === 'yugioh') {
        // Use TCGdex API for Yu-Gi-Oh!
        const result = await tcgdexApi.searchCards(searchQuery, { limit: 20 });
        setSearchResults(result.results || result.data || []);
      } else {
        // Use Scryfall for Magic (default)
        // Add game filter to search query for better results
        const gameQuery = `${searchQuery} game:${selectedGame}`;
        const result = await scryfallApi.searchCards(gameQuery, { limit: 20 });
        setSearchResults(result.data || result.Results || []);
      }
    } catch (error) {
      console.error('Card search error:', error);
      // Don't show error toast for rate limits (429)
      if (error.message && error.message.includes('429')) {
        // Silently ignore rate limits
        return;
      }
      toast.error('Error al buscar cartas');
    } finally {
      setSearching(false);
    }
  };

  const importCard = async (card) => {
    let newCard;
    
    if (selectedGame === 'pokemon') {
      // From PokéWallet API - prices in USD, convert to MXN
      const info = card.card_info || {};
      const tcgPrice = card.tcgplayer?.prices?.[0];
      const cmPrice = card.cardmarket?.prices?.[0];
      const priceUSD = tcgPrice?.market_price || tcgPrice?.low_price || cmPrice?.avg || cmPrice?.trend || 0;
      const priceFoilUSD = tcgPrice?.sub_type_name === 'Holofoil' ? tcgPrice?.market_price : null;
      
      newCard = {
        id: `card-${Date.now()}`,
        name: info.name || 'Unknown Card',
        game: 'Pokemon',
        set: info.set_name || info.set_code || 'Unknown Set',
        setCode: info.set_code || info.set_id || '',
        rarity: info.rarity?.toLowerCase() || 'rare',
        // Store price in MXN (converted from USD)
        price: exchangeRate ? Math.round(priceUSD * exchangeRate) : Math.round(priceUSD * 20),
        priceFoil: priceFoilUSD ? (exchangeRate ? Math.round(priceFoilUSD * exchangeRate) : Math.round(priceFoilUSD * 20)) : null,
        stock: 1,
        active: true,
        description: info.card_text || '',
        imageUrl: `https://api.pokewallet.io/images/${card.id}?size=high`,
        condition: 'NM',
        pokemonId: card.id,
      };
    } else if (selectedGame === 'yugioh') {
      // From TCGdex API - prices in USD, convert to MXN
      const priceUSD = card.cardPrices?.[0]?.price || card.price || 0;
      newCard = {
        id: `card-${Date.now()}`,
        name: card.name || 'Unknown Card',
        game: 'Yu-Gi-Oh',
        set: card.set || card.localization?.en?.set || 'Unknown Set',
        setCode: card.setCode || card.id || '',
        rarity: card.rarity?.toLowerCase() || 'rare',
        price: exchangeRate ? Math.round(priceUSD * exchangeRate) : Math.round(priceUSD * 20),
        priceFoil: null,
        stock: 1,
        active: true,
        description: card.description || '',
        imageUrl: card.image || card.localization?.en?.image || null,
        condition: 'NM',
        tcgdexId: card.id,
      };
    } else {
      // From Scryfall API (Magic, etc.) - prices in USD, convert to MXN
      const priceUSD = card.prices?.usd ? parseFloat(card.prices.usd) : 0;
      const priceFoilUSD = card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null;
      newCard = {
        id: `card-${Date.now()}`,
        name: card.name || 'Unknown Card',
        game: selectedGame.charAt(0).toUpperCase() + selectedGame.slice(1),
        set: card.set_name || 'Unknown Set',
        setCode: card.set || '',
        rarity: card.rarity?.toLowerCase() || 'rare',
        price: exchangeRate ? Math.round(priceUSD * exchangeRate) : Math.round(priceUSD * 20),
        priceFoil: priceFoilUSD ? (exchangeRate ? Math.round(priceFoilUSD * exchangeRate) : Math.round(priceFoilUSD * 20)) : null,
        stock: 1,
        active: true,
        description: card.oracle_text || '',
        imageUrl: card.image_uris?.normal || card.image_uris?.small || card.card_faces?.[0]?.image_uris?.normal || null,
        condition: 'NM',
        scryfallId: card.id,
      };
    }
    
    try {
      const created = await api.cards.create(newCard);
      const cardWithId = created.id ? created : newCard;
      setCards(prev => [cardWithId, ...prev]);
      setEditingCard(cardWithId.id);
    } catch (err) {
      setCards(prev => [newCard, ...prev]);
      setEditingCard(newCard.id);
    }
    
    setSearchResults([]);
    setSearchQuery('');
    toast.success(`"${card.name}" importada`);
  };

  const onChange = (path, val) => updateContent(path, val);

  // Sample cards data
  const sampleCards = [
    { id: 'c1', name: 'Charizard ex - Ultra Rare', price: 3500, game: 'Pokemon', set: 'Phantasmal Flames', rarity: 'Ultra Rare', condition: 'NM', stock: 2, imageUrl: null, description: '', active: true },
    { id: 'c2', name: 'Mewtwo ex - Rare Holo', price: 890, game: 'Pokemon', set: 'Obsidian Flames', rarity: 'Rare', condition: 'NM', stock: 5, imageUrl: null, description: '', active: true },
    { id: 'c3', name: 'Pikachu - Common', price: 25, game: 'Pokemon', set: 'Paldean Fates', rarity: 'Common', condition: 'NM', stock: 20, imageUrl: null, description: '', active: true },
    { id: 'c4', name: 'Blue Eyes White Dragon - Ultra Rare', price: 4500, game: 'Yu-Gi-Oh', set: 'Structure Deck', rarity: 'Ultra Rare', condition: 'NM', stock: 1, imageUrl: null, description: '', active: true },
    { id: 'c5', name: 'Dark Magician - Rare', price: 1200, game: 'Yu-Gi-Oh', set: 'Structure Deck', rarity: 'Rare', condition: 'NM', stock: 3, imageUrl: null, description: '', active: true },
    { id: 'c6', name: 'Black Lotus - Rare', price: 15000, game: 'Magic', set: 'Alpha Edition', rarity: 'Rare', condition: 'LP', stock: 1, imageUrl: null, description: '', active: true },
  ];

  // Load cards from API when cards section is active
  useEffect(() => {
    if (active === 'cards' && cards.length === 0) {
      setCardsLoading(true);
      api.cards.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setCards(data);
          }
        })
        .catch(err => {
          console.error('Error loading cards:', err);
          setCards([]);
        })
        .finally(() => {
          setCardsLoading(false);
        });
    }
  }, [active]);

  // Sync sellados and cards when entering campaigns section
  useEffect(() => {
    if (active === 'campaigns') {
      Promise.all([
        api.products.getAll(),
        api.cards.getAll()
      ]).then(([selladosData, cardsData]) => {
        setSellados(selladosData);
        setCards(cardsData);
      }).catch(err => {
        console.error('Error syncing products for campaigns:', err);
      });
    }
  }, [active]);

  // Card CRUD operations (using API)
  const createCard = async () => {
    if (creatingCard) return;
    
    const tempId = `card-${Date.now()}`;
    setCreatingCard(true);
    setNewCardId(tempId);
    
    const newCard = {
      id: tempId,
      name: 'Nueva Carta',
      game: 'Pokemon',
      set: '',
      rarity: 'Common',
      price: 0,
      stock: 1,
      imageUrl: '',
      description: '',
      active: true,
      isNew: true,
      createdAt: new Date().toISOString()
    };
    
    setNewCardId(tempId);
    setCards(prev => [newCard, ...prev]);
    setEditingCard(tempId);
    setCreatingCard(false);
  };

  const saveCard = async (cardId) => {
    const card = cards.find(c => c.id === cardId);
    if (!card) return;
    
    setSavingCard(true);
    
    try {
      if (card.isNew) {
        const { isNew, ...cardData } = card;
        const created = await api.cards.create(cardData);
        const cardWithId = created.id ? created : { ...card, id: created.id || cardId };
        setCards(prev => prev.map(c => c.id === cardId ? { ...cardWithId, isNew: false } : c));
        setNewCardId(null);
        showSuccessAlert('¡Carta guardada!', `La carta "${card.name}" se ha guardado correctamente.`);
      } else {
        await api.cards.update(cardId, card);
        showSuccessAlert('¡Cambios guardados!', 'Los cambios se han guardado correctamente.');
      }
    } catch (err) {
      console.error('Error saving card:', err);
      toast.error('Error al guardar la carta');
    } finally {
      setSavingCard(false);
    }
  };

  const updateCard = (cardId, field, value) => {
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, [field]: value } : c));
  };

  const deleteCard = async (cardId) => {
    const result = await showDeleteAlert('esta carta');
    if (!result.isConfirmed) return;
    
    const card = cards.find(c => c.id === cardId);
    
    if (card?.isNew) {
      setCards(prev => prev.filter(c => c.id !== cardId));
      if (editingCard === cardId) setEditingCard(null);
      return;
    }
    
    setCards(prev => prev.filter(c => c.id !== cardId));
    try {
      await api.cards.delete(cardId);
      showSuccessAlert('¡Carta eliminada!', 'La carta ha sido eliminada correctamente.');
    } catch (err) {
      console.error('Error deleting card:', err);
    }
    if (editingCard === cardId) setEditingCard(null);
  };

  const uploadCardImage = async (cardId, file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        updateCard(cardId, 'imageUrl', base64);
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  // Sellados (sealed products) CRUD
  const sampleSellados = [
    { id: 's1', name: 'Charizard ex Ultra Premium Collection', price: 2990, game: 'pokemon', set: 'Phantasmal Flames', type: 'premium', badge: 'Nuevo', discountPercent: 0, stock: 5, imageUrl: null, active: true },
    { id: 's2', name: 'Mega Evolution Elite Trainer Box', price: 1270, game: 'pokemon', set: 'Mega Evolution', type: 'elite-trainer', badge: 'Oferta', discountPercent: 20, stock: 3, imageUrl: null, active: true },
    { id: 's3', name: 'Prismatic Evolutions Booster Box', price: 5800, game: 'pokemon', set: 'Scarlet & Violet', type: 'booster-box', badge: 'Preventa', discountPercent: 0, stock: 10, imageUrl: null, active: true },
    { id: 's4', name: 'Marvel Super Heroes Commander Deck', price: 890, game: 'magic', set: 'Marvel', type: 'deck', badge: 'Nuevo', discountPercent: 0, stock: 8, imageUrl: null, active: true },
    { id: 's5', name: 'Destined Rivals Booster Bundle', price: 760, game: 'pokemon', set: 'Scarlet & Violet', type: 'bundle', badge: 'Oferta', discountPercent: 20, stock: 12, imageUrl: null, active: true },
    { id: 's6', name: 'Digimon BT-15 Booster Box', price: 2200, game: 'digimon', set: 'BT-15', type: 'booster-box', badge: 'Nuevo', discountPercent: 0, stock: 4, imageUrl: null, active: true },
  ];

  // Load products and cards for dashboard on mount
  useEffect(() => {
    if (sellados.length === 0) {
      api.products.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setSellados(data);
          }
        })
        .catch(err => {
          console.error('Error loading sellados:', err);
        });
    }
    if (cards.length === 0) {
      api.cards.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setCards(data);
          }
        })
        .catch(err => {
          console.error('Error loading cards:', err);
        });
    }
  }, []);

  useEffect(() => {
    if (active === 'sellados' && sellados.length === 0) {
      setSelladosLoading(true);
      api.products.getAll()
        .then(data => {
          if (Array.isArray(data)) {
            setSellados(data);
          }
        })
        .catch(err => {
          console.error('Error loading sellados:', err);
          setSellados([]);
        })
        .finally(() => {
          setSelladosLoading(false);
        });
    }
  }, [active]);

  const createSellado = () => {
    const tempId = `sell-${Date.now()}`;
    
    const newItem = {
      id: tempId,
      name: 'Nuevo Producto Sellado',
      game: 'pokemon',
      set: '',
      type: 'booster-box',
      price: 0,
      discountPercent: 0,
      stock: 1,
      imageUrl: '',
      badge: '',
      active: true,
      isNew: true,
      createdAt: new Date().toISOString()
    };
    
    setNewSelladoId(tempId);
    setSellados(prev => [newItem, ...prev]);
    setEditingSellado(tempId);
  };

  const saveSellado = async (selladoId) => {
    const sellado = sellados.find(s => s.id === selladoId);
    if (!sellado) return;
    
    setSavingSellado(true);
    
    try {
      if (sellado.isNew) {
        const { isNew, ...selladoData } = sellado;
        const created = await api.products.create(selladoData);
        const selladoWithId = created.id ? created : { ...sellado, id: created.id || selladoId };
        setSellados(prev => prev.map(s => s.id === selladoId ? { ...selladoWithId, isNew: false } : s));
        setNewSelladoId(null);
        showSuccessAlert('¡Producto guardado!', `El producto "${sellado.name}" se ha guardado correctamente.`);
      } else {
        await api.products.update(selladoId, sellado);
        showSuccessAlert('¡Cambios guardados!', 'Los cambios se han guardado correctamente.');
      }
    } catch (err) {
      console.error('Error saving sellado:', err);
      toast.error('Error al guardar el producto');
    } finally {
      setSavingSellado(false);
    }
  };

  const updateSellado = async (id, field, value) => {
    setSellados(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    try {
      await api.products.update(id, { [field]: value });
    } catch (err) {
      console.error('Error updating sellado:', err);
    }
  };

  const deleteSellado = async (id) => {
    const result = await showDeleteAlert('este producto');
    if (!result.isConfirmed) return;
    
    const sellado = sellados.find(s => s.id === id);
    
    if (sellado?.isNew) {
      setSellados(prev => prev.filter(item => item.id !== id));
      setEditingSellado(null);
      return;
    }
    
    setSellados(prev => prev.filter(item => item.id !== id));
    try {
      await api.products.delete(id);
      showSuccessAlert('¡Producto eliminado!', sellado ? `"${sellado.name}" ha sido eliminado.` : 'Producto eliminado correctamente.');
    } catch (err) {
      console.error('Error deleting sellado:', err);
    }
    setEditingSellado(null);
  };

  const uploadSelladoImage = async (id, file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        updateSellado(id, 'imageUrl', base64);
        resolve(base64);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  useEffect(() => {
    if (saveStatus === 'saved') {
      toast.success('¡Cambios Guardados Exitosamente!');
    } else if (saveStatus === 'error') {
      toast.error('Error al guardar');
    }
  }, [saveStatus]);

  const renderSection = () => {
    switch (active) {

      // ── Dashboard ─────────────────────────────────────────────────────────
      case 'dashboard': {
        const totalImages = [images.logo, images.heroBg, images.aboutHero].filter(Boolean).length;
        
        const dashboardSellados = sellados;
        const dashboardCards = cards;
        const dashboardOrders = orders;
        
        const totalProducts = dashboardSellados.length + dashboardCards.length;
        const activeProducts = [...dashboardSellados, ...dashboardCards].filter(p => p.active !== false).length;
        const discountedProducts = [...dashboardSellados, ...dashboardCards].filter(p => p.discountPercent > 0 || p.originalPrice).length;
        const outOfStockProducts = [...dashboardSellados, ...dashboardCards].filter(p => p.stock === 0).length;
        
        const inventoryValue = [...dashboardSellados, ...dashboardCards].reduce((sum, p) => sum + (p.price * (p.stock || 0)), 0);
        
        const now = new Date();
        const todayOrders = dashboardOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return orderDate >= todayStart;
        });
        const weekOrders = dashboardOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const monday = getMonday(now);
          return orderDate >= monday;
        });
        const monthOrders = dashboardOrders.filter(o => {
          const orderDate = new Date(o.createdAt);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        });
        
        const topProduct = dashboardOrders.length > 0 
          ? dashboardOrders.reduce((acc, order) => {
              order.items?.forEach(item => {
                acc[item.name] = (acc[item.name] || 0) + item.quantity;
              });
              return acc;
            }, {})
          : {};
        const topProductName = Object.keys(topProduct).length > 0 
          ? Object.entries(topProduct).sort((a, b) => b[1] - a[1])[0][0]
          : 'Sin datos';

        return (
          <div>
            <h3 style={sectionTitle}><LayoutDashboard size={20} color="var(--accent-gold)" /> Panel de Estadísticas</h3>
            
            {/* Period Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              {['Hoy', 'Esta Semana', 'Este Mes'].map((period) => (
                <button key={period} onClick={() => setDashboardPeriod(period)} style={{
                  padding: '8px 16px',
                  background: dashboardPeriod === period ? 'var(--accent-gold)' : 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                  color: dashboardPeriod === period ? 'white' : 'var(--text-secondary)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>
                  {period}
                </button>
              ))}
            </div>

            {/* Stats Grid - TCG Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <StatCard label="Total Productos" val={totalProducts} sub={`${activeProducts} activos`} color="#8b5cf6" Icon={Package} />
              <StatCard label="Sellados" val={dashboardSellados.length} sub="En inventario" color="#3b82f6" Icon={Package} />
              <StatCard label="Cartas Sueltas" val={dashboardCards.length} sub="En inventario" color="#06b6d4" Icon={Layers} />
              <StatCard label="Con Descuento" val={discountedProducts} sub="Productos en oferta" color="#10b981" Icon={Tag} />
              <StatCard label="Sin Stock" val={outOfStockProducts} sub="Agotados" color="#ef4444" Icon={AlertCircle} />
              <StatCard label="Valor Inventario" val={`$${inventoryValue.toLocaleString('es-MX')}`} sub="Pesos MXN" color="#f59e0b" Icon={TrendingUp} />
            </div>

            {/* Orders Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {dashboardPeriod === 'Hoy' && (
                <StatCard label="Pedidos Hoy" val={todayOrders.length} sub="Últimas 24h" color="#25d366" Icon={BarChart2} />
              )}
              {dashboardPeriod === 'Esta Semana' && (
                <StatCard label="Pedidos Esta Semana" val={weekOrders.length} sub="Lunes - Domingo" color="#3b82f6" Icon={BarChart2} />
              )}
              {dashboardPeriod === 'Este Mes' && (
                <StatCard label="Pedidos Este Mes" val={monthOrders.length} sub="Últimos 30 días" color="#8b5cf6" Icon={BarChart2} />
              )}
              <StatCard label="Total Pedidos" val={dashboardOrders.length} sub="Registrados" color="#f59e0b" Icon={BarChart2} />
            </div>

            {/* Top Product & More Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Top Selling Product */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#10b981" /> Producto Más Vendido
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '60px', height: '60px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🏆</div>
                  <div>
                    <p style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{topProductName}</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {topProduct[topProductName] ? `${topProduct[topProductName]} unidades` : 'Sin datos aún'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inventory by Game */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '1.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} color="#3b82f6" /> Inventario por Juego
                </h4>
                {['pokemon', 'yugioh', 'magic', 'digimon', 'dragonball', 'onepiece'].map(game => {
                  const gameProducts = [...dashboardSellados, ...dashboardCards].filter(p => getGameValue(p.game) === game);
                  const percentage = totalProducts > 0 ? Math.round((gameProducts.length / totalProducts) * 100) : 0;
                  return (
                    <div key={game} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.85rem', textTransform: 'capitalize' }}>{game}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{gameProducts.length}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--glass-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--accent-gold)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '1.2rem', fontSize: '1rem' }}>⚡ Acciones Rápidas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { label: '📦 Agregar Sellado', section: 'sellados', action: 'create' },
                    { label: '🃏 Agregar Carta', section: 'cards', action: 'create' },
                    { label: '🎨 Cambiar Colores', section: 'theme' },
                  ].map(q => (
                    <button key={q.label} onClick={() => {
                      if (q.action === 'create') {
                        if (q.section === 'sellados') createSellado();
                        else if (q.section === 'cards') createCard();
                      } else {
                        setActive(q.section);
                      }
                    }}
                      style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.9rem', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-gold)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    >{q.label}</button>
                  ))}
                </div>
              </div>

              {/* Site Info */}
              <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', marginBottom: '1.2rem', fontSize: '1rem' }}>📋 Información del Sitio</h4>
                {[
                  { label: 'Nombre', val: content.siteName },
                  { label: 'Email', val: content.contact?.email },
                  { label: 'WhatsApp', val: content.contact?.whatsapp },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: '500' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Visits Chart */}
            <SimpleBarChart data={analytics.visits_simulated} />
          </div>
        );
      }

      // ── Products ─────────────────────────────────────────────────────────
      case 'products':
        return (
          <div>
            <h3 style={sectionTitle}><Package size={20} color="var(--accent-gold)" /> Catálogo de Productos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Gestiona los productos eléctricos que se mostrarán en la página de Productos.</p>
            
            <button className="btn-primary" onClick={() => createProduct()} style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.9rem' }}>
              <Plus size={16} /> Añadir Producto
            </button>
            
            <div style={{ display: 'grid', gridTemplateColumns: splitView ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {products.map((prod, i) => (
                <div key={prod.id} style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: `1px solid ${prod.active ? 'var(--accent-gold)' : 'var(--glass-border)'}`, borderRadius: '12px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => moveProduct(i, 'up')} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ArrowUp size={14} /></button>
                      <button onClick={() => moveProduct(i, 'down')} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}><ArrowDown size={14} /></button>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={prod.active} onChange={e => updateProduct(prod.id, 'active', e.target.checked)} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
                      Activo (Visible)
                    </label>
                    <button onClick={() => { if(confirm('¿Eliminar este producto?')) deleteProduct(prod.id); }} style={{ background: 'transparent', border: '1px solid #ef444455', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Eliminar
                    </button>
                  </div>
                  
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Nombre</label>
                    <input value={prod.name} onChange={e => updateProduct(prod.id, 'name', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} />
                  </div>
                  
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Precio (opcional)</label>
                    <input value={prod.price} onChange={e => updateProduct(prod.id, 'price', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="Ej: $120.00" />
                  </div>

                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Descripción</label>
                    <Toolbar onFormat={(t) => insertFormat(prod.id, prod.description, t, (p,v) => updateProduct(p, 'description', v))} />
                    <textarea value={prod.description} onChange={e => updateProduct(prod.id, 'description', e.target.value)} rows={3} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.85rem' }} />
                  </div>
                  
                  <ImageUploader label="Foto del Producto" description="Cuadrada (ej: 600x600)" value={prod.image} onChange={val => updateProduct(prod.id, 'image', val)} />
                </div>
              ))}
              {products.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No hay productos registrados.</p>}
            </div>
          </div>
        );

      // ── Sellados (Sealed Products) ─────────────────────────────────────────
      case 'sellados':
        if (selladosLoading) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Cargando productos...</div>
            </div>
          );
        }

        const selectedSellado = editingSellado ? sellados.find(s => s.id === editingSellado) : null;

        return (
          <div>
            <h3 style={sectionTitle}><Package size={20} color="var(--accent-gold)" /> Productos Sellados</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Gestiona Booster Boxes, ETBs, Decks, Bundles y más productos sellados.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: splitView ? '1fr 1fr' : 'minmax(350px, 450px) 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Sellados List */}
              <div>
                <button onClick={createSellado} style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--accent-gold)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                  <Plus size={18} /> Nuevo Producto
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                  {sellados.map(item => (
                    <div key={item.id}
                      onClick={() => setEditingSellado(item.id)}
                      style={{
                        padding: '1rem',
                        background: editingSellado === item.id ? 'rgba(245,158,11,0.15)' : 'var(--glass-bg)',
                        border: `1px solid ${editingSellado === item.id ? '#f59e0b' : 'var(--glass-border)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (editingSellado !== item.id) e.currentTarget.style.borderColor = '#f59e0b'; }}
                      onMouseLeave={e => { if (editingSellado !== item.id) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                    >
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Package size={24} color="var(--glass-border)" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getGameValue(item.game)} • {item.type}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>${item.price}</span>
                          <span style={{ fontSize: '0.7rem', color: item.stock > 0 ? 'var(--text-secondary)' : '#ef4444' }}>Stock: {item.stock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sellados.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '10px' }}>
                      <Package size={32} color="var(--glass-border)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No hay productos sellados aún</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sellado Editor */}
              <div>
                {selectedSellado ? (
                  <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.1rem' }}>Editando Producto</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => deleteSellado(selectedSellado.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                        <button onClick={() => setEditingSellado(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Nombre</label>
                        <input value={selectedSellado.name} onChange={e => updateSellado(selectedSellado.id, 'name', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Juego</label>
                        <select value={selectedSellado.game} onChange={e => updateSellado(selectedSellado.id, 'game', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }}>
                          <option value="pokemon">Pokémon TCG</option>
                          <option value="yugioh">Yu-Gi-Oh!</option>
                          <option value="magic">Magic: The Gathering</option>
                          <option value="digimon">Digimon</option>
                          <option value="onepiece">One Piece</option>
                          <option value="dragonball">Dragon Ball</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Set / Expansión</label>
                        <input value={selectedSellado.set} onChange={e => updateSellado(selectedSellado.id, 'set', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="Ej: Scarlet & Violet" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Tipo</label>
                        <select value={selectedSellado.type} onChange={e => updateSellado(selectedSellado.id, 'type', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }}>
                          <option value="booster-box">Booster Box</option>
                          <option value="elite-trainer">Elite Trainer Box</option>
                          <option value="booster">Booster / Sobre</option>
                          <option value="deck">Deck</option>
                          <option value="starter">Starter Deck</option>
                          <option value="premium">Premium Collection</option>
                          <option value="blister">Blister Pack</option>
                          <option value="bundle">Booster Bundle</option>
                          <option value="accessories">Accesorios</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Precio ($)</label>
                        <input type="number" step="any" value={selectedSellado.price || ''} onChange={e => updateSellado(selectedSellado.id, 'price', parseFloat(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0.00" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>% Descuento</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="number" step="1" value={selectedSellado.discountPercent || ''} onChange={e => updateSellado(selectedSellado.id, 'discountPercent', parseInt(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0" />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>%</span>
                        </div>
                        {selectedSellado.discountPercent > 0 && (
                          <p style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '4px' }}>
                            Precio anterior: ${Math.round(selectedSellado.price / (1 - selectedSellado.discountPercent / 100)).toLocaleString('es-MX')}
                          </p>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Stock</label>
                        <input type="number" step="1" value={selectedSellado.stock || ''} onChange={e => updateSellado(selectedSellado.id, 'stock', parseInt(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0" />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Badge</label>
                        <select value={selectedSellado.badge || ''} onChange={e => updateSellado(selectedSellado.id, 'badge', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }}>
                          <option value="">Sin badge</option>
                          <option value="Nuevo">Nuevo</option>
                          <option value="Preventa">Preventa</option>
                          <option value="Oferta">Oferta</option>
                          <option value="Agotado">Agotado</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Imagen</label>
                        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--glass-border)', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', transition: 'all 0.2s' }}
                          onDragOver={e => e.preventDefault()}
                          onDrop={e => { e.preventDefault(); const file = e.dataTransfer.files[0]; if (file) uploadSelladoImage(selectedSellado.id, file); }}
                        >
                          <ImageIcon size={16} />
                          {selectedSellado.imageUrl ? 'Cambiar' : 'Subir imagen'}
                          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const file = e.target.files[0]; if (file) uploadSelladoImage(selectedSellado.id, file); }} />
                        </label>
                        {selectedSellado.imageUrl && (
                          <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                            <img src={selectedSellado.imageUrl} alt="Preview" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>
                        <input type="checkbox" checked={selectedSellado.active} onChange={e => updateSellado(selectedSellado.id, 'active', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        Visible en tienda
                      </label>
                    </div>

                    {/* Save Button */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {selectedSellado.isNew ? (
                        <button 
                          onClick={() => saveSellado(selectedSellado.id)}
                          disabled={savingSellado}
                          style={{ 
                            width: '100%', 
                            padding: '14px', 
                            background: savingSellado ? 'rgba(16,185,129,0.5)' : 'var(--accent-primary)', 
                            border: 'none', 
                            borderRadius: '10px', 
                            color: '#fff', 
                            cursor: savingSellado ? 'wait' : 'pointer',
                            fontSize: '1rem', 
                            fontWeight: '700', 
                            fontFamily: 'var(--font-heading)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {savingSellado ? (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={18} /> Guardar Producto
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => saveSellado(selectedSellado.id)}
                          disabled={savingSellado}
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            background: 'rgba(16,185,129,0.1)', 
                            border: '1px solid rgba(16,185,129,0.3)', 
                            borderRadius: '10px', 
                            color: '#10b981', 
                            cursor: savingSellado ? 'wait' : 'pointer',
                            fontSize: '0.9rem', 
                            fontWeight: '700', 
                            fontFamily: 'var(--font-heading)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {savingSellado ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /></svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={16} /> Guardar Cambios
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    <Package size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                    <p>Selecciona un producto para editarlo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ── Cards TCG ─────────────────────────────────────────────────────────
      case 'cards':
        if (cardsLoading) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ color: 'var(--text-secondary)' }}>Cargando cartas...</div>
            </div>
          );
        }

        const selectedCard = editingCard ? cards.find(c => c.id === editingCard) : null;

        return (
          <div>
            <h3 style={sectionTitle}><Layers size={20} color="var(--accent-gold)" /> Cartas Sueltas</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Gestiona cartas individuales: Holos, Raras, Ultra Rares, Full Arts y más.</p>
            
            {/* Scryfall Search */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} /> Buscar en Scryfall (Precios en USD)
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select 
                  value={selectedGame} 
                  onChange={e => setSelectedGame(e.target.value)}
                  style={{ ...inputSt, width: 'auto', minWidth: '120px', padding: '8px 12px' }}
                >
                  <option value="magic">Magic</option>
                  <option value="pokemon">Pokémon</option>
                  <option value="yugioh">Yu-Gi-Oh!</option>
                </select>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  
                  placeholder={selectedGame === 'pokemon' ? "Buscar carta..." : "Buscar carta..."}
                  style={{ ...inputSt, flex: 1 }}
                />
                <button 
                  onClick={handleCardSearch}
                  disabled={searching}
                  style={{ padding: '8px 16px', background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {searching ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                  Buscar
                </button>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
                    {searchResults.length} resultado(s) encontrado(s) • {selectedGame === 'pokemon' ? 'PokéWallet' : selectedGame === 'yugioh' ? 'TCGdex' : 'Scryfall'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {searchResults.slice(0, 10).map((card, idx) => {
                      // Handle different API response formats
                      let name, setName, rarity, price, imageUrl;
                      
                      if (selectedGame === 'pokemon') {
                        // PokéWallet format - use cached images
                        const info = card.card_info || {};
                        const tcgPrice = card.tcgplayer?.prices?.[0];
                        const cmPrice = card.cardmarket?.prices?.[0];
                        name = info.name;
                        setName = info.set_name || 'Unknown Set';
                        rarity = info.rarity || 'Rare';
                        price = tcgPrice?.market_price || tcgPrice?.low_price || cmPrice?.avg || cmPrice?.trend || 0;
                        imageUrl = searchResultsImages[card.id] || null;
                      } else if (selectedGame === 'yugioh') {
                        // TCGdex format
                        name = card.name;
                        setName = card.set || card.localization?.en?.set || 'Unknown Set';
                        rarity = card.rarity || 'Rare';
                        price = card.cardPrices?.[0]?.price || 0;
                        imageUrl = card.image || card.localization?.en?.image || null;
                      } else {
                        // Scryfall format (Magic)
                        name = card.name;
                        setName = card.set_name || 'Unknown Set';
                        rarity = card.rarity || 'Rare';
                        price = card.prices?.usd || 0;
                        imageUrl = card.image_uris?.small || card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.small || null;
                      }
                      
                      return (
                      <div key={card.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0.75rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
                        <div style={{ width: '50px', height: '70px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.05)' }}>
                          {imageUrl ? (
                            <img src={imageUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>🃏</div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{setName} • {rarity}</p>
                          <p style={{ fontSize: '0.8rem', fontWeight: '700', color: '#10b981' }}>
                            {formatPrice(price)}
                          </p>
                        </div>
                        <button 
                          onClick={() => importCard(card)}
                          style={{ padding: '6px 12px', background: 'var(--accent-gold)', border: 'none', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}
                        >
                          Importar
                        </button>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {searchQuery && searchResults.length === 0 && !searching && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>
                  No se encontraron cartas para "{searchQuery}"
                </p>
              )}
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: splitView ? '1fr 1fr' : 'minmax(350px, 450px) 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Card List */}
              <div>
                <button onClick={createCard} disabled={creatingCard} style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: creatingCard ? 'rgba(59,130,246,0.2)' : 'var(--glass-bg)', border: `1px dashed ${creatingCard ? 'var(--accent-primary)' : 'var(--glass-border)'}`, borderRadius: '10px', color: creatingCard ? 'var(--accent-primary)' : 'var(--text-primary)', cursor: creatingCard ? 'wait' : 'pointer', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)', transition: 'all 0.3s' }}>
                  {creatingCard ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} /> Nueva Carta Manual
                    </>
                  )}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                  {cards.map(card => (
                    <div key={card.id}
                      onClick={() => setEditingCard(card.id)}
                      className={newCardId === card.id ? 'card-new-animation' : ''}
                      style={{
                        padding: '1rem',
                        background: editingCard === card.id ? 'rgba(245,158,11,0.15)' : newCardId === card.id ? 'rgba(59,130,246,0.15)' : 'var(--glass-bg)',
                        border: `1px solid ${editingCard === card.id ? 'var(--accent-gold)' : newCardId === card.id ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { if (editingCard !== card.id) e.currentTarget.style.borderColor = 'var(--accent-gold)'; }}
                      onMouseLeave={e => { if (editingCard !== card.id) e.currentTarget.style.borderColor = newCardId === card.id ? 'var(--accent-primary)' : 'var(--glass-border)'; }}
                    >
                      <div style={{ width: '60px', height: '84px', borderRadius: '6px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {card.imageUrl && !card.imageUrl.startsWith('blob:') ? (
                          <img 
                            src={card.imageUrl} 
                            alt={card.name} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { 
                              e.target.style.display = 'none'; 
                            }}
                          />
                        ) : (
                          <Layers size={24} color="var(--glass-border)" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</h5>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getGameValue(card.game)} • {card.set}</p>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', background: card.rarity === 'Common' ? 'rgba(150,150,150,0.2)' : card.rarity === 'Rare' ? 'rgba(245,158,11,0.2)' : card.rarity === 'Ultra Rare' ? 'rgba(234,179,8,0.2)' : 'rgba(168,85,247,0.2)', color: card.rarity === 'Common' ? '#9ca3af' : card.rarity === 'Rare' ? '#f59e0b' : card.rarity === 'Ultra Rare' ? '#eab308' : '#a855f7', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{card.rarity}</span>
                          <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 'bold' }}>${card.price}</span>
                          <span style={{ fontSize: '0.7rem', color: card.stock > 0 ? 'var(--text-secondary)' : '#ef4444' }}>Stock: {card.stock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '10px' }}>
                      <Gamepad2 size={32} color="var(--glass-border)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No hay cartas aún</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Editor */}
              <div>
                {selectedCard ? (
                  <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.1rem' }}>Editando Carta</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => deleteCard(selectedCard.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                        <button onClick={() => setEditingCard(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Nombre</label>
                        <input value={selectedCard.name} onChange={e => updateCard(selectedCard.id, 'name', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Juego</label>
                        <select value={selectedCard.game} onChange={e => updateCard(selectedCard.id, 'game', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }}>
                          <option value="Pokemon">Pokemon</option>
                          <option value="Yu-Gi-Oh">Yu-Gi-Oh!</option>
                          <option value="Magic">Magic: The Gathering</option>
                          <option value="OnePiece">One Piece</option>
                          <option value="Digimon">Digimon</option>
                          <option value="DragonBall">Dragon Ball</option>
                          <option value="Other">Otro</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Set / Expansión</label>
                        <input value={selectedCard.set} onChange={e => updateCard(selectedCard.id, 'set', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="Ej: Obsidian Flames" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Rareza</label>
                        <select value={selectedCard.rarity} onChange={e => updateCard(selectedCard.id, 'rarity', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }}>
                          <option value="Common">Common</option>
                          <option value="Uncommon">Uncommon</option>
                          <option value="Rare">Rare</option>
                          <option value="Super Rare">Super Rare</option>
                          <option value="Ultra Rare">Ultra Rare</option>
                          <option value="Secret Rare">Secret Rare</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Precio ($)</label>
                        <input type="number" step="any" value={selectedCard.price || ''} onChange={e => updateCard(selectedCard.id, 'price', parseFloat(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0.00" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Stock</label>
                        <input type="number" step="1" value={selectedCard.stock || ''} onChange={e => updateCard(selectedCard.id, 'stock', parseInt(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0" />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.2rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Descripción</label>
                      <textarea value={selectedCard.description || ''} onChange={e => updateCard(selectedCard.id, 'description', e.target.value)} rows={2} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.85rem' }} placeholder="Descripción opcional de la carta..." />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>
                        <input type="checkbox" checked={selectedCard.active} onChange={e => updateCard(selectedCard.id, 'active', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        Visible en tienda
                      </label>
                    </div>

                    {/* Image Upload */}
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Imagen de la Carta</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '120px', height: '168px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {selectedCard.imageUrl ? (
                            <img src={selectedCard.imageUrl} alt={selectedCard.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Layers size={32} color="var(--glass-border)" />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <input type="file" accept="image/*" id={`card-img-${selectedCard.id}`} style={{ display: 'none' }} onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const url = await uploadCardImage(selectedCard.id, file);
                              if (url) {
                                toast.success('Imagen subida correctamente');
                              }
                            }
                          }} />
                          <label htmlFor={`card-img-${selectedCard.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                          >
                            <ImageIcon size={16} /> Subir Imagen
                          </label>
                          {selectedCard.imageUrl && (
                            <button onClick={() => {
                              updateCard(selectedCard.id, 'imageUrl', '');
                            }} style={{ display: 'block', marginTop: '8px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>
                              Eliminar imagen
                            </button>
                          )}
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>PNG, JPG, WebP • Máx 5MB</p>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      {selectedCard.isNew ? (
                        <button 
                          onClick={() => saveCard(selectedCard.id)}
                          disabled={savingCard}
                          style={{ 
                            width: '100%', 
                            padding: '14px', 
                            background: savingCard ? 'rgba(16,185,129,0.5)' : 'var(--accent-primary)', 
                            border: 'none', 
                            borderRadius: '10px', 
                            color: '#fff', 
                            cursor: savingCard ? 'wait' : 'pointer',
                            fontSize: '1rem', 
                            fontWeight: '700', 
                            fontFamily: 'var(--font-heading)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {savingCard ? (
                            <>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={18} /> Guardar Carta
                            </>
                          )}
                        </button>
                      ) : (
                        <button 
                          onClick={() => saveCard(selectedCard.id)}
                          disabled={savingCard}
                          style={{ 
                            width: '100%', 
                            padding: '12px', 
                            background: 'rgba(16,185,129,0.1)', 
                            border: '1px solid rgba(16,185,129,0.3)', 
                            borderRadius: '10px', 
                            color: '#10b981', 
                            cursor: savingCard ? 'wait' : 'pointer',
                            fontSize: '0.9rem', 
                            fontWeight: '700', 
                            fontFamily: 'var(--font-heading)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {savingCard ? (
                            <>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="60" strokeDashoffset="20" /></svg>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <Save size={16} /> Guardar Cambios
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                    <Gamepad2 size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Selecciona una carta para editarla</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>o crea una nueva carta</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      // ── Campañas de Oferta ────────────────────────────────────────────────
      case 'campaigns': {
        const selectedCampaign = editingCampaign ? campaigns.find(c => c.id === editingCampaign) : null;
        const activeCampaign = campaigns.find(c => {
          if (!c.active) return false;
          const now = new Date();
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return now >= start && now <= end;
        });

        const allSellados = sellados;
        const allCards = cards;
        const allProducts = [...allSellados.map(s => ({ id: s.id, name: s.name, game: s.game, type: 'sellado' })), ...allCards.map(c => ({ id: c.id, name: c.name, game: c.game, type: 'carta' }))];
        const selectedProducts = selectedCampaign?.selectedProducts || [];
        const productScope = selectedProducts.length === 0 ? 'all' : 'selected';

        return (
          <div>
            <h3 style={sectionTitle}><Tag size={20} color="var(--accent-gold)" /> Campañas de Oferta</h3>
            <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--text-primary)' }}>🎯 Ofertas Temporales:</strong> Crea campañas de descuento para todos los productos o selecciona productos específicos. Controla el % de descuento, fechas, productos y el banner.
            </div>

            {activeCampaign && (
              <div style={{ padding: '1rem 1.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>Oferta Activa Ahora</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ color: '#10b981' }}>{activeCampaign.name}</strong> — {activeCampaign.discountPercent}% de descuento
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 450px) 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Campaigns List */}
              <div>
                <button onClick={() => setEditingCampaign(createCampaign())} style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--accent-gold)', border: 'none', borderRadius: '10px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                  <Plus size={18} /> Nueva Campaña
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
                  {campaigns.map(camp => {
                    const now = new Date();
                    const start = new Date(camp.startDate);
                    const end = new Date(camp.endDate);
                    const isActive = camp.active && now >= start && now <= end;
                    const isExpired = camp.active && now > end;
                    
                    return (
                      <div key={camp.id}
                        onClick={() => setEditingCampaign(camp.id)}
                        style={{
                          padding: '1rem',
                          background: editingCampaign === camp.id ? 'rgba(245,158,11,0.15)' : 'var(--glass-bg)',
                          border: `1px solid ${editingCampaign === camp.id ? '#f59e0b' : isActive ? '#10b981' : 'var(--glass-border)'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { if (editingCampaign !== camp.id) e.currentTarget.style.borderColor = '#f59e0b'; }}
                        onMouseLeave={e => { if (editingCampaign !== camp.id) e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>{camp.name}</h5>
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: isActive ? 'rgba(16,185,129,0.2)' : isExpired ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: isActive ? '#10b981' : isExpired ? '#ef4444' : '#f59e0b'
                          }}>
                            {isActive ? '● ACTIVA' : isExpired ? 'EXPIRADA' : camp.active ? 'PROGRAMADA' : 'INACTIVA'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Percent size={12} /> {camp.discountPercent}%
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={12} /> {new Date(camp.endDate).toLocaleDateString('es-MX')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {campaigns.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '10px' }}>
                      <Tag size={32} color="var(--glass-border)" style={{ marginBottom: '0.5rem' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No hay campañas aún</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Campaign Editor */}
              <div>
                {selectedCampaign ? (
                  <div style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.1rem' }}>Editando Campaña</h4>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => { if (confirm('¿Eliminar esta campaña?')) { deleteCampaign(selectedCampaign.id); setEditingCampaign(null); }}} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={14} /> Eliminar
                        </button>
                        <button onClick={() => setEditingCampaign(null)} style={{ background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                          Cerrar
                        </button>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Nombre de la Campaña</label>
                      <input value={selectedCampaign.name} onChange={e => updateCampaign(selectedCampaign.id, 'name', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="Ej: Navidad 2024" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>% Descuento</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="number" step="1" value={selectedCampaign.discountPercent || ''} onChange={e => updateCampaign(selectedCampaign.id, 'discountPercent', parseInt(e.target.value) || 0)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="0" />
                          <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>%</span>
                        </div>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Color del Banner</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="color" value={selectedCampaign.bannerColor || '#ef4444'} onChange={e => updateCampaign(selectedCampaign.id, 'bannerColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '2px', background: 'transparent' }} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selectedCampaign.bannerColor}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Fecha Inicio</label>
                        <input type="datetime-local" value={selectedCampaign.startDate?.slice(0, 16)} onChange={e => updateCampaign(selectedCampaign.id, 'startDate', new Date(e.target.value).toISOString())} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Fecha Fin</label>
                        <input type="datetime-local" value={selectedCampaign.endDate?.slice(0, 16)} onChange={e => updateCampaign(selectedCampaign.id, 'endDate', new Date(e.target.value).toISOString())} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Texto del Banner</label>
                      <input value={selectedCampaign.bannerText || ''} onChange={e => updateCampaign(selectedCampaign.id, 'bannerText', e.target.value)} style={{ ...inputSt, padding: '8px 12px', fontSize: '0.9rem' }} placeholder="Ej: ¡Black Friday! Hasta 30% OFF" />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        <input type="checkbox" checked={selectedCampaign.active} onChange={e => updateCampaign(selectedCampaign.id, 'active', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        Campaña Activa
                      </label>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', marginLeft: '28px' }}>Solo las activas se mostrarán en el sitio</p>
                    </div>

                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Aplicar descuento a:</label>
                      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.8rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: productScope === 'all' ? 'white' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                          <input type="radio" name={`productScope-${selectedCampaign.id}`} checked={productScope === 'all'} onChange={() => updateCampaign(selectedCampaign.id, 'selectedProducts', [])} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          Todos los productos
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: productScope === 'selected' ? 'white' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>
                          <input type="radio" name={`productScope-${selectedCampaign.id}`} checked={productScope === 'selected'} onChange={() => { if (selectedProducts.length === 0) updateCampaign(selectedCampaign.id, 'selectedProducts', allProducts.map(p => p.id)); }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          Productos seleccionados
                        </label>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: '#10b981' }}>
                        {productScope === 'all' ? '✓ El descuento se aplicará a todos los productos' : `✓ ${selectedProducts.length} producto(s) seleccionado(s)`}
                      </p>
                    </div>

                    {productScope === 'selected' && (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Seleccionar Productos:</label>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => updateCampaign(selectedCampaign.id, 'selectedProducts', allProducts.map(p => p.id))} style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '4px', color: '#f59e0b', cursor: 'pointer' }}>Todos</button>
                            <button onClick={() => updateCampaign(selectedCampaign.id, 'selectedProducts', [])} style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '4px', color: '#ef4444', cursor: 'pointer' }}>Ninguno</button>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {allProducts.map(product => (
                            <label key={product.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: selectedProducts.includes(product.id) ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${selectedProducts.includes(product.id) ? 'rgba(16,185,129,0.4)' : 'var(--glass-border)'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                              <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => {
                                const newSelected = selectedProducts.includes(product.id)
                                  ? selectedProducts.filter(id => id !== product.id)
                                  : [...selectedProducts, product.id];
                                updateCampaign(selectedCampaign.id, 'selectedProducts', newSelected);
                              }} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{getGameValue(product.game)} • {product.type}</span>
                              </div>
                            </label>
                          ))}
                          {allProducts.length === 0 && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No hay productos disponibles</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Vista previa del banner:</p>
                      <div style={{ 
                        background: selectedCampaign.bannerColor || '#ef4444',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <Tag size={16} color="white" />
                        <span style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '0.9rem' }}>{selectedCampaign.bannerText || 'Texto del banner'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                    <Tag size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                    <p>Selecciona una campaña para editarla</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      // ── Theme / Colors ────────────────────────────────────────────────────
      case 'theme':
        return (
          <div>
            <h3 style={sectionTitle}><Palette size={20} color="var(--accent-gold)" /> Colores & Tema</h3>
            <div style={{ padding: '14px 18px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              🎨 <strong style={{ color: 'var(--text-primary)' }}>Los cambios se aplican en tiempo real.</strong> Ve la página en otra pestaña y verás los colores actualizarse cada vez que selecciones uno. Presiona <strong style={{ color: 'var(--text-primary)' }}>Guardar</strong> cuando estés conforme.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--accent-gold)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}> Colores de Acento</h4>
                <ColorPicker label="Color Principal (Accent)" value={theme.accentPrimary} onChange={v => updateTheme('accentPrimary', v)} hint="Botones, links, acentos primarios" />
                <ColorPicker label="Color Secundario" value={theme.accentSecondary} onChange={v => updateTheme('accentSecondary', v)} hint="Gradientes, hover, detalles" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--accent-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}> Colores de Fondo</h4>
                <ColorPicker label="Fondo Principal" value={theme.bgPrimary} onChange={v => updateTheme('bgPrimary', v)} hint="Color de fondo del cuerpo" />
                <ColorPicker label="Fondo Secundario" value={theme.bgSecondary} onChange={v => updateTheme('bgSecondary', v)} hint="Base secundaria" />
                <ColorPicker label="Fondo Terciario" value={theme.bgTertiary} onChange={v => updateTheme('bgTertiary', v)} hint="Footer, elementos anidados" />
                <ColorPicker label="Fondo Navbar (Menu)" value={theme.navbarColor || theme.bgSecondary} onChange={v => updateTheme('navbarColor', v)} hint="Color de fondo y blur superior" />
                <ColorPicker label="Fondo Tarjetas (Glass)" value={theme.cardBg || theme.bgSecondary} onChange={v => updateTheme('cardBg', v)} hint="Tarjetas, editor y paneles" />
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '1.5rem', color: '#10b981', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}> Colores de Texto Generales</h4>
                <ColorPicker label="Texto Principal" value={theme.textPrimary} onChange={v => updateTheme('textPrimary', v)} hint="Títulos y texto destacado globales" />
                <ColorPicker label="Texto Secundario" value={theme.textSecondary} onChange={v => updateTheme('textSecondary', v)} hint="Subtítulos, descripciones globales" />

                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginTop: '2.5rem', marginBottom: '1.5rem', color: '#ef4444', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}> Textos por Módulo (Específicos)</h4>
                <ColorPicker label="Texto Navbar (Principal)" value={theme.textNavbarPrimary || theme.textPrimary} onChange={v => updateTheme('textNavbarPrimary', v)} hint="Logo y links al hacer hover en Navbar" />
                <ColorPicker label="Texto Navbar (Secundario)" value={theme.textNavbarSecondary || theme.textSecondary} onChange={v => updateTheme('textNavbarSecondary', v)} hint="Links inactivos en el Navbar" />
                <ColorPicker label="Texto Cards (Principal)" value={theme.textCardPrimary || theme.textPrimary} onChange={v => updateTheme('textCardPrimary', v)} hint="Títulos dentro de las tarjetas Glass" />
                <ColorPicker label="Texto Cards (Secundario)" value={theme.textCardSecondary || theme.textSecondary} onChange={v => updateTheme('textCardSecondary', v)} hint="Descripciones dentro de las tarjetas" />
              </div>
              
              {/* Newsletter Color */}
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '1rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-gold)' }}>Newsletter (Suscripciones)</h4>
                <ColorPicker label="Color del Newsletter" value={theme.accentPrimary} onChange={v => updateTheme('newsletterBg', `linear-gradient(135deg, ${v}, ${theme.accentSecondary || v})`)} hint="Fondo de la sección de suscripciones" />
              </div>
            </div>

            {/* Preset Themes */}
            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '1.2rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>Temas Predefinidos</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { name: 'Dorado Oscuro', p: '#f59e0b', s: '#d97706', bg: '#050505' },
                  { name: 'Dorado Brillante', p: '#fbbf24', s: '#f59e0b', bg: '#070707' },
                  { name: 'Naranja Tostado', p: '#ea580c', s: '#dc2626', bg: '#080505' },
                  { name: 'Amber Clásico', p: '#f59e0b', s: '#92400e', bg: '#060402' },
                  { name: 'Dorado Elegante', p: '#d97706', s: '#b45309', bg: '#050404' },
                  { name: '🤍 Claro Dorado', p: '#f59e0b', s: '#d97706', bg: '#f8fafc' },
                ].map(preset => (
                  <button key={preset.name}
                    onClick={() => {
                      updateTheme('accentPrimary', preset.p);
                      updateTheme('accentSecondary', preset.s);
                      updateTheme('bgPrimary', preset.bg);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', fontSize: '0.85rem', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = preset.p; e.currentTarget.style.color = 'white'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                  >
                    <div style={{ display: 'flex', gap: '3px' }}>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.p }}></div>
                      <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: preset.s }}></div>
                    </div>
                    {preset.name}
                  </button>
                ))}
              </div>
              <button onClick={resetTheme} style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '8px 16px', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>
                <RefreshCw size={14} /> Restablecer colores originales
              </button>
            </div>
          </div>
        );

      // ── SEO ───────────────────────────────────────────────────────────────
      case 'seo':
        return (
          <div>
            <h3 style={sectionTitle}><Globe size={20} color="var(--accent-gold)" /> SEO & Metadatos</h3>
            <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', marginBottom: '2rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              🔍 Estos datos aparecen en Google cuando alguien busca tu sitio. Un buen título y descripción aumentan los clicks desde las búsquedas.
            </div>
            <Field label="Título de la Página (aparece en la pestaña del navegador)" path="seo.title" value={content.seo?.title || ''} onChange={onChange} hint="Máximo 60 caracteres recomendado" />
            <div style={{ fontSize: '0.75rem', color: content.seo?.title?.length > 60 ? '#ef4444' : 'var(--text-secondary)', marginTop: '-0.8rem', marginBottom: '1rem' }}>
              {content.seo?.title?.length || 0}/60 caracteres
            </div>
            <Field label="Descripción Meta (aparece en resultados de Google)" path="seo.description" value={content.seo?.description || ''} onChange={onChange} type="textarea" hint="Máximo 160 caracteres recomendado" />
            <div style={{ fontSize: '0.75rem', color: content.seo?.description?.length > 160 ? '#ef4444' : 'var(--text-secondary)', marginTop: '-0.8rem', marginBottom: '1rem' }}>
              {content.seo?.description?.length || 0}/160 caracteres
            </div>
            <Field label="Palabras clave (separadas por coma)" path="seo.keywords" value={content.seo?.keywords || ''} onChange={onChange} type="textarea" hint="ej: diseño web, marketing digital, agencia" />

            {/* Google Preview */}
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Vista previa en Google:</p>
              <p style={{ color: '#1a0dab', fontSize: '1.1rem', fontWeight: '500', fontFamily: 'Arial, sans-serif', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {content.seo?.title || 'Título del sitio'}
              </p>
              <p style={{ color: '#006621', fontSize: '0.82rem', fontFamily: 'Arial, sans-serif', marginBottom: '0.3rem' }}>
                https://tusitioweb.com
              </p>
              <p style={{ color: '#545454', fontSize: '0.88rem', fontFamily: 'Arial, sans-serif', lineHeight: '1.4' }}>
                {content.seo?.description || 'Descripción del sitio...'}
              </p>
            </div>
          </div>
        );

      case 'general':
        return (
          <div>
            <h3 style={sectionTitle}><Settings size={20} color="var(--accent-gold)" /> Configuración General</h3>
            <Field label="Nombre del Sitio / Logo texto" path="siteName" value={content.siteName} onChange={onChange} />
            <Field label="Tagline / Eslogan" path="tagline" value={content.tagline} onChange={onChange} />
            <Field label="Texto Botón CTA (Navbar)" path="ctaButton" value={content.ctaButton} onChange={onChange} />
            
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: '800', marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} /> Seguridad Institucional
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>Cambia la contraseña maestra de acceso al panel ("admin123" por defecto). Por precaución cierra sesión y vuelve a entrar tras cambiarla.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
                <input id="oldPass" type="password" placeholder="Contraseña Actual" style={inputSt} />
                <input id="newPass" type="password" placeholder="Nueva Contraseña" style={inputSt} />
              </div>
              <button 
                onClick={async () => {
                  const oldP = document.getElementById('oldPass').value;
                  const newP = document.getElementById('newPass').value;
                  if(!oldP || !newP) {
                    toast.error('Llena ambos campos de contraseña');
                    return;
                  }
                  const success = await changePassword(oldP, newP);
                  if(success) {
                    document.getElementById('oldPass').value = '';
                    document.getElementById('newPass').value = '';
                    toast.success('Contraseña Actualizada Correctamente');
                  } else {
                    toast.error('Error al actualizar la contraseña / Actual errónea');
                  }
                }}
                style={{ padding: '10px 18px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
              >
                Actualizar Contraseña Maestra
              </button>
            </div>
          </div>
        );

      case 'home':
        return (
          <div>
            <h3 style={sectionTitle}><Monitor size={20} color="var(--accent-gold)" /> Página de Inicio</h3>
            <Field label="Badge (texto pequeño arriba del título)" path="home.badge" value={content.home.badge} onChange={onChange} />
            <Field label="Título Principal" path="home.title" value={content.home.title} onChange={onChange} />
            <Field label="Título Acento (con gradiente de color)" path="home.titleAccent" value={content.home.titleAccent} onChange={onChange} />
            <Field label="Subtítulo" path="home.subtitle" value={content.home.subtitle} onChange={onChange} type="textarea" />
            <Field label="Botón Primario" path="home.ctaText" value={content.home.ctaText} onChange={onChange} />
            <Field label="Botón Secundario" path="home.ctaSecondary" value={content.home.ctaSecondary} onChange={onChange} />
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <Field label="Título sección Features" path="home.featuresTitle" value={content.home.featuresTitle} onChange={onChange} />
              <Field label="Subtítulo sección Features" path="home.featuresSubtitle" value={content.home.featuresSubtitle} onChange={onChange} type="textarea" />
            </div>
            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
              <Field label="Título CTA Final" path="home.ctaSectionTitle" value={content.home.ctaSectionTitle} onChange={onChange} />
              <Field label="Subtítulo CTA Final" path="home.ctaSectionSubtitle" value={content.home.ctaSectionSubtitle} onChange={onChange} type="textarea" />
            </div>
          </div>
        );

      case 'about':
        return (
          <div>
            <h3 style={sectionTitle}><Info size={20} color="var(--accent-gold)" /> Página Nosotros</h3>
            <Field label="Título" path="about.title" value={content.about.title} onChange={onChange} />
            <Field label="Subtítulo" path="about.subtitle" value={content.about.subtitle} onChange={onChange} type="textarea" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div>
                <Field label="Título Misión" path="about.misionTitle" value={content.about.misionTitle} onChange={onChange} />
                <Field label="Texto Misión" path="about.misionText" value={content.about.misionText} onChange={onChange} type="textarea" />
              </div>
              <div>
                <Field label="Título Visión" path="about.visionTitle" value={content.about.visionTitle} onChange={onChange} />
                <Field label="Texto Visión" path="about.visionText" value={content.about.visionText} onChange={onChange} type="textarea" />
              </div>
            </div>
          </div>
        );

      case 'blog':
        return (
          <div>
            <h3 style={sectionTitle}><FileText size={20} color="var(--accent-gold)" /> Entradas de Blog</h3>

            {!editPost ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 300px) 1fr', gap: '2rem' }}>
                {/* LIST */}
                <div style={{ borderRight: '1px solid var(--glass-border)', paddingRight: '2rem' }}>
                  <button className="btn-primary" onClick={() => setEditPost(createBlogPost())} style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}>
                    + Nuevo Artículo
                  </button>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {blogPosts.map(post => (
                      <div key={post.id}
                        onClick={() => setEditPost(post.id)}
                        style={{ padding: '12px 14px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s', borderLeft: post.published ? '3px solid #10b981' : '3px solid #f59e0b' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-gold)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', marginBottom: '4px' }}>{post.title || 'Sin Título'}</h5>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{post.date} • {post.published ? 'Público' : 'Borrador'}</p>
                        </div>
                      </div>
                    ))}
                    {blogPosts.length === 0 && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '1rem' }}>No hay artículos aún.</p>}
                  </div>
                </div>
                {/* STATS/PLACEHOLDER */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  <FileText size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                  <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>Selecciona un artículo para editar</p>
                  <p style={{ fontSize: '0.85rem' }}>o crea uno nuevo para empezar a escribir.</p>
                </div>
              </div>
            ) : (
              // EDITOR
              <div style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={() => setEditPost(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    ← Volver a la lista
                  </button>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => { duplicateBlogPost(editPost); setEditPost(null); }} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Duplicar</button>
                    <button onClick={() => { if (confirm('¿Seguro que deseas eliminar este artículo?')) { deleteBlogPost(editPost); setEditPost(null); } }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Eliminar</button>
                  </div>
                </div>

                {blogPosts.filter(p => p.id === editPost).map(post => (
                  <div key={post.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 300px' }}>

                    {/* Main Editor Fields */}
                    <div style={{ padding: '2rem', borderRight: '1px solid var(--glass-border)' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Título del Artículo</label>
                        <input value={post.title} onChange={e => updateBlogPost(post.id, 'title', e.target.value)} style={{ ...inputSt, fontSize: '1.2rem', padding: '14px', fontFamily: 'var(--font-heading)', fontWeight: 'bold' }} />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Extracto (Resumen corto)</label>
                        <textarea value={post.excerpt} onChange={e => updateBlogPost(post.id, 'excerpt', e.target.value)} rows={2} style={inputSt} />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Contenido Completo (Markdown / Texto)</label>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Tip: Presiona Enter dos veces para crear un nuevo párrafo.</div>
                        <textarea value={post.content} onChange={e => updateBlogPost(post.id, 'content', e.target.value)} rows={15} style={{ ...inputSt, fontFamily: 'monospace', lineHeight: '1.6', fontSize: '0.9rem' }} />
                      </div>
                    </div>

                    {/* Meta Sidebar */}
                    <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ marginBottom: '2rem', padding: '1rem', background: post.published ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${post.published ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          <input type="checkbox" checked={post.published} onChange={e => updateBlogPost(post.id, 'published', e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                          {post.published ? '🟢 Estado: Publicado (Visible)' : '🟡 Estado: Borrador (Oculto)'}
                        </label>
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Autor</label>
                        <input value={post.author} onChange={e => updateBlogPost(post.id, 'author', e.target.value)} style={inputSt} />
                      </div>

                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Fecha de Publicación</label>
                        <input value={post.date} onChange={e => updateBlogPost(post.id, 'date', e.target.value)} style={inputSt} />
                      </div>

                      <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Etiquetas (Tags)</label>
                        <input value={post.tags} onChange={e => updateBlogPost(post.id, 'tags', e.target.value)} placeholder="Ej: diseño, marketing, tips" style={inputSt} />
                      </div>

                      <ImageUploader label="Imagen de Portada (Opcional)" description="Recomendado: 1200x630 px. Máx 2MB" value={post.image} onChange={val => updateBlogPost(post.id, 'image', val)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'contact':
        return (
          <div>
            <h3 style={sectionTitle}><Mail size={20} color="var(--accent-gold)" /> Página Contacto</h3>
            <Field label="Título" path="contact.title" value={content.contact.title} onChange={onChange} />
            <Field label="Subtítulo" path="contact.subtitle" value={content.contact.subtitle} onChange={onChange} type="textarea" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="WhatsApp (texto visible)" path="contact.whatsapp" value={content.contact.whatsapp} onChange={onChange} type="tel" />
              <Field label="Email" path="contact.email" value={content.contact.email} onChange={onChange} type="email" />
            </div>
            <Field label="Dirección" path="contact.address" value={content.contact.address} onChange={onChange} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <Field label="Latitud del Mapa" path="contact.mapLat" value={String(content.contact.mapLat)} onChange={(p, v) => onChange(p, parseFloat(v) || 0)} type="number" />
              <Field label="Longitud del Mapa" path="contact.mapLng" value={String(content.contact.mapLng)} onChange={(p, v) => onChange(p, parseFloat(v) || 0)} type="number" />
            </div>
          </div>
        );

      case 'social':
        return (
          <div>
            <h3 style={sectionTitle}><Globe size={20} color="var(--accent-gold)" /> Redes Sociales</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Estas URLs se usan en el Navbar, Footer y cualquier lugar donde aparezcan íconos de redes sociales.</p>
            {[
              { label: '📸 Instagram', path: 'social.instagram', placeholder: 'https://instagram.com/tuusuario' },
              { label: '▶️ YouTube', path: 'social.youtube', placeholder: 'https://youtube.com/@tucanal' },
              { label: '👍 Facebook', path: 'social.facebook', placeholder: 'https://facebook.com/tupagina' },
              { label: '🎵 TikTok', path: 'social.tiktok', placeholder: 'https://tiktok.com/@tuusuario' },
              { label: '💼 LinkedIn', path: 'social.linkedin', placeholder: 'https://linkedin.com/company/tuempresa' },
            ].map(s => (
              <Field key={s.path} label={s.label} path={s.path} value={content.social?.[s.path.split('.')[1]] || ''} onChange={onChange} />
            ))}
          </div>
        );

      case 'whatsapp':
        return (
          <div>
            <h3 style={sectionTitle}><MessageSquare size={20} color="#25d366" /> Configuración de WhatsApp</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>El botón flotante de WhatsApp que aparece en todas las páginas del sitio.</p>
            <Field label="Número de WhatsApp (formato internacional)" path="whatsappFloat.number" value={content.whatsappFloat?.number || ''} onChange={onChange} type="tel" hint="Ej: +521234567890 (sin espacios ni guiones)" />
            <Field label="Mensaje predefinido al abrir WhatsApp" path="whatsappFloat.message" value={content.whatsappFloat?.message || ''} onChange={onChange} type="textarea" hint="Este mensaje aparece pre-escrito cuando el usuario abre WhatsApp" />

            {/* Preview */}
            <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: '#128c7e15', border: '1px solid #25d36630', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.8rem', fontWeight: '700' }}>🔗 Enlace generado:</p>
              <code style={{ fontSize: '0.82rem', color: '#25d366', wordBreak: 'break-all', lineHeight: '1.6' }}>
                {`https://wa.me/${(content.whatsappFloat?.number || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(content.whatsappFloat?.message || '')}`}
              </code>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div>
            <h3 style={sectionTitle}><FileText size={20} color="var(--accent-gold)" /> Footer</h3>
            <Field label="Descripción de la empresa" path="footer.description" value={content.footer.description} onChange={onChange} type="textarea" />
            <Field label="Texto de Copyright" path="footer.copyright" value={content.footer.copyright} onChange={onChange} hint={`Ej: MiEmpresa. Todos los derechos reservados.`} />
          </div>
        );

      case 'images':
        return (
          <div>
            <h3 style={sectionTitle}><ImageIcon size={20} color="var(--accent-gold)" /> Gestión de Imágenes</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '2rem', padding: '12px 16px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', lineHeight: '1.6' }}>
              💡 Las imágenes se guardan en tu navegador como base64. <strong style={{ color: 'var(--text-primary)' }}>Máximo 2 MB por imagen.</strong> Para imágenes más grandes, considera almacenamiento en la nube.
            </p>
            <ImageUploader label="Logo / Imagen de Marca" description="PNG transparente recomendado — 200×60 px" value={images.logo} onChange={val => updateImage('logo', val)} />
            <ImageUploader label="Imagen Hero (Fondo del Inicio)" description="JPG/WebP — 1920×1080 px" value={images.heroBg} onChange={val => updateImage('heroBg', val)} />
            <ImageUploader label="Imagen Nosotros" description="JPG — 800×600 px" value={images.aboutHero} onChange={val => updateImage('aboutHero', val)} />
          </div>
        );

      case 'inbox':
        const unreadCount = inbox.filter(m => !m.read).length;
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={sectionTitle}><Mail size={20} color="var(--accent-gold)" /> Bandeja de Entrada</h3>
              {unreadCount > 0 && (
                <span style={{ background: '#ef4444', color: 'var(--text-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {unreadCount} sin leer
                </span>
              )}
            </div>
            
            {inbox.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <MessageSquare size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>Aún no hay mensajes en tu bandeja.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {inbox.map(msg => (
                  <div key={msg.id} style={{ padding: '1.5rem', background: 'var(--glass-bg)', border: `1px solid ${msg.read ? 'var(--glass-border)' : 'var(--accent-gold)'}`, borderRadius: '12px', position: 'relative' }}>
                    {!msg.read && <div style={{ position: 'absolute', top: '15px', right: '15px', width: '10px', height: '10px', background: 'var(--accent-gold)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-gold)' }} />}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.2rem' }}>{msg.name}</h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{msg.email} • {new Date(msg.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {!msg.read && (
                          <button onClick={() => markMessageRead(msg.id)} style={{ background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>Marcar Leído</button>
                        )}
                        <button onClick={() => { Swal.fire({ title: '¿Eliminar mensaje?', text: 'Esta acción no se puede deshacer.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280', confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar', background: 'rgba(15, 23, 42, 0.95)', color: '#fff' }).then((result) => { if (result.isConfirmed) deleteMessage(msg.id); }); }} style={{ background: 'transparent', border: '1px solid #ef444455', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}><Trash2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Eliminar</button>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'orders': {
        const filteredOrders = orderFilter === 'all' 
          ? orders 
          : orders.filter(o => o.status === orderFilter);
        
        const handleMarkShipped = async (order) => {
          const { value: trackingNumber } = await Swal.fire({
            title: 'Marcar como Enviado',
            text: `Ingresa el número de guía para el pedido #${order.id.slice(-6).toUpperCase()}`,
            input: 'text',
            inputPlaceholder: 'Ej: TRACK123456789',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Confirmar Envío',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => {
              if (!value || value.trim() === '') {
                return 'Debes ingresar un número de guía';
              }
            }
          });

          if (trackingNumber) {
            try {
              await orderApi.updateStatus(order.id, 'SHIPPED', trackingNumber.trim());
              toast.success('Pedido marcado como enviado');
              loadOrders(true);
            } catch (err) {
              console.error('Error updating order:', err);
              toast.error('Error al actualizar el pedido');
            }
          }
        };

        const statusColors = {
          PENDING: { bg: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
          PROCESSING: { bg: 'rgba(59,130,246,0.2)', color: '#3b82f6' },
          SHIPPED: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
          DELIVERED: { bg: 'rgba(168,85,247,0.2)', color: '#a855f7' },
          CANCELLED: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
        };

        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={sectionTitle}><Package size={20} color="var(--accent-gold)" /> Gestión de Pedidos</h3>
              <button onClick={loadOrders} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
            
            {ordersLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
                <div style={{ color: 'var(--text-secondary)' }}>Cargando pedidos...</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {['all', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(filter => (
                    <button key={filter} onClick={() => { setOrderFilter(filter); setOrderPage(1); }} style={{
                      padding: '8px 16px',
                      background: orderFilter === filter ? 'var(--accent-gold)' : 'var(--glass-bg)',
                      border: '1px solid',
                      borderColor: orderFilter === filter ? 'var(--accent-gold)' : 'var(--glass-border)',
                      borderRadius: '8px',
                      color: orderFilter === filter ? 'white' : 'var(--text-secondary)',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}>
                      {filter === 'all' ? 'Todos' : filter === 'PENDING' ? 'pendiente' : filter === 'PROCESSING' ? 'en proceso' : filter === 'SHIPPED' ? 'enviado' : filter === 'DELIVERED' ? 'entregado' : 'cancelado'}
                      {filter !== 'all' && (
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                          ({statusCounts[filter] || 0})
                        </span>
                      )}
                      {filter === 'all' && orderTotal > 0 && (
                        <span style={{ marginLeft: '4px', opacity: 0.7 }}>
                          ({Object.values(statusCounts).reduce((a, b) => a + b, 0)})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Pagination */}
                {orderTotal > ORDER_LIMIT && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '10px'
                  }}>
                    {(() => {
                      const totalPages = Math.ceil(orderTotal / ORDER_LIMIT);
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, orderPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                      if (endPage - startPage < maxVisible - 1) startPage = Math.max(1, endPage - maxVisible + 1);

                      for (let i = startPage; i <= endPage; i++) pages.push(i);

                      return (
                        <>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Mostrando {((orderPage - 1) * ORDER_LIMIT) + 1}–{Math.min(orderPage * ORDER_LIMIT, orderTotal)} de {orderTotal}
                          </span>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button
                              onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                              disabled={orderPage === 1}
                              style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                color: orderPage === 1 ? 'var(--glass-border)' : 'var(--text-primary)',
                                cursor: orderPage === 1 ? 'default' : 'pointer', fontSize: '0.8rem'
                              }}
                            >
                              ‹
                            </button>
                            {pages.map(p => (
                              <button key={p} onClick={() => setOrderPage(p)} style={{
                                padding: '4px 10px', borderRadius: '6px', minWidth: '32px',
                                background: p === orderPage ? 'var(--accent-gold)' : 'var(--glass-bg)',
                                border: `1px solid ${p === orderPage ? 'var(--accent-gold)' : 'var(--glass-border)'}`,
                                color: p === orderPage ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer', fontSize: '0.8rem', fontWeight: p === orderPage ? '700' : '400'
                              }}>{p}</button>
                            ))}
                            <button
                              onClick={() => setOrderPage(p => Math.min(totalPages, p + 1))}
                              disabled={orderPage === totalPages}
                              style={{
                                padding: '4px 10px', borderRadius: '6px',
                                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                color: orderPage === totalPages ? 'var(--glass-border)' : 'var(--text-primary)',
                                cursor: orderPage === totalPages ? 'default' : 'pointer', fontSize: '0.8rem'
                              }}
                            >
                              ›
                            </button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {filteredOrders.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '12px' }}>
                    <Package size={48} color="var(--glass-border)" style={{ marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>
                      No hay pedidos {orderFilter !== 'all' ? `con estado ${orderFilter === 'PENDING' ? 'pendiente' : orderFilter === 'PROCESSING' ? 'en proceso' : orderFilter === 'SHIPPED' ? 'enviado' : orderFilter === 'DELIVERED' ? 'entregado' : 'cancelado'}` : 'registrados'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {filteredOrders.map(order => (
                      <div key={order.id} style={{ 
                        padding: '1.5rem', 
                        background: 'var(--glass-bg)', 
                        border: '1px solid var(--glass-border)', 
                        borderRadius: '12px',
                        borderLeft: `3px solid ${statusColors[order.status]?.color || '#6b7280'}`
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                          <div>
                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: '700', marginBottom: '4px' }}>
                              Pedido #{order.id.slice(-6).toUpperCase()}
                            </h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Fecha no disponible'}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              fontWeight: 'bold',
                              padding: '4px 10px',
                              borderRadius: '4px',
                              background: statusColors[order.status]?.bg || 'rgba(107,114,128,0.2)',
                              color: statusColors[order.status]?.color || '#6b7280',
                              textTransform: 'uppercase'
                            }}>
                              {order.status === 'PENDING' ? 'Pendiente' : order.status === 'PROCESSING' ? 'En proceso' : order.status === 'SHIPPED' ? 'Enviado' : order.status === 'DELIVERED' ? 'Entregado' : 'Cancelado'}
                            </span>
                            {order.status === 'PENDING' || order.status === 'PROCESSING' ? (
                              <button 
                                onClick={() => handleMarkShipped(order)}
                                style={{ 
                                  padding: '6px 12px', 
                                  background: 'rgba(16,185,129,0.1)', 
                                  border: '1px solid rgba(16,185,129,0.3)', 
                                  borderRadius: '6px', 
                                  color: '#10b981', 
                                  cursor: 'pointer', 
                                  fontSize: '0.75rem', 
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Truck size={12} /> Marcar Enviado
                              </button>
                            ) : null}
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Cliente</p>
                            <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>{order.customerName || 'N/A'}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerEmail || order.email || 'N/A'}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{order.customerPhone || order.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Dirección</p>
                            <p style={{ fontSize: '0.85rem' }}>{order.address || 'N/A'}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {order.city || ''}{order.state ? `, ${order.state}` : ''} {order.zipCode || ''}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '2px' }}>Total</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981' }}>
                              ${order.total ? order.total.toLocaleString('es-MX') : '0.00'}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              Subtotal: ${order.subtotal ? order.subtotal.toLocaleString('es-MX') : '0.00'} | Envío: ${order.shipping || 0}
                            </p>
                          </div>
                        </div>

                        {order.trackingNumber && (
                          <div style={{ 
                            padding: '0.75rem 1rem', 
                            background: 'rgba(16,185,129,0.1)', 
                            border: '1px solid rgba(16,185,129,0.2)', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Truck size={14} color="#10b981" />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Número de Guía:</span>
                            <code style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600' }}>{order.trackingNumber}</code>
                          </div>
                        )}

                        {order.items && order.items.length > 0 && (
                          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Productos:</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              {order.items.map((item, idx) => (
                                <div key={idx} style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>{item.quantity}x {item.name}</span>
                                  <span style={{ fontWeight: '600' }}>${(item.price * item.quantity).toLocaleString('es-MX')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  if (isLoggingOut) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--bg-tertiary)',
          borderTop: '4px solid var(--accent-gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cerrando sesión...</p>
      </div>
    );
  }

  return (
    <>
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--nav-height))', background: 'var(--bg-primary)' }}>

      {/* ── Sidebar ─────────────────────────── */}
      <aside style={{ width: '230px', background: 'var(--bg-secondary)', borderRight: '1px solid var(--glass-border)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 'var(--nav-height)', height: 'calc(100vh - var(--nav-height))', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', padding: '0 0.3rem' }}>
          <div style={{ width: '30px', height: '30px', background: 'var(--accent-gold)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Settings size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '1rem' }}>CMS Panel</span>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.8rem', padding: '0 0.3rem' }}>Secciones</p>

        <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {AdminSections({ unreadOrders, unreadMessages }).map(s => {
            const notificationBadge = s.badge || null;
            const isActive = active === s.id;
            
            return (
            <li key={s.id} onClick={() => setActive(s.id)} style={{
              padding: '9px 12px', borderRadius: '7px',
              background: isActive ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: isActive ? '700' : '500',
              fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: '9px', cursor: 'pointer',
              border: isActive ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
              fontFamily: 'var(--font-heading)', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {s.icon} {s.label}
              {notificationBadge && (
                <span style={{ 
                  background: isActive ? '#10b981' : '#ef4444', 
                  color: '#fff', 
                  fontSize: '0.7rem', 
                  padding: '2px 6px', 
                  borderRadius: '10px', 
                  marginLeft: 'auto', 
                  fontWeight: 'bold',
                  transition: 'background 0.3s'
                }}>
                  {notificationBadge}
                </span>
              )}
              {!notificationBadge && s.id === 'orders' && unreadOrders > 0 && (
                <span style={{
                  background: isActive ? '#10b981' : '#3b82f6',
                  color: '#fff',
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  marginLeft: 'auto',
                  transition: 'background 0.3s'
                }}>
                  {unreadOrders}
                </span>
              )}
            </li>
          )})}
        </ul>

        <div style={{ padding: '0.9rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-gold)', flexShrink: 0 }}></div>
            <div>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', fontFamily: 'var(--font-heading)' }}>Admin</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Conectado</p>
            </div>
          </div>
          <button onClick={() => {
            setIsLoggingOut(true);
            setTimeout(() => {
              logout();
              navigate('/login', { replace: true });
            }, 100);
          }} title="Cerrar Sesión" style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
             Salir
          </button>
        </div>
      </aside>

      {/* ── Main Layout ──────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Editor Half */}
        <div style={{ flex: splitView ? '0 0 500px' : 1, padding: '2.5rem', overflowY: 'auto', borderRight: splitView ? '1px solid var(--glass-border)' : 'none', transition: 'flex 0.3s' }}>
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: '800' }}>Panel de Administración</h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>Edita cualquier cosa → Guarda → Los cambios persisten.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => setSplitView(!splitView)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: splitView ? 'var(--accent-gold)' : 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: splitView ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
                <Columns size={15} /> {splitView ? 'Cerrar Vista Previa' : 'Vista Dividida'}
              </button>
              <button onClick={resetContent} title="Restablecer todo" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: '600' }}>
                <RotateCcw size={15} /> Reset
              </button>
              <a href="/" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'var(--font-heading)', fontWeight: '600', textDecoration: 'none' }}>
                <Eye size={15} /> Ver Sitio
              </a>
              <button onClick={() => { saveContent(); toast.success('Cambios guardados correctamente'); }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-heading)', fontWeight: '700', boxShadow: '0 4px 14px var(--accent-glow)' }}>
                <Save size={17} /> Guardar
              </button>
            </div>
          </div>

          {/* Editor Panel */}
          <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '2rem' }}>
            {renderSection()}
          </div>
        </div>

        {/* Live Preview Iframe */}
        {splitView && (
          <div style={{ flex: 1, background: '#fff', position: 'relative' }}>
            <iframe src="/" style={{ width: '100%', height: '100%', border: 'none' }} title="Vista Previa" />
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'var(--text-primary)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.75rem', backdropFilter: 'blur(5px)' }}>
              Live Preview
            </div>
          </div>
        )}
      </div>
    </div>
    
    <style>{`
      @keyframes cardNewAnimation {
        0% { transform: translateY(-20px); opacity: 0; }
        50% { transform: translateY(5px); box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
        100% { transform: translateY(0); opacity: 1; }
      }
      .card-new-animation {
        animation: cardNewAnimation 0.6s ease-out forwards;
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
    </>
  );
};

export default Admin;
