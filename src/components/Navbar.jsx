import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useWishlist } from '../context/WishlistContext';
import CartButton from './CartButton';

const USER_KEY = 'tcg_user';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { itemCount } = useWishlist();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setIsDropdownOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setIsDropdownOpen(false);
  };

  const navLinks = [
    { path: '/', name: 'Inicio' },
    { path: '/productos', name: 'Productos' },
    { path: '/catalogo', name: 'Cartas Sueltas' },
    { path: '/mis-deseos', name: 'Favoritos' },
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
            <Link to={user ? '/mi-cuenta' : '/login'} className="user-icon-btn">
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
                {link.path === '/mis-deseos' && itemCount > 0 && (
                  <span className="favorites-badge">{itemCount}</span>
                )}
              </Link>
            </li>
          ))}
          
          <li className="nav-actions-mobile">
            <Link to={user ? '/mi-cuenta' : '/login'} className="nav-user-link">
              <User size={20} />
              <span>{user ? user.name : 'Iniciar Sesión'}</span>
            </Link>
          </li>
          
          <li className="nav-cart-item desktop-cart">
            <CartButton />
          </li>
        </ul>

        {/* User login button - Desktop */}
        {!user && (
          <Link to="/login" className="nav-login-btn">
            <User size={18} />
            <span>Iniciar Sesión</span>
          </Link>
        )}

        {user && (
          <div className="user-dropdown">
            <button className="user-dropdown-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <User size={20} />
              <span>{user.name}</span>
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown-menu">
                <Link to="/mi-cuenta" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>
                  Mi Cuenta
                </Link>
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

export default Navbar;
