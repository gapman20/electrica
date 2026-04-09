import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle } from 'lucide-react';
import { authApi } from '../services/api';
import Swal from 'sweetalert2';
import SEO from '../components/SEO';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'code' | 'success'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await authApi.recoverPassword(email);
      Swal.fire({
        icon: 'success',
        title: 'Código enviado',
        text: 'Revisa la consola del servidor para ver el código (configura email en producción)',
        confirmButtonColor: '#d4af37',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      setStep('code');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'No se pudo solicitar el código',
        confirmButtonColor: '#ef4444',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas no coinciden',
        text: 'Las contraseñas deben ser iguales',
        confirmButtonColor: '#d4af37',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Contraseña muy corta',
        text: 'La contraseña debe tener al menos 6 caracteres',
        confirmButtonColor: '#d4af37',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      return;
    }

    setLoading(true);
    
    try {
      const result = await authApi.resetPassword(email, code, newPassword);
      Swal.fire({
        icon: 'success',
        title: '¡Contraseña actualizada!',
        text: 'Ahora puedes iniciar sesión con tu nueva contraseña',
        confirmButtonColor: '#d4af37',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
      navigate('/login');
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'El código es inválido o ha expirado',
        confirmButtonColor: '#ef4444',
        background: 'rgba(15, 23, 42, 0.95)',
        color: '#fff',
      });
    }
    
    setLoading(false);
  };

  return (
    <>
      <SEO title="Recuperar Contraseña" description="Recupera tu contraseña de Adventure TCG" />
      <div className="page">
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '2rem', fontSize: '0.9rem' }}>
          <ArrowLeft size={16} />
          Volver al login
        </Link>

        <div className="glass-card" style={{ maxWidth: '420px', margin: '0 auto', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: '60px', height: '60px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-gold)' }}>
            <KeyRound size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            {step === 'email' ? 'Recuperar Contraseña' : step === 'code' ? 'Ingresa el Código' : '¡Listo!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {step === 'email' 
              ? 'Ingresa tu email para recibir un código de recuperación' 
              : step === 'code'
              ? 'Ingresa el código que recibiste y tu nueva contraseña'
              : 'Tu contraseña ha sido actualizada'}
          </p>
          
          {step === 'email' && (
            <form onSubmit={handleRequestCode}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>
                  <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Correo electrónico
                </label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com" 
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  required
                />
              </div>
              
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Enviando...' : 'Enviar Código'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Código de 6 dígitos
                </label>
                <input 
                  type="text" 
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" 
                  maxLength={6}
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem', textAlign: 'center', letterSpacing: '8px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>
                  <Lock size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Nueva contraseña
                </label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" 
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.5rem', textAlign: 'left' }}>
                  Confirmar contraseña
                </label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña" 
                  style={{ width: '100%', padding: '12px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', outline: 'none', fontSize: '0.95rem' }}
                  required
                />
              </div>
              
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;