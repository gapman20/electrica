// Google OAuth Service
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const googleAuth = {
  init: () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });
    }
  },

  renderButton: (elementId) => {
    if (window.google?.accounts?.id && document.getElementById(elementId)) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        { theme: 'outline', size: 'large', text: 'continue_with' }
      );
    }
  },

  prompt: () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  },
};

let authCallback = null;

function handleCredentialResponse(response) {
  if (authCallback && response.credential) {
    authCallback(response.credential);
    authCallback = null;
  }
}

export const onGoogleAuth = (callback) => {
  authCallback = callback;
};

export const authenticateWithGoogle = async () => {
  return new Promise((resolve) => {
    onGoogleAuth(async (credential) => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
        
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ googleToken: credential }),
        });

        const data = await res.json();
        resolve(data);
      } catch (error) {
        resolve({ error: error.message });
      }
    });

    googleAuth.prompt();
  });
};
