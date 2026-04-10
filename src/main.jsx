import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

if (typeof window !== 'undefined') {
  window.googleInitialized = false;
  window.googleReadyCallbacks = [];
  
  window.initGoogleSignIn = () => {
    if (window.googleInitialized) return;
    
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.log('No Google Client ID configured');
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
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
                  localStorage.setItem('auth_token', data.token);
                  localStorage.setItem('tcg_user', JSON.stringify(data.user));
                  window.dispatchEvent(new CustomEvent('google-login-success', { detail: data }));
                }
              });
            }
          },
          ux_mode: 'redirect',
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        window.googleInitialized = true;
        window.googleReadyCallbacks.forEach(cb => cb());
        window.googleReadyCallbacks = [];
      }
    };
    document.head.appendChild(script);
  };
  
  window.initGoogleSignIn();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
