import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import { useUser } from '../context/UserContext';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';

const Register = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
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
                    title: '¡Cuenta creada!',
                    text: `Bienvenido ${data.user?.name || 'Usuario'}`,
                    confirmButtonColor: '#d4af37',
                    background: 'rgba(15, 23, 42, 0.95)',
                    color: '#fff',
                  }).then(() => navigate('/'));
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'No se pudo registrar con Google',
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
      }
    };

    if (!window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.head.appendChild(script);
    } else {
      initGoogle();
    }
  }, []);

  const handleGoogleRegister = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.register(formData.email, formData.password, formData.name);
      
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: '¡Cuenta creada!',
          text: 'Ahora puedes iniciar sesión con tus credenciales.',
          confirmButtonColor: '#d4af37',
          background: 'rgba(15, 23, 42, 0.95)',
          color: '#fff',
        }).then(() => {
          navigate('/login');
        });
      } else {
        setError('No se pudo crear la cuenta. Intenta de nuevo.');
      }
    } catch (err) {
      setError('El email ya está registrado o hay un error.');
    }

    setLoading(false);
  };

  return (
    <>
      <SEO title="Crear Cuenta" description="Regístrate en Adventure TCG para hacer pedidos y obtener ofertas exclusivas" />
      <div className="page">
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>

      <div className="glass-card" style={{ maxWidth: '420px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-gold)' }}>
          <UserPlus size={28} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Crear Cuenta</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>Regístrate para hacer pedidos y ver tu historial</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <User size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Nombre
            </label>
            <input 
              type="text" 
              name="name"
              placeholder="Tu nombre" 
              value={formData.name} 
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
              required
            />
          </div>
          
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
              <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Contraseña
            </label>
            <input 
              type="password" 
              name="password"
              placeholder="Mínimo 6 caracteres" 
              value={formData.password} 
              onChange={handleChange}
              style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${error ? '#ef4444' : 'var(--glass-border)'}`, color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
              required
              minLength={6}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Confirmar Contraseña
            </label>
            <input 
              type="password" 
              name="confirmPassword"
              placeholder="Repite la contraseña" 
              value={formData.confirmPassword} 
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
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
        </div>

        <button 
          onClick={handleGoogleRegister}
          className="btn-primary"
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '12px',
            padding: '12px 16px',
            background: 'white', 
            color: '#1f2937',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Register;
