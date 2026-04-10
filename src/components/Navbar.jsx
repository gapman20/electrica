import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Heart, User, Settings } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useWishlist } from '../context/WishlistContext';
import CartButton from './CartButton';

const USER_KEY = 'tcg_user';
const AUTH_KEY = 'is_authenticated';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { itemCount, items } = useWishlist();
  const { logout: siteLogout } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(localStorage.getItem('token') || localStorage.getItem('auth_token'));
  
  useEffect(() => {
    const checkToken = () => setToken(localStorage.getItem('token') || localStorage.getItem('auth_token'));
    window.addEventListener('storage', checkToken);
    const interval = setInterval(checkToken, 500);
    return () => {
      window.removeEventListener('storage', checkToken);
      clearInterval(interval);
    };
  }, []);

  const user = (() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  })();
  
  const isAdmin = user?.role === 'ADMIN';
  const isLoggedIn = user || isAdmin;

  useEffect(() => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    await siteLogout();
    navigate('/');
    window.location.reload();
  };

  const navLinks = [
    { path: '/', name: 'Inicio' },
    { path: '/productos', name: 'Productos' },
    { path: '/catalogo', name: 'Cartas Sueltas' },
    ...(isLoggedIn ? [{ path: '/mis-deseos', name: 'Favoritos' }] : []),
    { path: '/mis-pedidos', name: 'Mis Pedidos' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <img 
            src="/Adventure.jpeg" 
            alt="Adventure" 
            style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }} 
          />
          <span>Adventure</span>
        </Link>

        <div className="navbar-actions">
          <div className="mobile-cart">
            <CartButton />
          </div>
          <div className="user-menu-mobile">
            <Link to={isLoggedIn ? '#' : '/login'} className="user-icon-btn">
              <User size={22} />
            </Link>
          </div>
          <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </div>
        </div>

        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          {navLinks.map(link => (
            <li key={link.path}>
              <Link 
                to={link.path} 
                className={`nav-links ${location.pathname === link.path ? 'active' : ''}`} 
                onClick={() => setIsOpen(false)}
              >
                {link.name}
                {link.path === '/mis-deseos' && token && items.length > 0 && (
                  <span className="favorites-badge">{itemCount}</span>
                )}
              </Link>
            </li>
          ))}
          
          <li className="nav-actions-mobile">
            {isLoggedIn ? (
              <>
                <div style={{ padding: '0.5rem 1rem', color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                  {user?.name || 'Admin'}
                </div>
                {isAdmin && (
                  <Link to="/admin" className="nav-user-link" style={{ color: 'var(--accent-gold)' }}>
                    <Settings size={20} />
                    <span>Panel Admin</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="nav-user-link" style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-user-link">
                <User size={20} />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </li>
          
          <li className="nav-cart-item desktop-cart">
            <CartButton />
          </li>
        </ul>

        {/* User login button - Desktop */}
        {!isLoggedIn && (
          <Link to="/login" className="nav-login-btn">
            <User size={18} />
            <span>Iniciar Sesión</span>
          </Link>
        )}

        {isLoggedIn && (
          <div className="user-dropdown">
            <button className="user-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <User size={20} />
              <span>{user?.name || 'Admin'}</span>
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                {isAdmin && (
                  <Link to="/admin" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    <Settings size={16} style={{ marginRight: '8px' }} />
                    Panel Admin
                  </Link>
                )}
                {user && !isAdmin && (
                  <Link to="/mi-cuenta" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                    Mi Cuenta
                  </Link>
                )}
                <button className="dropdown-item" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
