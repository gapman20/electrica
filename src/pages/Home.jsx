import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Truck, CreditCard, Package, ChevronLeft, ChevronRight,
  Zap, Star, Clock, Tag, Sparkles, ShoppingCart, Heart
} from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../components/Toast';
import SEO from '../components/SEO';
import { getGameValue, productApi, cardApi } from '../services/api';

const formatPrice = (value) => {
  if (typeof value === 'number') {
    return `$${value.toLocaleString('es-MX')}`;
  }
  return value;
};

const GameCard = ({ name, icon, color }) => (
  <Link 
    to={`/catalogo?game=${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
    className="game-category-card"
    style={{ '--game-color': color }}
  >
    <div className="game-category-icon">{icon}</div>
    <span>{name}</span>
  </Link>
);

const ProductCard = ({ product, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isInWishlist, toggleItem } = useWishlist();
  const toast = useToast();
  const isLoggedIn = !!localStorage.getItem('tcg_user');
  
  const hasDiscount = product.originalPrice && product.originalPrice !== product.price;
  const badgeClass = product.badge ? product.badge.toLowerCase().replace(/[^a-z]/g, '') : '';
  const wishlisted = isInWishlist(product.id, 'product');
  
  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wasAdded = toggleItem({ ...product, type: 'product' });
    if (wasAdded) {
      toast.success(`${product.name} añadido a favoritos`);
    } else {
      toast.info(`${product.name} eliminado de favoritos`);
    }
  };
  
  return (
    <div 
      className="tcg-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {product.image ? (
          <img src={product.image} alt={product.name} className="product-image" />
        ) : (
          <div className="product-placeholder">
            <Package size={48} color="var(--text-secondary)" />
          </div>
        )}
        
        {product.badge && (
          <span className={`product-badge badge-${badgeClass}`}>
            {product.badge}
          </span>
        )}
        
        {hasDiscount && (
          <span className="product-badge badge-oferta">
            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
          </span>
        )}
        
        <div className={`product-actions ${isHovered || window.innerWidth < 768 ? 'visible' : ''}`}>
          {isLoggedIn && (
            <button 
              className="action-btn wishlist-btn"
              onClick={handleToggleWishlist}
            >
              <Heart size={20} fill={wishlisted ? 'var(--accent-gold)' : 'none'} color={wishlisted ? 'var(--accent-gold)' : 'currentColor'} />
            </button>
          )}
          <button className="action-btn cart-btn" onClick={() => onAddToCart(product)}>
            <ShoppingCart size={20} />
          </button>
        </div>
        
        {product.stock === 0 && (
          <div className="product-soldout-overlay">
            <span>Agotado</span>
          </div>
        )}
      </div>
      
      <div className="product-info">
        <div className="product-tags">
          {product.game && <span className="product-tag">{getGameValue(product.game)}</span>}
          {product.set && <span className="product-tag">{product.set}</span>}
        </div>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-price">
          <span className="price-current">{product.price}</span>
          {hasDiscount && (
            <span className="price-original">{product.originalPrice}</span>
          )}
        </div>
        <button 
          className="add-to-cart-btn"
          onClick={() => onAddToCart(product)}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
        </button>
      </div>
    </div>
  );
};

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown-timer">
      {[
        { value: timeLeft.days, label: 'Días' },
        { value: timeLeft.hours, label: 'Horas' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Seg' }
      ].map((item, i) => (
        <div key={i} className="countdown-item">
          <span>{String(item.value).padStart(2, '0')}</span>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
};

const ArrowRight = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const Home = () => {
  const { addItem } = useCart ? useCart() : {};
  const { getActiveCampaign: getCampaign } = useSite();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [email, setEmail] = useState('');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const carouselRef = useRef(null);
  
  const activeCampaign = getCampaign ? getCampaign() : null;

  const banners = [
    {
      title: 'Mega Evolution: Phantasmal Flames',
      subtitle: '¡Las llamas azules ya están aquí!',
      image: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1600',
      link: '/catalogo'
    },
    {
      title: 'Preventas Exclusivas',
      subtitle: 'Chaos Rising y más novedades',
      image: 'https://images.unsplash.com/photo-1585620385456-4759f9b5c7d9?w=1600',
      link: '/catalogo?filter=preventa'
    },
    {
      title: 'Ofertas de Temporada',
      subtitle: 'Hasta 50% de descuento',
      image: 'https://images.unsplash.com/photo-1606663889134-b1dedb5ed8b7?w=1600',
      link: '/catalogo?filter=oferta'
    }
  ];

  const games = [
    { name: 'Pokémon TCG', icon: '🔴', color: '#ef4444' },
    { name: 'Yu-Gi-Oh!', icon: '💛', color: '#f59e0b' },
    { name: 'Magic', icon: '🔵', color: '#3b82f6' },
    { name: 'Digimon', icon: '🟣', color: '#8b5cf6' },
    { name: 'One Piece', icon: '🔴', color: '#dc2626' },
    { name: 'Dragon Ball', icon: '🟠', color: '#f97316' }
  ];

  const trustBadges = [
    { icon: <Shield size={28} />, title: 'Pago Seguro', desc: 'SSL 256-bit encryption' },
    { icon: <Truck size={28} />, title: 'Envío 24-48h', desc: 'En empaques protegidos' },
    { icon: <CreditCard size={28} />, title: ' múltiples', desc: 'Visa, Mastercard, PayPal' },
    { icon: <Star size={28} />, title: 'Garantía', desc: 'Productos 100% originales' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const [productsData, cardsData] = await Promise.all([
          productApi.getAll(),
          cardApi.getAll()
        ]);
        
        const formattedProducts = productsData.slice(0, 4).map(p => ({
          ...p,
          price: formatPrice(p.price),
          originalPrice: p.originalPrice ? formatPrice(p.originalPrice) : null,
          image: p.imageUrl || null
        }));
        
        const formattedOffers = productsData
          .filter(p => p.discountPercent > 0)
          .slice(0, 4)
          .map(p => ({
            ...p,
            price: formatPrice(p.price),
            originalPrice: p.originalPrice ? formatPrice(p.originalPrice) : null,
            image: p.imageUrl || null
          }));
        
        setFeaturedProducts(formattedProducts);
        setOffers(formattedOffers);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      game: product.game,
      stock: product.stock
    });
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    alert(`¡Gracias! Te suscribiste con: ${email}`);
    setEmail('');
  };

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % banners.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + banners.length) % banners.length);

  const handleTouchStart = (e) => {
    setTouchEnd(0);
    setTouchStart(e.target.getBoundingClientRect().x);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.target.getBoundingClientRect().x);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    
    if (distance > minSwipeDistance) {
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      prevSlide();
    }
  };

  return (
    <div className="tcg-home">
      <SEO 
        title="Inicio" 
        description="Adventure TCG - Tu tienda de cartas coleccionables. Pokémon, Yu-Gi-Oh!, Magic, Digimon y más."
      />

      {/* Hero Banner Carousel */}
      <section className="hero-carousel">
        <div 
          className="carousel-container"
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {banners.map((banner, index) => (
            <div 
              key={index}
              className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
              style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${banner.image})` }}
            >
              <div className="slide-content">
                <span className="slide-badge">
                  <Zap size={16} />
                  {index === 1 ? '¡Última oportunidad!' : '¡Nuevo!'}
                </span>
                <h1>{banner.title}</h1>
                <p>{banner.subtitle}</p>
                <Link to={banner.link} className="btn-primary">
                  Ver Ahora <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          ))}
          
          <button className="carousel-btn prev" onClick={prevSlide}>
            <ChevronLeft size={28} />
          </button>
          <button className="carousel-btn next" onClick={nextSlide}>
            <ChevronRight size={28} />
          </button>
          
          <div className="carousel-dots">
            {banners.map((_, index) => (
              <button 
                key={index}
                className={`dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Game Categories */}
      <section className="game-categories">
        <div className="container">
          {/* Grid for Desktop */}
          <div className="games-grid">
            {games.map((game, index) => (
              <GameCard key={index} {...game} />
            ))}
          </div>
          {/* Scroll for Mobile/Tablet */}
          <div className="games-scroll-container">
            <div className="games-scroll">
              {games.map((game, index) => (
                <GameCard key={`scroll-${index}`} {...game} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <div>
              <h2><Sparkles size={22} /> Recomendados</h2>
              <p>Los productos más populares de la semana</p>
            </div>
            <Link to="/catalogo" className="view-all-link">
              Ver todo <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="products-grid">
            {loadingProducts ? (
              <p>Cargando productos...</p>
            ) : featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))
            ) : (
              <p>No hay productos disponibles</p>
            )}
          </div>
        </div>
      </section>

      {/* Special Offer Banner - Solo si hay campaña activa */}
      {activeCampaign && (
        <section className="special-offer-banner" style={{
          background: `linear-gradient(135deg, ${activeCampaign.bannerColor}22, ${activeCampaign.bannerColor}11)`,
          borderTop: `2px solid ${activeCampaign.bannerColor}`,
          borderBottom: `2px solid ${activeCampaign.bannerColor}`
        }}>
          <div className="container">
            <div className="offer-content">
              <div className="offer-badge" style={{
                background: activeCampaign.bannerColor,
                boxShadow: `0 0 20px ${activeCampaign.bannerColor}66`
              }}>
                <Tag size={18} />
                <span>{activeCampaign.bannerText}</span>
              </div>
              <h2>{activeCampaign.name} — {activeCampaign.discountPercent}% de descuento</h2>
              <p>{activeCampaign.selectedProducts?.length > 0 ? `En productos seleccionados` : 'En todos los productos'}</p>
              <CountdownTimer targetDate={activeCampaign.endDate} />
              <Link to="/catalogo?filter=oferta" className="btn-primary">
                Ver Ofertas <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Offers Section */}
      <section className="offers-section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2><Clock size={22} /> Ofertas</h2>
              <p>Productos con precios especiales</p>
            </div>
            <Link to="/catalogo?filter=oferta" className="view-all-link">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="offers-grid">
            {loadingProducts ? (
              <p>Cargando ofertas...</p>
            ) : offers.length > 0 ? (
              offers.map(offer => (
                <ProductCard key={offer.id} product={{ ...offer, badge: 'Oferta' }} onAddToCart={handleAddToCart} />
              ))
            ) : (
              <p>No hay ofertas disponibles</p>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges - Horizontal Scroll on Mobile */}
      <section className="trust-section">
        <div className="container">
          <div className="trust-scroll-container">
            <div className="trust-scroll">
              {trustBadges.map((badge, index) => (
                <div key={index} className="trust-badge">
                  <div className="trust-icon">{badge.icon}</div>
                  <h4>{badge.title}</h4>
                  <p>{badge.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter - Responsive */}
      <section className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <h2>¡No te pierdas nuestras ofertas!</h2>
            <p>Suscríbete para recibir promociones exclusivas y novedades</p>
            <form onSubmit={handleSubscribe} className="newsletter-form">
              <input 
                type="email" 
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Suscribirse
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
