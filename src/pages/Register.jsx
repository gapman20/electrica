import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import { googleAuth } from '../services/googleAuth';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    googleAuth.init();
    googleAuth.renderButton('google-signin-btn');
  }, []);

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

        <div id="google-signin-btn" style={{ display: 'flex', justifyContent: 'center' }}></div>

        <p style={{ marginTop: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--accent-gold)', textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
    </>
  );
};

export default Register;
