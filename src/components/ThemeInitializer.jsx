import { useEffect } from 'react';

const ThemeInitializer = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
    } else if (savedTheme === 'dark') {
      document.body.classList.remove('light-theme');
    } else {
      if (!prefersDark) {
        document.body.classList.add('light-theme');
      }
    }
  }, []);

  return null;
};

export default ThemeInitializer;
