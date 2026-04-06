import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import { useUser } from '../context/UserContext';
import { Lock, Mail, ArrowLeft, User } from 'lucide-react';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';
import { googleAuth, onGoogleAuth } from '../services/googleAuth';

const Login = () => {
  const navigate = useNavigate();
  const { login: adminLogin } = useSite();
  const { login: userLogin, setUser } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleToken: response.credential }),
              })
              .then(res => res.json())
              .then(data => {
                if (data.token) {
                  localStorage.setItem('token', data.token);
                  localStorage.setItem('tcg_user', JSON.stringify(data.user));
                  setUser(data.user);
                  Swal.fire({
                    icon: 'success',
                    title: '¡Bienvenido!',
                    text: `Has iniciado sesión como ${data.user?.name || 'Usuario'}`,
                    confirmButtonColor: '#d4af37',
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                  }).then(() => navigate('/'));
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'No se pudo iniciar sesión con Google',
                    confirmButtonColor: '#d4af37',
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                  });
                }
              })
              .catch(err => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: err.message,
                  confirmButtonColor: '#d4af37',
                  background: 'rgba(15, 23, 42, 0.95)',
                  color: '#fff',
                });
              });
            }
          }
        });

        if (document.getElementById('google-signin-btn')) {
          window.google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            { theme: 'outline', size: 'large', text: 'continue_with' }
          );
        }
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const adminSuccess = await adminLogin(formData.email, formData.password);
    
    if (adminSuccess) {
      navigate('/admin');
    } else {
      const userSuccess = await userLogin(formData.email, formData.password);
      
      if (userSuccess) {
        navigate('/');
      } else {
        setError('Credenciales incorrectas');
      }
    }
    
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
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center' }}></div>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿No tienes cuenta? <Link to="/registro" style={{ color: 'var(--accent-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><UserPlus size={14} /> Regístrate</Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;
