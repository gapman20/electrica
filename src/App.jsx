import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SiteProvider, useSite } from './context/SiteContext';
import { WishlistProvider } from './context/WishlistContext';
import { UserProvider } from './context/UserContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/Toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import ScrollToTop from './components/ScrollToTop';
import PageLoader from './components/PageLoader';

// Lazy Loaded Pages
const Home = React.lazy(() => import('./pages/Home'));
const About = React.lazy(() => import('./pages/About'));
const Services = React.lazy(() => import('./pages/Services'));
const Products = React.lazy(() => import('./pages/Products'));
const ServiceDetail1 = React.lazy(() => import('./pages/ServiceDetail1'));
const ServiceDetail2 = React.lazy(() => import('./pages/ServiceDetail2'));
const Portfolio = React.lazy(() => import('./pages/Portfolio'));
const Blog = React.lazy(() => import('./pages/Blog'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Admin = React.lazy(() => import('./pages/Admin'));
const CustomPage = React.lazy(() => import('./pages/CustomPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const MyAccount = React.lazy(() => import('./pages/MyAccount'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));

// Store Pages
const Catalog = React.lazy(() => import('./pages/Catalog'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderTracking = React.lazy(() => import('./pages/OrderTracking'));
const OrderConfirmation = React.lazy(() => import('./pages/OrderConfirmation'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));

const AppContent = () => {
  const { pages, isAuthenticated } = useSite();
  
  const isAdminUser = (() => {
    const savedUser = localStorage.getItem('tcg_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return user?.role === 'ADMIN';
    }
    return false;
  })();
  
  const componentMap = {
    home: <Home />,
    about: <About />,
    services: <Services />,
    products: <Products />,
    portfolio: <Portfolio />,
    blog: <Blog />,
    sellados: <Products />,
    cards: <Catalog />,
    orders: <OrderTracking />,
    contact: <Contact />
  };

  return (
    <div className="app-container">
      <ScrollToTop />
      <Navbar />
      <main>
        <PageLoader />
        <React.Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
            <div className="spinner">Cargando...</div>
          </div>
        }>
          <Routes>
            {/* Static Routes */}
            <Route path="/servicios/1" element={<ServiceDetail1 />} />
            <Route path="/servicios/2" element={<ServiceDetail2 />} />
            <Route path="/blog/:id" element={<BlogPost />} />
            <Route path="/admin" element={isAdminUser ? <Admin /> : <Login />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/pedido/:orderId/confirmacion" element={<OrderConfirmation />} />
            <Route path="/catalogo/:game" element={<Catalog />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/mis-deseos" element={<Wishlist />} />
            <Route path="/mis-pedidos/:orderId" element={<OrderTracking />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/mi-cuenta" element={<MyAccount />} />
            <Route path="/recuperar-password" element={<ForgotPassword />} />
            
            {/* Dynamic Pages from SiteContext */}
            {pages.filter(p => p.active).map(page => (
              <Route 
                key={page.id} 
                path={page.path} 
                element={page.isCustom ? <CustomPage page={page} /> : componentMap[page.id]} 
              />
            ))}
          </Routes>
        </React.Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

const App = () => {
  return (
    <SiteProvider>
      <UserProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </WishlistProvider>
        </CartProvider>
      </UserProvider>
    </SiteProvider>
  );
};

export default App;
