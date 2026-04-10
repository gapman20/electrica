import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useUser } from '../context/UserContext';
import { Lock, Mail, ArrowLeft, User } from 'lucide-react';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';

const Login = () => {
  const navigate = useNavigate();
  const { login: adminLogin } = useSite();
  const { login: userLogin, setUser } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginPhase, setLoginPhase] = useState('idle');
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const handleGoogleSuccess = (e) => {
      const { user, token } = e.detail;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('tcg_user', JSON.stringify(user));
      setUser(user);
      navigate('/');
    };

    if (window.googleInitialized) {
      setGoogleReady(true);
    } else {
      window.googleReadyCallbacks.push(() => setGoogleReady(true));
    }

    window.addEventListener('google-login-success', handleGoogleSuccess);
    return () => window.removeEventListener('google-login-success', handleGoogleSuccess);
  }, [navigate, setUser]);

  const handleGoogleLogin = () => {
    console.log('handleGoogleLogin', {
      google: !!window.google,
      accounts: !!window.google?.accounts,
      id: !!window.google?.accounts?.id,
      initialized: window.googleInitialized
    });
    try {
      if (window.google?.accounts?.id) {
        const result = window.google.accounts.id.prompt();
        console.log('prompt result:', result);
      } else {
        console.log('Google not available for prompt');
      }
    } catch (e) {
      console.error('prompt error:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setLoginPhase('checking-admin');
    const adminSuccess = await adminLogin(formData.email, formData.password);
    
    if (adminSuccess) {
      setLoginPhase('success');
      navigate('/admin');
      return;
    }

    setLoginPhase('checking-user');
    const userSuccess = await userLogin(formData.email, formData.password);
    
    if (userSuccess) {
      setLoginPhase('success');
      navigate('/');
      return;
    }

    setLoginPhase('idle');
    setError('Credenciales incorrectas');
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  return (
    <>
      <SEO title="Iniciar Sesión" description="Inicia sesión en tu cuenta de Adventure TCG para hacer pedidos y ver tu historial" />
      <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <div className="glass-card" style={{ maxWidth: '420px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-gold)' }}>
          <User size={28} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Iniciar Sesión</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Ingresa tu email y contraseña</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Correo electrónico
            </label>
            <input 
              type="email" 
              name="email"
              placeholder="tu@email.com" 
              value={formData.email} 
              onChange={handleChange}
              autoComplete="username"
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${error ? '#ef4444' : 'var(--glass-border)'}`, color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
              required
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              name="password"
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange}
              autoComplete="current-password"
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${error ? '#ef4444' : 'var(--glass-border)'}`, color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
              required
            />
          </div>
          
          {error && (
            <span style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '6px' }}>
              {error}
            </span>
          )}
          
          <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading 
              ? loginPhase === 'checking-admin' ? 'Verificando como admin...' 
              : loginPhase === 'checking-user' ? 'Verificando como usuario...'
              : 'Verificando...'
              : 'Iniciar Sesión'
            }
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <div id="google-button-container"></div>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UserPlus size={14} /> Regístrate</Link>
        </p>

        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <Link to="/recuperar-password" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;