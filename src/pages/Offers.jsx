import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Tag, ArrowLeft, Search, SlidersHorizontal, X, Grid, List } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { productApi, cardApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';

const Offers = () => {
  const { getActiveCampaign, calculateDiscountedPrice } = useSite();
  const [productsData, setProductsData] = useState([]);
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const activeCampaign = getActiveCampaign();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(false);
      try {
        const [products, cards] = await Promise.all([
          productApi.getAll(),
          cardApi.getAll()
        ]);
        setProductsData(products);
        setCardsData(cards);
      } catch (e) {
        console.error('Error loading offers:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const offersData = useMemo(() => {
    if (!activeCampaign) return { products: [], cards: [] };

    const selectedProducts = activeCampaign.selectedProducts || [];
    const appliesToAll = selectedProducts.length === 0;

    const filteredProducts = productsData.filter(product => {
      if (appliesToAll) return true;
      return selectedProducts.includes(product.id);
    });

    const filteredCards = cardsData.filter(card => {
      if (appliesToAll) return true;
      return selectedProducts.includes(card.id);
    });

    const productsWithDiscount = filteredProducts.map(product => ({
      ...product,
      image: product.imageUrl || null,
      game: typeof product.game === 'object' ? product.game.name : product.game,
      originalPrice: product.price,
      price: calculateDiscountedPrice(product.price, activeCampaign, product.id),
      discountPercent: activeCampaign.discountPercent
    }));

    const cardsWithDiscount = filteredCards.map(card => ({
      ...card,
      image: card.imageUrl || null,
      game: typeof card.game === 'object' ? card.game.name : card.game,
      originalPrice: card.price,
      price: calculateDiscountedPrice(card.price, activeCampaign, card.id),
      discountPercent: activeCampaign.discountPercent
    }));

    return { products: productsWithDiscount, cards: cardsWithDiscount };
  }, [activeCampaign, productsData, cardsData, calculateDiscountedPrice]);

  const totalOffers = offersData.products.length + offersData.cards.length;

  if (!activeCampaign) {
    return (
      <div className="page offers-page">
        <SEO title="Ofertas" description="Ofertas y promociones especiales" />
        <div className="container">
          <div className="offers-no-campaign">
            <Tag size={64} color="var(--text-secondary)" />
            <h1>Ofertas</h1>
            <p>No hay ofertas activas en este momento.</p>
            <p>Vuelve pronto para ver las próximas promociones.</p>
            <Link to="/" className="btn-primary" style={{ marginTop: '2rem', display: 'inline-flex' }}>
              <ArrowLeft size={18} /> Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page offers-page">
      <SEO 
        title={`${activeCampaign.bannerText} - ${activeCampaign.discountPercent}% de descuento`} 
        description={activeCampaign.bannerText}
      />

      {/* Campaign Banner */}
      <div className="offers-hero" style={{ background: activeCampaign.bannerColor }}>
        <div className="container">
          <div className="offers-hero-content">
            <Tag size={32} color="white" />
            <h1>{activeCampaign.bannerText}</h1>
            <p className="offers-discount-badge">
              {activeCampaign.discountPercent}% de descuento
            </p>
            {activeCampaign.endDate && (
              <p className="offers-end-date">
                Oferta válida hasta: {new Date(activeCampaign.endDate).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Header */}
        <div className="offers-header">
          <div className="offers-back">
            <Link to="/" className="back-link">
              <ArrowLeft size={18} /> Volver al inicio
            </Link>
          </div>
          <div className="offers-info">
            <h2>
              {totalOffers} producto{totalOffers !== 1 ? 's' : ''} en oferta
            </h2>
            {activeCampaign.selectedProducts?.length > 0 && (
              <span className="offers-scope-badge">
                Productos seleccionados
              </span>
            )}
          </div>
          
          <div className="offers-controls">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <Grid size={20} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="offers-loading">
            <div className="loading-spinner" />
            <p>Cargando ofertas...</p>
          </div>
        ) : error ? (
          <div className="offers-error">
            <p>Error al cargar las ofertas. Intenta de nuevo.</p>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              Reintentar
            </button>
          </div>
        ) : totalOffers === 0 ? (
          <div className="offers-empty">
            <Tag size={48} color="var(--text-secondary)" />
            <p>No hay productos disponibles en esta oferta.</p>
          </div>
        ) : (
          <div className="offers-content">
            {/* Products Section */}
            {offersData.products.length > 0 && (
              <div className="offers-section">
                <h3 className="offers-section-title">Productos Sellados</h3>
                <div className={`offers-grid ${viewMode}`}>
                  {offersData.products.map(product => (
                    <ProductCard 
                      key={product.id} 
                      item={{
                        ...product,
                        type: 'product',
                        badge: 'Oferta'
                      }} 
                      type="product"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cards Section */}
            {offersData.cards.length > 0 && (
              <div className="offers-section">
                <h3 className="offers-section-title">Cartas Sueltas</h3>
                <div className={`offers-grid ${viewMode}`}>
                  {offersData.cards.map(card => (
                    <ProductCard 
                      key={card.id} 
                      item={{
                        ...card,
                        type: 'card',
                        badge: 'Oferta'
                      }} 
                      type="card"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offers;
