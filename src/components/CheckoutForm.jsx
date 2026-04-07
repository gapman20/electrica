import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';

const inputSt = {
  width: '100%', padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--glass-border)',
  borderRadius: '8px', color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)', fontSize: '0.95rem',
  outline: 'none', resize: 'vertical',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const focus = e => { e.target.style.borderColor = 'var(--accent-gold)'; e.target.style.boxShadow = '0 0 0 3px rgba(212, 175, 55, 0.15)'; };
const blur = e => { e.target.style.borderColor = 'var(--glass-border)'; e.target.style.boxShadow = 'none'; };

const labelStyle = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: '700',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '0.5rem'
};

const CheckoutForm = ({ formData, errors, onChange, onSubmit, loading, paypalIsConfigured = true, onProceedToPayment }) => {
  const hasAddress = formData.street && formData.city && formData.state && formData.zip;
  const [isEditing, setIsEditing] = useState(!hasAddress);

  React.useEffect(() => {
    if (Object.keys(errors || {}).length > 0) {
      setIsEditing(true);
    }
  }, [errors]);
  
  const formatAddress = () => {
    if (!hasAddress) return null;
    return `${formData.street}, ${formData.city}, ${formData.state}, CP ${formData.zip}, ${formData.country === 'MX' ? 'México' : 'Estados Unidos'}`;
  };

  return (
    <form onSubmit={onSubmit} className="glass-card checkout-form" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Información de Envío</h3>
        {hasAddress && !isEditing && (
          <button 
            type="button" 
            onClick={() => setIsEditing(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: 'transparent', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: '6px',
              fontSize: '0.85rem', cursor: 'pointer'
            }}
          >
            <Edit2 size={14} />
            Editar
          </button>
        )}
      </div>
      
      {!isEditing && hasAddress ? (
        <>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '8px', 
            padding: '1.25rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ 
                width: '40px', height: '40px', 
                background: 'rgba(212, 175, 55, 0.15)', 
                borderRadius: '8px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <span style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>📍</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Dirección de entrega</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>{formatAddress()}</p>
                {formData.name && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>{formData.name} • {formData.email}</p>
                )}
              </div>
              </div>
            </div>
        </>
      ) : (
        <div className="form-grid">
          <div className="form-grid-full">
            <label style={labelStyle}>Nombre completo</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={onChange} 
              placeholder="Tu nombre completo"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.name && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
          </div>
          <div className="form-grid-full">
            <label style={labelStyle}>Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={onChange} 
              placeholder="tu@email.com"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.email && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
          </div>
          <div className="form-grid-full">
            <label style={labelStyle}>Dirección</label>
            <input 
              type="text" 
              name="street" 
              value={formData.street} 
              onChange={onChange} 
              placeholder="Calle y número"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.street && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.street}</span>}
          </div>
          <div>
            <label style={labelStyle}>Ciudad</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city} 
              onChange={onChange} 
              placeholder="Ciudad"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.city && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.city}</span>}
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <input 
              type="text" 
              name="state" 
              value={formData.state} 
              onChange={onChange} 
              placeholder="Estado"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.state && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.state}</span>}
          </div>
          <div>
            <label style={labelStyle}>CP</label>
            <input 
              type="text" 
              name="zip" 
              value={formData.zip} 
              onChange={onChange} 
              placeholder="Código postal"
              style={inputSt}
              onFocus={focus}
              onBlur={blur}
            />
            {errors.zip && <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>{errors.zip}</span>}
          </div>
          <div className="form-grid-full">
            <label style={labelStyle}>País</label>
            <select 
              name="country" 
              value={formData.country} 
              onChange={onChange} 
              style={inputSt}
            >
              <option value="MX">México</option>
              <option value="US">Estados Unidos</option>
            </select>
          </div>
          {isEditing && (
            <div className="form-grid-full" style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setIsEditing(false)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'transparent', border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: '6px',
                  fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                <X size={14} />
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}
      {(!isEditing && !paypalIsConfigured) || (paypalIsConfigured && (!hasAddress || isEditing)) ? (
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {loading ? 'Procesando...' : (paypalIsConfigured ? 'Guardar Dirección y Continuar' : 'Completar Pedido')}
        </button>
      ) : null}
    </form>
  );
};

export default CheckoutForm;
